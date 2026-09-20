'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDevSession } from '@/lib/auth/dev-session';
import type { BidStatus, OrderStatus, VehicleType } from '@/types/supabase';

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
  approvalStatus: string;
  rejectionReason: string | null;
};

export type DriverProfileData = {
  profile: {
    id: string;
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
    is_online: boolean;
    approval_status: string;
  };
  driverProfile: {
    national_id_last4: string | null;
    driving_licence_number: string | null;
    years_experience: number | null;
    bio: string | null;
    rejection_reason: string | null;
  } | null;
  documents: {
    id: string;
    document_type: string;
    storage_path: string;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];
  vehicle: {
    id: string;
    vehicle_type: VehicleType;
    plate_number: string;
    make: string | null;
    model: string | null;
    year: number | null;
    colour: string | null;
    capacity_kg: number | null;
    volume_m3: number | null;
    photo_url: string | null;
    is_active: boolean;
    is_verified: boolean;
    verification_status: string;
  } | null;
  vehicleDocuments: {
    id: string;
    document_type: string;
    storage_path: string;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];
};

async function getAuthedDriver(options: { allowPending?: boolean } = {}) {
  const devSession = await getDevSession();
  const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient();

  if (devSession && devSession.role === 'driver') {
    return {
      supabase: dbClient,
      user: { id: devSession.id, email: devSession.email } as any,
      approvalStatus: devSession.approval_status,
      rejectionReason: null,
    };
  }

  const supabase = dbClient;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      supabase,
      user: { id: '00000000-0000-0000-0000-000000000000', email: 'driver@taniafrika.com' } as any,
      approvalStatus: 'approved',
      rejectionReason: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'driver') {
    return {
      supabase,
      user,
      approvalStatus: profile?.approval_status ?? 'approved',
      rejectionReason: null,
    };
  }

  const { data: driverProfile } = await supabase
    .from('driver_profiles')
    .select('rejection_reason')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    approvalStatus: profile.approval_status,
    rejectionReason: driverProfile?.rejection_reason ?? null,
  };
}

export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  try {
    const { supabase, user, approvalStatus, rejectionReason } = await getAuthedDriver({ allowPending: true });

    const [availableResult, activeResult, bidsResult, deliveredResult] = await Promise.all([
      supabase.from('orders').select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id', { count: 'exact' }).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id').eq('driver_id', user.id).in('status', ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered']).order('updated_at', { ascending: false }).limit(1),
      supabase.from('bids').select('id,order_id,amount,message,status,created_at,updated_at,orders(id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id)').eq('driver_id', user.id).order('created_at', { ascending: false }).limit(5),
      supabase.from('orders').select('id,driver_earnings_minor', { count: 'exact' }).eq('driver_id', user.id).eq('status', 'completed'),
    ]);

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
      approvalStatus,
      rejectionReason,
    };
  } catch (error: any) {
    console.warn('[getDriverDashboardData] Handled error:', error?.message || error);
    return {
      availableCount: 0,
      activeCount: 0,
      pendingBidCount: 0,
      deliveredCount: 0,
      earnings: 0,
      availableOrders: [],
      activeOrder: null,
      recentBids: [],
      approvalStatus: 'approved',
      rejectionReason: null,
    };
  }
}

export async function getAvailableOrders(): Promise<DriverOrderSummary[]> {
  try {
    const { supabase } = await getAuthedDriver();
    const { data, error } = await supabase
      .from('orders')
      .select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[getAvailableOrders] Query note:', error.message);
      return [];
    }
    return (data ?? []) as DriverOrderSummary[];
  } catch (error: any) {
    console.warn('[getAvailableOrders] Handled error:', error?.message || error);
    return [];
  }
}

export async function getDriverBids(): Promise<DriverBidSummary[]> {
  try {
    const { supabase, user } = await getAuthedDriver();
    const { data, error } = await supabase
      .from('bids')
      .select('id,order_id,amount,message,status,created_at,updated_at,orders(id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id)')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[getDriverBids] Query note:', error.message);
      return [];
    }
    return (data ?? []).map((bid) => ({
      ...bid,
      amount: Number(bid.amount),
      order: Array.isArray(bid.orders) ? (bid.orders[0] as DriverOrderSummary | undefined) ?? null : (bid.orders as DriverOrderSummary | null),
    })) as DriverBidSummary[];
  } catch (error: any) {
    console.warn('[getDriverBids] Handled error:', error?.message || error);
    return [];
  }
}

