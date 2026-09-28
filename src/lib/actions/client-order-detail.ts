'use server';

import { revalidatePath } from 'next/cache';

import { getPortalActor } from '@/lib/auth/portal-actor';
import { createClient } from '@/lib/supabase/server';
import type { Order, OrderStatusHistory } from '@/types/supabase';

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface BidderInfo {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface BidMessageRow {
  id: string;
  bid_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface ClientBid {
  id: string;
  order_id: string;
  amount: number;
  message: string | null;
  status: string;
  created_at: string;
  estimated_pickup_at: string | null;
  vehicle_type: string | null;
  driver: BidderInfo | null;
  messages: BidMessageRow[];
}

export interface AssignedDriverInfo {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  vehicle_type: string | null;
  plate_number: string | null;
}

export interface PaymentHold {
  priceAgreed: number | null;
  platformFeeMinor: number | null;
  driverEarningsMinor: number | null;
}

export interface ClientReview {
  id: string;
  rating: number;
  comment: string | null;
}

export interface ClientOrderDetail {
  order: Order;
  orderNumber: number | null;
  bids: ClientBid[];
  history: OrderStatusHistory[];
  driver: AssignedDriverInfo | null;
  driverLocation: { lat: number; lng: number; updatedAt: string } | null;
  paymentHold: PaymentHold;
  mpesaPaymentsEnabled: boolean;
  review: ClientReview | null;
}

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Fetches everything the client order-detail screen needs, scoped to the
 * signed-in client. Returns null if the order doesn't exist or doesn't
 * belong to the caller (the page should call notFound() in that case).
 */
export async function getClientOrderDetail(orderId: string): Promise<ClientOrderDetail | null> {
  const actor = await getPortalActor();
  const supabase = actor.supabase;
  const userId = actor.userId;

  if (!userId || (actor.usingDemo && actor.devSession?.role !== 'client')) return null;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('client_id', userId)
    .single();

  if (orderError || !order) return null;

  const { data: history } = await supabase
    .from('order_status_history')
    .select('id, order_id, status, changed_by, notes, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  const isAssigned = Boolean(order.driver_id);

  let driver: AssignedDriverInfo | null = null;
  let driverLocation: ClientOrderDetail['driverLocation'] = null;

  if (isAssigned && order.driver_id) {
    // Once assigned, RLS allows the client to read the driver's full
    // profile row (including phone) — see profiles RLS notes.
    const [{ data: driverProfile }, { data: vehicle }, { data: location }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, phone_e164, avatar_url')
        .eq('id', order.driver_id)
        .single(),
      supabase
        .from('vehicles')
        .select('vehicle_type, plate_number')
        .eq('driver_id', order.driver_id)
        .eq('is_active', true)
        .maybeSingle(),
      supabase
        .from('driver_locations')
        .select('latitude, longitude, updated_at')
        .eq('driver_id', order.driver_id)
        .maybeSingle(),
    ]);

    driver = driverProfile
      ? {
          id: driverProfile.id,
          full_name: driverProfile.full_name,
          phone: driverProfile.phone_e164 ?? driverProfile.phone,
          avatar_url: driverProfile.avatar_url,
          vehicle_type: vehicle?.vehicle_type ?? null,
          plate_number: vehicle?.plate_number ?? null,
        }
      : null;

    driverLocation = location
      ? { lat: location.latitude, lng: location.longitude, updatedAt: location.updated_at }
      : null;
  }

  let bids: ClientBid[] = [];

  const showBids = order.status === 'pending';

  if (showBids) {
    const { data: bidRows } = await supabase
      .from('bids')
      .select('id, order_id, amount, message, status, created_at, driver_id, vehicle_id, estimated_pickup_at')
      .eq('order_id', orderId)
      .order('amount', { ascending: true });

    const driverIds = [...new Set((bidRows ?? []).map((bid) => bid.driver_id))];
    const bidIds = (bidRows ?? []).map((bid) => bid.id);
    const vehicleIds = [
      ...new Set((bidRows ?? []).map((bid) => bid.vehicle_id).filter((id): id is string => Boolean(id))),
    ];

    // Pre-assignment, bidder identity must come from `profiles_public`
    // (no phone exposed) rather than `profiles` directly.
    const [{ data: bidders }, { data: messages }, { data: vehicles }] = await Promise.all([
      driverIds.length > 0
        ? supabase.from('profiles_public').select('id, full_name, avatar_url').in('id', driverIds)
        : Promise.resolve({ data: [] as BidderInfo[] }),
      bidIds.length > 0
        ? supabase
            .from('bid_messages')
            .select('id, bid_id, sender_id, message, created_at')
            .in('bid_id', bidIds)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] as BidMessageRow[] }),
      vehicleIds.length > 0
        ? supabase.from('vehicles').select('id, vehicle_type').in('id', vehicleIds)
        : Promise.resolve({ data: [] as { id: string; vehicle_type: string | null }[] }),
    ]);

    const bidderById = new Map((bidders ?? []).map((bidder) => [bidder.id, bidder]));
    const vehicleById = new Map((vehicles ?? []).map((vehicle) => [vehicle.id, vehicle.vehicle_type]));
    const messagesByBid = new Map<string, BidMessageRow[]>();
    (messages ?? []).forEach((message) => {
      const list = messagesByBid.get(message.bid_id) ?? [];
      list.push(message);
      messagesByBid.set(message.bid_id, list);
    });

    bids = (bidRows ?? []).map((bid) => ({
      id: bid.id,
      order_id: bid.order_id,
      amount: bid.amount,
      message: bid.message,
      status: bid.status,
      created_at: bid.created_at,
      estimated_pickup_at: bid.estimated_pickup_at,
      vehicle_type: bid.vehicle_id ? vehicleById.get(bid.vehicle_id) ?? null : null,
      driver: bidderById.get(bid.driver_id) ?? null,
      messages: messagesByBid.get(bid.id) ?? [],
    }));
  }

  const { data: paymentFlag } = await supabase
    .from('feature_flags')
    .select('enabled')
    .eq('key', 'mpesa_payments')
    .maybeSingle();

  const { data: reviewRow } = await supabase
    .from('reviews')
    .select('id, rating, comment')
    .eq('order_id', orderId)
    .eq('reviewer_id', userId)
    .maybeSingle();

  const orderRow = order as Order & {
    order_number?: number | string | null;
    platform_fee_minor?: number | string | null;
    driver_earnings_minor?: number | string | null;
  };

  return {
    order: order as Order,
    orderNumber: toNumberOrNull(orderRow.order_number),
    bids,
    history: (history ?? []) as OrderStatusHistory[],
    driver,
    driverLocation,
    paymentHold: {
      priceAgreed: toNumberOrNull(orderRow.price_agreed),
      platformFeeMinor: toNumberOrNull(orderRow.platform_fee_minor),
      driverEarningsMinor: toNumberOrNull(orderRow.driver_earnings_minor),
    },
    mpesaPaymentsEnabled: Boolean(paymentFlag?.enabled),
    review: reviewRow
      ? { id: reviewRow.id, rating: Number(reviewRow.rating), comment: reviewRow.comment }
      : null,
  };
}

