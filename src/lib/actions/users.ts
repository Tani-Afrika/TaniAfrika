'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole, ApprovalStatus } from '@/types/supabase';

const VALID_ROLES: UserRole[] = ['client', 'driver', 'admin'];
const VALID_APPROVAL_STATUSES: ApprovalStatus[] = ['pending', 'approved', 'rejected'];

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Verifies the current session belongs to a logged-in admin.
 * Returns the caller's user id on success, or an error result on failure.
 */
async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; result: ActionResult }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, result: { success: false, error: 'Not authenticated.' } };
  }

  const { data: callerProfile, error: callerError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerError || callerProfile?.role !== 'admin') {
    return { ok: false, result: { success: false, error: 'Not authorized.' } };
  }

  return { ok: true, userId: user.id };
}

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<ActionResult> {
  if (!VALID_ROLES.includes(newRole)) {
    return { success: false, error: 'Invalid role.' };
  }

  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  // Optional safety: prevent an admin from accidentally demoting themselves.
  if (targetUserId === adminCheck.userId && newRole !== 'admin') {
    return {
      success: false,
      error: 'You cannot change your own role away from admin.',
    };
  }

  const adminClient = createAdminClient();

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/clients');
  revalidatePath('/drivers');
  revalidatePath('/');

  return { success: true };
}

export async function updateDriverApproval(
  driverId: string,
  newStatus: ApprovalStatus
): Promise<ActionResult> {
  if (!VALID_APPROVAL_STATUSES.includes(newStatus)) {
    return { success: false, error: 'Invalid approval status.' };
  }

  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return adminCheck.result;

  const adminClient = createAdminClient();

  // Confirm the target is actually a driver before touching approval_status.
  const { data: targetProfile, error: fetchError } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', driverId)
    .single();

  if (fetchError || !targetProfile) {
    return { success: false, error: 'Driver not found.' };
  }

  if (targetProfile.role !== 'driver') {
    return { success: false, error: 'This user is not a driver.' };
  }

  const updatePayload: { approval_status: ApprovalStatus; is_online?: boolean } = {
    approval_status: newStatus,
  };

  // If a driver is rejected or reset to pending while online, force them offline.
  if (newStatus !== 'approved') {
    updatePayload.is_online = false;
  }

  const { error: updateError } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', driverId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/drivers');
  revalidatePath('/');

  return { success: true };
}