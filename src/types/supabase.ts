export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'payment_pending'
  | 'assigned'
  | 'driver_en_route'
  | 'arrived'
  | 'loading'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';
export type UserRole = 'client' | 'driver' | 'support' | 'operations' | 'finance' | 'admin';
export type VehicleType = 'motorcycle' | 'tuktuk' | 'pickup' | 'van' | 'truck_small' | 'truck_large';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_online: boolean;
  approval_status: ApprovalStatus; 
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  client_id: string;

  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;

  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;

  goods_description: string;
  vehicle_type_required: VehicleType | null;

  status: OrderStatus;

  driver_id: string | null;

  price_agreed: number | null;

  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;

  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  order_id: string;
  driver_id: string;
  amount: number;
  message: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}

export interface DriverLocation {
  driver_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  vehicle_type: VehicleType;
  plate_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity_kg: number | null;
  photo_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Joined shapes used in queries.ts
export interface OrderWithRelations extends Order {
  client: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
  driver: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
}

export interface BidWithDriver extends Bid {
  driver: Pick<Profile, 'id' | 'full_name' | 'phone'> | null;
}

