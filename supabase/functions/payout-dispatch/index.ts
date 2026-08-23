import { errorResponse, jsonResponse, requireCronSecret } from '../_shared/http.ts';
import { initiateB2cPayout, normalizeKenyanPhone } from '../_shared/mpesa.ts';
import { adminClient } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
    requireCronSecret(request);
    const admin = adminClient();
    const { data: candidates, error } = await admin
      .from('payouts')
      .select('id,order_id,amount_minor,currency,status,attempts,payout_account:payout_accounts!inner(destination_token,verified,active)')
      .in('status', ['pending', 'failed'])
      .lte('next_attempt_at', new Date().toISOString())
      .order('created_at')
      .limit(25);
    if (error) throw error;

    const results: Array<{ payoutId: string; status: string }> = [];
    for (const candidate of candidates ?? []) {
      const account = Array.isArray(candidate.payout_account) ? candidate.payout_account[0] : candidate.payout_account;
      if (!account?.verified || !account.active) {
        results.push({ payoutId: candidate.id, status: 'invalid_payout_account' });
        continue;
      }
      if (candidate.currency !== 'KES' || candidate.amount_minor % 100 !== 0) {
        await admin.from('payouts').update({ status: 'requires_review', failure_code: 'UNSUPPORTED_AMOUNT' }).eq('id', candidate.id);
        results.push({ payoutId: candidate.id, status: 'requires_review' });
        continue;
      }

      // Atomic claim: a concurrent worker receives no updated row.
      const { data: claimed } = await admin.from('payouts').update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        attempts: candidate.attempts + 1,
      }).eq('id', candidate.id).in('status', ['pending', 'failed']).select('id').maybeSingle();
      if (!claimed) continue;

      try {
        const response = await initiateB2cPayout({
          amountKes: candidate.amount_minor / 100,
          destination: normalizeKenyanPhone(account.destination_token),
          remarks: `TaniAfrika order ${candidate.order_id}`,
          occasion: `Order payout ${candidate.id}`,
        });
        await admin.from('payouts').update({
          provider_conversation_id: response.ConversationID ? String(response.ConversationID) : null,
          provider_originator_conversation_id: response.OriginatorConversationID ? String(response.OriginatorConversationID) : null,
          provider_response: response,
          status: 'processing',
        }).eq('id', candidate.id);
        results.push({ payoutId: candidate.id, status: 'processing' });
      } catch (providerError) {
        const nextDelayMinutes = Math.min(60, 2 ** Math.min(candidate.attempts + 1, 6));
        await admin.from('payouts').update({
          status: candidate.attempts + 1 >= 5 ? 'requires_review' : 'failed',
          failure_code: 'PROVIDER_REQUEST_FAILED',
          failure_message: providerError instanceof Error ? providerError.message : 'Payout request failed.',
          failed_at: new Date().toISOString(),
          next_attempt_at: new Date(Date.now() + nextDelayMinutes * 60 * 1000).toISOString(),
        }).eq('id', candidate.id);
        results.push({ payoutId: candidate.id, status: 'failed' });
      }
    }

    return jsonResponse({ ok: true, processed: results.length, results });
  } catch (error) {
    return errorResponse(error, 401);
  }
});

