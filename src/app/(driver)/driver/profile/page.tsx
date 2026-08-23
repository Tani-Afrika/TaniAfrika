import { createClient } from '@/lib/supabase/server';
import { VEHICLE_TYPE_LABELS } from '@/lib/format';
import { PageHeading } from '@/components/driver/DriverUI';
import { SettingsIcon, TruckIcon, UserIcon, WalletIcon } from '@/components/driver/DriverIcons';
import type { VehicleType } from '@/types/supabase';

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: vehicle }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name,phone,avatar_url,is_online,approval_status')
      .eq('id', user.id)
      .single(),
    supabase
      .from('vehicles')
      .select('*')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        eyebrow="Account centre"
        title="Profile & vehicle"
        description="Review the personal and vehicle details associated with your driver account."
      />

      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white sm:p-7">
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 text-2xl font-bold text-orange-600 shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-8 w-8" />
              )}
            </span>

            <div className="min-w-0">
              <h2 className="text-2xl font-bold">{profile?.full_name ?? 'Driver'}</h2>
              <p className="mt-1 text-sm text-white/85">{user.email}</p>
              <p className="mt-1 text-sm text-white/85">{profile?.phone ?? 'No phone saved'}</p>
            </div>

            <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur sm:ml-auto">
              {profile?.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          <ProfileTile
            icon={TruckIcon}
            title="Vehicle"
            description={
              vehicle
                ? `${VEHICLE_TYPE_LABELS[vehicle.vehicle_type as VehicleType]} • ${vehicle.plate_number}`
                : 'No active vehicle registered'
            }
          />
          <ProfileTile
            icon={SettingsIcon}
            title="Verification"
            description={vehicle?.is_verified ? 'Vehicle verified' : 'Verification pending'}
          />
          <ProfileTile
            icon={WalletIcon}
            title="Capacity"
            description={vehicle?.capacity_kg ? `${vehicle.capacity_kg} kg` : 'Not provided'}
          />
          <ProfileTile
            icon={UserIcon}
            title="Vehicle details"
            description={
              vehicle
                ? [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'Not provided'
                : 'Add a vehicle to begin'
            }
          />
        </div>
      </section>
    </div>
  );
}

function ProfileTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof TruckIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-orange-100 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-600">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}