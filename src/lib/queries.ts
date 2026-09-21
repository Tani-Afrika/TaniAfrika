import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderStatus, BidStatus, OrderWithRelations, BidWithDriver, Vehicle } from '@/types/supabase';

async function getDbClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createAdminClient();
  }
  return await createClient();
}

function isPermissionError(err: any): boolean {
  if (!err) return false;
  return (
    err.code === '42501' ||
    err.code === 'PGRST301' ||
    err.code === 'PGRST204' ||
    err.code === '42P01' ||
    String(err.message || '').toLowerCase().includes('permission denied') ||
    String(err.message || '').toLowerCase().includes('jwt') ||
    String(err.message || '').toLowerCase().includes('apikey')
  );
}

export async function getDashboardStats() {
  try {
    const supabase = await getDbClient();

    const [
      ordersTotalRes,
      ordersActiveRes,
      driversRes,
      clientsRes,
      pendingApprovalsRes,
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

    const hasCountError =
      ordersTotalRes.error ||
      ordersActiveRes.error ||
      driversRes.error ||
      clientsRes.error ||
      pendingApprovalsRes.error;

    if (hasCountError) {
      console.warn('[getDashboardStats] Database count query error handled:', {
        ordersTotal: ordersTotalRes.error?.message,
        ordersActive: ordersActiveRes.error?.message,
        drivers: driversRes.error?.message,
        clients: clientsRes.error?.message,
        pendingApprovals: pendingApprovalsRes.error?.message,
      });
      return {
        totalOrders: 0,
        activeOrders: 0,
        totalDrivers: 0,
        totalClients: 0,
        pendingDriverApprovals: 0,
        recentOrders: [],
      };
    }

    const { data: recentOrders, error } = await supabase
      .from('orders')
      .select('id, status, pickup_address, dropoff_address, price_agreed, created_at')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.warn('[getDashboardStats] Error fetching recent orders:', error.message);
      return {
        totalOrders: ordersTotalRes.count ?? 0,
        activeOrders: ordersActiveRes.count ?? 0,
        totalDrivers: driversRes.count ?? 0,
        totalClients: clientsRes.count ?? 0,
        pendingDriverApprovals: pendingApprovalsRes.count ?? 0,
        recentOrders: [],
      };
    }

    return {
      totalOrders: ordersTotalRes.count ?? 0,
      activeOrders: ordersActiveRes.count ?? 0,
      totalDrivers: driversRes.count ?? 0,
      totalClients: clientsRes.count ?? 0,
      pendingDriverApprovals: pendingApprovalsRes.count ?? 0,
      recentOrders: recentOrders ?? [],
    };
  } catch (error: any) {
    console.warn('[getDashboardStats] Handled unexpected error:', error?.message || error);
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalDrivers: 0,
      totalClients: 0,
      pendingDriverApprovals: 0,
      recentOrders: [],
    };
  }
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
  const supabase = await getDbClient();
  const { status, search, dateFrom, dateTo, page = 1, pageSize = 15 } = params;
  const term = search?.trim();

  try {
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
    if (error) {
      console.warn('[getOrders] Query note:', error.message);
      return { orders: [], totalCount: 0, totalPages: 1, page, pageSize };
    }

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      orders: (data ?? []) as unknown as OrderWithRelations[],
      totalCount,
      totalPages,
      page,
      pageSize,
    };
  } catch (error: any) {
    console.warn('[getOrders] Handled error:', error?.message || error);
    return { orders: [], totalCount: 0, totalPages: 1, page, pageSize };
  }
}

export async function getOrderById(id: string) {
  try {
    const supabase = await getDbClient();

    const { data: order, error } = await supabase
      .from('orders')
      .select(
        '*, client:profiles!orders_client_id_fkey(id, full_name, phone), driver:profiles!orders_driver_id_fkey(id, full_name, phone)'
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[getOrderById] Query note:', error.message);
      return { order: null, bids: [], history: [], driverLocation: null };
    }

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
      const { data: location } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, heading, speed, updated_at')
        .eq('driver_id', order.driver_id)
        .maybeSingle();
      driverLocation = location;
    }

    return {
      order: order as unknown as OrderWithRelations,
      bids: (bids ?? []) as unknown as BidWithDriver[],
      history: history ?? [],
      driverLocation,
    };
  } catch (error: any) {
    console.warn('[getOrderById] Handled error:', error?.message || error);
    return { order: null, bids: [], history: [], driverLocation: null };
  }
}

export async function getDrivers() {
  try {
    const supabase = await getDbClient();

    const { data: drivers, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone, is_active, is_online, approval_status, created_at')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[getDrivers] Query note:', error.message);
      return [];
    }

    const [vehiclesRes, driverProfilesRes, driverDocsRes, vehicleDocsRes] = await Promise.all([
      supabase.from('vehicles').select('*'),
      supabase.from('driver_profiles').select('user_id, rejection_reason, national_id_last4, driving_licence_number'),
      supabase.from('driver_documents').select('id, driver_id, document_type, storage_path, verification_status, rejection_reason, created_at').order('created_at', { ascending: false }),
      supabase.from('vehicle_documents').select('id, vehicle_id, document_type, storage_path, verification_status, rejection_reason, created_at').order('created_at', { ascending: false }),
    ]);

    const vehiclesByDriver = new Map<string, Vehicle[]>();
    (vehiclesRes.data ?? []).forEach((v) => {
      const list = vehiclesByDriver.get(v.driver_id) ?? [];
      list.push(v as Vehicle);
      vehiclesByDriver.set(v.driver_id, list);
    });

    const driverProfilesByUser = new Map<string, any>();
    (driverProfilesRes.data ?? []).forEach((dp) => {
      driverProfilesByUser.set(dp.user_id, dp);
    });

    const driverDocsByUser = new Map<string, any[]>();
    (driverDocsRes.data ?? []).forEach((doc) => {
      const list = driverDocsByUser.get(doc.driver_id) ?? [];
      list.push(doc);
      driverDocsByUser.set(doc.driver_id, list);
    });

    return (drivers ?? []).map((d) => {
      const dVehicles = vehiclesByDriver.get(d.id) ?? [];
      const vIds = new Set(dVehicles.map((v) => v.id));
      const allVDocs = (vehicleDocsRes.data ?? []).filter((doc) => vIds.has(doc.vehicle_id));

      return {
        ...d,
        driverProfile: driverProfilesByUser.get(d.id) ?? null,
        driverDocuments: driverDocsByUser.get(d.id) ?? [],
        vehicles: dVehicles,
        vehicleDocuments: allVDocs,
      };
    });
  } catch (error: any) {
    console.warn('[getDrivers] Handled error:', error?.message || error);
    return [];
  }
}

export async function getClients() {
  try {
    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, phone, is_active, created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[getClients] Query note:', error.message);
      return [];
    }
    return data ?? [];
  } catch (error: any) {
    console.warn('[getClients] Handled error:', error?.message || error);
    return [];
  }
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
  try {
    const supabase = await getDbClient();

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
      console.warn('[getBids] Query note:', error.message);
      return [];
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
  } catch (error: any) {
    console.warn('[getBids] Handled error:', error?.message || error);
    return [];
  }
}
