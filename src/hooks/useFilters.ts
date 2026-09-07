export type FilterDef = {
  key: string;
  label: string;
  css: string;
};

export const COLOR_FILTERS: FilterDef[] = [
  { key: 'ORIGINAL', label: 'Original', css: 'none' },
  { key: 'WARM', label: 'Warm', css: 'sepia(0.25) saturate(1.3) brightness(1.05)' },
  { key: 'COOL', label: 'Cool', css: 'hue-rotate(180deg) saturate(1.2) brightness(0.98)' },
  { key: 'SOFT', label: 'Soft', css: 'blur(0.4px) brightness(1.08) saturate(0.9) contrast(0.92)' },
  { key: 'NATURAL', label: 'Natural', css: 'saturate(1.08) contrast(1.03) brightness(1.02)' },
  { key: 'FILM', label: 'Film', css: 'contrast(1.2) saturate(0.85) brightness(0.95) sepia(0.15)' },
  { key: 'VINTAGE', label: 'Vintage', css: 'sepia(0.4) saturate(1.5) contrast(0.9) brightness(1.05) hue-rotate(-10deg)' },
  { key: 'FADED', label: 'Faded', css: 'contrast(0.8) brightness(1.1) saturate(0.6)' },
  { key: 'DISPOSABLE', label: 'Disposable', css: 'saturate(1.4) contrast(1.15) brightness(1.08) hue-rotate(5deg) sepia(0.1)' },
  { key: 'POLAROID', label: 'Polaroid', css: 'contrast(0.95) brightness(1.1) saturate(0.85) sepia(0.12)' },
  { key: 'KODAK', label: 'Kodak', css: 'sepia(0.2) saturate(1.25) contrast(1.1) brightness(1.03) hue-rotate(-5deg)' },
  { key: 'BW', label: 'Black & White', css: 'grayscale(1) contrast(1.1)' },
  { key: 'SEPIA', label: 'Sepia', css: 'sepia(0.7) contrast(1.05) brightness(1.02)' },
  { key: 'MATTE', label: 'Matte', css: 'contrast(0.88) brightness(1.05) saturate(0.9)' },
  { key: 'BRIGHT', label: 'Bright', css: 'brightness(1.18) saturate(1.15) contrast(1.05)' },
  { key: 'MOODY', label: 'Moody', css: 'contrast(1.15) brightness(0.9) saturate(0.8) sepia(0.1)' },
  { key: 'DREAMY', label: 'Dreamy', css: 'blur(0.6px) brightness(1.12) saturate(1.1) contrast(0.88)' },
  { key: 'GRAIN', label: 'Grain', css: 'contrast(1.1) saturate(0.95) brightness(0.98) sepia(0.08)' },
  { key: 'HIGH_CONTRAST', label: 'High Contrast', css: 'contrast(1.4) saturate(1.1) brightness(0.98)' },
];

export const FILTER_MAP: Record<string, FilterDef> = COLOR_FILTERS.reduce(
  (acc, f) => { acc[f.key] = f; return acc; },
  {} as Record<string, FilterDef>,
);

export function getFilterCss(key: string): string {
  return FILTER_MAP[key]?.css || 'none';
}

export function getFilterLabel(key: string): string {
  return FILTER_MAP[key]?.label || 'Original';
}
