'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { BidStatus, OrderStatus, VehicleType } from '@/types/supabase';

export type DriverOrderSummary = {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  goods_description: string;
  vehicle_type_required: VehicleType | null;
  status: OrderStatus;
  price_agreed: number | null;
  created_at: string;
  updated_at: string;
  client_id: string;
  driver_id: string | null;
};

export type DriverBidSummary = {
  id: string;
  order_id: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;
  order: DriverOrderSummary | null;
};

export type DriverMessage = {
  id: string;
  bid_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export type DriverDashboardData = {
  availableCount: number;
  activeCount: number;
  pendingBidCount: number;
  deliveredCount: number;
  earnings: number;
  availableOrders: DriverOrderSummary[];
  activeOrder: DriverOrderSummary | null;
  recentBids: DriverBidSummary[];
};

async function getAuthedDriver() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('You must be signed in as a driver.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'driver') throw new Error('Driver account required.');
  if (profile.approval_status !== 'approved') throw new Error('Your driver account is awaiting approval.');

  return { supabase, user };
}

export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  const { supabase, user } = await getAuthedDriver();

  const [availableResult, activeResult, bidsResult, deliveredResult] = await Promise.all([
    supabase.from('orders').select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id').eq('driver_id', user.id).in('status', ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered']).order('updated_at', { ascending: false }).limit(1),
    supabase.from('bids').select('id,order_id,amount,message,status,created_at,updated_at,orders(id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id)').eq('driver_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('orders').select('id,driver_earnings_minor', { count: 'exact' }).eq('driver_id', user.id).eq('status', 'completed'),
  ]);

  if (availableResult.error) throw availableResult.error;
  if (activeResult.error) throw activeResult.error;
  if (bidsResult.error) throw bidsResult.error;
  if (deliveredResult.error) throw deliveredResult.error;

  const deliveredRows = deliveredResult.data ?? [];
  const earnings = deliveredRows.reduce((sum, row) => sum + Number(row.driver_earnings_minor ?? 0) / 100, 0);
  const recentBids = (bidsResult.data ?? []).map((bid) => ({
    ...bid,
    amount: Number(bid.amount),
    order: Array.isArray(bid.orders) ? (bid.orders[0] as DriverOrderSummary | undefined) ?? null : (bid.orders as DriverOrderSummary | null),
  })) as DriverBidSummary[];

  return {
    availableCount: availableResult.count ?? 0,
    activeCount: activeResult.data?.length ?? 0,
    pendingBidCount: recentBids.filter((bid) => bid.status === 'pending').length,
    deliveredCount: deliveredResult.count ?? 0,
    earnings,
    availableOrders: (availableResult.data ?? []) as DriverOrderSummary[],
    activeOrder: ((activeResult.data ?? [])[0] as DriverOrderSummary | undefined) ?? null,
    recentBids,
  };
}

export async function getAvailableOrders(): Promise<DriverOrderSummary[]> {
  const { supabase } = await getAuthedDriver();
  const { data, error } = await supabase
    .from('orders')
    .select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DriverOrderSummary[];
}

export async function getDriverBids(): Promise<DriverBidSummary[]> {
  const { supabase, user } = await getAuthedDriver();
  const { data, error } = await supabase
    .from('bids')
    .select('id,order_id,amount,message,status,created_at,updated_at,orders(id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id)')
    .eq('driver_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((bid) => ({
    ...bid,
    amount: Number(bid.amount),
    order: Array.isArray(bid.orders) ? (bid.orders[0] as DriverOrderSummary | undefined) ?? null : (bid.orders as DriverOrderSummary | null),
  })) as DriverBidSummary[];
}

