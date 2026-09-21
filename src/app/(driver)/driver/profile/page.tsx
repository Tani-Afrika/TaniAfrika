import { getDriverProfileData } from '@/lib/actions/driver-orders';
import DriverProfileForm from '@/components/driver/DriverProfileForm';

export const dynamic = 'force-dynamic';

export default async function DriverProfilePage() {
  const profileData = await getDriverProfileData();

  return (
    <div className="mx-auto max-w-5xl">
      <DriverProfileForm initialData={profileData} />
    </div>
  );
}