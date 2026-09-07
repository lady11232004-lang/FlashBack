export const TEMPLATE_FILTERS: Record<string, string> = {
  CLASSIC: 'grayscale(1) contrast(1.1)',
  MINIMAL: 'grayscale(0.3) contrast(1.05)',
  FILM: 'contrast(1.2) saturate(0.85) brightness(0.95) sepia(0.15)',
  '35MM FILM': 'sepia(0.4) contrast(1.1) brightness(1.05)',
  'VINTAGE 70S': 'sepia(0.6) saturate(1.4) contrast(0.95)',
  'DATE STAMP': 'grayscale(0.8) contrast(1.05)',
  POLAROID: 'contrast(0.95) brightness(1.1) saturate(0.85) sepia(0.12)',
  RETRO: 'sepia(0.5) saturate(1.6) contrast(0.9) brightness(1.05) hue-rotate(-15deg)',
  EDITORIAL: 'contrast(1.15) saturate(0.9) brightness(1.0)',
  'CLEAN MODERN': 'saturate(1.05) contrast(1.05) brightness(1.03)',
  COUPLE: 'sepia(0.15) saturate(1.2) contrast(1.05) brightness(1.03)',
  KODAK: 'sepia(0.2) saturate(1.25) contrast(1.1) brightness(1.03) hue-rotate(-5deg)',
};

export const TEMPLATE_LAYOUTS: Record<string, { layout: string; slots: number; label: string; desc: string }> = {
  CLASSIC: { layout: 'vertical', slots: 4, label: 'Classic', desc: '4-frame vertical strip' },
  MINIMAL: { layout: 'vertical', slots: 3, label: 'Minimal', desc: '3-frame clean strip' },
  FILM: { layout: 'vertical', slots: 4, label: 'Film', desc: '4-frame film look' },
  '35MM FILM': { layout: 'vertical', slots: 4, label: '35mm Film', desc: 'Warm faded film grain' },
  'VINTAGE 70S': { layout: 'vertical', slots: 4, label: 'Vintage 70s', desc: 'Retro warm tones' },
  'DATE STAMP': { layout: 'vertical', slots: 4, label: 'Date Stamp', desc: 'B&W with date stamp' },
  POLAROID: { layout: 'polaroid', slots: 3, label: 'Polaroid', desc: '3-frame polaroid style' },
  RETRO: { layout: 'vertical', slots: 6, label: 'Retro', desc: '6-frame retro strip' },
  EDITORIAL: { layout: 'single', slots: 1, label: 'Editorial', desc: 'Single hero frame' },
  'CLEAN MODERN': { layout: 'grid2x2', slots: 4, label: 'Clean Modern', desc: '2x2 grid layout' },
  COUPLE: { layout: 'sidebyside', slots: 4, label: 'Cute Couple', desc: 'Side-by-side couple strip' },
  KODAK: { layout: 'vertical', slots: 4, label: 'Kodak', desc: 'Kodak-inspired warm tones' },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATE_LAYOUTS);

export const STRIP_BACKGROUNDS: Record<string, string> = {
  CREAM: '#fafaf7',
  WHITE: '#ffffff',
  BLACK: '#1a1a1a',
  BLUSH: '#fce4ec',
  SAGE: '#e8f5e9',
  NAVY: '#1a237e',
  ROSE: '#fff0f3',
  KRAFT: '#d7ccc8',
  RED: '#c62828',
  BROWN: '#5d4037',
  PASTEL: '#e0f7fa',
  NEUTRAL: '#efebe9',
  DARK: '#263238',
  SOFT_PINK: '#f8bbd0',
};

export const STRIP_BORDERS: Record<string, string> = {
  NONE: 'none',
  THIN: '1px solid #c9c7c1',
  THICK: '4px solid #202125',
  DASHED: '2px dashed #95422e',
  DOUBLE: '3px double #202125',
  ROUNDED: '8px solid #202125',
  RUST: '3px solid #95422e',
  PINK: '3px solid #f48fb1',
};

export const TEXT_COLORS: Record<string, string> = {
  AUTO: '',
  DARK: '#202125',
  LIGHT: '#ffffff',
  RUST: '#95422e',
  PINK: '#e91e63',
  NAVY: '#1a237e',
  BROWN: '#5d4037',
};

export const ACCENT_COLORS: Record<string, string> = {
  NONE: '',
  RUST: '#95422e',
  GOLD: '#d4af37',
  PINK: '#e91e63',
  NAVY: '#1a237e',
  SAGE: '#66bb6a',
  RED: '#c62828',
};

