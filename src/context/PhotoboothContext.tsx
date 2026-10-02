import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useCamera } from '@/hooks/useCamera';
import { getFilterCss, getFilterOverlay } from '@/hooks/useFilters';
import { generatePhotoStrip, generateCoupleStrip, DEFAULT_CUSTOMIZATION, TEMPLATE_LAYOUTS, type StripCustomization } from '@/utils/photoStrip';
import { listGallery, saveGallery, updateGallery, deleteGallery, deviceStore, type GalleryInput, type GalleryItem } from '@/lib/gallery';

export type PhotoboothMode = 'SOLO' | 'DOUBLE';

type PhotoboothState = {
  mode: PhotoboothMode;
  setMode: (m: PhotoboothMode) => void;
  totalShots: number;
  setTotalShots: (n: number) => void;
  countdownDuration: number;
  setCountdownDuration: (n: number) => void;
  filterKey: string;
  setFilterKey: (k: string) => void;
  // camera
  videoRef: React.RefObject<HTMLVideoElement>;
  ready: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => void;
  reattach: () => void;
  facingMode: 'user' | 'environment';
  // capture
  countdown: number;
  isCapturing: boolean;
  flash: boolean;
  capturedShots: string[];
  selectedShots: number[];
  retakeShot: (index: number) => Promise<void>;
  selectShot: (index: number) => void;
  deselectShot: (index: number) => void;
  toggleShot: (index: number) => void;
  setSelectedShotsBulk: (indices: number[]) => void;
  resetSession: () => void;
  startCapture: () => Promise<void>;
  MAX_SHOTS: number;
  // strip
  stripDataUrl: string;
  stripLoading: boolean;
  generateStrip: () => Promise<string>;
  setStripDataUrl: (s: string) => void;
  // customization
  customization: StripCustomization;
  setCustomization: (c: Partial<StripCustomization>) => void;
  // couple
  partnerPhotos: string[];
  setPartnerPhotos: (p: string[]) => void;
  // gallery
  galleryItems: GalleryItem[];
  galleryError: string | null;
  galleryLoading: boolean;
  draftReady: boolean;
  replaceShots: (photos: string[]) => void;
  updateGalleryItem: (id: string, patch: { title?: string; favorite?: boolean }) => Promise<void>;
  deleteGalleryItem: (id: string) => Promise<void>;
  loadGallery: () => Promise<void>;
  saveToGallery: (item: GalleryInput) => Promise<void>;
  // video
  videoBlobUrl: string | null;
  setVideoBlobUrl: (url: string | null) => void;
};

const Ctx = createContext<PhotoboothState | null>(null);
const CAPTURE_FLASH_MS = 220;
export const MAX_SHOTS = 10;
const STUDIO_CHOICE_KEY = 'flashback-studio-choice';
function readStudioChoice(): Partial<StripCustomization> {
  try {
    const choice = JSON.parse(localStorage.getItem(STUDIO_CHOICE_KEY) || '{}');
    return { ...(typeof choice.room === 'string' ? { room: choice.room } : {}), ...(typeof choice.frameId === 'string' ? { frameId: choice.frameId } : {}) };
  } catch { return {}; }
}

