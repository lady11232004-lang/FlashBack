import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, type CoupleSession } from '@/lib/supabase';

export type ParticipantRole = 'host' | 'partner';

export type CoupleSyncState = {
  session: CoupleSession | null;
  loading: boolean;
  error: string | null;
  role: ParticipantRole;
  sessionId: string | null;
};

export function useCoupleSync() {
  const [session, setSession] = useState<CoupleSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<ParticipantRole>('host');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const mountedRef = useRef(true);

  const fetchSession = useCallback(async (id: string): Promise<CoupleSession | null> => {
    const { data, error: err } = await supabase
      .from('couple_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (err) throw new Error(err.message);
    return data as CoupleSession | null;
  }, []);

  const createSession = useCallback(async (hostLabel: string, totalShots: number): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('couple_sessions')
        .insert({
          host_label: hostLabel,
          total_shots: totalShots,
          status: 'waiting',
        })
        .select()
        .single();
      if (err) throw new Error(err.message);
      const s = data as CoupleSession;
      setSession(s);
      setSessionId(s.id);
      setRole('host');
      mountedRef.current = true;
      subscribeToSession(s.id);
      return s.id;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create session';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (id: string, partnerLabel: string): Promise<CoupleSession | null> => {
    setLoading(true);
    setError(null);
    try {
      const existing = await fetchSession(id);
      if (!existing) {
        setError('Session not found. Check your link and try again.');
        return null;
      }
      if (existing.status === 'completed') {
        setError('This session has already ended.');
        return null;
      }
      const { error: err } = await supabase
        .from('couple_sessions')
        .update({
          partner_label: partnerLabel,
          status: 'joined',
          partner_ready: false,
        })
        .eq('id', id);
      if (err) throw new Error(err.message);
      const updated = await fetchSession(id);
      setSession(updated);
      setSessionId(id);
      setRole('partner');
      mountedRef.current = true;
      subscribeToSession(id);
      return updated;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to join session';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  const loadSession = useCallback(async (id: string): Promise<CoupleSession | null> => {
    setLoading(true);
    try {
      const s = await fetchSession(id);
      if (s) {
        setSession(s);
        setSessionId(id);
        if (s.host_ready && !s.partner_ready) setRole('partner');
        else if (s.host_ready) setRole('host');
        mountedRef.current = true;
        subscribeToSession(id);
      }
      return s;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load session';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  const subscribeToSession = useCallback((id: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    const channel = supabase
      .channel(`couple_session:${id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'couple_sessions', filter: `id=eq.${id}` },
        (payload) => {
          if (!mountedRef.current) return;
          const newSession = payload.new as CoupleSession;
          setSession(newSession);
        },
      )
      .subscribe();
    channelRef.current = channel;
  }, []);

  const updateSession = useCallback(async (patch: Partial<CoupleSession>) => {
    if (!sessionId) return;
    const { error: err } = await supabase
      .from('couple_sessions')
      .update(patch)
      .eq('id', sessionId);
    if (err) setError(err.message);
  }, [sessionId]);

  const setReady = useCallback((ready: boolean) => {
    const patch = role === 'host'
      ? { host_ready: ready }
      : { partner_ready: ready };
    updateSession(patch);
  }, [role, updateSession]);

  const startCountdown = useCallback(async () => {
    if (!session) return;
    await updateSession({
      countdown_active: true,
      status: 'capturing',
    });
  }, [session, updateSession]);

  const finishCountdown = useCallback(async () => {
    await updateSession({ countdown_active: false });
  }, [updateSession]);

  const advanceShot = useCallback(async (currentShot: number) => {
    await updateSession({ current_shot: currentShot });
  }, [updateSession]);

  const submitPhoto = useCallback(async (photo: string, shotIndex: number) => {
    if (!session) return;
    const photos = role === 'host' ? [...session.host_photos] : [...session.partner_photos];
    while (photos.length <= shotIndex) photos.push('');
    photos[shotIndex] = photo;
    const patch = role === 'host'
      ? { host_photos: photos }
      : { partner_photos: photos };
    await updateSession(patch);
  }, [session, role, updateSession]);

  const completeSession = useCallback(async (strip: string) => {
    await updateSession({ status: 'completed', final_strip: strip });
  }, [updateSession]);

  const cleanup = useCallback(() => {
    mountedRef.current = false;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  return {
    session,
    loading,
    error,
    role,
    sessionId,
    createSession,
    joinSession,
    loadSession,
    setReady,
    startCountdown,
    finishCountdown,
    advanceShot,
    submitPhoto,
    completeSession,
    cleanup,
  };
}