export type StripSticker = {
  emoji: string;
  x: number;
  y: number;
  size: number;
};

export type StripCustomization = {
  template: string;
  background: string;
  border: string;
  textColor: string;
  accentColor: string;
  titleText: string;
  subtitleText: string;
  namesText: string;
  locationText: string;
  dateText: string;
  messageText: string;
  stickers: StripSticker[];
  filterKey: string;
  layout: string;
};

export const DEFAULT_CUSTOMIZATION: StripCustomization = {
  template: 'CLASSIC',
  background: 'CREAM',
  border: 'NONE',
  textColor: 'AUTO',
  accentColor: 'NONE',
  titleText: 'FLASHBACK STUDIO',
  subtitleText: '',
  namesText: '',
  locationText: '',
  dateText: '',
  messageText: '',
  stickers: [],
  filterKey: 'ORIGINAL',
  layout: 'vertical',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getLayoutPhotos(photos: string[], layout: string, maxSlots: number): string[] {
  const p = photos.slice(0, maxSlots);
  if (p.length === 0) return [];
  return p;
}

export async function generatePhotoStrip(
  photos: string[],
  customization: StripCustomization,
): Promise<string> {
  const layoutDef = TEMPLATE_LAYOUTS[customization.template] || TEMPLATE_LAYOUTS.CLASSIC;
  const maxSlots = layoutDef.slots;
  const usePhotos = getLayoutPhotos(photos, layoutDef.layout, maxSlots);
  if (usePhotos.length === 0) return '';
  const imgs = await Promise.all(usePhotos.map(loadImage));

  const layout = layoutDef.layout;
  const isCouple = layout === 'sidebyside';
  const isPolaroid = layout === 'polaroid';
  const isSingle = layout === 'single';
  const isGrid = layout === 'grid2x2';

  const STRIP_WIDTH = isCouple ? 680 : (isSingle ? 520 : 440);
  const PAD = isPolaroid ? 28 : 22;
  const POLAROID_BOTTOM = isPolaroid ? 60 : 0;
  const GAP = 8;
  const FOOTER = 80;
  const innerWidth = STRIP_WIDTH - PAD * 2;
  const bg = STRIP_BACKGROUNDS[customization.background] || '#fafaf7';
  const filterCss = TEMPLATE_FILTERS[customization.template] || 'none';
  const captureFilterCss = customization.filterKey !== 'ORIGINAL'
    ? (TEMPLATE_FILTERS[customization.template] ? 'none' : 'none')
    : 'none';

  let positions: { x: number; y: number; w: number; h: number; img: HTMLImageElement }[];
  let totalHeight: number;

  if (isSingle) {
    const photoHeight = Math.round(innerWidth * 1.25);
    positions = [{ x: PAD, y: PAD, w: innerWidth, h: photoHeight, img: imgs[0] }];
    totalHeight = PAD + photoHeight + FOOTER + PAD;
  } else if (isGrid && imgs.length >= 4) {
    const cellW = (innerWidth - GAP) / 2;
    const cellH = Math.round(cellW * 0.75);
    positions = imgs.slice(0, 4).map((img, i) => ({
      x: PAD + (i % 2) * (cellW + GAP),
      y: PAD + Math.floor(i / 2) * (cellH + GAP),
      w: cellW,
      h: cellH,
      img,
    }));
    totalHeight = PAD + 2 * cellH + GAP + FOOTER + PAD;
  } else if (isCouple) {
    const halfW = (innerWidth - GAP) / 2;
    const cellH = Math.round(halfW * 0.75);
    positions = [];
    for (let i = 0; i < imgs.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      positions.push({ x: PAD + col * (halfW + GAP), y: PAD + row * (cellH + GAP), w: halfW, h: cellH, img: imgs[i] });
    }
    const rows = Math.ceil(imgs.length / 2);
    totalHeight = PAD + rows * cellH + (rows - 1) * GAP + FOOTER + PAD;
  } else if (isPolaroid) {
    const photoHeight = Math.round(innerWidth * 0.8);
    positions = imgs.map((img, i) => ({
      x: PAD,
      y: PAD + i * (photoHeight + POLAROID_BOTTOM + GAP),
      w: innerWidth,
      h: photoHeight,
      img,
    }));
    totalHeight = PAD + imgs.length * (photoHeight + POLAROID_BOTTOM) + (imgs.length - 1) * GAP + FOOTER + PAD;
  } else {
    const photoHeight = Math.round(innerWidth * 0.75);
    positions = imgs.map((img, i) => ({
      x: PAD,
      y: PAD + i * (photoHeight + GAP),
      w: innerWidth,
      h: photoHeight,
      img,
    }));
    totalHeight = PAD + imgs.length * photoHeight + (imgs.length - 1) * GAP + FOOTER + PAD;
  }

  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);

  ctx.filter = filterCss;
  for (const pos of positions) {
    const img = pos.img;
    const imgRatio = img.width / img.height;
    const targetRatio = pos.w / pos.h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, pos.x, pos.y, pos.w, pos.h);
    if (isPolaroid) {
      ctx.fillStyle = bg;
      const bottomY = pos.y + pos.h;
      ctx.fillRect(pos.x, bottomY, pos.w, POLAROID_BOTTOM);
    }
  }
  ctx.filter = 'none';

  if (customization.template === '35MM FILM') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(210,180,120,0.2)';
    ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);
    ctx.globalCompositeOperation = 'source-over';
  } else if (customization.template === 'VINTAGE 70S' || customization.template === 'RETRO') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(200,150,80,0.3)';
    ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);
    ctx.globalCompositeOperation = 'source-over';
  }

  const isDarkBg = ['BLACK', 'NAVY', 'DARK', 'BROWN', 'RED'].includes(customization.background);
  const autoColor = isDarkBg ? '#ffffff' : '#202125';
  const textColor = customization.textColor === 'AUTO' ? autoColor : (TEXT_COLORS[customization.textColor] || autoColor);
  const accent = ACCENT_COLORS[customization.accentColor] || '';

  const lastPos = positions[positions.length - 1];
  const footerY = lastPos.y + lastPos.h + (isPolaroid ? POLAROID_BOTTOM : 0) + 16;

  ctx.textAlign = 'center';

  if (customization.titleText) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(customization.titleText, STRIP_WIDTH / 2, footerY);
  }

  let lineY = footerY + 16;

  if (accent) {
    ctx.fillStyle = accent;
    ctx.font = '10px monospace';
    ctx.fillText('\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014', STRIP_WIDTH / 2, lineY);
    lineY += 12;
  }

  ctx.font = '10px monospace';
  if (customization.namesText) {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(customization.namesText, STRIP_WIDTH / 2, lineY);
    lineY += 16;
  }

  ctx.font = '10px monospace';
  const metaParts: string[] = [];
  if (customization.locationText) metaParts.push(customization.locationText);
  const dateStr = customization.dateText || new Date().toLocaleDateString('en-US');
  if (dateStr) metaParts.push(dateStr);
  if (metaParts.length > 0) {
    ctx.fillStyle = textColor;
    ctx.fillText(metaParts.join('  /  '), STRIP_WIDTH / 2, lineY);
    lineY += 14;
  }

  if (customization.messageText) {
    ctx.fillStyle = textColor;
    ctx.font = 'italic 11px sans-serif';
    ctx.fillText(customization.messageText, STRIP_WIDTH / 2, lineY);
    lineY += 14;
  }

  if (customization.stickers.length > 0) {
    ctx.font = '24px serif';
    ctx.textAlign = 'left';
    for (const s of customization.stickers) {
      ctx.fillText(s.emoji, s.x * STRIP_WIDTH, s.y * totalHeight);
    }
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function generateCoupleStrip(
  hostPhotos: string[],
  partnerPhotos: string[],
  hostLabel: string,
  partnerLabel: string,
  customization: StripCustomization,
): Promise<string> {
  const allPhotos: string[] = [];
  const maxLen = Math.max(hostPhotos.length, partnerPhotos.length);
  for (let i = 0; i < maxLen; i++) {
    if (hostPhotos[i]) allPhotos.push(hostPhotos[i]);
    if (partnerPhotos[i]) allPhotos.push(partnerPhotos[i]);
  }
  const coupleCustom: StripCustomization = {
    ...customization,
    layout: 'sidebyside',
    titleText: customization.titleText || 'FLASHBACK STUDIO',
    namesText: customization.namesText || `${hostLabel} \u2665 ${partnerLabel}`,
    locationText: customization.locationText || `${hostLabel.split(' / ')[1] || hostLabel} \u00d7 ${partnerLabel.split(' / ')[1] || partnerLabel}`,
    messageText: customization.messageText || 'same booth, different places.',
  };
  return generatePhotoStrip(allPhotos, coupleCustom);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
