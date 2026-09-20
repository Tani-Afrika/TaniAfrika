export type DevRoleKey = 'admin' | 'approved_driver' | 'pending_driver' | 'client';

export interface DevAccountConfig {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'driver' | 'client';
  approvalStatus?: 'approved' | 'pending';
  redirectUrl: string;
  label: string;
  badge: string;
  description: string;
  themeColor: {
    bg: string;
    hoverBg: string;
    text: string;
    border: string;
  };
}

export const DEV_ACCOUNTS: Record<DevRoleKey, DevAccountConfig> = {
  admin: {
    email: 'admin@taniafrika.com',
    password: 'TestPassword123!',
    fullName: 'Wilfred Admin',
    role: 'admin',
    redirectUrl: '/',
    label: 'Admin',
    badge: 'Staff',
    description: 'Fleet, drivers, verifications & financial approvals',
    themeColor: {
      bg: 'bg-emerald-50',
      hoverBg: 'hover:bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
  },
  approved_driver: {
    email: 'driver@taniafrika.com',
    password: 'TestPassword123!',
    fullName: 'John Driver (Approved)',
    role: 'driver',
    approvalStatus: 'approved',
    redirectUrl: '/driver',
    label: 'Driver (Approved)',
    badge: 'Ready for Bids',
    description: 'Verified vehicle, ready to browse job feed and place bids',
    themeColor: {
      bg: 'bg-blue-50',
      hoverBg: 'hover:bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
  },
  pending_driver: {
    email: 'pending.driver@taniafrika.com',
    password: 'TestPassword123!',
    fullName: 'Sam Driver (Pending)',
    role: 'driver',
    approvalStatus: 'pending',
    redirectUrl: '/driver',
    label: 'Driver (Pending)',
    badge: 'Awaiting KYC',
    description: 'Unverified profile routed to complete onboarding',
    themeColor: {
      bg: 'bg-amber-50',
      hoverBg: 'hover:bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
  },
  client: {
    email: 'client@taniafrika.com',
    password: 'TestPassword123!',
    fullName: 'Nicholas Client',
    role: 'client',
    redirectUrl: '/client',
    label: 'Client / Shipper',
    badge: 'Customer',
    description: 'Place freight orders and track active shipments',
    themeColor: {
      bg: 'bg-purple-50',
      hoverBg: 'hover:bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
    },
  },
};
