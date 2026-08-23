export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateString));
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

import type { OrderStatus, BidStatus, VehicleType } from '@/types/supabase';

export const ORDER_STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  draft: { label: 'Draft', bg: '#F3F4F6', text: '#374151' },
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  payment_pending: { label: 'Awaiting Payment', bg: '#FEF3C7', text: '#92400E' },
  assigned: { label: 'Assigned', bg: '#DBEAFE', text: '#1E40AF' },
  driver_en_route: { label: 'Driver En Route', bg: '#DBEAFE', text: '#1E40AF' },
  arrived: { label: 'Driver Arrived', bg: '#E0F2FE', text: '#075985' },
  loading: { label: 'Loading', bg: '#CFFAFE', text: '#155E75' },
  picked_up: { label: 'Picked Up', bg: '#CFFAFE', text: '#155E75' },
  in_transit: { label: 'In Transit', bg: '#E0E7FF', text: '#3730A3' },
  delivered: { label: 'Delivered', bg: '#DCFCE7', text: '#166534' },
  completed: { label: 'Completed', bg: '#DCFCE7', text: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', text: '#991B1B' },
  disputed: { label: 'Disputed', bg: '#FEE2E2', text: '#991B1B' },
};

export const BID_STATUS_STYLES: Record<BidStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  accepted: { label: 'Accepted', bg: '#DCFCE7', text: '#166534' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', text: '#991B1B' },
  withdrawn: { label: 'Withdrawn', bg: '#F3F4F6', text: '#374151' },
  expired: { label: 'Expired', bg: '#F3F4F6', text: '#6B7280' },
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  motorcycle: 'Motorcycle',
  tuktuk: 'Tuk Tuk',
  pickup: 'Pickup',
  van: 'Van',
  truck_small: 'Small Truck',
  truck_large: 'Large Truck',
};
