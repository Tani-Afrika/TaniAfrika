import { errorResponse, jsonResponse, requireEnv, safeEqual, sha256Hex } from '../_shared/http.ts';
import { stkCallback } from '../_shared/mpesa.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ResultCode: 1, ResultDesc: 'Method not allowed' }, 405);
    const token = new URL(request.url).searchParams.get('token') ?? '';
    if (!safeEqual(token, requireEnv('MPESA_CALLBACK_TOKEN'))) return jsonResponse({ ResultCode: 1, ResultDesc: 'Rejected' }, 401);

    const body = await request.json() as Record<string, unknown>;
    const callback = stkCallback(body);
    if (!callback.checkoutRequestId) throw new Error('Missing CheckoutRequestID.');
    const providerEventId = `stk:${callback.checkoutRequestId}:${callback.resultCode}:${callback.receipt ?? 'none'}`;
    const payloadText = JSON.stringify(body);
    const admin = adminClient();

    const { data: event, error: eventError } = await admin
      .from('payment_provider_events')
      .insert({
        provider: 'mpesa',
        provider_event_id: providerEventId,
        event_type: 'stk_callback',
        payload: body,
        payload_sha256: await sha256Hex(payloadText),
      })
      .select('id')
      .maybeSingle();

    if (eventError?.code === '23505') return jsonResponse({ ResultCode: 0, ResultDesc: 'Accepted' });
    if (eventError || !event) throw eventError ?? new Error('Could not record provider event.');

    const { data: intent, error: intentError } = await admin
      .from('payment_intents')
      .select('id,amount_minor,status')
      .eq('provider_checkout_request_id', callback.checkoutRequestId)
      .maybeSingle();
    if (intentError || !intent) throw new Error('Unknown CheckoutRequestID.');

    if (callback.resultCode === 0) {
      if (!callback.receipt || callback.amountKes === null || !Number.isFinite(callback.amountKes)) {
        throw new Error('Successful callback is missing transaction metadata.');
      }
      const amountMinor = Math.round(callback.amountKes * 100);
      const { error } = await admin.rpc('record_payment_success', {
        p_payment_intent_id: intent.id,
        p_provider_transaction_id: callback.receipt,
        p_amount_minor: amountMinor,
        p_provider_occurred_at: new Date().toISOString(),
        p_provider_payload: body,
      });
      if (error) throw error;
    } else {
      const { error: failureError } = await admin.from('payment_intents').update({
        status: 'failed',
        failure_code: String(callback.resultCode),
        failure_message: callback.resultDescription,
        failed_at: new Date().toISOString(),
        provider_response: body,
      }).eq('id', intent.id).neq('status', 'succeeded');
      if (failureError) throw failureError;
    }

    const { error: processedError } = await admin.from('payment_provider_events').update({
      processed: true,
      processed_at: new Date().toISOString(),
    }).eq('id', event.id);
    if (processedError) throw processedError;
    return jsonResponse({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('mpesa-callback', error);
    return errorResponse(error, 400);
  }
});
