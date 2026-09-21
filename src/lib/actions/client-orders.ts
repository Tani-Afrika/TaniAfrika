'use server';

import { redirect } from 'next/navigation';

import { VEHICLE_TYPE_LABELS } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { VehicleType } from '@/types/supabase';

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type CreateClientOrderInput = {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupAccessNotes: string | null;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  goodsDescription: string;
  vehicleTypeRequired: string | null;
  scheduledForIso: string | null;
  fragile: boolean;
};

export type CreateClientOrderResult =
  | { ok: true }
  | { ok: false; error: string };

const isVehicleType = (value: string): value is VehicleType =>
  Object.prototype.hasOwnProperty.call(VEHICLE_TYPE_LABELS, value);

export async function createClientOrder(
  input: CreateClientOrderInput,
  photo: File | null,
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
  const pickupAccessNotes = input.pickupAccessNotes?.trim() || null;

  if (!pickupAddress || !dropoffAddress || !goodsDescription) {
    return { ok: false, error: 'Please complete all required order details.' };
  }

  if (goodsDescription.length < 3 || goodsDescription.length > 3000) {
    return { ok: false, error: 'Describe what you are moving in 3 to 3,000 characters.' };
  }

  if (pickupAccessNotes && pickupAccessNotes.length > 500) {
    return { ok: false, error: 'Keep the landmark note under 500 characters.' };
  }

  const coordinates = [input.pickupLat, input.pickupLng, input.dropoffLat, input.dropoffLng];
  if (coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    return { ok: false, error: 'Please place both pickup and drop-off pins on the map.' };
  }

  const vehicleTypeRequired =
    input.vehicleTypeRequired && isVehicleType(input.vehicleTypeRequired)
      ? input.vehicleTypeRequired
      : null;

  let scheduledFor: string | null = null;
  if (input.scheduledForIso) {
    const scheduledDate = new Date(input.scheduledForIso);
    if (Number.isNaN(scheduledDate.getTime())) {
      return { ok: false, error: 'Choose a valid pickup date and time, or pick as soon as possible.' };
    }
    if (scheduledDate.getTime() < Date.now() - 60_000) {
      return { ok: false, error: 'Scheduled pickup must be in the future.' };
    }
    scheduledFor = scheduledDate.toISOString();
  }

  if (photo) {
    if (!ALLOWED_PHOTO_TYPES[photo.type]) {
      return { ok: false, error: 'Photos must be JPEG, PNG, or WebP.' };
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return { ok: false, error: 'Photos must be 15 MB or smaller.' };
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      client_id: user.id,
      pickup_address: pickupAddress,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      pickup_access_notes: pickupAccessNotes,
      dropoff_address: dropoffAddress,
      dropoff_lat: input.dropoffLat,
      dropoff_lng: input.dropoffLng,
      goods_description: goodsDescription,
      vehicle_type_required: vehicleTypeRequired,
      scheduled_for: scheduledFor,
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

  if (input.fragile) {
    const { error: itemError } = await supabase.from('order_items').insert({
      order_id: data.id,
      description: goodsDescription,
      quantity: 1,
      fragile: true,
    });

    if (itemError) {
      console.error('createClientOrder item failed', itemError);
      return {
        ok: false,
        error: itemError.message ?? 'The order was created but we could not save the fragile flag. Open the order and try again.',
      };
    }
  }

  if (photo) {
    const extension = ALLOWED_PHOTO_TYPES[photo.type];
    const storagePath = `${data.id}/goods_photo-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await photo.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('order-evidence')
      .upload(storagePath, buffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('createClientOrder photo upload failed', uploadError);
      return {
        ok: false,
        error: uploadError.message ?? 'The order was created but the photo could not be uploaded.',
      };
    }

    const { error: attachmentError } = await supabase.from('order_attachments').insert({
      order_id: data.id,
      uploaded_by: user.id,
      attachment_type: 'goods_photo',
      storage_path: storagePath,
    });

    if (attachmentError) {
      console.error('createClientOrder attachment failed', attachmentError);
      return {
        ok: false,
        error: attachmentError.message ?? 'The order was created but we could not attach the photo.',
      };
    }
  }

  redirect(`/client/orders/${data.id}`);
}
