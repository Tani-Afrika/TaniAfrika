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

      revalidatePath(`/orders/${orderId}`);
      revalidatePath('/orders');
      revalidatePath('/driver/orders');
      revalidatePath('/driver');
      revalidatePath('/');
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

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  revalidatePath('/driver/orders');
  revalidatePath('/driver');
  revalidatePath('/');
  return { success: true };
}