export function PhotoboothProvider({ children }: { children: ReactNode }) {
  const {
    videoRef,
    ready,
    error,
    start,
    stop,
    switchCamera,
    captureWithFilter,
    reattach,
    facingMode,
  } = useCamera();

  const [mode, setMode] = useState<PhotoboothMode>('SOLO');
  const [totalShots, setTotalShots] = useState(4);
  const [countdownDuration, setCountdownDuration] = useState(3);
  const [filterKey, setFilterKey] = useState('ORIGINAL');
  const [countdown, setCountdown] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturedShots, setCapturedShots] = useState<string[]>([]);
  const [selectedShots, setSelectedShots] = useState<number[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [stripDataUrl, setStripDataUrl] = useState('');
  const [stripLoading, setStripLoading] = useState(false);
  const [customization, setCustomizationState] = useState<StripCustomization>(() => ({ ...DEFAULT_CUSTOMIZATION, ...readStudioChoice() }));
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const activeRef = useRef(false);
  const captureLock = useRef(false);
  const captureEpoch = useRef(0);
  const generationRef = useRef(0);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    deviceStore<{mode: PhotoboothMode; totalShots: number; countdownDuration: number; filterKey: string; capturedShots: string[]; selectedShots: number[]; partnerPhotos: string[]; customization: StripCustomization; stripDataUrl: string; videoBlobUrl: string | null} | undefined>('draft', 'readonly', store => store.get('current')).then(draft => {
      if (cancelled) return;
      if (draft) {
        setMode(draft.mode); setTotalShots(draft.totalShots); setCountdownDuration(draft.countdownDuration);
        setFilterKey(draft.filterKey); setCapturedShots(draft.capturedShots); setSelectedShots(draft.selectedShots);
        setPartnerPhotos(draft.partnerPhotos); setCustomizationState({ ...DEFAULT_CUSTOMIZATION, ...draft.customization, ...readStudioChoice() });
        setStripDataUrl(draft.stripDataUrl); setVideoBlobUrl(draft.videoBlobUrl);
      }
    }).catch(error => { if (!cancelled) setGalleryError(error.message); }).finally(() => { if (!cancelled) setDraftReady(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    // Queue all writes in order; refreshing after a completed capture restores the draft.
    deviceStore('draft', 'readwrite', store => store.put({ mode, totalShots, countdownDuration, filterKey, capturedShots, selectedShots, partnerPhotos, customization, stripDataUrl, videoBlobUrl }, 'current')).catch(error => setGalleryError(error.message));
  }, [draftReady, mode, totalShots, countdownDuration, filterKey, capturedShots, selectedShots, partnerPhotos, customization, stripDataUrl, videoBlobUrl]);

  const replaceShots = useCallback((photos: string[]) => {
    setCapturedShots(photos); setSelectedShots([]); setStripDataUrl('');
  }, []);

  const startCamera = useCallback(async () => {
    activeRef.current = true;
    await start();
  }, [start]);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    captureEpoch.current++;
    stop();
  }, [stop]);

  const resetSession = useCallback(() => {
    activeRef.current = false;
    captureEpoch.current++;
    generationRef.current++;
    setCapturedShots([]);
    setSelectedShots([]);
    setPartnerPhotos([]);
    setCountdown(0);
    setIsCapturing(false);
    setFlash(false);
    setStripDataUrl('');
    setVideoBlobUrl(null);
    try { localStorage.setItem(STUDIO_CHOICE_KEY, JSON.stringify({ room: 'classic', frameId: '' })); } catch { /* Device storage errors are reported by the draft save. */ }
    setCustomizationState(DEFAULT_CUSTOMIZATION);
  }, []);

  const setCustomization = useCallback((patch: Partial<StripCustomization>) => {
    // Small preferences are saved synchronously, so an immediate refresh cannot lose a click.
    if (patch.room !== undefined || patch.frameId !== undefined) {
      try { localStorage.setItem(STUDIO_CHOICE_KEY, JSON.stringify({ ...readStudioChoice(), ...(patch.room !== undefined ? { room: patch.room } : {}), ...(patch.frameId !== undefined ? { frameId: patch.frameId } : {}) })); }
      catch { setGalleryError('Your browser could not preserve the selected room/frame.'); }
    }
    setCustomizationState((prev) => {
      const next = { ...prev, ...patch };
      if (patch.template) {
        const layoutDef = TEMPLATE_LAYOUTS[patch.template];
        if (layoutDef) next.layout = layoutDef.layout;
      }
      return next;
    });
  }, []);

  const startCapture = useCallback(async () => {
    if (!ready || captureLock.current || capturedShots.length >= MAX_SHOTS) return;
    captureLock.current = true;
    const epoch = captureEpoch.current;
    setIsCapturing(true);

    for (let step = countdownDuration; step >= 1; step--) {
      setCountdown(step);
      await new Promise((r) => setTimeout(r, 1000));
      if (!activeRef.current || epoch !== captureEpoch.current) { captureLock.current = false; setIsCapturing(false); setCountdown(0); return; }
    }
    setCountdown(0);

    setFlash(true);
    setTimeout(() => setFlash(false), CAPTURE_FLASH_MS);

    const filterCss = getFilterCss(filterKey);
    const photo = captureWithFilter(filterCss, getFilterOverlay(filterKey));
    if (photo) {
      setCapturedShots((prev) => [...prev, photo]);
    }
    setIsCapturing(false);
    captureLock.current = false;
  }, [ready, capturedShots.length, captureWithFilter, filterKey, countdownDuration]);

  const retakeShot = useCallback(async (index: number) => {
    if (!ready || captureLock.current || index < 0 || index >= capturedShots.length) return;
    captureLock.current = true;
    const epoch = captureEpoch.current;
    setIsCapturing(true);
    for (let step = countdownDuration; step >= 1; step--) {
      setCountdown(step);
      await new Promise((r) => setTimeout(r, 1000));
      if (!activeRef.current || epoch !== captureEpoch.current) { captureLock.current = false; setIsCapturing(false); setCountdown(0); return; }
    }
    setCountdown(0);
    setFlash(true);
    setTimeout(() => setFlash(false), CAPTURE_FLASH_MS);
    const filterCss = getFilterCss(filterKey);
    const photo = captureWithFilter(filterCss, getFilterOverlay(filterKey));
    if (photo) {
      setCapturedShots((prev) => {
        const next = [...prev];
        next[index] = photo;
        return next;
      });
    }
    setIsCapturing(false);
    captureLock.current = false;
  }, [ready, capturedShots.length, captureWithFilter, filterKey, countdownDuration]);

  const toggleShot = useCallback((index: number) => {
    setSelectedShots((prev) => {
      if (prev.includes(index)) return prev.filter(i => i !== index);
      if (prev.length >= totalShots) return prev;
      return [...prev, index];
    });
  }, [totalShots]);

  const selectShot = useCallback((index: number) => {
    setSelectedShots((prev) => prev.includes(index) ? prev : [...prev, index].slice(0, totalShots));
  }, [totalShots]);

  const deselectShot = useCallback((index: number) => {
    setSelectedShots((prev) => prev.filter(i => i !== index));
  }, []);

  const setSelectedShotsBulk = useCallback((indices: number[]) => {
    setSelectedShots(indices.slice(0, totalShots));
  }, [totalShots]);

  const generateStrip = useCallback(async (): Promise<string> => {
    const generation = ++generationRef.current;
    setStripLoading(true);
    try {
      const layoutDef = TEMPLATE_LAYOUTS[customization.template] || TEMPLATE_LAYOUTS.CLASSIC;
      const maxSlots = layoutDef.layout === 'single' ? 1 : totalShots;
      let photosToUse: string[];

      if (selectedShots.length > 0) {
        photosToUse = selectedShots.map(i => capturedShots[i]).filter(Boolean);
      } else {
        photosToUse = capturedShots.slice(0, maxSlots);
      }

      let url: string;
      if (mode === 'DOUBLE' && partnerPhotos.length > 0) {
        url = await generateCoupleStrip(
          photosToUse,
          partnerPhotos,
          customization.namesText.split('\u2665')[0].trim() || 'HOST',
          customization.namesText.split('\u2665')[1]?.trim() || 'PARTNER',
          customization,
        );
      } else {
        url = await generatePhotoStrip(photosToUse, customization);
      }
      if (generation === generationRef.current) setStripDataUrl(url);
      return url;
    } finally {
      if (generation === generationRef.current) setStripLoading(false);
    }
  }, [capturedShots, selectedShots, partnerPhotos, mode, customization, totalShots]);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true); setGalleryError(null);
    try { setGalleryItems(await listGallery()); }
    catch (error) { setGalleryError(error instanceof Error ? error.message : 'Could not load gallery.'); }
    finally { setGalleryLoading(false); }
  }, []);

  const saveToGallery = useCallback(async (item: GalleryInput) => {
    await saveGallery(item, mode);
    await loadGallery();
  }, [mode, loadGallery]);

  const updateGalleryItem = useCallback(async (id: string, patch: { title?: string; favorite?: boolean }) => {
    await updateGallery(id, patch); await loadGallery();
  }, [loadGallery]);

  const deleteGalleryItem = useCallback(async (id: string) => {
    await deleteGallery(id); await loadGallery();
  }, [loadGallery]);

  useEffect(
    () => () => {
      activeRef.current = false;
      stop();
    },
    [stop],
  );

  const value: PhotoboothState = {
    mode, setMode,
    totalShots, setTotalShots,
    countdownDuration, setCountdownDuration,
    filterKey, setFilterKey,
    videoRef, ready, error,
    startCamera, stopCamera, switchCamera, reattach,
    facingMode,
    countdown, isCapturing, flash,
    capturedShots, selectedShots,
    retakeShot, selectShot, deselectShot, toggleShot, setSelectedShotsBulk,
    resetSession, startCapture,
    MAX_SHOTS,
    stripDataUrl, stripLoading,
    generateStrip, setStripDataUrl,
    customization, setCustomization,
    partnerPhotos, setPartnerPhotos,
    galleryItems, galleryError, galleryLoading, draftReady, replaceShots, loadGallery, saveToGallery, updateGalleryItem, deleteGalleryItem,
    videoBlobUrl, setVideoBlobUrl,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// The provider and its consumer hook intentionally share one module.
// eslint-disable-next-line react-refresh/only-export-components
export function usePhotobooth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePhotobooth must be used within PhotoboothProvider');
  return ctx;
}
