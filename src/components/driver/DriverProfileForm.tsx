'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  uploadDriverDocument,
  saveDriverVehicle,
  type DriverProfileData,
} from '@/lib/actions/driver-orders';
import { VEHICLE_TYPE_LABELS } from '@/lib/format';
import type { VehicleType } from '@/types/supabase';
import { CheckIcon, UserIcon } from './DriverIcons';

interface DriverProfileFormProps {
  initialData: DriverProfileData;
}

const VEHICLE_OPTIONS: { value: VehicleType; label: string }[] = [
  { value: 'motorcycle', label: VEHICLE_TYPE_LABELS.motorcycle },
  { value: 'tuktuk', label: VEHICLE_TYPE_LABELS.tuktuk },
  { value: 'pickup', label: VEHICLE_TYPE_LABELS.pickup },
  { value: 'van', label: VEHICLE_TYPE_LABELS.van },
  { value: 'truck_small', label: VEHICLE_TYPE_LABELS.truck_small },
  { value: 'truck_large', label: VEHICLE_TYPE_LABELS.truck_large },
];

export default function DriverProfileForm({ initialData }: DriverProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { profile, driverProfile, documents, vehicle, vehicleDocuments } = initialData;

  const [docFeedback, setDocFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [vehicleFeedback, setVehicleFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);

  // Vehicle form state
  const [vehicleType, setVehicleType] = useState<VehicleType>(vehicle?.vehicle_type ?? 'pickup');
  const [plateNumber, setPlateNumber] = useState(vehicle?.plate_number ?? '');
  const [make, setMake] = useState(vehicle?.make ?? '');
  const [model, setModel] = useState(vehicle?.model ?? '');
  const [year, setYear] = useState(vehicle?.year ? String(vehicle.year) : '');
  const [colour, setColour] = useState(vehicle?.colour ?? '');
  const [capacityKg, setCapacityKg] = useState(vehicle?.capacity_kg ? String(vehicle.capacity_kg) : '');
  const [volumeM3, setVolumeM3] = useState(vehicle?.volume_m3 ? String(vehicle.volume_m3) : '');

  function getDocStatus(type: string) {
    const doc = documents.find((d) => d.document_type === type);
    return doc ? doc.verification_status : 'not_submitted';
  }

  function getVehicleDocStatus(type: string) {
    const doc = vehicleDocuments.find((d) => d.document_type === type);
    return doc ? doc.verification_status : 'not_submitted';
  }

  async function handleDocUpload(documentType: 'national_id' | 'driving_licence' | 'profile_photo', file: File) {
    setDocFeedback(null);
    setUploadingDocType(documentType);

    const formData = new FormData();
    formData.set('document_type', documentType);
    formData.set('file', file);

    startTransition(async () => {
      const res = await uploadDriverDocument(formData);
      setUploadingDocType(null);

      if (res.success) {
        setDocFeedback({
          type: 'success',
          message: `${documentType.replace('_', ' ').toUpperCase()} uploaded successfully.`,
        });
        router.refresh();
      } else {
        setDocFeedback({
          type: 'error',
          message: res.error ?? 'Upload failed. Please try again.',
        });
      }
    });
  }

  async function handleVehicleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setVehicleFeedback(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await saveDriverVehicle(formData);

      if (res.success) {
        setVehicleFeedback({
          type: 'success',
          message: 'Vehicle information saved. Awaiting admin review.',
        });
        router.refresh();
      } else {
        setVehicleFeedback({
          type: 'error',
          message: res.error ?? 'Failed to save vehicle details.',
        });
      }
    });
  }

  const isApproved = profile.approval_status === 'approved';
  const isRejected = profile.approval_status === 'rejected';

  // Checklist status helpers
  const idStatus = getDocStatus('national_id');
  const licenceStatus = getDocStatus('driving_licence');
  const logbookStatus = getVehicleDocStatus('vehicle_logbook');
  const insuranceStatus = getVehicleDocStatus('vehicle_insurance');

  return (
    <div className="space-y-4">
      {/* 1. Luminous Meadow Top Banner with Reliable Neighbour Borders & Controls */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-[#1F5F3F]/20 bg-gradient-to-br from-[#F1FAF3] via-[#E2F6E6] to-[#CEEFD3] p-5 text-slate-900 shadow-sm">
        {/* Subtle decorative road contours reflecting brand graphic */}
        <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full border-[14px] border-[#74C67A]/25" />
        <div className="pointer-events-none absolute -right-4 -bottom-16 h-40 w-40 rounded-full border-[10px] border-[#1F5F3F]/10" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Driver identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-[#1F5F3F]/30 bg-white text-base font-bold text-[#1F5F3F] shadow-sm">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-7 w-7 text-[#1F5F3F]" />
                )}
              </span>
              <label
                htmlFor="profile_photo_input"
                className="absolute -bottom-1 -right-1 cursor-pointer rounded-md bg-[#1F5F3F] hover:bg-[#14422B] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm transition"
                title="Change photo"
              >
                {uploadingDocType === 'profile_photo' ? '…' : 'Edit'}
                <input
                  id="profile_photo_input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDocUpload('profile_photo', file);
                  }}
                />
              </label>
            </div>

            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#14422B] truncate">
                {profile.full_name}
              </h1>
              <p className="text-xs font-semibold text-[#1F5F3F]">
                {profile.phone ?? 'No phone recorded'}
              </p>
            </div>
          </div>

          {/* Status Capsule */}
          <div className="flex flex-col sm:items-end gap-1">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#1F5F3F]/30 px-3 py-1 text-xs font-bold text-[#14422B] shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#74C67A]" />
                Approved Driver
              </span>
            ) : isRejected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-bold text-red-900 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Action Required
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#D4A244] px-3 py-1 text-xs font-bold text-amber-950 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Pending Verification
              </span>
            )}

            <p className="text-[11px] font-medium text-[#1F5F3F]/85">
              {isApproved
                ? 'Active for bidding across marketplace'
                : isRejected
                ? driverProfile?.rejection_reason || 'Please update documents'
                : 'Review takes up to 24h • Bidding unlocks once approved'}
            </p>
          </div>
        </div>

        {/* Verification Checklist Pills */}
        <div className="relative z-10 mt-4 border-t border-[#1F5F3F]/15 pt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-[#1F5F3F] uppercase tracking-wider mr-1">
            Checklist:
          </span>
          <ChecklistChip label="National ID" status={idStatus} />
          <ChecklistChip label="Licence" status={licenceStatus} />
          <ChecklistChip label="Vehicle Info" status={vehicle ? (vehicle.is_verified ? 'verified' : 'pending') : 'not_submitted'} />
          <ChecklistChip label="Logbook" status={logbookStatus} />
          <ChecklistChip label="Insurance" status={insuranceStatus} />
        </div>
      </section>

      {/* Feedback Alerts */}
      {docFeedback && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
            docFeedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-[#1F5F3F]'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {docFeedback.message}
        </div>
      )}

      {vehicleFeedback && (
        <div
          role="alert"
          className={`rounded-xl px-4 py-2.5 text-xs font-semibold ${
            vehicleFeedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-[#1F5F3F]'
              : 'border border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {vehicleFeedback.message}
        </div>
      )}

      {/* 2. Personal Identity & KYC Documents (Side-by-Side Row) */}
      <section className="rounded-2xl border border-[#1F5F3F]/15 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#74C67A]" />
            <h2 className="font-display text-sm font-bold text-slate-900">
              1. Identity & KYC
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#1F5F3F]">Encrypted Private Storage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DocumentRow
            title="National ID"
            subtitle="Kenyan National ID"
            status={idStatus}
            isUploading={uploadingDocType === 'national_id'}
            disabled={isPending}
            onSelect={(file) => handleDocUpload('national_id', file)}
          />
          <DocumentRow
            title="Driving Licence"
            subtitle="NTSA Registered Licence"
            status={licenceStatus}
            isUploading={uploadingDocType === 'driving_licence'}
            disabled={isPending}
            onSelect={(file) => handleDocUpload('driving_licence', file)}
          />
        </div>
      </section>

      {/* 3. Vehicle Registration (Balanced 2-Column Layout to make form shorter) */}
      <section className="rounded-2xl border border-[#1F5F3F]/15 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#74C67A]" />
            <h2 className="font-display text-sm font-bold text-slate-900">
              2. Vehicle Registration
            </h2>
            {vehicle && (
              <StatusBadge status={vehicle.is_verified ? 'verified' : 'pending'} />
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#1F5F3F]">Attached to your marketplace bids</span>
        </div>

        {/* 2-Column Form Layout: Specs on Left, Compliance Docs on Right */}
        <form onSubmit={handleVehicleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Column 1: Vehicle Specifications (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Vehicle Specifications
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {/* Vehicle Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  name="vehicle_type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                  required
                >
                  {VEHICLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Number Plate */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Number Plate *
                </label>
                <input
                  type="text"
                  name="plate_number"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="KDA 123A"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-900 uppercase placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                  required
                />
              </div>

              {/* Make */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  name="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g. Isuzu"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. NPR"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  min="1980"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2020"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>

              {/* Colour */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Colour
                </label>
                <input
                  type="text"
                  name="colour"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  placeholder="e.g. White"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Capacity (KG)
                </label>
                <input
                  type="number"
                  name="capacity_kg"
                  min="10"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Volume (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="volume_m3"
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(e.target.value)}
                  placeholder="e.g. 14.5"
                  className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#74C67A]/25"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Compliance Documents & Save (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Verification Files
            </p>

            <div className="space-y-2.5">
              <VehicleFileBox
                label="Logbook"
                status={logbookStatus}
                name="vehicle_logbook"
              />
              <VehicleFileBox
                label="Insurance Certificate"
                status={insuranceStatus}
                name="vehicle_insurance"
              />
              <VehicleFileBox
                label="Exterior Photo"
                status={vehicle?.photo_url ? 'verified' : 'not_submitted'}
                name="vehicle_photo"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center rounded-xl bg-[#1F5F3F] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#14422B] border border-[#14422B] disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isPending ? 'Saving Vehicle...' : 'Save Vehicle Info →'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#EBF8ED] border border-[#74C67A]/50 px-2 py-0.5 text-[10px] font-bold text-[#14422B]">
        <CheckIcon className="h-3 w-3 text-[#3E9745]" /> Verified
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-300/60 px-2 py-0.5 text-[10px] font-bold text-amber-900">
        Pending
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
      Not Uploaded
    </span>
  );
}

function ChecklistChip({ label, status }: { label: string; status: string }) {
  const isOk = status === 'verified';
  const isP = status === 'pending';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
        isOk
          ? 'bg-white text-[#14422B] border border-[#74C67A] shadow-2xs'
          : isP
          ? 'bg-white text-amber-900 border border-amber-300 shadow-2xs'
          : 'bg-white/70 text-slate-600 border border-slate-200'
      }`}
    >
      <span className={isOk ? 'text-[#3E9745] font-bold' : isP ? 'text-amber-600 font-bold' : 'text-slate-400'}>
        {isOk ? '✓' : isP ? '⏳' : '○'}
      </span>
      {label}
    </span>
  );
}

