'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type CreateClientOrderInput = {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  goodsDescription: string;
  vehicleTypeRequired: string | null;
};

export type CreateClientOrderResult =
  | { ok: true }
  | { ok: false; error: string };

export async function createClientOrder(
  input: CreateClientOrderInput,
): Promise<CreateClientOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' };
  }

  const pickupAddress = input.pickupAddress.trim();
  const dropoffAddress = input.dropoffAddress.trim();
  const goodsDescription = input.goodsDescription.trim();

  if (!pickupAddress || !dropoffAddress || !goodsDescription) {
    return { ok: false, error: 'Please complete all required order details.' };
  }

  const coordinates = [input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng];
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return { ok: false, error: 'Please place both pickup and drop-off pins on the map.' };
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,
      pickup_address: pickupAddress,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      dropoff_address: dropoffAddress,
      dropoff_lat: input.dropoffLat,
      dropoff_lng: input.dropoffLng,
      goods_description: goodsDescription,
      vehicle_type_required: input.vehicleTypeRequired || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createClientOrder failed', error);
    return {
      ok: false,
      error: error?.message ?? 'We could not post your order. Please try again.',
    };
  }

  redirect(`/client/orders/${data.id}`);
}