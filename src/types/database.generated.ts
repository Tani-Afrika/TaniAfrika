export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["app_role"] | null
          after_data: Json | null
          before_data: Json | null
          id: number
          ip_hash: string | null
          metadata: Json
          occurred_at: string
          request_id: string | null
          resource_id: string | null
          resource_type: string
          user_agent_hash: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          id?: never
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent_hash?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          after_data?: Json | null
          before_data?: Json | null
          id?: never
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          request_id?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_messages: {
        Row: {
          bid_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          bid_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          bid_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_messages_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          accepted_at: string | null
          amount: number
          amount_minor: number | null
          created_at: string
          currency: string
          driver_id: string
          estimated_pickup_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          order_id: string
          status: Database["public"]["Enums"]["bid_status"]
          updated_at: string
          vehicle_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          amount_minor?: number | null
          created_at?: string
          currency?: string
          driver_id: string
          estimated_pickup_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
          vehicle_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          amount_minor?: number | null
          created_at?: string
          currency?: string
          driver_id?: string
          estimated_pickup_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["bid_status"]
          updated_at?: string
          vehicle_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          granted: boolean
          id: string
          ip_hash: string | null
          policy_version: string
          recorded_at: string
          source: string
          user_agent_hash: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          granted: boolean
          id?: string
          ip_hash?: string | null
          policy_version: string
          recorded_at?: string
          source: string
          user_agent_hash?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          granted?: boolean
          id?: string
          ip_hash?: string | null
          policy_version?: string
          recorded_at?: string
          source?: string
          user_agent_hash?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          details: string | null
          due_at: string | null
          export_storage_path: string | null
          id: string
          identity_verified_at: string | null
          rejection_reason: string | null
          request_type: Database["public"]["Enums"]["data_request_type"]
          status: Database["public"]["Enums"]["data_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_at?: string | null
          export_storage_path?: string | null
          id?: string
          identity_verified_at?: string | null
          rejection_reason?: string | null
          request_type: Database["public"]["Enums"]["data_request_type"]
          status?: Database["public"]["Enums"]["data_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          details?: string | null
          due_at?: string | null
          export_storage_path?: string | null
          id?: string
          identity_verified_at?: string | null
          rejection_reason?: string | null
          request_type?: Database["public"]["Enums"]["data_request_type"]
          status?: Database["public"]["Enums"]["data_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_subject_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_subject_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_subject_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          active: boolean
          created_at: string
          device_id: string | null
          id: string
          last_used_at: string | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          id?: string
          last_used_at?: string | null
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          id?: string
          last_used_at?: string | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_offers: {
        Row: {
          distance_to_pickup_m: number | null
          driver_id: string
          expires_at: string
          id: string
          metadata: Json
          offered_at: string
          order_id: string
          rank_score: number | null
          responded_at: string | null
          status: Database["public"]["Enums"]["dispatch_offer_status"]
          vehicle_id: string | null
        }
        Insert: {
          distance_to_pickup_m?: number | null
          driver_id: string
          expires_at: string
          id?: string
          metadata?: Json
          offered_at?: string
          order_id: string
          rank_score?: number | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_offer_status"]
          vehicle_id?: string | null
        }
        Update: {
          distance_to_pickup_m?: number | null
          driver_id?: string
          expires_at?: string
          id?: string
          metadata?: Json
          offered_at?: string
          order_id?: string
          rank_score?: number | null
          responded_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_offer_status"]
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_offers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_offers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_availability_sessions: {
        Row: {
          created_at: string
          driver_id: string
          end_location: unknown
          ended_at: string | null
          ended_reason: string | null
          id: string
          start_location: unknown
          started_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          end_location?: unknown
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          start_location?: unknown
          started_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          end_location?: unknown
          ended_at?: string | null
          ended_reason?: string | null
          id?: string
          start_location?: unknown
          started_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_availability_sessions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_availability_sessions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_availability_sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_number_masked: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          driver_id: string
          expires_on: string | null
          file_sha256: string | null
          id: string
          issued_on: string | null
          metadata: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          document_number_masked?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          driver_id: string
          expires_on?: string | null
          file_sha256?: string | null
          id?: string
          issued_on?: string | null
          metadata?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          document_number_masked?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          driver_id?: string
          expires_on?: string | null
          file_sha256?: string | null
          id?: string
          issued_on?: string | null
          metadata?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_location_events: {
        Row: {
          accuracy_m: number | null
          driver_id: string
          heading: number | null
          id: number
          location: unknown
          order_id: string | null
          recorded_at: string
          speed: number | null
        }
        Insert: {
          accuracy_m?: number | null
          driver_id: string
          heading?: number | null
          id?: never
          location: unknown
          order_id?: string | null
          recorded_at?: string
          speed?: number | null
        }
        Update: {
          accuracy_m?: number | null
          driver_id?: string
          heading?: number | null
          id?: never
          location?: unknown
          order_id?: string | null
          recorded_at?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_location_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_location_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_location_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          accuracy_m: number | null
          driver_id: string
          heading: number | null
          latitude: number
          location: unknown
          longitude: number
          order_id: string | null
          source: string
          speed: number | null
          updated_at: string
        }
        Insert: {
          accuracy_m?: number | null
          driver_id: string
          heading?: number | null
          latitude: number
          location?: unknown
          longitude: number
          order_id?: string | null
          source?: string
          speed?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_m?: number | null
          driver_id?: string
          heading?: number | null
          latitude?: number
          location?: unknown
          longitude?: number
          order_id?: string | null
          source?: string
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          acceptance_rate: number | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          average_rating: number
          bio: string | null
          cancellation_rate: number | null
          completed_orders: number
          created_at: string
          driving_licence_expires_on: string | null
          driving_licence_number: string | null
          good_conduct_expires_on: string | null
          national_id_last4: string | null
          rating_count: number
          rejection_reason: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          years_experience: number | null
        }
        Insert: {
          acceptance_rate?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number
          bio?: string | null
          cancellation_rate?: number | null
          completed_orders?: number
          created_at?: string
          driving_licence_expires_on?: string | null
          driving_licence_number?: string | null
          good_conduct_expires_on?: string | null
          national_id_last4?: string | null
          rating_count?: number
          rejection_reason?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          years_experience?: number | null
        }
        Update: {
          acceptance_rate?: number | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number
          bio?: string | null
          cancellation_rate?: number | null
          completed_orders?: number
          created_at?: string
          driving_licence_expires_on?: string | null
          driving_licence_number?: string | null
          good_conduct_expires_on?: string | null
          national_id_last4?: string | null
          rating_count?: number
          rejection_reason?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_vehicle_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          driver_id: string
          ends_at: string | null
          id: string
          starts_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          driver_id: string
          ends_at?: string | null
          id?: string
          starts_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          driver_id?: string
          ends_at?: string | null
          id?: string
          starts_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_primary: boolean
          phone_e164: string
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_primary?: boolean
          phone_e164: string
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          phone_e164?: string
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_holds: {
        Row: {
          amount_minor: number
          client_id: string
          created_at: string
          currency: string
          driver_amount_minor: number
          driver_id: string
          funded_at: string | null
          id: string
          order_id: string
          payment_intent_id: string
          platform_fee_minor: number
          refunded_at: string | null
          release_due_at: string | null
          release_requested_at: string | null
          released_at: string | null
          status: Database["public"]["Enums"]["escrow_status"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          client_id: string
          created_at?: string
          currency?: string
          driver_amount_minor: number
          driver_id: string
          funded_at?: string | null
          id?: string
          order_id: string
          payment_intent_id: string
          platform_fee_minor: number
          refunded_at?: string | null
          release_due_at?: string | null
          release_requested_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          client_id?: string
          created_at?: string
          currency?: string
          driver_amount_minor?: number
          driver_id?: string
          funded_at?: string | null
          id?: string
          order_id?: string
          payment_intent_id?: string
          platform_fee_minor?: number
          refunded_at?: string | null
          release_due_at?: string | null
          release_requested_at?: string | null
          released_at?: string | null
          status?: Database["public"]["Enums"]["escrow_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_holds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: true
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      event_outbox: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempts: number
          available_at: string
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          payload: Json
          status: Database["public"]["Enums"]["outbox_status"]
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempts?: number
          available_at?: string
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["outbox_status"]
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempts?: number
          available_at?: string
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["outbox_status"]
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean
          key: string
          rollout_percentage: number
          targeting: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean
          key: string
          rollout_percentage?: number
          targeting?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean
          key?: string
          rollout_percentage?: number
          targeting?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_disputes: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          escrow_hold_id: string | null
          id: string
          opened_by: string
          order_id: string
          reason_code: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["financial_dispute_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          escrow_hold_id?: string | null
          id?: string
          opened_by: string
          order_id: string
          reason_code: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["financial_dispute_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          escrow_hold_id?: string | null
          id?: string
          opened_by?: string
          order_id?: string
          reason_code?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["financial_dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_escrow_hold_id_fkey"
            columns: ["escrow_hold_id"]
            isOneToOne: false
            referencedRelation: "escrow_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["ledger_account_type"]
          active: boolean
          created_at: string
          currency: string
          id: string
          order_id: string | null
          owner_user_id: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["ledger_account_type"]
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          owner_user_id?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["ledger_account_type"]
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          order_id?: string | null
          owner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_accounts_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_id: string
          amount_minor: number
          created_at: string
          id: string
          side: Database["public"]["Enums"]["ledger_entry_side"]
          transaction_id: string
        }
        Insert: {
          account_id: string
          amount_minor: number
          created_at?: string
          id?: string
          side: Database["public"]["Enums"]["ledger_entry_side"]
          transaction_id: string
        }
        Update: {
          account_id?: string
          amount_minor?: number
          created_at?: string
          id?: string
          side?: Database["public"]["Enums"]["ledger_entry_side"]
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ledger_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          occurred_at: string
          posted_at: string | null
          reference: string
          source_id: string | null
          source_type: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          occurred_at?: string
          posted_at?: string | null
          reference: string
          source_id?: string | null
          source_type: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          occurred_at?: string
          posted_at?: string | null
          reference?: string
          source_id?: string | null
          source_type?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          bid_updates: boolean
          order_updates: boolean
          payment_updates: boolean
          preferred_channels: Database["public"]["Enums"]["notification_channel"][]
          promotions: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          safety_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bid_updates?: boolean
          order_updates?: boolean
          payment_updates?: boolean
          preferred_channels?: Database["public"]["Enums"]["notification_channel"][]
          promotions?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          safety_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bid_updates?: boolean
          order_updates?: boolean
          payment_updates?: boolean
          preferred_channels?: Database["public"]["Enums"]["notification_channel"][]
          promotions?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          safety_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          data: Json
          delivered_at: string | null
          id: string
          last_error: string | null
          outbox_event_id: string | null
          provider_message_id: string | null
          read_at: string | null
          scheduled_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_key: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          outbox_event_id?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          data?: Json
          delivered_at?: string | null
          id?: string
          last_error?: string | null
          outbox_event_id?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_key?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_outbox_event_id_fkey"
            columns: ["outbox_event_id"]
            isOneToOne: false
            referencedRelation: "event_outbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          file_sha256: string | null
          id: string
          order_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          attachment_type: string
          created_at?: string
          file_sha256?: string | null
          id?: string
          order_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          file_sha256?: string | null
          id?: string
          order_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_attachments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          declared_value_minor: number | null
          description: string
          estimated_weight_kg: number | null
          fragile: boolean
          id: string
          order_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          declared_value_minor?: number | null
          description: string
          estimated_weight_kg?: number | null
          fragile?: boolean
          id?: string
          order_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          declared_value_minor?: number | null
          description?: string
          estimated_weight_kg?: number | null
          fragile?: boolean
          id?: string
          order_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_role: Database["public"]["Enums"]["app_role"] | null
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          order_id: string
          previous_status: Database["public"]["Enums"]["order_status"] | null
          source: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          order_id: string
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          source?: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_role?: Database["public"]["Enums"]["app_role"] | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          order_id?: string
          previous_status?: Database["public"]["Enums"]["order_status"] | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_stops: {
        Row: {
          access_notes: string | null
          address: string
          arrived_at: string | null
          completed_at: string | null
          contact_name: string | null
          contact_phone_e164: string | null
          created_at: string
          id: string
          location: unknown
          order_id: string
          stop_sequence: number
          stop_type: string
        }
        Insert: {
          access_notes?: string | null
          address: string
          arrived_at?: string | null
          completed_at?: string | null
          contact_name?: string | null
          contact_phone_e164?: string | null
          created_at?: string
          id?: string
          location: unknown
          order_id: string
          stop_sequence: number
          stop_type: string
        }
        Update: {
          access_notes?: string | null
          address?: string
          arrived_at?: string | null
          completed_at?: string | null
          contact_name?: string | null
          contact_phone_e164?: string | null
          created_at?: string
          id?: string
          location?: unknown
          order_id?: string
          stop_sequence?: number
          stop_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_stops_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_bid_id: string | null
          arrived_at: string | null
          cancellation_actor: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          driver_earnings_minor: number | null
          driver_en_route_at: string | null
          driver_id: string | null
          dropoff_access_notes: string | null
          dropoff_address: string
          dropoff_contact_name: string | null
          dropoff_contact_phone_e164: string | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_location: unknown
          estimated_distance_m: number | null
          estimated_duration_s: number | null
          estimated_volume_m3: number | null
          estimated_weight_kg: number | null
          goods_category: string | null
          goods_description: string
          id: string
          order_number: number
          organisation_id: string | null
          picked_up_at: string | null
          pickup_access_notes: string | null
          pickup_address: string
          pickup_contact_name: string | null
          pickup_contact_phone_e164: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location: unknown
          platform_fee_minor: number | null
          price_agreed: number | null
          route_polyline: string | null
          route_provider: string | null
          scheduled_for: string | null
          service_area_id: string | null
          service_type_id: string | null
          special_handling: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount_minor: number | null
          updated_at: string
          vehicle_id: string | null
          vehicle_type_required:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
          version: number
        }
        Insert: {
          accepted_bid_id?: string | null
          arrived_at?: string | null
          cancellation_actor?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          driver_earnings_minor?: number | null
          driver_en_route_at?: string | null
          driver_id?: string | null
          dropoff_access_notes?: string | null
          dropoff_address: string
          dropoff_contact_name?: string | null
          dropoff_contact_phone_e164?: string | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_location?: unknown
          estimated_distance_m?: number | null
          estimated_duration_s?: number | null
          estimated_volume_m3?: number | null
          estimated_weight_kg?: number | null
          goods_category?: string | null
          goods_description: string
          id?: string
          order_number?: never
          organisation_id?: string | null
          picked_up_at?: string | null
          pickup_access_notes?: string | null
          pickup_address: string
          pickup_contact_name?: string | null
          pickup_contact_phone_e164?: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location?: unknown
          platform_fee_minor?: number | null
          price_agreed?: number | null
          route_polyline?: string | null
          route_provider?: string | null
          scheduled_for?: string | null
          service_area_id?: string | null
          service_type_id?: string | null
          special_handling?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_minor?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_required?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
          version?: number
        }
        Update: {
          accepted_bid_id?: string | null
          arrived_at?: string | null
          cancellation_actor?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          driver_earnings_minor?: number | null
          driver_en_route_at?: string | null
          driver_id?: string | null
          dropoff_access_notes?: string | null
          dropoff_address?: string
          dropoff_contact_name?: string | null
          dropoff_contact_phone_e164?: string | null
          dropoff_lat?: number
          dropoff_lng?: number
          dropoff_location?: unknown
          estimated_distance_m?: number | null
          estimated_duration_s?: number | null
          estimated_volume_m3?: number | null
          estimated_weight_kg?: number | null
          goods_category?: string | null
          goods_description?: string
          id?: string
          order_number?: never
          organisation_id?: string | null
          picked_up_at?: string | null
          pickup_access_notes?: string | null
          pickup_address?: string
          pickup_contact_name?: string | null
          pickup_contact_phone_e164?: string | null
          pickup_lat?: number
          pickup_lng?: number
          pickup_location?: unknown
          platform_fee_minor?: number | null
          price_agreed?: number | null
          route_polyline?: string | null
          route_provider?: string | null
          scheduled_for?: string | null
          service_area_id?: string | null
          service_type_id?: string | null
          special_handling?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount_minor?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_type_required?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_accepted_bid_id_fkey"
            columns: ["accepted_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancellation_actor_fkey"
            columns: ["cancellation_actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancellation_actor_fkey"
            columns: ["cancellation_actor"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_members: {
        Row: {
          invited_by: string | null
          joined_at: string
          member_role: Database["public"]["Enums"]["organisation_member_role"]
          organisation_id: string
          removed_at: string | null
          user_id: string
        }
        Insert: {
          invited_by?: string | null
          joined_at?: string
          member_role?: Database["public"]["Enums"]["organisation_member_role"]
          organisation_id: string
          removed_at?: string | null
          user_id: string
        }
        Update: {
          invited_by?: string | null
          joined_at?: string
          member_role?: Database["public"]["Enums"]["organisation_member_role"]
          organisation_id?: string
          removed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          billing_email: string | null
          billing_phone_e164: string | null
          created_at: string
          created_by: string
          id: string
          legal_name: string
          registration_number: string | null
          tax_number: string | null
          trading_name: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          billing_email?: string | null
          billing_phone_e164?: string | null
          created_at?: string
          created_by: string
          id?: string
          legal_name: string
          registration_number?: string | null
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          billing_email?: string | null
          billing_phone_e164?: string | null
          created_at?: string
          created_by?: string
          id?: string
          legal_name?: string
          registration_number?: string | null
          tax_number?: string | null
          trading_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_minor: number
          client_id: string
          created_at: string
          currency: string
          expires_at: string | null
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          initiated_at: string | null
          order_id: string
          payer_phone_e164: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_checkout_request_id: string | null
          provider_merchant_request_id: string | null
          provider_reference: string | null
          provider_response: Json
          status: Database["public"]["Enums"]["payment_intent_status"]
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          client_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key: string
          initiated_at?: string | null
          order_id: string
          payer_phone_e164?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_checkout_request_id?: string | null
          provider_merchant_request_id?: string | null
          provider_reference?: string | null
          provider_response?: Json
          status?: Database["public"]["Enums"]["payment_intent_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          client_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key?: string
          initiated_at?: string | null
          order_id?: string
          payer_phone_e164?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_checkout_request_id?: string | null
          provider_merchant_request_id?: string | null
          provider_reference?: string | null
          provider_response?: Json
          status?: Database["public"]["Enums"]["payment_intent_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_provider_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          payload_sha256: string
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_event_id: string
          received_at: string
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          payload_sha256: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_event_id: string
          received_at?: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          payload_sha256?: string
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_event_id?: string
          received_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          order_id: string
          payment_intent_id: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_occurred_at: string | null
          provider_payload: Json
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_transaction_status"]
          transaction_type: Database["public"]["Enums"]["payment_transaction_type"]
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          payment_intent_id?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_occurred_at?: string | null
          provider_payload?: Json
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_transaction_status"]
          transaction_type: Database["public"]["Enums"]["payment_transaction_type"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          payment_intent_id?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_occurred_at?: string | null
          provider_payload?: Json
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_transaction_status"]
          transaction_type?: Database["public"]["Enums"]["payment_transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_accounts: {
        Row: {
          active: boolean
          created_at: string
          destination_token: string
          display_hint: string
          driver_id: string
          id: string
          is_default: boolean
          provider: Database["public"]["Enums"]["payment_provider"]
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          destination_token: string
          display_hint: string
          driver_id: string
          id?: string
          is_default?: boolean
          provider: Database["public"]["Enums"]["payment_provider"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          destination_token?: string
          display_hint?: string
          driver_id?: string
          id?: string
          is_default?: boolean
          provider?: Database["public"]["Enums"]["payment_provider"]
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_accounts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_accounts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_minor: number
          attempts: number
          created_at: string
          currency: string
          driver_id: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          payout_account_id: string | null
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          attempts?: number
          created_at?: string
          currency?: string
          driver_id: string
          escrow_hold_id: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key: string
          next_attempt_at?: string
          order_id: string
          payout_account_id?: string | null
          processing_started_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_originator_conversation_id?: string | null
          provider_response?: Json
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          attempts?: number
          created_at?: string
          currency?: string
          driver_id?: string
          escrow_hold_id?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key?: string
          next_attempt_at?: string
          order_id?: string
          payout_account_id?: string | null
          processing_started_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_originator_conversation_id?: string | null
          provider_response?: Json
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_escrow_hold_id_fkey"
            columns: ["escrow_hold_id"]
            isOneToOne: false
            referencedRelation: "escrow_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_payout_account_id_fkey"
            columns: ["payout_account_id"]
            isOneToOne: false
            referencedRelation: "payout_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          active: boolean
          base_fare_minor: number
          cancellation_fee_minor: number
          commission_bps: number
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          minimum_fare_minor: number
          name: string
          per_km_minor: number
          per_minute_minor: number
          priority: number
          service_area_id: string | null
          service_type_id: string | null
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          active?: boolean
          base_fare_minor?: number
          cancellation_fee_minor?: number
          commission_bps?: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          minimum_fare_minor?: number
          name: string
          per_km_minor?: number
          per_minute_minor?: number
          priority?: number
          service_area_id?: string | null
          service_type_id?: string | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          active?: boolean
          base_fare_minor?: number
          cancellation_fee_minor?: number
          commission_bps?: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          minimum_fare_minor?: number
          name?: string
          per_km_minor?: number
          per_minute_minor?: number
          priority?: number
          service_area_id?: string | null
          service_type_id?: string | null
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          approval_status: Database["public"]["Enums"]["approval_status"]
          avatar_url: string | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          full_name: string
          id: string
          is_active: boolean
          is_online: boolean
          last_seen_at: string | null
          locale: string
          location_updated_at: string | null
          onboarding_completed_at: string | null
          phone: string | null
          phone_e164: string | null
          phone_verified_at: string | null
          privacy_accepted_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          terms_accepted_at: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          approval_status?: Database["public"]["Enums"]["approval_status"]
          avatar_url?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          full_name: string
          id: string
          is_active?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          locale?: string
          location_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          approval_status?: Database["public"]["Enums"]["approval_status"]
          avatar_url?: string | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          locale?: string
          location_updated_at?: string | null
          onboarding_completed_at?: string | null
          phone?: string | null
          phone_e164?: string | null
          phone_verified_at?: string | null
          privacy_accepted_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          terms_accepted_at?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reconciliation_items: {
        Row: {
          created_at: string
          id: string
          internal_amount_minor: number | null
          internal_transaction_id: string | null
          notes: string | null
          provider_amount_minor: number | null
          provider_reference: string
          run_id: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          internal_amount_minor?: number | null
          internal_transaction_id?: string | null
          notes?: string | null
          provider_amount_minor?: number | null
          provider_reference: string
          run_id: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Update: {
          created_at?: string
          id?: string
          internal_amount_minor?: number | null
          internal_transaction_id?: string | null
          notes?: string | null
          provider_amount_minor?: number | null
          provider_reference?: string
          run_id?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_internal_transaction_id_fkey"
            columns: ["internal_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_runs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          id: string
          matched_count: number
          mismatch_count: number
          period_end: string
          period_start: string
          provider: Database["public"]["Enums"]["payment_provider"]
          report_storage_path: string | null
          started_at: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          id?: string
          matched_count?: number
          mismatch_count?: number
          period_end: string
          period_start: string
          provider: Database["public"]["Enums"]["payment_provider"]
          report_storage_path?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          id?: string
          matched_count?: number
          mismatch_count?: number
          period_end?: string
          period_start?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          report_storage_path?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_minor: number
          attempts: number
          client_id: string
          created_at: string
          currency: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          reason: string
          requested_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          succeeded_at: string | null
          updated_at: string
        }
        Insert: {
          amount_minor: number
          attempts?: number
          client_id: string
          created_at?: string
          currency?: string
          escrow_hold_id: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key: string
          next_attempt_at?: string
          order_id: string
          processing_started_at?: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_originator_conversation_id?: string | null
          provider_response?: Json
          provider_transaction_id?: string | null
          reason: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          attempts?: number
          client_id?: string
          created_at?: string
          currency?: string
          escrow_hold_id?: string
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key?: string
          next_attempt_at?: string
          order_id?: string
          processing_started_at?: string | null
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id?: string | null
          provider_originator_conversation_id?: string | null
          provider_response?: Json
          provider_transaction_id?: string | null
          reason?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["refund_status"]
          succeeded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_escrow_hold_id_fkey"
            columns: ["escrow_hold_id"]
            isOneToOne: false
            referencedRelation: "escrow_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          order_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incident_evidence: {
        Row: {
          created_at: string
          description: string | null
          file_sha256: string | null
          id: string
          incident_id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_sha256?: string | null
          id?: string
          incident_id: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_sha256?: string | null
          id?: string
          incident_id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incident_evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "safety_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incident_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incident_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          immediate_assistance_requested: boolean
          incident_number: number
          incident_type: string
          location: unknown
          occurred_at: string | null
          order_id: string | null
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["incident_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          immediate_assistance_requested?: boolean
          incident_number?: never
          incident_type: string
          location?: unknown
          occurred_at?: string | null
          order_id?: string | null
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          immediate_assistance_requested?: boolean
          incident_number?: never
          incident_type?: string
          location?: unknown
          occurred_at?: string | null
          order_id?: string | null
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_places: {
        Row: {
          access_notes: string | null
          address: string
          created_at: string
          id: string
          is_default_pickup: boolean
          label: string
          location: unknown
          updated_at: string
          user_id: string
        }
        Insert: {
          access_notes?: string | null
          address: string
          created_at?: string
          id?: string
          is_default_pickup?: boolean
          label: string
          location: unknown
          updated_at?: string
          user_id: string
        }
        Update: {
          access_notes?: string | null
          address?: string
          created_at?: string
          id?: string
          is_default_pickup?: boolean
          label?: string
          location?: unknown
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          active: boolean
          boundary: unknown
          code: string
          country_code: string
          created_at: string
          display_name: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          boundary?: unknown
          code: string
          country_code?: string
          created_at?: string
          display_name: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          boundary?: unknown
          code?: string
          country_code?: string
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_types: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          requires_bidding: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          requires_bidding?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          requires_bidding?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      support_case_messages: {
        Row: {
          attachment_paths: string[]
          case_id: string
          created_at: string
          id: string
          internal_note: boolean
          message: string
          sender_id: string
        }
        Insert: {
          attachment_paths?: string[]
          case_id: string
          created_at?: string
          id?: string
          internal_note?: boolean
          message: string
          sender_id: string
        }
        Update: {
          attachment_paths?: string[]
          case_id?: string
          created_at?: string
          id?: string
          internal_note?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "support_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_case_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      support_cases: {
        Row: {
          assigned_to: string | null
          case_number: number
          category: string
          closed_at: string | null
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          opened_by: string
          order_id: string | null
          priority: Database["public"]["Enums"]["case_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_number?: never
          category: string
          closed_at?: string | null
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          opened_by: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["case_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_number?: never
          category?: string
          closed_at?: string | null
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          opened_by?: string
          order_id?: string | null
          priority?: Database["public"]["Enums"]["case_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_classes: {
        Row: {
          active: boolean
          code: Database["public"]["Enums"]["vehicle_type"]
          description: string | null
          display_name: string
          maximum_capacity_kg: number | null
          minimum_capacity_kg: number | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: Database["public"]["Enums"]["vehicle_type"]
          description?: string | null
          display_name: string
          maximum_capacity_kg?: number | null
          minimum_capacity_kg?: number | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: Database["public"]["Enums"]["vehicle_type"]
          description?: string | null
          display_name?: string
          maximum_capacity_kg?: number | null
          minimum_capacity_kg?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_on: string | null
          file_sha256: string | null
          id: string
          issued_on: string | null
          metadata: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          updated_at: string
          vehicle_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_sha256?: string | null
          id?: string
          issued_on?: string | null
          metadata?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          updated_at?: string
          vehicle_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          file_sha256?: string | null
          id?: string
          issued_on?: string | null
          metadata?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          updated_at?: string
          vehicle_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          capacity_kg: number | null
          colour: string | null
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          is_verified: boolean
          make: string | null
          model: string | null
          owner_id: string | null
          photo_url: string | null
          plate_number: string
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_status: Database["public"]["Enums"]["verification_status"]
          volume_m3: number | null
          year: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          capacity_kg?: number | null
          colour?: string | null
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          make?: string | null
          model?: string | null
          owner_id?: string | null
          photo_url?: string | null
          plate_number: string
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
          volume_m3?: number | null
          year?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          capacity_kg?: number | null
          colour?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          make?: string | null
          model?: string | null
          owner_id?: string | null
          photo_url?: string | null
          plate_number?: string
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          verification_status?: Database["public"]["Enums"]["verification_status"]
          volume_m3?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          completed_orders: number | null
          full_name: string | null
          id: string | null
          rating_count: number | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_bid: {
        Args: { p_bid_id: string; p_order_id: string }
        Returns: {
          accepted_bid_id: string | null
          arrived_at: string | null
          cancellation_actor: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          driver_earnings_minor: number | null
          driver_en_route_at: string | null
          driver_id: string | null
          dropoff_access_notes: string | null
          dropoff_address: string
          dropoff_contact_name: string | null
          dropoff_contact_phone_e164: string | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_location: unknown
          estimated_distance_m: number | null
          estimated_duration_s: number | null
          estimated_volume_m3: number | null
          estimated_weight_kg: number | null
          goods_category: string | null
          goods_description: string
          id: string
          order_number: number
          organisation_id: string | null
          picked_up_at: string | null
          pickup_access_notes: string | null
          pickup_address: string
          pickup_contact_name: string | null
          pickup_contact_phone_e164: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location: unknown
          platform_fee_minor: number | null
          price_agreed: number | null
          route_polyline: string | null
          route_provider: string | null
          scheduled_for: string | null
          service_area_id: string | null
          service_type_id: string | null
          special_handling: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount_minor: number | null
          updated_at: string
          vehicle_id: string | null
          vehicle_type_required:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_outbox_events: {
        Args: { p_limit?: number; p_worker_id: string }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          attempts: number
          available_at: string
          created_at: string
          delivered_at: string | null
          event_type: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          payload: Json
          status: Database["public"]["Enums"]["outbox_status"]
        }[]
        SetofOptions: {
          from: "*"
          to: "event_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_outbox_event: {
        Args: { p_delivered: boolean; p_error?: string; p_event_id: string }
        Returns: undefined
      }
      expire_payment_reservations: { Args: never; Returns: number }
      open_financial_dispute: {
        Args: {
          p_description: string
          p_order_id: string
          p_reason_code: string
        }
        Returns: {
          assigned_to: string | null
          created_at: string
          description: string
          escrow_hold_id: string | null
          id: string
          opened_by: string
          order_id: string
          reason_code: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["financial_dispute_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      purge_expired_operational_data: { Args: never; Returns: Json }
      queue_order_refund: {
        Args: { p_order_id: string; p_reason: string }
        Returns: {
          amount_minor: number
          attempts: number
          client_id: string
          created_at: string
          currency: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          reason: string
          requested_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          succeeded_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_payment_success: {
        Args: {
          p_amount_minor: number
          p_payment_intent_id: string
          p_provider_occurred_at?: string
          p_provider_payload?: Json
          p_provider_transaction_id: string
        }
        Returns: {
          amount_minor: number
          client_id: string
          created_at: string
          currency: string
          expires_at: string | null
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          initiated_at: string | null
          order_id: string
          payer_phone_e164: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_checkout_request_id: string | null
          provider_merchant_request_id: string | null
          provider_reference: string | null
          provider_response: Json
          status: Database["public"]["Enums"]["payment_intent_status"]
          succeeded_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payment_intents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_payout_success: {
        Args: {
          p_payout_id: string
          p_provider_payload?: Json
          p_provider_transaction_id: string
        }
        Returns: {
          amount_minor: number
          attempts: number
          created_at: string
          currency: string
          driver_id: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          payout_account_id: string | null
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          succeeded_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_refund_success: {
        Args: {
          p_provider_payload?: Json
          p_provider_transaction_id: string
          p_refund_id: string
        }
        Returns: {
          amount_minor: number
          attempts: number
          client_id: string
          created_at: string
          currency: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          reason: string
          requested_by: string | null
          status: Database["public"]["Enums"]["refund_status"]
          succeeded_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "refunds"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      request_escrow_release: {
        Args: { p_order_id: string }
        Returns: {
          amount_minor: number
          attempts: number
          created_at: string
          currency: string
          driver_id: string
          escrow_hold_id: string
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          next_attempt_at: string
          order_id: string
          payout_account_id: string | null
          processing_started_at: string | null
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_conversation_id: string | null
          provider_originator_conversation_id: string | null
          provider_response: Json
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payout_status"]
          succeeded_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_financial_dispute: {
        Args: {
          p_dispute_id: string
          p_notes: string
          p_resolution: Database["public"]["Enums"]["financial_dispute_status"]
        }
        Returns: {
          assigned_to: string | null
          created_at: string
          description: string
          escrow_hold_id: string | null
          id: string
          opened_by: string
          order_id: string
          reason_code: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["financial_dispute_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "financial_disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_review: {
        Args: { p_comment?: string; p_order_id: string; p_rating: number }
        Returns: {
          comment: string | null
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_notes?: string
          p_order_id: string
        }
        Returns: {
          accepted_bid_id: string | null
          arrived_at: string | null
          cancellation_actor: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          driver_earnings_minor: number | null
          driver_en_route_at: string | null
          driver_id: string | null
          dropoff_access_notes: string | null
          dropoff_address: string
          dropoff_contact_name: string | null
          dropoff_contact_phone_e164: string | null
          dropoff_lat: number
          dropoff_lng: number
          dropoff_location: unknown
          estimated_distance_m: number | null
          estimated_duration_s: number | null
          estimated_volume_m3: number | null
          estimated_weight_kg: number | null
          goods_category: string | null
          goods_description: string
          id: string
          order_number: number
          organisation_id: string | null
          picked_up_at: string | null
          pickup_access_notes: string | null
          pickup_address: string
          pickup_contact_name: string | null
          pickup_contact_phone_e164: string | null
          pickup_lat: number
          pickup_lng: number
          pickup_location: unknown
          platform_fee_minor: number | null
          price_agreed: number | null
          route_polyline: string | null
          route_provider: string | null
          scheduled_for: string | null
          service_area_id: string | null
          service_type_id: string | null
          special_handling: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount_minor: number | null
          updated_at: string
          vehicle_id: string | null
          vehicle_type_required:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_status: "pending" | "active" | "suspended" | "closed"
      app_role:
        | "client"
        | "driver"
        | "support"
        | "operations"
        | "finance"
        | "admin"
      approval_status: "pending" | "approved" | "rejected" | "suspended"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired"
      case_priority: "low" | "normal" | "high" | "urgent"
      case_status:
        | "open"
        | "waiting_customer"
        | "waiting_driver"
        | "in_progress"
        | "resolved"
        | "closed"
      data_request_status:
        | "received"
        | "identity_verification"
        | "in_progress"
        | "completed"
        | "rejected"
        | "cancelled"
      data_request_type:
        | "access"
        | "correction"
        | "portability"
        | "restriction"
        | "objection"
        | "erasure"
      dispatch_offer_status:
        | "offered"
        | "viewed"
        | "accepted"
        | "declined"
        | "expired"
        | "cancelled"
      document_type:
        | "national_id"
        | "driving_licence"
        | "good_conduct"
        | "profile_photo"
        | "vehicle_logbook"
        | "vehicle_inspection"
        | "vehicle_insurance"
        | "business_registration"
        | "other"
      escrow_status:
        | "pending_funding"
        | "funded"
        | "release_pending"
        | "released"
        | "refund_pending"
        | "refunded"
        | "disputed"
        | "cancelled"
      financial_dispute_status:
        | "open"
        | "under_review"
        | "resolved_release"
        | "resolved_refund"
        | "closed"
      incident_status:
        | "reported"
        | "triaged"
        | "investigating"
        | "resolved"
        | "closed"
      ledger_account_type: "asset" | "liability" | "revenue" | "expense"
      ledger_entry_side: "debit" | "credit"
      notification_channel: "in_app" | "push" | "sms" | "email" | "whatsapp"
      notification_status:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "failed"
        | "read"
      order_status:
        | "draft"
        | "pending"
        | "payment_pending"
        | "assigned"
        | "driver_en_route"
        | "arrived"
        | "loading"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      organisation_member_role:
        | "owner"
        | "admin"
        | "dispatcher"
        | "billing"
        | "member"
      outbox_status:
        | "pending"
        | "processing"
        | "delivered"
        | "failed"
        | "dead_letter"
      payment_intent_status:
        | "created"
        | "pending_customer"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "expired"
        | "requires_review"
      payment_provider: "mpesa" | "card" | "bank" | "cash" | "manual"
      payment_transaction_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "reversed"
        | "requires_review"
      payment_transaction_type:
        | "collection"
        | "payout"
        | "refund"
        | "reversal"
        | "adjustment"
      payout_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "requires_review"
      reconciliation_status:
        | "running"
        | "matched"
        | "mismatched"
        | "failed"
        | "completed"
      refund_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "requires_review"
      review_status: "published" | "hidden" | "under_review" | "removed"
      vehicle_type:
        | "motorcycle"
        | "tuktuk"
        | "pickup"
        | "van"
        | "truck_small"
        | "truck_large"
      verification_status:
        | "not_submitted"
        | "pending"
        | "verified"
        | "rejected"
        | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pending", "active", "suspended", "closed"],
      app_role: [
        "client",
        "driver",
        "support",
        "operations",
        "finance",
        "admin",
      ],
      approval_status: ["pending", "approved", "rejected", "suspended"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn", "expired"],
      case_priority: ["low", "normal", "high", "urgent"],
      case_status: [
        "open",
        "waiting_customer",
        "waiting_driver",
        "in_progress",
        "resolved",
        "closed",
      ],
      data_request_status: [
        "received",
        "identity_verification",
        "in_progress",
        "completed",
        "rejected",
        "cancelled",
      ],
      data_request_type: [
        "access",
        "correction",
        "portability",
        "restriction",
        "objection",
        "erasure",
      ],
      dispatch_offer_status: [
        "offered",
        "viewed",
        "accepted",
        "declined",
        "expired",
        "cancelled",
      ],
      document_type: [
        "national_id",
        "driving_licence",
        "good_conduct",
        "profile_photo",
        "vehicle_logbook",
        "vehicle_inspection",
        "vehicle_insurance",
        "business_registration",
        "other",
      ],
      escrow_status: [
        "pending_funding",
        "funded",
        "release_pending",
        "released",
        "refund_pending",
        "refunded",
        "disputed",
        "cancelled",
      ],
      financial_dispute_status: [
        "open",
        "under_review",
        "resolved_release",
        "resolved_refund",
        "closed",
      ],
      incident_status: [
        "reported",
        "triaged",
        "investigating",
        "resolved",
        "closed",
      ],
      ledger_account_type: ["asset", "liability", "revenue", "expense"],
      ledger_entry_side: ["debit", "credit"],
      notification_channel: ["in_app", "push", "sms", "email", "whatsapp"],
      notification_status: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "failed",
        "read",
      ],
      order_status: [
        "draft",
        "pending",
        "payment_pending",
        "assigned",
        "driver_en_route",
        "arrived",
        "loading",
        "picked_up",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      organisation_member_role: [
        "owner",
        "admin",
        "dispatcher",
        "billing",
        "member",
      ],
      outbox_status: [
        "pending",
        "processing",
        "delivered",
        "failed",
        "dead_letter",
      ],
      payment_intent_status: [
        "created",
        "pending_customer",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "expired",
        "requires_review",
      ],
      payment_provider: ["mpesa", "card", "bank", "cash", "manual"],
      payment_transaction_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "reversed",
        "requires_review",
      ],
      payment_transaction_type: [
        "collection",
        "payout",
        "refund",
        "reversal",
        "adjustment",
      ],
      payout_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "requires_review",
      ],
      reconciliation_status: [
        "running",
        "matched",
        "mismatched",
        "failed",
        "completed",
      ],
      refund_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "requires_review",
      ],
      review_status: ["published", "hidden", "under_review", "removed"],
      vehicle_type: [
        "motorcycle",
        "tuktuk",
        "pickup",
        "van",
        "truck_small",
        "truck_large",
      ],
      verification_status: [
        "not_submitted",
        "pending",
        "verified",
        "rejected",
        "expired",
      ],
    },
  },
} as const