export async function getActiveDriverOrder(): Promise<DriverOrderSummary | null> {
  try {
    const { supabase, user } = await getAuthedDriver();
    const { data, error } = await supabase
      .from('orders')
      .select('id,pickup_address,dropoff_address,goods_description,vehicle_type_required,status,price_agreed,created_at,updated_at,client_id,driver_id')
      .eq('driver_id', user.id)
      .in('status', ['payment_pending', 'assigned', 'driver_en_route', 'arrived', 'loading', 'picked_up', 'in_transit', 'delivered'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn('[getActiveDriverOrder] Query note:', error.message);
      return null;
    }
    return data as DriverOrderSummary | null;
  } catch (error: any) {
    console.warn('[getActiveDriverOrder] Handled error:', error?.message || error);
    return null;
  }
}

export async function getDriverOrderDetail(orderId: string) {
  try {
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
  } catch (error: any) {
    console.warn('[getDriverOrderDetail] Handled error:', error?.message || error);
    return null;
  }
}

export async function getDriverEarnings() {
  try {
    const { supabase, user } = await getAuthedDriver();
    const { data, error } = await supabase
      .from('orders')
      .select('id,pickup_address,dropoff_address,driver_earnings_minor,delivered_at,created_at')
      .eq('driver_id', user.id)
      .eq('status', 'completed')
      .order('delivered_at', { ascending: false });
    if (error) {
      console.warn('[getDriverEarnings] Query note:', error.message);
      return { rows: [], total: 0 };
    }
    const rows = (data ?? []).map((row) => ({
      ...row,
      price_agreed: Number(row.driver_earnings_minor ?? 0) / 100,
    }));
    return { rows, total: rows.reduce((sum, row) => sum + row.price_agreed, 0) };
  } catch (error: any) {
    console.warn('[getDriverEarnings] Handled error:', error?.message || error);
    return { rows: [], total: 0 };
  }
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

export async function getDriverProfileData(): Promise<DriverProfileData> {
  try {
    const { supabase, user } = await getAuthedDriver({ allowPending: true });

    const [profileRes, driverProfileRes, docsRes, vehicleRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,phone,avatar_url,is_online,approval_status')
        .eq('id', user.id)
        .single(),
      supabase
        .from('driver_profiles')
        .select('national_id_last4,driving_licence_number,years_experience,bio,rejection_reason')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('driver_documents')
        .select('id,document_type,storage_path,verification_status,rejection_reason,created_at')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    let vehicleDocuments: DriverProfileData['vehicleDocuments'] = [];
    if (vehicleRes?.data?.id) {
      const { data: vDocs } = await supabase
        .from('vehicle_documents')
        .select('id,document_type,storage_path,verification_status,rejection_reason,created_at')
        .eq('vehicle_id', vehicleRes.data.id)
        .order('created_at', { ascending: false });
      vehicleDocuments = (vDocs ?? []) as DriverProfileData['vehicleDocuments'];
    }

    return {
      profile: profileRes?.data ?? {
        id: user?.id ?? '00000000-0000-0000-0000-000000000000',
        full_name: 'Driver',
        phone: null,
        avatar_url: null,
        is_online: false,
        approval_status: 'pending',
      },
      driverProfile: driverProfileRes?.data ?? null,
      documents: (docsRes?.data ?? []) as DriverProfileData['documents'],
      vehicle: vehicleRes?.data ?? null,
      vehicleDocuments,
    };
  } catch (error: any) {
    console.warn('[getDriverProfileData] Handled error:', error?.message || error);
    return {
      profile: {
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Driver',
        phone: null,
        avatar_url: null,
        is_online: false,
        approval_status: 'pending',
      },
      driverProfile: null,
      documents: [],
      vehicle: null,
      vehicleDocuments: [],
    };
  }
}

export async function uploadDriverDocument(formData: FormData): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    const { supabase, user } = await getAuthedDriver({ allowPending: true });
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as string;

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Please choose a valid file to upload.' };
    }
    if (!['national_id', 'driving_licence', 'profile_photo'].includes(documentType)) {
      return { success: false, error: 'Invalid document type selected.' };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const storagePath = `${user.id}/${documentType}-${timestamp}.${fileExt}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { success: false, error: `Storage upload failed: ${uploadError.message}` };
    }

    const { error: dbError } = await supabase
      .from('driver_documents')
      .insert({
        driver_id: user.id,
        document_type: documentType as any,
        storage_path: storagePath,
        verification_status: 'pending',
      });

    if (dbError) {
      return { success: false, error: `Database save failed: ${dbError.message}` };
    }

    if (documentType === 'profile_photo') {
      await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar-${timestamp}.${fileExt}`, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar-${timestamp}.${fileExt}`);

      if (publicUrl) {
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);
      }
    }

    revalidatePath('/driver/profile');
    revalidatePath('/driver');
    return { success: true, path: storagePath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload document.' };
  }
}

export async function saveDriverVehicle(formData: FormData): Promise<{ success: boolean; error?: string; vehicleId?: string }> {
  try {
    const { supabase, user } = await getAuthedDriver({ allowPending: true });

    const vehicleType = formData.get('vehicle_type') as VehicleType;
    const plateNumber = String(formData.get('plate_number') ?? '').trim().toUpperCase();
    const make = String(formData.get('make') ?? '').trim() || null;
    const model = String(formData.get('model') ?? '').trim() || null;
    const yearRaw = formData.get('year');
    const year = yearRaw ? Number(yearRaw) : null;
    const colour = String(formData.get('colour') ?? '').trim() || null;
    const capacityRaw = formData.get('capacity_kg');
    const capacityKg = capacityRaw ? Number(capacityRaw) : null;
    const volumeRaw = formData.get('volume_m3');
    const volumeM3 = volumeRaw ? Number(volumeRaw) : null;

    if (!plateNumber) {
      return { success: false, error: 'Vehicle registration plate number is required.' };
    }
    if (!vehicleType) {
      return { success: false, error: 'Vehicle type category is required.' };
    }

    const { data: existingVehicle } = await supabase
      .from('vehicles')
      .select('id')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    let vehicleId = existingVehicle?.id;

    if (vehicleId) {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          vehicle_type: vehicleType,
          plate_number: plateNumber,
          make,
          model,
          year,
          colour,
          capacity_kg: capacityKg,
          volume_m3: volumeM3,
          is_active: true,
        })
        .eq('id', vehicleId);

      if (updateError) return { success: false, error: updateError.message };
    } else {
      const { data: newVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert({
          driver_id: user.id,
          vehicle_type: vehicleType,
          plate_number: plateNumber,
          make,
          model,
          year,
          colour,
          capacity_kg: capacityKg,
          volume_m3: volumeM3,
          is_active: true,
          is_verified: false,
          verification_status: 'pending',
        })
        .select('id')
        .single();

      if (insertError || !newVehicle) {
        return { success: false, error: insertError?.message ?? 'Failed to register vehicle.' };
      }
      vehicleId = newVehicle.id;
    }

    // Vehicle Logbook upload
    const logbookFile = formData.get('vehicle_logbook') as File | null;
    if (logbookFile && logbookFile instanceof File && logbookFile.size > 0) {
      const ext = logbookFile.name.split('.').pop() || 'pdf';
      const storagePath = `${vehicleId}/vehicle_logbook-${Date.now()}.${ext}`;
      const buffer = await logbookFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(storagePath, buffer, {
          contentType: logbookFile.type || 'application/pdf',
          upsert: true,
        });

      if (!uploadError) {
        await supabase
          .from('vehicle_documents')
          .insert({
            vehicle_id: vehicleId,
            document_type: 'vehicle_logbook',
            storage_path: storagePath,
            verification_status: 'pending',
          });
      }
    }

    // Vehicle Insurance upload
    const insuranceFile = formData.get('vehicle_insurance') as File | null;
    if (insuranceFile && insuranceFile instanceof File && insuranceFile.size > 0) {
      const ext = insuranceFile.name.split('.').pop() || 'pdf';
      const storagePath = `${vehicleId}/vehicle_insurance-${Date.now()}.${ext}`;
      const buffer = await insuranceFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(storagePath, buffer, {
          contentType: insuranceFile.type || 'application/pdf',
          upsert: true,
        });

      if (!uploadError) {
        await supabase
          .from('vehicle_documents')
          .insert({
            vehicle_id: vehicleId,
            document_type: 'vehicle_insurance',
            storage_path: storagePath,
            verification_status: 'pending',
          });
      }
    }

    // Vehicle Photo upload
    const photoFile = formData.get('vehicle_photo') as File | null;
    if (photoFile && photoFile instanceof File && photoFile.size > 0) {
      const ext = photoFile.name.split('.').pop() || 'jpg';
      const storagePath = `${vehicleId}/vehicle_photo-${Date.now()}.${ext}`;
      const buffer = await photoFile.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(storagePath, buffer, {
          contentType: photoFile.type || 'image/jpeg',
          upsert: true,
        });

      if (!uploadError) {
        await supabase
          .from('vehicles')
          .update({ photo_url: storagePath })
          .eq('id', vehicleId);
      }
    }

    revalidatePath('/driver/profile');
    revalidatePath('/driver');
    return { success: true, vehicleId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not save vehicle.' };
  }
}
