import { zoomCrop } from '@/utils/cameraZoom';
import { drawFilteredImage } from '@/utils/canvasFilter';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);
  const requestRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const start = useCallback(async (mode?: 'user' | 'environment') => {
    const fm = mode ?? facingMode;
    const request = ++requestRef.current;
    setReady(false);
    setError(null);
    activeRef.current = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera API not available in this browser.');
        setReady(false);
        return;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStream(null);
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: fm },
        audio: false,
      });
      if (!activeRef.current || request !== requestRef.current) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      if (videoRef.current) {
        const video = videoRef.current;
        video.addEventListener('loadeddata', () => { if (activeRef.current && request === requestRef.current) setReady(true); }, { once: true });
        video.srcObject = mediaStream;
        void video.play().catch(() => setError('Tap reconnect to resume your camera.'));
      }
    } catch (e: unknown) {
      if (request !== requestRef.current) return;
      const err = e as Error;
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(err?.message || 'Unable to access camera.');
      }
      setReady(false);
    }
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (activeRef.current) void start(next);
  }, [facingMode, start]);

  const stop = useCallback(() => {
    activeRef.current = false;
    requestRef.current++;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setReady(false);
  }, []);

  const capture = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, [facingMode]);

  const captureWithFilter = useCallback(
    (filterCss: string, overlayFn?: ((ctx: CanvasRenderingContext2D, w: number, h: number) => void)): string | null => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || video.readyState < 2) { setError('Camera frame unavailable. Reconnect your camera and retry.'); return null; }
      const canvas = document.createElement('canvas');
      const ratio = video.clientWidth / video.clientHeight || video.videoWidth / video.videoHeight;
      const base = zoomCrop(video.videoWidth, video.videoHeight, 1, ratio);
      canvas.width = Math.round(base.w);
      canvas.height = Math.round(base.h);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.save();
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      const crop = zoomCrop(video.videoWidth, video.videoHeight, zoom, ratio);
      drawFilteredImage(ctx, video, filterCss, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      if (overlayFn) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        overlayFn(ctx, canvas.width, canvas.height);
      }

      return canvas.toDataURL('image/jpeg', 0.92);
    },
    [facingMode, zoom],
  );

  const reattach = useCallback(() => {
    if (videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== stream) video.srcObject = stream;
      if (video.readyState >= 2) setReady(true);
      else video.addEventListener('loadeddata', () => { if (activeRef.current && streamRef.current === stream) setReady(true); }, { once: true });
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  useEffect(
    () => () => {
      activeRef.current = false;
      requestRef.current++;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  return { zoom, setZoom, videoRef, stream, ready, error, facingMode, start, stop, switchCamera, capture, captureWithFilter, reattach };
}
