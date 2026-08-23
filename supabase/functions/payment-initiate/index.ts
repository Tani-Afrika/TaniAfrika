import { assertUuid, corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { initiateStkPush, normalizeKenyanPhone } from '../_shared/mpesa.ts';
import { adminClient, authenticatedUser } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  const cors = corsHeaders(request);

  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, cors);
    const { client, user } = await authenticatedUser(request);
    const body = await request.json() as { orderId?: unknown; phone?: unknown; idempotencyKey?: unknown };
    const orderId = assertUuid(body.orderId, 'orderId');
    const idempotencyKey = String(request.headers.get('idempotency-key') ?? body.idempotencyKey ?? '').trim();
    if (!/^[A-Za-z0-9:_-]{16,120}$/.test(idempotencyKey)) {
      throw new Error('A valid Idempotency-Key is required.');
    }

    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id,order_number,client_id,status,total_amount_minor,currency')
      .eq('id', orderId)
      .single();
    if (orderError || !order || order.client_id !== user.id) throw new Error('Order not found.');
    if (order.status !== 'payment_pending') throw new Error('This order is not awaiting payment.');
    if (!order.total_amount_minor || order.total_amount_minor <= 0) throw new Error('The order amount is invalid.');
    if (order.currency !== 'KES') throw new Error('M-Pesa currently supports KES orders only.');
    if (order.total_amount_minor % 100 !== 0) throw new Error('M-Pesa amount must be a whole Kenya shilling.');

    let phoneSource = typeof body.phone === 'string' ? body.phone : '';
    if (!phoneSource) {
      const { data: profile } = await client.from('profiles').select('phone_e164,phone').eq('id', user.id).single();
      phoneSource = profile?.phone_e164 ?? profile?.phone ?? '';
    }
    const phone = normalizeKenyanPhone(phoneSource);
    const admin = adminClient();
    const { data: paymentFlag, error: flagError } = await admin
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'mpesa_payments')
      .single();
    if (flagError) throw flagError;
    if (!paymentFlag?.enabled) throw new Error('M-Pesa payments are not available yet.');

    const { data: existing } = await admin
      .from('payment_intents')
      .select('*')
      .eq('client_id', user.id)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (existing && (
      existing.order_id !== order.id ||
      Number(existing.amount_minor) !== Number(order.total_amount_minor) ||
      existing.currency !== order.currency
    )) {
      throw new Error('That idempotency key belongs to a different payment request.');
    }

    if (existing?.status === 'succeeded' || (existing?.provider_checkout_request_id && ['pending_customer', 'processing'].includes(existing.status))) {
      return jsonResponse({
        ok: true,
        paymentIntentId: existing.id,
        status: existing.status,
        checkoutRequestId: existing.provider_checkout_request_id,
        reused: true,
      }, 200, cors);
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    let intent = existing;
    if (intent) {
      const { data, error } = await admin
        .from('payment_intents')
        .update({
          status: 'processing', payer_phone_e164: `+${phone}`, failure_code: null,
          failure_message: null, expires_at: expiresAt, initiated_at: new Date().toISOString(),
        })
        .eq('id', intent.id)
        .select('*')
        .single();
      if (error) throw error;
      intent = data;
    } else {
      const { data, error } = await admin
        .from('payment_intents')
        .insert({
          order_id: order.id,
          client_id: user.id,
          provider: 'mpesa',
          amount_minor: order.total_amount_minor,
          currency: order.currency,
          status: 'processing',
          idempotency_key: idempotencyKey,
          payer_phone_e164: `+${phone}`,
          expires_at: expiresAt,
          initiated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) throw error;
      intent = data;
    }

    try {
      const response = await initiateStkPush({
        phone,
        amountKes: order.total_amount_minor / 100,
        accountReference: `TA${order.order_number}`,
        description: `TaniAfrika order ${order.order_number}`,
      });
      const merchantRequestId = String(response.MerchantRequestID ?? '');
      const checkoutRequestId = String(response.CheckoutRequestID ?? '');
      if (!merchantRequestId || !checkoutRequestId) throw new Error('M-Pesa did not return checkout references.');

      const { error } = await admin.from('payment_intents').update({
        status: 'pending_customer',
        provider_merchant_request_id: merchantRequestId,
        provider_checkout_request_id: checkoutRequestId,
        provider_response: response,
      }).eq('id', intent.id);
      if (error) throw error;

      return jsonResponse({
        ok: true,
        paymentIntentId: intent.id,
        status: 'pending_customer',
        checkoutRequestId,
        message: 'Confirm the M-Pesa prompt on your phone.',
      }, 202, cors);
    } catch (providerError) {
      await admin.from('payment_intents').update({
        status: 'failed',
        failure_code: 'PROVIDER_REQUEST_FAILED',
        failure_message: providerError instanceof Error ? providerError.message : 'M-Pesa request failed.',
        failed_at: new Date().toISOString(),
      }).eq('id', intent.id);
      throw providerError;
    }
  } catch (error) {
    return errorResponse(error, 400, cors);
  }
});
