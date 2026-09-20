'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ApprovalStatus } from '@/types/supabase';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

import { getDevSession } from '@/lib/auth/dev-session';

/**
 * Ensures caller is signed in with 'admin' role.
 */
async function requireAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; result: ActionResult }
> {
  const devSession = await getDevSession();
  if (devSession && devSession.role === 'admin') {
    return { ok: true, adminId: devSession.id };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, result: { success: false, error: 'Authentication required.' } };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || profile?.role !== 'admin') {
    return { ok: false, result: { success: false, error: 'Admin authorization required.' } };
  }

  return { ok: true, adminId: user.id };
}

/**
 * Updates a vehicle's verification status (W3).
 * When isVerified = true, sets is_verified = true and verification_status = 'verified'.
 */
export async function verifyVehicleAction(
  vehicleId: string,
  isVerified: boolean,
  rejectionReason?: string
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  const adminClient = createAdminClient();

  const updateData: Record<string, any> = {
    is_verified: isVerified,
    verification_status: isVerified ? 'verified' : 'rejected',
    approved_by: isVerified ? adminCheck.adminId : null,
    approved_at: isVerified ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminClient
    .from('vehicles')
    .update(updateData)
    .eq('id', vehicleId);

  if (error) {
    return { success: false, error: `Failed to update vehicle: ${error.message}` };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/driver/profile');
  revalidatePath('/driver');
  return { success: true };
}

/**
 * Verifies or rejects an uploaded document (driver KYC or vehicle document).
 */
export async function verifyDocumentAction(
  documentId: string,
  docCategory: 'driver' | 'vehicle',
  status: 'verified' | 'rejected',
  rejectionReason?: string
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  const adminClient = createAdminClient();
  const table = docCategory === 'driver' ? 'driver_documents' : 'vehicle_documents';

  const updateData: Record<string, any> = {
    verification_status: status,
    reviewed_by: adminCheck.adminId,
    reviewed_at: new Date().toISOString(),
    rejection_reason: status === 'rejected' ? (rejectionReason || 'Document did not meet verification criteria') : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminClient
    .from(table)
    .update(updateData)
    .eq('id', documentId);

  if (error) {
    return { success: false, error: `Failed to update document: ${error.message}` };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/driver/profile');
  return { success: true };
}

/**
 * Updates driver approval status and records rejection reason if applicable.
 */
export async function updateDriverApprovalWithReason(
  driverId: string,
  newStatus: ApprovalStatus,
  rejectionReason?: string
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  const adminClient = createAdminClient();

  // 1. Update profiles table
  const profilePayload: Record<string, any> = {
    approval_status: newStatus,
  };
  if (newStatus !== 'approved') {
    profilePayload.is_online = false;
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .update(profilePayload)
    .eq('id', driverId);

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  // 2. Update or upsert driver_profiles record
  const driverProfilePayload: Record<string, any> = {
    approval_status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'approved') {
    driverProfilePayload.approved_by = adminCheck.adminId;
    driverProfilePayload.approved_at = new Date().toISOString();
    driverProfilePayload.rejection_reason = null;
  } else if (newStatus === 'rejected') {
    driverProfilePayload.rejection_reason = rejectionReason || 'Application does not meet onboarding requirements.';
  } else if (newStatus === 'pending') {
    driverProfilePayload.rejection_reason = null;
  }

  const { error: driverProfileError } = await adminClient
    .from('driver_profiles')
    .upsert({
      user_id: driverId,
      ...driverProfilePayload,
    }, { onConflict: 'user_id' });

  if (driverProfileError) {
    console.warn('Driver profile record sync warning:', driverProfileError.message);
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/driver');
  revalidatePath('/driver/profile');
  return { success: true };
}

/**
 * Generates a signed URL for an admin to view private documents.
 */
export async function getDocumentSignedUrl(
  bucket: 'driver-documents' | 'vehicle-documents',
  storagePath: string
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Could not create signed URL.' };
  }

  return { success: true, data: data.signedUrl };
}