export async function acceptBid(orderId: string, bidId: string): Promise<ActionResult> {
  const actor = await getPortalActor();
  if (!actor.userId || (actor.usingDemo && actor.devSession?.role !== 'client')) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (actor.usingDemo) {
    return acceptDemoBid(actor.supabase, actor.userId, orderId, bidId);
  }

  const { error } = await actor.supabase.rpc('accept_bid', {
    p_order_id: orderId,
    p_bid_id: bidId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/client/orders/${orderId}`);
  return { success: true };
}

const ACTIVE_DRIVER_STATUSES = [
  'payment_pending',
  'assigned',
  'driver_en_route',
  'arrived',
  'loading',
  'picked_up',
  'in_transit',
  'delivered',
];

async function acceptDemoBid(
  supabase: Awaited<ReturnType<typeof getPortalActor>>['supabase'],
  clientId: string,
  orderId: string,
  bidId: string,
): Promise<ActionResult> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, client_id, status, service_type_id, vehicle_type_required')
    .eq('id', orderId)
    .eq('client_id', clientId)
    .single();

  if (orderError || !order) return { success: false, error: 'Order not found.' };
  if (order.status !== 'pending') {
    return { success: false, error: 'This order is no longer accepting bids.' };
  }

  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .select('id, driver_id, amount, status, vehicle_id')
    .eq('id', bidId)
    .eq('order_id', orderId)
    .single();

  if (bidError || !bid || bid.status !== 'pending') {
    return { success: false, error: 'Bid is no longer available.' };
  }

  const { data: busy } = await supabase
    .from('orders')
    .select('id')
    .eq('driver_id', bid.driver_id)
    .in('status', ACTIVE_DRIVER_STATUSES)
    .neq('id', orderId)
    .limit(1);

  if (busy && busy.length > 0) {
    return { success: false, error: 'The driver is no longer available.' };
  }

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id')
    .eq('driver_id', bid.driver_id)
    .eq('is_active', true)
    .eq('is_verified', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!vehicle) {
    return { success: false, error: 'The selected driver has no verified active vehicle.' };
  }

  const amount = Number(bid.amount);
  const amountMinor = Math.round(amount * 100);
  const feeMinor = Math.round(amountMinor * 0.1);
  const now = new Date().toISOString();

  const { error: rejectError } = await supabase
    .from('bids')
    .update({ status: 'rejected', updated_at: now })
    .eq('order_id', orderId)
    .neq('id', bidId)
    .eq('status', 'pending');

  if (rejectError) return { success: false, error: rejectError.message };

  const { error: acceptError } = await supabase
    .from('bids')
    .update({
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
      vehicle_id: vehicle.id,
    })
    .eq('id', bidId);

  if (acceptError) return { success: false, error: acceptError.message };

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      accepted_bid_id: bidId,
      driver_id: bid.driver_id,
      vehicle_id: vehicle.id,
      price_agreed: amount,
      total_amount_minor: amountMinor,
      platform_fee_minor: feeMinor,
      driver_earnings_minor: amountMinor - feeMinor,
      status: 'payment_pending',
      updated_at: now,
    })
    .eq('id', orderId)
    .eq('status', 'pending');

  if (orderUpdateError) return { success: false, error: orderUpdateError.message };

  revalidatePath(`/client/orders/${orderId}`);
  revalidatePath('/driver');
  revalidatePath('/driver/orders');
  revalidatePath('/admin/orders');
  return { success: true };
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  // update_order_status is the only sanctioned way to change orders.status
  // post-assignment; direct .update() calls are blocked by RLS.
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: 'cancelled',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/client/orders/${orderId}`);
  return { success: true };
}

export async function sendBidMessage(orderId: string, bidId: string, message: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: 'Message cannot be empty.' };

  const { error } = await supabase.from('bid_messages').insert({
    bid_id: bidId,
    sender_id: user.id,
    message: trimmed,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/client/orders/${orderId}`);
  return { success: true };
}

export async function disputeOrder(orderId: string, notes?: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, client_id, status')
    .eq('id', orderId)
    .eq('client_id', user.id)
    .single();

  if (orderError || !order) return { success: false, error: 'Order not found.' };
  if (order.status !== 'delivered') {
    return { success: false, error: 'You can only dispute a delivered order.' };
  }

  const trimmedNotes = notes?.trim() ?? '';
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: 'disputed',
    ...(trimmedNotes ? { p_notes: trimmedNotes } : {}),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/client/orders/${orderId}`);
  return { success: true };
}

export async function submitClientReview(
  orderId: string,
  rating: number,
  comment: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Choose a rating from 1 to 5.' };
  }

  const trimmed = comment.trim();
  if (trimmed.length > 2000) {
    return { success: false, error: 'Keep the comment under 2,000 characters.' };
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, client_id, status')
    .eq('id', orderId)
    .eq('client_id', user.id)
    .single();

  if (orderError || !order) return { success: false, error: 'Order not found.' };
  if (order.status !== 'delivered' && order.status !== 'completed') {
    return { success: false, error: 'You can rate this trip after delivery.' };
  }

  const { error } = await supabase.rpc('submit_review', {
    p_order_id: orderId,
    p_rating: rating,
    p_comment: trimmed || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/client/orders/${orderId}`);
  return { success: true };
}
