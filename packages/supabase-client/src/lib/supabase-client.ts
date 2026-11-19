import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Database types (generated from schema)
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          customer_id: string;
          phone: string;
          name: string;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id?: string;
          phone: string;
          name: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          phone?: string;
          name?: string;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          booking_id: string;
          booking_reference: string;
          customer_id: string;
          status: string;
          pickup_date: string;
          pickup_address: string;
          total_weight_kg: number;
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          booking_id?: string;
          booking_reference: string;
          customer_id: string;
          status?: string;
          pickup_date: string;
          pickup_address: string;
          total_weight_kg: number;
          total_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          booking_reference?: string;
          customer_id?: string;
          status?: string;
          pickup_date?: string;
          pickup_address?: string;
          total_weight_kg?: number;
          total_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      parcels: {
        Row: {
          parcel_id: string;
          booking_id: string;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          description: string;
          value_inr: number;
          created_at: string;
        };
        Insert: {
          parcel_id?: string;
          booking_id: string;
          weight_kg: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          description: string;
          value_inr: number;
          created_at?: string;
        };
        Update: {
          parcel_id?: string;
          booking_id?: string;
          weight_kg?: number;
          length_cm?: number;
          width_cm?: number;
          height_cm?: number;
          description?: string;
          value_inr?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          payment_id: string;
          booking_id: string;
          razorpay_payment_id: string;
          amount_cents: number;
          currency: string;
          status: string;
          payment_method: string;
          created_at: string;
          updated_at: string;
          captured_at: string | null;
        };
        Insert: {
          payment_id?: string;
          booking_id: string;
          razorpay_payment_id: string;
          amount_cents: number;
          currency: string;
          status?: string;
          payment_method?: string;
          created_at?: string;
          updated_at?: string;
          captured_at?: string | null;
        };
        Update: {
          payment_id?: string;
          booking_id?: string;
          razorpay_payment_id?: string;
          amount_cents?: number;
          currency?: string;
          status?: string;
          payment_method?: string;
          created_at?: string;
          updated_at?: string;
          captured_at?: string | null;
        };
      };
      pickups: {
        Row: {
          pickup_id: string;
          booking_id: string;
          agent_id: string | null;
          status: string;
          scheduled_at: string;
          completed_at: string | null;
          actual_weight_kg: number | null;
          balance_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          pickup_id?: string;
          booking_id: string;
          agent_id?: string | null;
          status?: string;
          scheduled_at: string;
          completed_at?: string | null;
          actual_weight_kg?: number | null;
          balance_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pickup_id?: string;
          booking_id?: string;
          agent_id?: string | null;
          status?: string;
          scheduled_at?: string;
          completed_at?: string | null;
          actual_weight_kg?: number | null;
          balance_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      agents: {
        Row: {
          agent_id: string;
          phone: string;
          name: string;
          email: string | null;
          assigned_area: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          agent_id?: string;
          phone: string;
          name: string;
          email?: string | null;
          assigned_area?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          agent_id?: string;
          phone?: string;
          name?: string;
          email?: string | null;
          assigned_area?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tracking: {
        Row: {
          tracking_id: string;
          booking_id: string;
          india_post_tracking_number: string;
          status: string;
          status_details: string | null;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tracking_id?: string;
          booking_id: string;
          india_post_tracking_number: string;
          status?: string;
          status_details?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tracking_id?: string;
          booking_id?: string;
          india_post_tracking_number?: string;
          status?: string;
          status_details?: string | null;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          document_id: string;
          booking_id: string;
          document_type: string;
          storage_url: string;
          created_at: string;
        };
        Insert: {
          document_id?: string;
          booking_id: string;
          document_type: string;
          storage_url: string;
          created_at?: string;
        };
        Update: {
          document_id?: string;
          booking_id?: string;
          document_type?: string;
          storage_url?: string;
          created_at?: string;
        };
      };
      parcel_photos: {
        Row: {
          photo_id: string;
          pickup_id: string;
          storage_url: string;
          uploaded_at: string;
        };
        Insert: {
          photo_id?: string;
          pickup_id: string;
          storage_url: string;
          uploaded_at?: string;
        };
        Update: {
          photo_id?: string;
          pickup_id?: string;
          storage_url?: string;
          uploaded_at?: string;
        };
      };
      rate_tables: {
        Row: {
          region: string;
          weight_bracket: string;
          base_rate: number;
          per_kg_rate: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          region: string;
          weight_bracket: string;
          base_rate: number;
          per_kg_rate: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          region?: string;
          weight_bracket?: string;
          base_rate?: number;
          per_kg_rate?: number;
          currency?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in string]: unknown;
    };
    Functions: {
      [_ in string]: unknown;
    };
    Enums: {
      booking_status: 'pending' | 'paid' | 'cancelled' | 'completed';
      payment_status: 'initiated' | 'captured' | 'failed' | 'refunded';
      payment_method: 'upi' | 'card' | 'netbanking' | 'wallet';
      pickup_status: 'assigned' | 'scanned' | 'weight_verified' | 'photo_captured' | 'completed';
      tracking_status: 'booked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
      document_type: 'sticker' | 'cn22' | 'cn23' | 'invoice';
    };
  };
};

// Supabase client instance
let supabase: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const key = process.env['SUPABASE_SERVICE_KEY'];

    if (!url || !key) {
      throw new Error('Supabase URL and Key must be set');
    }

    supabase = createClient<Database>(url, key);
  }
  return supabase;
}

// Client for public use (anon key)
export function getPublicSupabaseClient(): SupabaseClient<Database> {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!url || !key) {
    throw new Error('Supabase URL and Anon Key must be set');
  }

  return createClient<Database>(url, key);
}