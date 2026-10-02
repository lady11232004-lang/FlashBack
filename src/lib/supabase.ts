import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const backendConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = backendConfigured ? createClient(supabaseUrl!, supabaseAnonKey!, {
  realtime: { params: { eventsPerSecond: 10 } },
}) : null;

export function requireBackend() {
  if (!supabase) throw new Error('Long-distance sessions need a configured Supabase backend. Solo sessions and your device gallery are available.');
  return supabase;
}

let identityPromise: Promise<string> | null = null;
export function ensureIdentity(): Promise<string> {
  if (!identityPromise) identityPromise = (async () => {
    const client = requireBackend();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session.user.id;
    const result = await client.auth.signInAnonymously();
    if (result.error) throw result.error;
    return result.data.user!.id;
  })().catch(error => { identityPromise = null; throw error; });
  return identityPromise;
}

export type CoupleSession = {
  id: string;
  code: string;
  room_key: string;
  host_user_id: string;
  partner_user_id: string | null;
  countdown_seconds: number;
  capture_at: string | null;
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
