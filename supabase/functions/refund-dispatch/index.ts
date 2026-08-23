import { errorResponse, jsonResponse, requireCronSecret } from '../_shared/http.ts';
import { initiateB2cPayout, normalizeKenyanPhone } from '../_shared/mpesa.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
    requireCronSecret(request);
    const admin = adminClient();
    const { data: candidates, error } = await admin
      .from('refunds')
      .select('id,order_id,escrow_hold_id,amount_minor,currency,status,attempts')
      .in('status', ['pending', 'failed'])
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at')
      .limit(25);
    if (error) throw error;

    const results: Array<{ refundId: string; status: string }> = [];
    for (const candidate of candidates ?? []) {
      if (candidate.currency !== 'KES' || candidate.amount_minor % 100 !== 0) {
        await admin.from('refunds').update({ status: 'requires_review', failure_code: 'UNSUPPORTED_AMOUNT' }).eq('id', candidate.id);
        results.push({ refundId: candidate.id, status: 'requires_review' });
        continue;
      }
      const { data: hold, error: holdError } = await admin
        .from('escrow_holds')
        .select('payment_intent:payment_intents!inner(payer_phone_e164)')
        .eq('id', candidate.escrow_hold_id)
        .single();
      if (holdError) throw holdError;
      const intent = Array.isArray(hold.payment_intent) ? hold.payment_intent[0] : hold.payment_intent;
      if (!intent?.payer_phone_e164) {
        await admin.from('refunds').update({ status: 'requires_review', failure_code: 'MISSING_REFUND_DESTINATION' }).eq('id', candidate.id);
        results.push({ refundId: candidate.id, status: 'requires_review' });
        continue;
      }

      const { data: claimed } = await admin.from('refunds').update({
        status: 'processing', processing_started_at: new Date().toISOString(), attempts: candidate.attempts + 1,
      }).eq('id', candidate.id).in('status', ['pending', 'failed']).select('id').maybeSingle();
      if (!claimed) continue;

      try {
        const response = await initiateB2cPayout({
          amountKes: candidate.amount_minor / 100,
          destination: normalizeKenyanPhone(intent.payer_phone_e164),
          remarks: `TaniAfrika refund ${candidate.order_id}`,
          occasion: `Order refund ${candidate.id}`,
          callbackKind: 'refund',
        });
        await admin.from('refunds').update({
          provider_conversation_id: response.ConversationID ? String(response.ConversationID) : null,
          provider_originator_conversation_id: response.OriginatorConversationID ? String(response.OriginatorConversationID) : null,
          provider_response: response,
          status: 'processing',
        }).eq('id', candidate.id);
        results.push({ refundId: candidate.id, status: 'processing' });
      } catch (providerError) {
        const attempt = candidate.attempts + 1;
        const nextDelayMinutes = Math.min(60, 2 ** Math.min(attempt, 6));
        await admin.from('refunds').update({
          status: attempt >= 5 ? 'requires_review' : 'failed',
          failure_code: 'PROVIDER_REQUEST_FAILED',
          failure_message: providerError instanceof Error ? providerError.message : 'Refund request failed.',
          failed_at: new Date().toISOString(),
          next_attempt_at: new Date(Date.now() + nextDelayMinutes * 60 * 1000).toISOString(),
        }).eq('id', candidate.id);
        results.push({ refundId: candidate.id, status: attempt >= 5 ? 'requires_review' : 'failed' });
      }
    }
    return jsonResponse({ ok: true, processed: results.length, results });
  } catch (error) {
    return errorResponse(error, 401);
  }
});
