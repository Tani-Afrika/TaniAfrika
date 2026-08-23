import { errorResponse, jsonResponse, requireCronSecret } from '../_shared/http.ts';
import { queryStkPush } from '../_shared/mpesa.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
    requireCronSecret(request);
    const admin = adminClient();
    const { error: expiryError } = await admin.rpc('expire_payment_reservations');
    if (expiryError) throw expiryError;
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: intents, error } = await admin
      .from('payment_intents')
      .select('id,provider_checkout_request_id,status')
      .in('status', ['pending_customer', 'processing'])
      .not('provider_checkout_request_id', 'is', null)
      .lt('updated_at', cutoff)
      .order('updated_at')
      .limit(50);
    if (error) throw error;

    const results: Array<{ id: string; action: string }> = [];
    for (const intent of intents ?? []) {
      try {
        const response = await queryStkPush(intent.provider_checkout_request_id);
        const code = Number(response.ResultCode ?? response.resultCode ?? -1);
        const description = String(response.ResultDesc ?? response.resultDesc ?? '');
        if (code === 0) {
          // STK query does not reliably provide the receipt/amount needed to post
          // money. Hold for finance reconciliation instead of inventing success.
          await admin.from('payment_intents').update({
            status: 'requires_review',
            failure_code: 'CALLBACK_MISSING_AFTER_SUCCESS',
            failure_message: description || 'Provider reports success but callback evidence is missing.',
            provider_response: response,
          }).eq('id', intent.id).neq('status', 'succeeded');
          results.push({ id: intent.id, action: 'requires_review' });
        } else if ([1, 1032, 1037, 2001].includes(code)) {
          await admin.from('payment_intents').update({
            status: 'failed', failure_code: String(code), failure_message: description,
            failed_at: new Date().toISOString(), provider_response: response,
          }).eq('id', intent.id).neq('status', 'succeeded');
          results.push({ id: intent.id, action: 'failed' });
        } else {
          results.push({ id: intent.id, action: 'pending' });
        }
      } catch (queryError) {
        results.push({ id: intent.id, action: `query_error:${queryError instanceof Error ? queryError.message : 'unknown'}` });
      }
    }
    return jsonResponse({ ok: true, checked: results.length, results });
  } catch (error) {
    return errorResponse(error, 401);
  }
});
