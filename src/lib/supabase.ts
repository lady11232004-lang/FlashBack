import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type CoupleSession = {
  id: string;
  code: string;
  host_label: string;
  partner_label: string;
  status: string;
  total_shots: number;
  current_shot: number;
  countdown_active: boolean;
  host_ready: boolean;
  partner_ready: boolean;
  host_photos: string[];
  partner_photos: string[];
  final_strip: string | null;
  created_at: string;
  updated_at: string;
};
