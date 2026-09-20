'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  verifyVehicleAction,
  verifyDocumentAction,
  updateDriverApprovalWithReason,
  getDocumentSignedUrl,
} from '@/lib/actions/admin-verification';
import { VEHICLE_TYPE_LABELS, formatDate } from '@/lib/format';
import type { ApprovalStatus, VehicleType } from '@/types/supabase';

export interface DriverVerificationData {
  id: string;
  full_name: string;
  phone: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  is_online?: boolean;
  is_active?: boolean;
  driverProfile?: {
    rejection_reason: string | null;
    national_id_last4: string | null;
    driving_licence_number: string | null;
  } | null;
  vehicles: {
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
    is_verified: boolean;
    verification_status: string;
  }[];
  driverDocuments: {
    id: string;
    document_type: string;
    storage_path: string;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];
  vehicleDocuments: {
    id: string;
    vehicle_id: string;
    document_type: string;
    storage_path: string;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];
}

interface DriverVerificationModalProps {
  driver: DriverVerificationData;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverVerificationModal({
  driver,
  isOpen,
  onClose,
}: DriverVerificationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rejectingTarget, setRejectingTarget] = useState<{
    type: 'driver' | 'vehicle' | 'doc';
    id: string;
    docCategory?: 'driver' | 'vehicle';
    title: string;
  } | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  if (!isOpen) return null;

  async function handleVerifyVehicle(vehicleId: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await verifyVehicleAction(vehicleId, true);
      if (res.success) {
        setFeedback({ type: 'success', message: 'Vehicle verified successfully.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error ?? 'Failed to verify vehicle.' });
      }
    });
  }

  async function handleVerifyDoc(documentId: string, category: 'driver' | 'vehicle') {
    setFeedback(null);
    startTransition(async () => {
      const res = await verifyDocumentAction(documentId, category, 'verified');
      if (res.success) {
        setFeedback({ type: 'success', message: 'Document verified.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error ?? 'Failed to verify document.' });
      }
    });
  }

  async function handleApproveDriver() {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateDriverApprovalWithReason(driver.id, 'approved');
      if (res.success) {
        setFeedback({ type: 'success', message: 'Driver approved successfully.' });
        router.refresh();
      } else {
        setFeedback({ type: 'error', message: res.error ?? 'Failed to approve driver.' });
      }
    });
  }

  async function handleViewDocument(bucket: 'driver-documents' | 'vehicle-documents', path: string) {
    const res = await getDocumentSignedUrl(bucket, path);
    if (res.success && res.data) {
      window.open(res.data, '_blank');
    } else {
      alert(res.error ?? 'Unable to generate document link.');
    }
  }

