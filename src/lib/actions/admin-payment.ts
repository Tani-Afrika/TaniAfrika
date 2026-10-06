'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDevSession } from '@/lib/auth/dev-session';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Admin action to confirm test payment for orders in 'payment_pending' status.
 * Invokes the secure record_payment_success RPC via the service_role admin client.
 */
export async function confirmTestPaymentAction(orderId: string): Promise<ActionResult> {
  const devSession = await getDevSession();
  let isAdmin = devSession?.role === 'admin';

  if (!isAdmin) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      isAdmin = profile?.role === 'admin';
    }
  }

  if (!isAdmin) {
    return { success: false, error: 'Admin authorization required.' };
  }

  const adminClient = createAdminClient();

  // Fetch the order
  const { data: order, error: orderErr } = await adminClient
    .from('orders')
    .select('id, client_id, driver_id, status, price_agreed, total_amount_minor, currency')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: 'Order not found.' };
  }

  if (order.status !== 'payment_pending') {
    return { success: false, error: `Order is not awaiting payment (current status: ${order.status}).` };
  }

  const amountMinor = order.total_amount_minor ?? Math.round((Number(order.price_agreed) || 0) * 100);

  // Find or create payment_intent
  let { data: intent } = await adminClient
    .from('payment_intents')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!intent) {
    const { data: newIntent, error: createIntentErr } = await adminClient
      .from('payment_intents')
      .insert({
        order_id: orderId,
        client_id: order.client_id,
        provider: 'mpesa',
        amount_minor: amountMinor,
        currency: order.currency ?? 'KES',
        status: 'processing',
        idempotency_key: `dev-payment-${orderId}-${Date.now()}`,
        initiated_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (createIntentErr || !newIntent) {
      const { error: directUpdateErr } = await adminClient
        .from('orders')
        .update({ status: 'assigned', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (directUpdateErr) return { success: false, error: directUpdateErr.message };

      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath('/admin/orders');
      revalidatePath('/driver/orders');
      revalidatePath('/driver');
      revalidatePath('/admin');
      return { success: true };
    }
    intent = newIntent;
  }

  // Call record_payment_success RPC
  const txnId = `TEST-MPESA-${Date.now()}`;
  const { error: rpcError } = await adminClient.rpc('record_payment_success', {
    p_payment_intent_id: intent.id,
    p_provider_transaction_id: txnId,
    p_amount_minor: intent.amount_minor || amountMinor,
    p_provider_occurred_at: new Date().toISOString(),
    p_provider_payload: { simulated_by: 'admin_test_payment' },
  });

  if (rpcError) {
    console.warn('[confirmTestPaymentAction] RPC note, applying direct state transition:', rpcError.message);
    await adminClient.from('payment_intents').update({
      status: 'succeeded',
      provider_reference: txnId,
      succeeded_at: new Date().toISOString(),
    }).eq('id', intent.id);

    const { error: updateErr } = await adminClient
      .from('orders')
      .update({ status: 'assigned', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (updateErr) return { success: false, error: updateErr.message };
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/driver/orders');
  revalidatePath('/driver');
  revalidatePath('/admin');
  return { success: true };
}

async function assertAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const devSession = await getDevSession();
  let isAdmin = devSession?.role === 'admin';

  if (!isAdmin) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      isAdmin = profile?.role === 'admin';
    }
  }

  if (!isAdmin) {
    return { ok: false, error: 'Admin authorization required.' };
  }
  return { ok: true };
}

function revalidateOrderPaths(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  revalidatePath('/driver/orders');
  revalidatePath(`/driver/orders/${orderId}`);
  revalidatePath('/driver/active');
  revalidatePath('/driver/earnings');
  revalidatePath('/driver');
  revalidatePath(`/client/orders/${orderId}`);
  revalidatePath('/client/orders');
}

/**
 * Admin staging action: release escrow and mark payout success for a delivered order.
 * Mirrors live escrow-release + B2C callback without requiring M-Pesa.
 */
export async function confirmTestPayoutAction(orderId: string): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const adminClient = createAdminClient();

  const { data: order, error: orderErr } = await adminClient
    .from('orders')
    .select(
      'id, client_id, driver_id, status, price_agreed, total_amount_minor, platform_fee_minor, driver_earnings_minor, currency',
    )
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return { success: false, error: 'Order not found.' };
  }

  if (order.status !== 'delivered') {
    return {
      success: false,
      error: `Order must be delivered before payout (current status: ${order.status}).`,
    };
  }

  if (!order.driver_id) {
    return { success: false, error: 'Order has no assigned driver.' };
  }

  const amountMinor =
    order.total_amount_minor ?? Math.round((Number(order.price_agreed) || 0) * 100);
  const platformFeeMinor =
    order.platform_fee_minor ?? Math.round(amountMinor * 0.15);
  const driverAmountMinor =
    order.driver_earnings_minor ?? Math.max(amountMinor - platformFeeMinor, 0);
  const currency = order.currency ?? 'KES';

  // Ensure a payment intent exists (needed by escrow_holds FK).
  let { data: intent } = await adminClient
    .from('payment_intents')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!intent) {
    const { data: newIntent, error: intentErr } = await adminClient
      .from('payment_intents')
      .insert({
        order_id: orderId,
        client_id: order.client_id,
        provider: 'mpesa',
        amount_minor: amountMinor,
        currency,
        status: 'succeeded',
        idempotency_key: `dev-payout-intent-${orderId}`,
        initiated_at: new Date().toISOString(),
        succeeded_at: new Date().toISOString(),
        provider_reference: `TEST-COLLECTION-${orderId.slice(0, 8)}`,
      })
      .select('*')
      .single();

    if (intentErr || !newIntent) {
      return {
        success: false,
        error: intentErr?.message ?? 'Could not create staging payment intent for payout.',
      };
    }
    intent = newIntent;
  }

  // Ensure funded escrow hold.
  let { data: hold } = await adminClient
    .from('escrow_holds')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (!hold) {
    const { data: newHold, error: holdErr } = await adminClient
      .from('escrow_holds')
      .insert({
        order_id: orderId,
        payment_intent_id: intent.id,
        client_id: order.client_id,
        driver_id: order.driver_id,
        amount_minor: amountMinor,
        platform_fee_minor: platformFeeMinor,
        driver_amount_minor: driverAmountMinor,
        currency,
        status: 'funded',
        funded_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (holdErr || !newHold) {
      return {
        success: false,
        error: holdErr?.message ?? 'Could not create staging escrow hold.',
      };
    }
    hold = newHold;
  }

  if (hold.status === 'released') {
    if (order.status !== 'completed') {
      await adminClient
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
      revalidateOrderPaths(orderId);
    }
    return { success: true };
  }

  if (!['funded', 'release_pending'].includes(hold.status)) {
    return {
      success: false,
      error: `Escrow hold is not releasable (status: ${hold.status}).`,
    };
  }

  // Ensure driver has a verified payout destination for staging.
  let { data: payoutAccount } = await adminClient
    .from('payout_accounts')
    .select('*')
    .eq('driver_id', order.driver_id)
    .eq('active', true)
    .eq('verified', true)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payoutAccount) {
    const { data: newAccount, error: accountErr } = await adminClient
      .from('payout_accounts')
      .insert({
        driver_id: order.driver_id,
        provider: 'mpesa',
        destination_token: `staging-mpesa-${order.driver_id}`,
        display_hint: 'Staging M-Pesa ****',
        verified: true,
        verified_at: new Date().toISOString(),
        is_default: true,
        active: true,
      })
      .select('*')
      .single();

    if (accountErr || !newAccount) {
      return {
        success: false,
        error: accountErr?.message ?? 'Could not create staging payout account.',
      };
    }
    payoutAccount = newAccount;
  }

  // Queue release + payout row if needed.
  let { data: payout } = await adminClient
    .from('payouts')
    .select('*')
    .eq('order_id', orderId)
    .in('status', ['pending', 'processing', 'succeeded'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (payout?.status === 'succeeded') {
    await adminClient
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .neq('status', 'completed');
    revalidateOrderPaths(orderId);
    return { success: true };
  }

  if (!payout) {
    if (hold.status === 'funded') {
      const { error: holdUpdateErr } = await adminClient
        .from('escrow_holds')
        .update({
          status: 'release_pending',
          release_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', hold.id);

      if (holdUpdateErr) {
        return { success: false, error: holdUpdateErr.message };
      }
    }

    const { data: newPayout, error: payoutErr } = await adminClient
      .from('payouts')
      .insert({
        order_id: orderId,
        escrow_hold_id: hold.id,
        driver_id: order.driver_id,
        payout_account_id: payoutAccount.id,
        provider: 'mpesa',
        amount_minor: hold.driver_amount_minor,
        currency: hold.currency,
        status: 'pending',
        idempotency_key: `order-release:${orderId}`,
      })
      .select('*')
      .single();

    if (payoutErr || !newPayout) {
      // Idempotency race — fetch existing
      const { data: existing } = await adminClient
        .from('payouts')
        .select('*')
        .eq('idempotency_key', `order-release:${orderId}`)
        .maybeSingle();

      if (!existing) {
        return {
          success: false,
          error: payoutErr?.message ?? 'Could not queue staging payout.',
        };
      }
      payout = existing;
    } else {
      payout = newPayout;
    }
  }

  if (hold.status === 'funded') {
    await adminClient
      .from('escrow_holds')
      .update({
        status: 'release_pending',
        release_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', hold.id);
  }

  const txnId = `TEST-B2C-${Date.now()}`;
  const { error: rpcError } = await adminClient.rpc('record_payout_success', {
    p_payout_id: payout.id,
    p_provider_transaction_id: txnId,
    p_provider_payload: { simulated_by: 'admin_test_payout' },
  });

  if (rpcError) {
    console.warn('[confirmTestPayoutAction] RPC note, applying direct completion:', rpcError.message);

    await adminClient
      .from('payouts')
      .update({
        status: 'succeeded',
        provider_transaction_id: txnId,
        succeeded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payout.id);

    await adminClient
      .from('escrow_holds')
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', hold.id);

    const { error: updateErr } = await adminClient
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateErr) return { success: false, error: updateErr.message };
  }

  revalidateOrderPaths(orderId);
  return { success: true };
}
