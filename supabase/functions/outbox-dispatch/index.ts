import { errorResponse, jsonResponse, requireCronSecret } from '../_shared/http.ts';
import { adminClient } from '../_shared/supabase.ts';

type OutboxEvent = {
  id: string;
  event_type: string;
  payload: Record<string, unknown>;
};

function notificationFor(event: OutboxEvent) {
  const templates: Record<string, { title: string; body: string }> = {
    'order.status_changed': { title: 'Order updated', body: `Your order is now ${String(event.payload.status ?? 'updated').replaceAll('_', ' ')}.` },
    'payment.succeeded': { title: 'Payment received', body: 'Your payment is secured and the driver has been assigned.' },
    'escrow.release_requested': { title: 'Payment release started', body: 'The driver payout is being processed.' },
    'payout.succeeded': { title: 'Payout completed', body: 'Your order payout has been sent.' },
    'refund.requested': { title: 'Refund started', body: 'Your approved refund is being processed.' },
    'refund.succeeded': { title: 'Refund completed', body: 'Your approved refund has been sent.' },
    'payment.requires_review': { title: 'Payment review required', body: 'We are checking your payment and will update you.' },
    'dispute.resolved_release': { title: 'Dispute resolved', body: 'The delivery payment is being released.' },
  };
  return templates[event.event_type] ?? { title: 'TaniAfrika update', body: 'There is an update on your account.' };
}

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405);
    requireCronSecret(request);
    const admin = adminClient();
    const workerId = `outbox-${crypto.randomUUID()}`;
    const { data, error } = await admin.rpc('claim_outbox_events', { p_worker_id: workerId, p_limit: 50 });
    if (error) throw error;
    const events = (data ?? []) as OutboxEvent[];
    let delivered = 0;

    for (const event of events) {
      try {
        const recipients = [event.payload.client_id, event.payload.driver_id]
          .filter((value): value is string => typeof value === 'string');
        const uniqueRecipients = [...new Set(recipients)];
        const template = notificationFor(event);

        for (const userId of uniqueRecipients) {
          const { error: notificationError } = await admin.from('notifications').upsert({
            user_id: userId,
            channel: 'in_app',
            template_key: event.event_type,
            title: template.title,
            body: template.body,
            data: event.payload,
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            outbox_event_id: event.id,
          }, { onConflict: 'outbox_event_id,user_id,channel', ignoreDuplicates: true });
          if (notificationError) throw notificationError;
        }

        const webhookUrl = Deno.env.get('NOTIFICATION_WEBHOOK_URL');
        if (webhookUrl && uniqueRecipients.length) {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              authorization: `Bearer ${Deno.env.get('NOTIFICATION_WEBHOOK_SECRET') ?? ''}`,
            },
            body: JSON.stringify({ event, recipients: uniqueRecipients, notification: template }),
          });
          if (!response.ok) throw new Error(`Notification provider returned ${response.status}.`);
        }

        const { error: completionError } = await admin.rpc('complete_outbox_event', {
          p_event_id: event.id, p_delivered: true, p_error: null,
        });
        if (completionError) throw completionError;
        delivered += 1;
      } catch (eventError) {
        await admin.rpc('complete_outbox_event', {
          p_event_id: event.id,
          p_delivered: false,
          p_error: eventError instanceof Error ? eventError.message : 'Unknown dispatch error',
        });
      }
    }
    return jsonResponse({ ok: true, claimed: events.length, delivered });
  } catch (error) {
    return errorResponse(error, 401);
  }
});
