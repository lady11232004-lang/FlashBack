import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureIdentity, requireBackend, type CoupleSession } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ParticipantRole = 'host' | 'partner';
const SESSION_KEY = 'flashback-couple-session';
export function useCoupleSync() {
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ParticipantRole>('host');
  const [sessionId, setSessionId] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountedRef = useRef(true);
  const refreshingRef = useRef(false);
  const latestRef = useRef<CoupleSession | null>(null);
  useEffect(() => { latestRef.current = session; }, [session]);
  const applySession = useCallback((data: CoupleSession) => {
    setSession(previous => previous?.id === data.id && (previous.updated_at === data.updated_at || Date.parse(previous.updated_at) > Date.parse(data.updated_at)) ? previous : data);
  }, []);

  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (channelRef.current) void requireBackend().removeChannel(channelRef.current);
    channelRef.current = null;
  }, []);

  const fetchSession = useCallback(async (id: string) => {
    await ensureIdentity();
    const { data, error } = await requireBackend().from('couple_sessions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as CoupleSession | null;
  }, []);

  const refreshSession = useCallback(async (id: string) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      // Timer/readiness metadata arrives before the heavier media history.
      const { data: stamp, error: stampError } = await requireBackend().from('couple_sessions').select('updated_at,capture_at,countdown_active,current_shot,status,host_ready,partner_ready').eq('id', id).maybeSingle();
      if (stampError) throw stampError;
      if (!stamp || (latestRef.current?.id === id && (stamp.updated_at === latestRef.current.updated_at || Date.parse(stamp.updated_at) < Date.parse(latestRef.current.updated_at)))) return;
      const { updated_at, ...metadata } = stamp;
      if (mountedRef.current) setSession(previous => previous?.id === id && updated_at !== previous.updated_at && Date.parse(updated_at) >= Date.parse(previous.updated_at) ? { ...previous, ...metadata } : previous);
      const fresh = await fetchSession(id);
      if (fresh && mountedRef.current) applySession(fresh);
    } catch (error) { if (mountedRef.current) setError(error instanceof Error ? error.message : 'Could not refresh shared photos.'); }
    finally { refreshingRef.current = false; }
  }, [fetchSession, applySession]);

  const adopt = useCallback(async (data: CoupleSession) => {
    const userId = await ensureIdentity();
    if (data.host_user_id !== userId && data.partner_user_id !== userId) throw new Error('You are not a participant in this session.');
    setRole(data.host_user_id === userId ? 'host' : 'partner');
    applySession(data); setSessionId(data.id); sessionStorage.setItem(SESSION_KEY, data.id);
    mountedRef.current = true;
    if (channelRef.current) void requireBackend().removeChannel(channelRef.current);
    channelRef.current = requireBackend().channel(`couple:${data.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couple_sessions', filter: `id=eq.${data.id}` }, payload => {
        void payload;
        // Large media fields can be omitted from Realtime payloads. Fetch the full, RLS-protected row.
        void refreshSession(data.id);
      }).subscribe();
  }, [refreshSession, applySession]);

  const createSession = useCallback(async (hostLabel: string, totalShots: number, countdownSeconds = 3, roomKey = 'classic') => {
    setLoading(true); setError(null);
    try {
      const userId = await ensureIdentity();
      const { data, error } = await requireBackend().from('couple_sessions').insert({ host_label: hostLabel, total_shots: totalShots, countdown_seconds: countdownSeconds, host_user_id: userId, room_key: roomKey }).select().single();
      if (error) throw error;
      await adopt(data as CoupleSession); return data.id as string;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not create session.'); throw error; }
    finally { setLoading(false); }
  }, [adopt]);

  const joinSession = useCallback(async (id: string, partnerLabel: string) => {
    setLoading(true); setError(null);
    try {
      await ensureIdentity();
      const { data, error } = await requireBackend().rpc('join_couple_session', { session_id: id, label: partnerLabel });
      if (error) throw error;
      const joined = data as CoupleSession;
      await adopt(joined); return joined;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not join session.'); return null; }
    finally { setLoading(false); }
  }, [adopt]);

  const loadSession = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const data = await fetchSession(id);
      if (!data) throw new Error('Session not found or you do not have access.');
      await adopt(data); return data;
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load session.'); return null; }
    finally { setLoading(false); }
  }, [adopt, fetchSession]);

  const updateSession = useCallback(async (patch: Partial<CoupleSession>) => {
    if (!sessionId) throw new Error('No active shared session.');
    const { data, error } = await requireBackend().from('couple_sessions').update(patch).eq('id', sessionId).select().single();
    if (error) { setError(error.message); throw error; }
    if (mountedRef.current) { applySession(data as CoupleSession); setError(null); }
  }, [sessionId, applySession]);

  const setReady = useCallback(async (ready: boolean) => {
    await updateSession(role === 'host' ? { host_ready: ready } : { partner_ready: ready });
  }, [role, updateSession]);
  const startCountdown = useCallback(async () => {
    if (role !== 'host' || !session?.host_ready || !session.partner_ready || session.countdown_active) return;
    const { data, error } = await requireBackend().rpc('schedule_couple_capture', { session_id: session.id });
    if (error) { setError(error.message); throw error; }
    if (mountedRef.current) applySession({ ...session, ...data } as CoupleSession);
  }, [role, session, applySession]);
  const finishCountdown = useCallback(async () => {
    if (!session) return;
    await updateSession({ countdown_active: false, current_shot: session.current_shot + 1, capture_at: null });
  }, [session, updateSession]);
  const submitPhoto = useCallback(async (photo: string, shotIndex: number) => {
    if (!session) return;
    const photos = [...(role === 'host' ? session.host_photos : session.partner_photos)];
    photos[shotIndex] = photo;
    await updateSession(role === 'host' ? { host_photos: photos } : { partner_photos: photos });
  }, [session, role, updateSession]);
  const completeSession = useCallback(async (strip: string) => {
    await updateSession({ status: 'completed', final_strip: strip });
  }, [updateSession]);

  useEffect(() => { mountedRef.current = true; return cleanup; }, [cleanup]);
  // Realtime may reconnect after a network drop; polling also repairs missed events.
  useEffect(() => {
    if (!sessionId) return;
    const timer = window.setInterval(() => { void refreshSession(sessionId); }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionId, refreshSession]);
  return { session, loading, error, role, sessionId, createSession, joinSession, loadSession, setReady, startCountdown, finishCountdown, submitPhoto, completeSession, cleanup };
}
