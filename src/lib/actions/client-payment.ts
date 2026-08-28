'use server';

import { createClient } from '@/lib/supabase/server';

export type InitiateClientPaymentResult =
  | { ok: true; message: string }
  | { ok: false; error: string; flagOff?: boolean };

export async function initiateClientPayment(orderId: string): Promise<InitiateClientPaymentResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' };
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, client_id, status')
    .eq('id', orderId)
    .eq('client_id', user.id)
    .single();

  if (orderError || !order) {
    return { ok: false, error: 'Order not found.' };
  }

  if (order.status !== 'payment_pending') {
    return { ok: false, error: 'This order is not waiting for payment.' };
  }

  const { data: flag, error: flagError } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'mpesa_payments')
    .maybeSingle();

  if (flagError) {
    return { ok: false, error: flagError.message };
  }

  if (!flag?.enabled) {
    return {
      ok: false,
      flagOff: true,
      error:
        'M-Pesa is not live on this environment yet. Your amount stays held on the order. An admin will confirm staging payment — we will not mark this paid from the app.',
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!accessToken || !supabaseUrl || !supabaseAnonKey) {
    return { ok: false, error: 'Payment could not start because the session or project URL is missing.' };
  }

  const idempotencyKey = `pay_${orderId.replaceAll('-', '')}_${Date.now()}`;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/payment-initiate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ orderId, idempotencyKey }),
    });

    const payload = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error ?? 'M-Pesa could not start. The order is still unpaid.',
      };
    }

    return { ok: true, message: 'Check your phone for the M-Pesa prompt. This screen will update when payment lands.' };
  } catch {
    return { ok: false, error: 'Could not reach the payment service. The order is still unpaid.' };
  }
}
