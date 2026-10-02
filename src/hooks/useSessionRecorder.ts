import { useCallback, useEffect, useRef, useState } from 'react';
import { blobToDataUrl } from '@/lib/gallery';

export function useSessionRecorder() {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pendingRef = useRef<Promise<string | null> | null>(null);
  const resolveRef = useRef<((url: string | null) => void) | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recorderRef.current) return;
    if (typeof MediaRecorder === 'undefined') { setError('Recording is unavailable in this browser. Photo capture still works.'); return; }
    try {
      const mimeType = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      pendingRef.current = new Promise(resolve => { resolveRef.current = resolve; });
      rec.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      rec.onstop = async () => {
        try { resolveRef.current?.(chunks.length ? await blobToDataUrl(new Blob(chunks, { type: rec.mimeType })) : null); }
        catch { setError('Could not read the recording.'); resolveRef.current?.(null); }
        recorderRef.current = null; setIsRecording(false);
      };
      rec.onerror = () => { setError('Recording failed. Your photos are still available.'); resolveRef.current?.(null); };
      rec.start(1000); recorderRef.current = rec; setIsRecording(true); setError(null);
    } catch { setError('Could not start recording. Your photos are still available.'); }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    return pendingRef.current ? await pendingRef.current : null;
  }, []);

  useEffect(() => () => { void stopRecording(); }, [stopRecording]);
  return { isRecording, error, startRecording, stopRecording };
}