function DocumentRow({
  title,
  subtitle,
  status,
  isUploading,
  disabled,
  onSelect,
}: {
  title: string;
  subtitle: string;
  status: string;
  isUploading: boolean;
  disabled: boolean;
  onSelect: (file: File) => void;
}) {
  const isDone = status === 'verified';
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
        isDone
          ? 'border-[#74C67A]/40 bg-[#F3FAF4]'
          : 'border-slate-200/90 bg-white hover:border-[#1F5F3F]/30'
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{title}</span>
          <StatusBadge status={status} />
        </div>
        <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
      </div>

      <label className="shrink-0 cursor-pointer rounded-xl bg-white border border-[#1F5F3F]/40 px-3 py-1.5 text-[11px] font-bold text-[#1F5F3F] shadow-xs transition hover:bg-[#EBF8ED] active:scale-[0.98]">
        <span>{isUploading ? '…' : status === 'not_submitted' ? 'Upload' : 'Replace'}</span>
        <input
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          disabled={disabled || isUploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onSelect(file);
          }}
        />
      </label>
    </div>
  );
}

function VehicleFileBox({
  label,
  status,
  name,
}: {
  label: string;
  status: string;
  name: string;
}) {
  const isDone = status === 'verified';
  return (
    <div
      className={`rounded-xl border p-2.5 transition ${
        isDone
          ? 'border-[#74C67A]/40 bg-[#F3FAF4]'
          : 'border-slate-200 bg-white hover:border-[#1F5F3F]/30'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-800">{label}</span>
        <StatusBadge status={status} />
      </div>
      <input
        type="file"
        name={name}
        accept=".pdf,image/*"
        className="block w-full text-[10px] text-slate-600 file:mr-2 file:rounded-lg file:border file:border-[#1F5F3F]/30 file:bg-[#EBF8ED] file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-[#1F5F3F] hover:file:bg-[#DEF4E2] cursor-pointer"
      />
    </div>
  );
}
