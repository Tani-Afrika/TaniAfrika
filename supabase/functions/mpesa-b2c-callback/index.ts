import { errorResponse, jsonResponse, requireEnv, safeEqual, sha256Hex } from '../_shared/http.ts';
import { b2cResult } from '../_shared/mpesa.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ResultCode: 1, ResultDesc: 'Method not allowed' }, 405);
    const token = new URL(request.url).searchParams.get('token') ?? '';
    if (!safeEqual(token, requireEnv('MPESA_B2C_CALLBACK_TOKEN'))) return jsonResponse({ ResultCode: 1, ResultDesc: 'Rejected' }, 401);
    const body = await request.json() as Record<string, unknown>;
    const result = b2cResult(body);
    if (!result.conversationId && !result.originatorConversationId) throw new Error('Missing payout conversation reference.');
    const eventId = `b2c:${result.originatorConversationId || result.conversationId}:${result.resultCode}:${result.transactionId ?? 'none'}`;
    const admin = adminClient();

    const { data: event, error: eventError } = await admin.from('payment_provider_events').insert({
      provider: 'mpesa',
      provider_event_id: eventId,
      event_type: result.resultType === 0 ? 'b2c_result' : 'b2c_timeout',
      payload: body,
      payload_sha256: await sha256Hex(JSON.stringify(body)),
    }).select('id').maybeSingle();
    if (eventError?.code === '23505') return jsonResponse({ ResultCode: 0, ResultDesc: 'Accepted' });
    if (eventError || !event) throw eventError ?? new Error('Could not record provider event.');

    const query = admin.from('payouts').select('id,status');
    const { data: payout, error: payoutError } = result.originatorConversationId
      ? await query.eq('provider_originator_conversation_id', result.originatorConversationId).maybeSingle()
      : await query.eq('provider_conversation_id', result.conversationId).maybeSingle();
    if (payoutError || !payout) throw new Error('Unknown payout conversation reference.');

    if (result.resultCode === 0 && result.transactionId) {
      const { error } = await admin.rpc('record_payout_success', {
        p_payout_id: payout.id,
        p_provider_transaction_id: result.transactionId,
        p_provider_payload: body,
      });
      if (error) throw error;
    } else {
      const { error: failureError } = await admin.from('payouts').update({
        status: result.resultType === 0 ? 'failed' : 'requires_review',
        failure_code: String(result.resultCode),
        failure_message: result.resultDescription,
        failed_at: new Date().toISOString(),
        provider_response: body,
      }).eq('id', payout.id).neq('status', 'succeeded');
      if (failureError) throw failureError;
    }
    const { error: processedError } = await admin.from('payment_provider_events')
      .update({ processed: true, processed_at: new Date().toISOString() }).eq('id', event.id);
    if (processedError) throw processedError;
    return jsonResponse({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('mpesa-b2c-callback', error);
    return errorResponse(error, 400);
  }
});