export async function getActiveDriverOrder(): Promise<DriverOrderSummary | null> {
  const { supabase, user } = await getAuthedDriver();
  const { data, error } = await supabase
    .from('orders')
    .select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id')
    .eq('driver_id', user.id)
    .in('status', ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as DriverOrderSummary | null;
}

export async function getDriverOrderDetail(orderId: string) {
  const { supabase, user } = await getAuthedDriver();
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error || !order) return null;

  const { data: ownBid } = await supabase
    .from('bids')
    .select('*')
    .eq('order_id', orderId)
    .eq('driver_id', user.id)
    .maybeSingle();

  let client: { id: string; full_name: string; phone?: string | null; avatar_url: string | null } | null = null;
  if (order.driver_id === user.id && order.status !== 'pending') {
    const { data } = await supabase.from('profiles').select('id,full_name,phone,avatar_url').eq('id', order.client_id).maybeSingle();
    client = data;
  } else {
    const { data } = await supabase.from('profiles_public').select('id,full_name,avatar_url').eq('id', order.client_id).maybeSingle();
    client = data;
  }

  const { data: history } = await supabase.from('order_status_history').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
  const { data: messages } = ownBid
    ? await supabase.from('bid_messages').select('*').eq('bid_id', ownBid.id).order('created_at', { ascending: true })
    : { data: [] };

  return { order, ownBid, client, history: history ?? [], messages: messages ?? [], currentUserId: user.id };
}

export async function getDriverEarnings() {
  const { supabase, user } = await getAuthedDriver();
  const { data, error } = await supabase
    .from('orders')
    .select('id,pickup_address,dropoff_address,driver_earnings_minor,delivered_at,created_at')
    .eq('driver_id', user.id)
    .eq('status', 'completed')
    .order('delivered_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map((row) => ({
    ...row,
    price_agreed: Number(row.driver_earnings_minor ?? 0) / 100,
  }));
  return { rows, total: rows.reduce((sum, row) => sum + row.price_agreed, 0) };
}

export async function placeDriverBid(input: { orderId: string; amount: number; message?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAuthedDriver();
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { success: false, error: 'Enter a valid bid amount.' };

    const { error } = await supabase.from('bids').insert({
      order_id: input.orderId,
      driver_id: user.id,
      amount: input.amount,
      message: input.message?.trim() || null,
    });
    if (error) return { success: false, error: error.message };
    revalidatePath('/driver');
    revalidatePath('/driver/orders');
    revalidatePath('/driver/bids');
    revalidatePath(`/driver/orders/${input.orderId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not submit your bid.' };
  }
}

export async function withdrawDriverBid(bidId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAuthedDriver();
    const { error } = await supabase.from('bids').update({ status: 'withdrawn' }).eq('id', bidId).eq('driver_id', user.id).eq('status', 'pending');
    if (error) return { success: false, error: error.message };
    revalidatePath('/driver/bids');
    revalidatePath(`/driver/orders/${orderId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not withdraw the bid.' };
  }
}

export async function updateDriverOrderStatus(
  orderId: string,
  nextStatus: Extract<OrderStatus, 'driver_en_route' | 'arrived' | 'loading' | 'picked_up' | 'in_transit' | 'delivered'>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase } = await getAuthedDriver();
    const { error } = await supabase.rpc('update_order_status', { p_order_id: orderId, p_new_status: nextStatus });
    if (error) return { success: false, error: error.message };
    revalidatePath('/driver');
    revalidatePath('/driver/active');
    revalidatePath(`/driver/orders/${orderId}`);
    revalidatePath('/driver/earnings');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not update the delivery.' };
  }
}

export async function sendDriverBidMessage(input: { bidId: string; orderId: string; message: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await getAuthedDriver();
    const message = input.message.trim();
    if (!message) return { success: false, error: 'Write a message first.' };
    const { error } = await supabase.from('bid_messages').insert({ bid_id: input.bidId, sender_id: user.id, message });
    if (error) return { success: false, error: error.message };
    revalidatePath(`/driver/orders/${input.orderId}`);
    revalidatePath('/driver/messages');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not send the message.' };
  }
}
