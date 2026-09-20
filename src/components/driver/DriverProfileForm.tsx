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
import {
  CheckIcon,
  TruckIcon,
  UserIcon,
} from './DriverIcons';

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

  // Feedback states
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

  // Find latest document status helper
  function getDocStatus(type: string) {
    const doc = documents.find((d) => d.document_type === type);
    return doc ? doc.verification_status : 'not_submitted';
  }

  function getVehicleDocStatus(type: string) {
    const doc = vehicleDocuments.find((d) => d.document_type === type);
    return doc ? doc.verification_status : 'not_submitted';
  }

  // Handle single KYC doc upload
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
          message: `${documentType.replace('_', ' ').toUpperCase()} uploaded successfully for verification.`,
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

  // Handle vehicle submission
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
          message: 'Vehicle and documents saved successfully. Awaiting admin verification.',
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

  return (
    <div className="space-y-6">
      {/* 1. Top Onboarding & Verification Status Banner */}
      {isApproved ? (
        <div className="flex items-start gap-4 rounded-2xl border border-[#1F5F3F]/20 bg-[#1F5F3F]/10 p-4 sm:p-5 text-[#1F5F3F]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1F5F3F] text-white shadow-sm">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display font-semibold text-[#1F5F3F]">Verified Driver Account</h3>
            <p className="mt-0.5 text-sm text-[#1F5F3F]/90">
              Your profile and vehicle are approved. You have full access to bid on available delivery orders.
            </p>
          </div>
        </div>
      ) : isRejected ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 text-red-900">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-600 text-white font-bold">
              !
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-red-900">Application Needs Attention</h3>
              <p className="mt-1 text-sm text-red-700">
                {driverProfile?.rejection_reason || 'Some details or documents did not meet compliance requirements.'}
              </p>
              <p className="mt-2 text-xs font-semibold text-red-800">
                Please re-upload the requested documents or update your vehicle information below for re-review.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 rounded-2xl border border-[#D4A244]/30 bg-[#FFF8F4] p-4 sm:p-5 text-[#2A2A28]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D4A244] text-white font-bold shadow-sm">
            i
          </span>
          <div>
            <h3 className="font-display font-semibold text-[#1C1D20]">Verification Under Review</h3>
            <p className="mt-0.5 text-sm text-[#3F4943]">
              To begin bidding on jobs, please complete your National ID, Driving Licence, and Vehicle registration below. Our team reviews submissions quickly.
            </p>
          </div>
        </div>
      )}

      {/* 2. Driver Profile Summary Header (Reliable Neighbour Trust Green) */}
      <section className="overflow-hidden rounded-3xl border border-[#1F5F3F]/15 bg-white shadow-sm">
        <div className="bg-[#1F5F3F] p-5 sm:p-7 text-white">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="relative">
              <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/95 text-2xl font-bold text-[#1F5F3F] shadow-md">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-9 w-9 text-[#1F5F3F]" />
                )}
              </span>
              <label
                htmlFor="profile_photo_input"
                className="absolute -bottom-2 -right-2 cursor-pointer rounded-lg bg-[#D4A244] px-2 py-1 text-[11px] font-bold text-white shadow hover:bg-[#b88c3a] transition"
              >
                {uploadingDocType === 'profile_photo' ? '...' : 'Change'}
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
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-2xl font-bold tracking-tight">{profile.full_name}</h2>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isApproved
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : isRejected
                      ? 'bg-red-500/20 text-red-200'
                      : 'bg-amber-400/20 text-amber-200'
                  }`}
                >
                  {profile.approval_status.toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-white/80">{profile.phone ?? 'No phone recorded'}</p>
            </div>

            <div className="sm:ml-auto flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${
                  profile.is_online ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/15 text-white/75'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${profile.is_online ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                {profile.is_online ? 'Online for Dispatch' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Personal KYC Verification Documents */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1C1D20]">Driver KYC & Identification</h3>
            <p className="text-xs sm:text-sm text-[#3F4943]">
              Mandatory legal credentials stored securely in encrypted private storage.
            </p>
          </div>
        </div>

        {docFeedback && (
          <div
            className={`mb-5 rounded-xl p-3.5 text-sm font-medium ${
              docFeedback.type === 'success'
                ? 'border border-[#1F5F3F]/20 bg-[#1F5F3F]/10 text-[#1F5F3F]'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {docFeedback.message}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* National ID Upload Card */}
          <DocumentCard
            title="National Identification Card"
            description="Clear copy of your Kenyan National ID (front & back or PDF)."
            status={getDocStatus('national_id')}
            isUploading={uploadingDocType === 'national_id'}
            onFileSelect={(file) => handleDocUpload('national_id', file)}
            disabled={isPending}
          />

          {/* Driving Licence Upload Card */}
          <DocumentCard
            title="Valid Driving Licence"
            description="Current NTSA driving licence showing your approved vehicle class."
            status={getDocStatus('driving_licence')}
            isUploading={uploadingDocType === 'driving_licence'}
            onFileSelect={(file) => handleDocUpload('driving_licence', file)}
            disabled={isPending}
          />
        </div>
      </section>

      {/* 4. Vehicle Details & Fleet Compliance Documents */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1C1D20]">Vehicle Details & Fleet Registration</h3>
            <p className="text-xs sm:text-sm text-[#3F4943]">
              Your active vehicle is automatically attached to bids you place on marketplace orders.
            </p>
          </div>
          {vehicle && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                vehicle.is_verified
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {vehicle.is_verified ? 'Vehicle Verified' : 'Vehicle Verification Pending'}
            </span>
          )}
        </div>

        {vehicleFeedback && (
          <div
            className={`mb-5 rounded-xl p-3.5 text-sm font-medium ${
              vehicleFeedback.type === 'success'
                ? 'border border-[#1F5F3F]/20 bg-[#1F5F3F]/10 text-[#1F5F3F]'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {vehicleFeedback.message}
          </div>
        )}

        <form onSubmit={handleVehicleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Type Category *
              </label>
              <select
                name="vehicle_type"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
                required
              >
                {VEHICLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Registration Plate */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Number Plate *
              </label>
              <input
                type="text"
                name="plate_number"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KDA 123A"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 uppercase focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
                required
              />
            </div>

            {/* Make */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Make
              </label>
              <input
                type="text"
                name="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Isuzu, Toyota"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Model
              </label>
              <input
                type="text"
                name="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. NPR, Hilux, Canter"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Year of Manufacture
              </label>
              <input
                type="number"
                name="year"
                min="1980"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2019"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>

            {/* Colour */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Vehicle Colour
              </label>
              <input
                type="text"
                name="colour"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                placeholder="e.g. White, Blue"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>

            {/* Capacity (kg) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Load Capacity (KG)
              </label>
              <input
                type="number"
                name="capacity_kg"
                min="10"
                value={capacityKg}
                onChange={(e) => setCapacityKg(e.target.value)}
                placeholder="e.g. 3000"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>

            {/* Volume (m3) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Cargo Volume (m³)
              </label>
              <input
                type="number"
                step="0.1"
                name="volume_m3"
                value={volumeM3}
                onChange={(e) => setVolumeM3(e.target.value)}
                placeholder="e.g. 14.5"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1F5F3F] focus:outline-none focus:ring-2 focus:ring-[#1F5F3F]/20"
              />
            </div>
          </div>

          {/* Vehicle Compliance Uploads */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-sm font-bold text-[#1C1D20]">Vehicle Verification Evidence</h4>
            <p className="text-xs text-slate-500 mb-4">Upload the official logbook and insurance documents to complete verification.</p>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Logbook */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Vehicle Logbook</span>
                  <StatusBadge status={getVehicleDocStatus('vehicle_logbook')} />
                </div>
                <input
                  type="file"
                  name="vehicle_logbook"
                  accept=".pdf,image/*"
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
                />
              </div>

              {/* Insurance */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Insurance Certificate</span>
                  <StatusBadge status={getVehicleDocStatus('vehicle_insurance')} />
                </div>
                <input
                  type="file"
                  name="vehicle_insurance"
                  accept=".pdf,image/*"
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
                />
              </div>

              {/* Vehicle Exterior Photo */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Vehicle Exterior Photo</span>
                  {vehicle?.photo_url ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Uploaded
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Optional
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  name="vehicle_photo"
                  accept="image/*"
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#1F5F3F] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#184c32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5F3F] disabled:opacity-50"
            >
              {isPending ? 'Saving Vehicle...' : 'Save Vehicle & Documents'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// Subcomponents
function StatusBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Verified</span>;
  }
  if (status === 'pending') {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">Pending Review</span>;
  }
  if (status === 'rejected') {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-800">Rejected</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">Not Uploaded</span>;
}

function DocumentCard({
  title,
  description,
  status,
  isUploading,
  onFileSelect,
  disabled,
}: {
  title: string;
  description: string;
  status: string;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-[#F7F1E5]/30 p-4 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-display text-sm font-bold text-[#1C1D20]">{title}</h4>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-xs text-[#5F5E5E] leading-relaxed">{description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-white border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-[#1F5F3F] disabled:opacity-50">
          <span>{isUploading ? 'Uploading...' : status === 'not_submitted' ? 'Upload Document' : 'Replace File'}</span>
          <input
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            disabled={disabled || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />
        </label>
        {status === 'verified' && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckIcon className="h-4 w-4" /> Ready
          </span>
        )}
      </div>
    </div>
  );
}
