import { assertUuid, corsHeaders, errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { authenticatedUser } from '../_shared/supabase.ts';

Deno.serve(async (request) => {
  const options = handleOptions(request);
  if (options) return options;
  const cors = corsHeaders(request);
  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, cors);
    const { client } = await authenticatedUser(request);
    const body = await request.json() as { orderId?: unknown };
    const orderId = assertUuid(body.orderId, 'orderId');
    const { data, error } = await client.rpc('request_escrow_release', { p_order_id: orderId });
    if (error) throw error;
    return jsonResponse({ ok: true, payout: data }, 202, cors);
  } catch (error) {
    return errorResponse(error, 400, cors);
  }
});
