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
import { getFilterCss } from '@/hooks/useFilters';
import { generatePhotoStrip, generateCoupleStrip, DEFAULT_CUSTOMIZATION, TEMPLATE_LAYOUTS, type StripCustomization } from '@/utils/photoStrip';
import { supabase } from '@/lib/supabase';

export type PhotoboothMode = 'SOLO' | 'DOUBLE';

type SavedGalleryItem = {
  id: string;
  item_type: string;
  data_url: string;
  thumbnail: string;
  title: string;
  template: string;
  mode: string;
  created_at: string;
};

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
  selectedShots: string[];
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
  galleryItems: SavedGalleryItem[];
  loadGallery: () => Promise<void>;
  saveToGallery: (item: { item_type: string; data_url: string; thumbnail?: string; title?: string; template?: string }) => Promise<void>;
  // video
  videoBlobUrl: string | null;
  setVideoBlobUrl: (url: string | null) => void;
};

const Ctx = createContext<PhotoboothState | null>(null);
const CAPTURE_FLASH_MS = 220;
export const MAX_SHOTS = 10;

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
  const [selectedShots, setSelectedShots] = useState<string[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [stripDataUrl, setStripDataUrl] = useState('');
  const [stripLoading, setStripLoading] = useState(false);
  const [customization, setCustomizationState] = useState<StripCustomization>(DEFAULT_CUSTOMIZATION);
  const [galleryItems, setGalleryItems] = useState<SavedGalleryItem[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const activeRef = useRef(false);

  const startCamera = useCallback(async () => {
    activeRef.current = true;
    await start();
  }, [start]);

  const stopCamera = useCallback(() => {
    activeRef.current = false;
    stop();
  }, [stop]);

  const resetSession = useCallback(() => {
    setCapturedShots([]);
    setSelectedShots([]);
    setPartnerPhotos([]);
    setCountdown(0);
    setIsCapturing(false);
    setFlash(false);
    setStripDataUrl('');
    setVideoBlobUrl(null);
    setCustomizationState(DEFAULT_CUSTOMIZATION);
  }, []);

  const setCustomization = useCallback((patch: Partial<StripCustomization>) => {
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
    if (isCapturing || capturedShots.length >= MAX_SHOTS) return;
    setIsCapturing(true);

    for (let step = countdownDuration; step >= 1; step--) {
      setCountdown(step);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(0);

    setFlash(true);
    setTimeout(() => setFlash(false), CAPTURE_FLASH_MS);

    const filterCss = getFilterCss(filterKey);
    const photo = captureWithFilter(filterCss);
    if (photo) {
      setCapturedShots((prev) => [...prev, photo]);
    }
    setIsCapturing(false);
  }, [isCapturing, capturedShots.length, captureWithFilter, filterKey, countdownDuration]);

  const retakeShot = useCallback(async (index: number) => {
    setIsCapturing(true);
    for (let step = countdownDuration; step >= 1; step--) {
      setCountdown(step);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(0);
    setFlash(true);
    setTimeout(() => setFlash(false), CAPTURE_FLASH_MS);
    const filterCss = getFilterCss(filterKey);
    const photo = captureWithFilter(filterCss);
    if (photo) {
      setCapturedShots((prev) => {
        const next = [...prev];
        next[index] = photo;
        return next;
      });
    }
    setIsCapturing(false);
  }, [captureWithFilter, filterKey, countdownDuration]);

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
    setStripLoading(true);
    try {
      const layoutDef = TEMPLATE_LAYOUTS[customization.template] || TEMPLATE_LAYOUTS.CLASSIC;
      const maxSlots = layoutDef.slots;
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
      setStripDataUrl(url);
      return url;
    } finally {
      setStripLoading(false);
    }
  }, [capturedShots, selectedShots, partnerPhotos, mode, customization]);

  const loadGallery = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (err) return;
    setGalleryItems((data || []) as SavedGalleryItem[]);
  }, []);

  const saveToGallery = useCallback(async (item: { item_type: string; data_url: string; thumbnail?: string; title?: string; template?: string }) => {
    await supabase.from('gallery_items').insert({
      item_type: item.item_type,
      data_url: item.data_url,
      thumbnail: item.thumbnail || '',
      title: item.title || '',
      template: item.template || '',
      mode,
    });
    await loadGallery();
  }, [mode, loadGallery]);

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
    galleryItems, loadGallery, saveToGallery,
    videoBlobUrl, setVideoBlobUrl,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePhotobooth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePhotobooth must be used within PhotoboothProvider');
  return ctx;
}
