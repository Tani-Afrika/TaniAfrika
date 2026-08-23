import { createClient } from '@/lib/supabase/server';
import type { OrderStatus, BidStatus, OrderWithRelations, BidWithDriver, Vehicle } from '@/types/supabase';

export async function getDashboardStats() {
  const supabase = await createClient();

  const [
    { count: totalOrders },
    { count: activeOrders },
    { count: totalDrivers },
    { count: totalClients },
    { count: pendingDriverApprovals },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver')
      .eq('approval_status', 'pending'),
  ]);

  const { data: recentOrders, error } = await supabase
    .from('orders')
    .select('id, status, pickup_address, dropoff_address, price_agreed, created_at')
    .order('created_at', { ascending: false })
    .limit(8);

  if (error) throw error;

  return {
    totalOrders: totalOrders ?? 0,
    activeOrders: activeOrders ?? 0,
    totalDrivers: totalDrivers ?? 0,
    totalClients: totalClients ?? 0,
    pendingDriverApprovals: pendingDriverApprovals ?? 0,
    recentOrders: recentOrders ?? [],
  };
}

export interface GetOrdersParams {
  status?: OrderStatus | 'all';
  search?: string;
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string; // yyyy-mm-dd
  page?: number;
  pageSize?: number;
}

export interface GetOrdersResult {
  orders: OrderWithRelations[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export async function getOrders(
  params: GetOrdersParams = {}
): Promise<GetOrdersResult> {
  const supabase = await createClient();
  const { status, search, dateFrom, dateTo, page = 1, pageSize = 15 } = params;
  const term = search?.trim();

  // Client name matches are resolved separately since Supabase can't OR
  // across a foreign-table column and native columns in one .or() call.
  let matchingClientIds: string[] | null = null;
  if (term) {
    const { data: matchingClients } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .ilike('full_name', `%${term}%`);
    matchingClientIds = (matchingClients ?? []).map((c) => c.id);
  }

  let query = supabase
    .from('orders')
    .select(
      'id, status, pickup_address, dropoff_address, price_agreed, vehicle_type_required, created_at, client_id, client:profiles!orders_client_id_fkey(id, full_name, phone), driver:profiles!orders_driver_id_fkey(id, full_name, phone)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00`);
  }

  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59`);
  }

  if (term) {
    const orParts = [
      `pickup_address.ilike.%${term}%`,
      `dropoff_address.ilike.%${term}%`,
    ];
    if (matchingClientIds && matchingClientIds.length > 0) {
      orParts.push(`client_id.in.(${matchingClientIds.join(',')})`);
    }
    query = query.or(orParts.join(','));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    orders: (data ?? []) as unknown as OrderWithRelations[],
    totalCount,
    totalPages,
    page,
    pageSize,
  };
}

export async function getOrderById(id: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      '*, client:profiles!orders_client_id_fkey(id, full_name, phone), driver:profiles!orders_driver_id_fkey(id, full_name, phone)'
    )
    .eq('id', id)
    .single();
  if (error) throw error;

  const { data: bids } = await supabase
    .from('bids')
    .select(
      'id, amount, message, status, created_at, driver_id, driver:profiles!bids_driver_id_fkey(id, full_name, phone)'
    )
    .eq('order_id', id)
    .order('amount', { ascending: true });

  const { data: history } = await supabase
    .from('order_status_history')
    .select('id, status, notes, created_at, changed_by')
    .eq('order_id', id)
    .order('created_at', { ascending: true });

  let driverLocation = null;
  if (order?.driver_id) {
  const { data: location, error: locationError } =
    await supabase
      .from('driver_locations')
      .select(
        'latitude, longitude, heading, speed, updated_at'
      )
      .eq(
        'driver_id',
        order.driver_id
      )
      .maybeSingle();

  if (locationError) {
    console.error(
      'Unable to load driver location:',
      locationError
    );
  }

  driverLocation = location;
}
  return {
    order: order as unknown as OrderWithRelations,
    bids: (bids ?? []) as unknown as BidWithDriver[],
    history: history ?? [],
    driverLocation,
  };
}

export async function getDrivers() {
  const supabase = await createClient();

  const { data: drivers, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, is_active, is_online, approval_status, created_at')
    .eq('role', 'driver')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const { data: vehicles } = await supabase.from('vehicles').select('*');

  const vehiclesByDriver = new Map<string, Vehicle[]>();
  (vehicles ?? []).forEach((v) => {
    const list = vehiclesByDriver.get(v.driver_id) ?? [];
    list.push(v as Vehicle);
    vehiclesByDriver.set(v.driver_id, list);
  });

  return (drivers ?? []).map((d) => ({
    ...d,
    vehicles: vehiclesByDriver.get(d.id) ?? [],
  }));
}

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, phone, is_active, created_at')
    .eq('role', 'client')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export interface AdminBid {
  id: string;
  order_id: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  created_at: string;

  driver: {
    id: string;
    full_name: string;
    phone: string | null;
  } | null;

  order: {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    status: OrderStatus;
  } | null;
}

export async function getBids(): Promise<AdminBid[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bids')
    .select(
      `
        id,
        order_id,
        amount,
        message,
        status,
        created_at,
        driver:profiles!bids_driver_id_fkey(
          id,
          full_name,
          phone
        ),
        order:orders(
          id,
          pickup_address,
          dropoff_address,
          status
        )
      `
    )
    .order('created_at', {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((bid) => ({
    id: bid.id,
    order_id: bid.order_id,
    amount: bid.amount,
    message: bid.message,
    status: bid.status as BidStatus,
    created_at: bid.created_at,

    driver: Array.isArray(bid.driver)
      ? bid.driver[0] ?? null
      : bid.driver ?? null,

    order: Array.isArray(bid.order)
      ? bid.order[0] ?? null
      : bid.order ?? null,
  })) as AdminBid[];
}
