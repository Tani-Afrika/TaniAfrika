import { getDriverProfileData } from '@/lib/actions/driver-orders';
import DriverProfileForm from '@/components/driver/DriverProfileForm';

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage() {
  const profileData = await getDriverProfileData();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1F5F3F]">
            Driver Workspace & Compliance
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-[#1C1D20] sm:text-4xl">
            Profile & Vehicle Registration
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#5F5E5E]">
            Upload your identification credentials and register your vehicle to complete compliance verification.
          </p>
        </div>
      </header>

      <DriverProfileForm initialData={profileData} />
    </div>
  );
}