  function submitRejection() {
    if (!rejectingTarget) return;
    const reason = rejectionReasonInput.trim();
    if (!reason) {
      alert('Please provide a specific rejection reason for the driver.');
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      if (rejectingTarget.type === 'driver') {
        const res = await updateDriverApprovalWithReason(driver.id, 'rejected', reason);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Driver application rejected with reason.' });
          setRejectingTarget(null);
          setRejectionReasonInput('');
          router.refresh();
        } else {
          setFeedback({ type: 'error', message: res.error ?? 'Failed to reject driver.' });
        }
      } else if (rejectingTarget.type === 'vehicle') {
        const res = await verifyVehicleAction(rejectingTarget.id, false, reason);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Vehicle rejected.' });
          setRejectingTarget(null);
          setRejectionReasonInput('');
          router.refresh();
        } else {
          setFeedback({ type: 'error', message: res.error ?? 'Failed to reject vehicle.' });
        }
      } else if (rejectingTarget.type === 'doc') {
        const res = await verifyDocumentAction(rejectingTarget.id, rejectingTarget.docCategory!, 'rejected', reason);
        if (res.success) {
          setFeedback({ type: 'success', message: 'Document rejected.' });
          setRejectingTarget(null);
          setRejectionReasonInput('');
          router.refresh();
        } else {
          setFeedback({ type: 'error', message: res.error ?? 'Failed to reject document.' });
        }
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#FDFBF7] px-6 py-5">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-slate-950">{driver.full_name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  driver.approval_status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : driver.approval_status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {driver.approval_status.toUpperCase()}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Phone: {driver.phone ?? 'None'} • Registered: {formatDate(driver.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {feedback && (
            <div
              className={`rounded-xl p-3.5 text-xs sm:text-sm font-semibold ${
                feedback.type === 'success'
                  ? 'border border-[#1F5F3F]/20 bg-[#1F5F3F]/10 text-[#1F5F3F]'
                  : 'border border-red-200 bg-red-50 text-red-800'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* Rejection Prompt Form (Conditional) */}
          {rejectingTarget && (
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 sm:p-5">
              <h4 className="text-sm font-bold text-red-900">
                Provide Rejection Reason for {rejectingTarget.title}
              </h4>
              <p className="mt-1 text-xs text-red-700">
                This explanation will be recorded and shown to the driver so they know what needs correcting.
              </p>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Unreadable photo, expired document, incorrect plate format..."
                className="mt-3 w-full rounded-xl border border-red-300 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                rows={3}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRejectingTarget(null);
                    setRejectionReasonInput('');
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  disabled={isPending}
                  className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}

          {/* 1. KYC Documents Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5F3F] mb-3">
              1. Driver Identification & Credentials
            </h3>
            {driver.driverDocuments.length ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {driver.driverDocuments.map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </span>
                        <DocStatusBadge status={doc.verification_status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Uploaded: {formatDate(doc.created_at)}
                      </p>
                      {doc.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600 font-medium">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDocument('driver-documents', doc.storage_path)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View File ↗
                      </button>
                      {doc.verification_status !== 'verified' && (
                        <button
                          disabled={isPending}
                          onClick={() => handleVerifyDoc(doc.id, 'driver')}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                      {doc.verification_status !== 'rejected' && (
                        <button
                          disabled={isPending}
                          onClick={() => {
                            setRejectingTarget({
                              type: 'doc',
                              id: doc.id,
                              docCategory: 'driver',
                              title: doc.document_type.replace('_', ' '),
                            });
                          }}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                No KYC documents uploaded by driver yet.
              </p>
            )}
          </div>

          {/* 2. Registered Vehicles Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1F5F3F] mb-3">
              2. Fleet & Vehicle Verification (Required for Bidding)
            </h3>
            {driver.vehicles.length ? (
              <div className="space-y-4">
                {driver.vehicles.map((v) => {
                  const vDocs = driver.vehicleDocuments.filter((d) => d.vehicle_id === v.id);

                  return (
                    <div key={v.id} className="rounded-2xl border border-slate-200 bg-[#FDFBF7] p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-sm text-slate-900 uppercase">
                              {v.plate_number}
                            </span>
                            <span className="text-xs font-medium text-slate-600">
                              • {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                v.is_verified
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {v.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {[v.make, v.model, v.year, v.colour].filter(Boolean).join(' ')} •{' '}
                            {v.capacity_kg ? `${v.capacity_kg} kg capacity` : 'No capacity set'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!v.is_verified ? (
                            <button
                              disabled={isPending}
                              onClick={() => handleVerifyVehicle(v.id)}
                              className="rounded-xl bg-[#1F5F3F] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#184c32] shadow-sm disabled:opacity-50 transition"
                            >
                              Verify Vehicle ✓
                            </button>
                          ) : (
                            <button
                              disabled={isPending}
                              onClick={() => {
                                setRejectingTarget({
                                  type: 'vehicle',
                                  id: v.id,
                                  title: `Vehicle ${v.plate_number}`,
                                });
                              }}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Revoke Verification
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Compliance Documents */}
                      <div className="mt-3">
                        <p className="text-xs font-bold text-slate-700 mb-2">Vehicle Compliance Evidence:</p>
                        {vDocs.length ? (
                          <div className="divide-y divide-slate-200/60 rounded-xl border border-slate-200 bg-white">
                            {vDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between p-3 text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800 capitalize">
                                    {doc.document_type.replace('_', ' ')}
                                  </span>
                                  <DocStatusBadge status={doc.verification_status} />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewDocument('vehicle-documents', doc.storage_path)}
                                    className="rounded-lg border border-slate-200 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    View ↗
                                  </button>
                                  {doc.verification_status !== 'verified' && (
                                    <button
                                      disabled={isPending}
                                      onClick={() => handleVerifyDoc(doc.id, 'vehicle')}
                                      className="rounded-lg bg-emerald-600 px-2 py-1 font-bold text-white hover:bg-emerald-700"
                                    >
                                      Verify
                                    </button>
                                  )}
                                  {doc.verification_status !== 'rejected' && (
                                    <button
                                      disabled={isPending}
                                      onClick={() => {
                                        setRejectingTarget({
                                          type: 'doc',
                                          id: doc.id,
                                          docCategory: 'vehicle',
                                          title: doc.document_type.replace('_', ' '),
                                        });
                                      }}
                                      className="rounded-lg border border-red-200 px-2 py-1 font-semibold text-red-700 hover:bg-red-50"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No logbook or insurance uploaded for this vehicle.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                No vehicles registered by driver yet.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-xs text-slate-500">
            Bid Acceptance requires: <strong className="text-slate-800">Approved Driver + Active Verified Vehicle</strong>.
          </div>
          <div className="flex items-center gap-2">
            {driver.approval_status !== 'approved' && (
              <button
                disabled={isPending}
                onClick={handleApproveDriver}
                className="rounded-xl bg-[#1F5F3F] px-4 py-2 text-xs font-bold text-white hover:bg-[#184c32] shadow transition disabled:opacity-50"
              >
                Approve Driver Account
              </button>
            )}
            {driver.approval_status !== 'rejected' && (
              <button
                disabled={isPending}
                onClick={() => {
                  setRejectingTarget({
                    type: 'driver',
                    id: driver.id,
                    title: `Driver ${driver.full_name}`,
                  });
                }}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Reject Driver...
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified</span>;
  }
  if (status === 'pending') {
    return <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Pending Review</span>;
  }
  if (status === 'rejected') {
    return <span className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">Rejected</span>;
  }
  return <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{status}</span>;
}
