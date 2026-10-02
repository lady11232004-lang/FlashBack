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

  const adopt = useCallback(async (data: CoupleSession) => {
    const userId = await ensureIdentity();
    if (data.host_user_id !== userId && data.partner_user_id !== userId) throw new Error('You are not a participant in this session.');
    setRole(data.host_user_id === userId ? 'host' : 'partner');
    setSession(data); setSessionId(data.id); sessionStorage.setItem(SESSION_KEY, data.id);
    mountedRef.current = true;
    if (channelRef.current) void requireBackend().removeChannel(channelRef.current);
    channelRef.current = requireBackend().channel(`couple:${data.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couple_sessions', filter: `id=eq.${data.id}` }, payload => {
        if (mountedRef.current) setSession(payload.new as CoupleSession);
      }).subscribe();
  }, []);

  const createSession = useCallback(async (hostLabel: string, totalShots: number, countdownSeconds = 3) => {
    setLoading(true); setError(null);
    try {
      const userId = await ensureIdentity();
      const { data, error } = await requireBackend().from('couple_sessions').insert({ host_label: hostLabel, total_shots: totalShots, countdown_seconds: countdownSeconds, host_user_id: userId }).select().single();
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
    if (mountedRef.current) setSession(data as CoupleSession);
  }, [sessionId]);

  const setReady = useCallback(async (ready: boolean) => {
    await updateSession(role === 'host' ? { host_ready: ready } : { partner_ready: ready });
  }, [role, updateSession]);
  const startCountdown = useCallback(async () => {
    if (role !== 'host' || !session?.host_ready || !session.partner_ready || session.countdown_active) return;
    await updateSession({ countdown_active: true, status: 'capturing', capture_at: new Date(Date.now() + session.countdown_seconds * 1000).toISOString() });
  }, [role, session, updateSession]);
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
    const timer = window.setInterval(() => { fetchSession(sessionId).then(data => { if (data && mountedRef.current) setSession(data); }).catch(error => { if (mountedRef.current) setError(error.message); }); }, 2000);
    return () => window.clearInterval(timer);
  }, [sessionId, fetchSession]);
  return { session, loading, error, role, sessionId, createSession, joinSession, loadSession, setReady, startCountdown, finishCountdown, submitPhoto, completeSession, cleanup };
}
