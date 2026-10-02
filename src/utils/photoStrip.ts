import { FRAME_PRESETS, drawFrameDecoration } from './frames';
import { drawFilteredImage } from './canvasFilter';
export const TEMPLATE_FILTERS: Record<string, string> = {
  CLASSIC: 'none',
  MINIMAL: 'none',
  FILM: 'contrast(1.2) saturate(0.85) brightness(0.95) sepia(0.15)',
  '35MM FILM': 'sepia(0.4) contrast(1.1) brightness(1.05)',
  'VINTAGE 70S': 'sepia(0.6) saturate(1.4) contrast(0.95)',
  'DATE STAMP': 'none',
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
  'DATE STAMP': { layout: 'vertical', slots: 4, label: 'Date Stamp', desc: 'Your photos with a date stamp' },
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
  LAVENDER: '#ede7f6',
  MINT: '#e0f2f1',
  SAND: '#f5e6d3',
  TERRACOTTA: '#e67d65',
  OLIVE: '#556b2f',
  BURGUNDY: '#6a1b3a',
  CHARCOAL: '#36454f',
  PEARL: '#f0f0e8',
  MUSTARD: '#e6c900',
  DUSTY_ROSE: '#d4a5a5',
  FOREST: '#2e4b3a',
  CORAL: '#ff7f6b',
  SLATE: '#708090',
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
  INSET: '4px inset #8d8d8d',
  GROOVE: '4px groove #95422e',
  RIDGE: '4px ridge #202125',
  DOTTED: '3px dotted #5d5b56',
  GOLD: '3px solid #d4af37',
  VINTAGE: '6px solid #d7ccc8',
  FILM_PERF: '2px solid #333',
  BRUSHED: '3px solid #b8a88a',
  ELEGANT: '2px solid #202125',
  FRAMED: '5px solid #5d4037',
  NEON: '2px solid #e91e63',
};

export const STRIP_TEXTURES: Record<string, { label: string; overlay: string; opacity: number }> = {
  NONE: { label: 'None', overlay: '', opacity: 0 },
  PAPER: { label: 'Paper', overlay: 'paper', opacity: 0.15 },
  LINEN: { label: 'Linen', overlay: 'linen', opacity: 0.12 },
  GRAIN: { label: 'Grain', overlay: 'grain', opacity: 0.2 },
  VINTAGE: { label: 'Vintage', overlay: 'vintage', opacity: 0.25 },
  DOTS: { label: 'Dots', overlay: 'dots', opacity: 0.1 },
  NOISE: { label: 'Noise', overlay: 'noise', opacity: 0.15 },
  WASHED: { label: 'Washed', overlay: 'washed', opacity: 0.18 },
};

export const TEXT_COLORS: Record<string, string> = {
  AUTO: '',
  DARK: '#202125',
  LIGHT: '#ffffff',
  RUST: '#95422e',
  PINK: '#e91e63',
  NAVY: '#1a237e',
  BROWN: '#5d4037',
  GOLD: '#d4af37',
  SAGE: '#66bb6a',
};

export const ACCENT_COLORS: Record<string, string> = {
  NONE: '',
  RUST: '#95422e',
  GOLD: '#d4af37',
  PINK: '#e91e63',
  NAVY: '#1a237e',
  SAGE: '#66bb6a',
  RED: '#c62828',
  CORAL: '#ff7f6b',
  LAVENDER: '#9c7bb5',
};

export type StripSticker = {
  emoji: string;
  x: number;
  y: number;
  size: number;
};

export type StripOrientation = 'portrait' | 'landscape';

export const STRIP_FONTS: Record<string,string> = { Sans: 'Arial, sans-serif', Serif: 'Georgia, serif', Mono: 'Courier New, monospace', Script: 'Apple Chancery, cursive', Handwritten: 'Comic Sans MS, cursive' };
export type StripCustomization = {
  showText?: boolean;
  showThemeLabels?: boolean;
  fontFamily?: string;
  template: string;
  frameId?: string;
  room?: string;
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
  orientation: StripOrientation;
  texture: string;
};

export const DEFAULT_CUSTOMIZATION: StripCustomization = {
  template: 'CLASSIC',
  frameId: '',
  room: 'classic',
  background: 'CREAM',
  border: 'NONE',
  textColor: 'AUTO',
  accentColor: 'NONE',
  showText: false,
  showThemeLabels: false,
  fontFamily: 'Serif',
  titleText: '',
  subtitleText: '',
  namesText: '',
  locationText: '',
  dateText: '',
  messageText: '',
  stickers: [],
  filterKey: 'ORIGINAL',
  layout: 'vertical',
  orientation: 'portrait',
  texture: 'NONE',
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

function getLayoutPhotos(photos: string[], maxSlots: number): string[] {
  const p = photos.slice(0, maxSlots);
  if (p.length === 0) return [];
  return p;
}

// Draw texture overlays on the strip
function drawTexture(ctx: CanvasRenderingContext2D, texture: string, w: number, h: number, opacity: number) {
  if (!texture || texture === 'NONE' || opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  if (texture === 'PAPER' || texture === 'GRAIN' || texture === 'NOISE') {
    // Random noise/grain pattern
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = Math.random() * 40 - 20;
      d[i] = n > 0 ? n : 0;
      d[i + 1] = n > 0 ? n : 0;
      d[i + 2] = n > 0 ? n : 0;
      d[i + 3] = Math.abs(n) * 2;
    }
    // Use a temp canvas to draw the noise
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    if (tctx) {
      tctx.putImageData(imgData, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(tmp, 0, 0);
    }
  } else if (texture === 'LINEN') {
    // Cross-hatch linen pattern
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (texture === 'VINTAGE' || texture === 'WASHED') {
    // Vintage warm overlay with vignette
    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, 'rgba(180,140,80,0)');
    grad.addColorStop(1, 'rgba(120,80,40,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (texture === 'DOTS') {
    // Dot pattern
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    const spacing = 8;
    for (let y = 0; y < h; y += spacing) {
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export async function generatePhotoStrip(
  photos: string[],
  customization: StripCustomization,
): Promise<string> {
  const layoutDef = TEMPLATE_LAYOUTS[customization.template] || TEMPLATE_LAYOUTS.CLASSIC;
  const maxSlots = layoutDef.slots;
  const layout = customization.layout || layoutDef.layout;
  const usePhotos = getLayoutPhotos(photos, layout === 'single' ? 1 : Math.max(maxSlots, photos.length));
  if (usePhotos.length === 0) return '';
  const imgs = await Promise.all(usePhotos.map(loadImage));

  const isCouple = layout === 'sidebyside';
  const isPolaroid = layout === 'polaroid';
  const isSingle = layout === 'single';
  const isGrid = layout === 'grid2x2';
  const isLandscape = customization.orientation === 'landscape';

  // Base dimensions differ by orientation
  const PORTRAIT_WIDTH = isCouple ? 680 : (isSingle ? 520 : 440);
  const LANDSCAPE_WIDTH = isSingle ? 720 : (isGrid ? 720 : 680);
  const STRIP_WIDTH = isLandscape ? LANDSCAPE_WIDTH : PORTRAIT_WIDTH;
  const frame = FRAME_PRESETS.find(frame => frame.id === customization.frameId);
  const PAD = frame && ['Signature','Portrait'].includes(frame.category) ? 48 : isPolaroid ? 28 : 22;
  const POLAROID_BOTTOM = isPolaroid ? 60 : 0;
  const GAP = frame && ['Signature','Portrait'].includes(frame.category) ? 16 : customization.template === 'MINIMAL' ? 18 : 8;
  const FOOTER = customization.showText ? 112 : 28;
  const innerWidth = STRIP_WIDTH - PAD * 2;
  const bg = frame?.color || STRIP_BACKGROUNDS[customization.background] || '#fafaf7';
  const filterCss = TEMPLATE_FILTERS[customization.template] || 'none';

  // Photo aspect ratio changes with orientation
  // Portrait: 3:4 (taller), Landscape: 4:3 (wider)

  let positions: { x: number; y: number; w: number; h: number; img: HTMLImageElement }[];
  let totalHeight: number;

  if (isSingle) {
    // Single hero frame - aspect ratio depends on orientation
    const photoHeight = isLandscape
      ? Math.round(innerWidth * 0.6)
      : Math.round(innerWidth * 1.25);
    positions = [{ x: PAD, y: PAD, w: innerWidth, h: photoHeight, img: imgs[0] }];
    totalHeight = PAD + photoHeight + FOOTER + PAD;
  } else if (isGrid) {
    const cellW = (innerWidth - GAP) / 2;
    const cellH = isLandscape ? Math.round(cellW * 0.65) : Math.round(cellW * 0.75);
    positions = imgs.map((img, i) => ({
      x: PAD + (i % 2) * (cellW + GAP),
      y: PAD + Math.floor(i / 2) * (cellH + GAP),
      w: cellW,
      h: cellH,
      img,
    }));
    const rows = Math.ceil(imgs.length / 2);
    totalHeight = PAD + rows * cellH + (rows - 1) * GAP + FOOTER + PAD;
  } else if (isCouple) {
    const halfW = (innerWidth - GAP) / 2;
    const cellH = isLandscape ? Math.round(halfW * 0.65) : Math.round(halfW * 0.75);
    positions = [];
    for (let i = 0; i < imgs.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      positions.push({ x: PAD + col * (halfW + GAP), y: PAD + row * (cellH + GAP), w: halfW, h: cellH, img: imgs[i] });
    }
    const rows = Math.ceil(imgs.length / 2);
    totalHeight = PAD + rows * cellH + (rows - 1) * GAP + FOOTER + PAD;
  } else if (isLandscape) {
    const photoWidth = (innerWidth - (imgs.length - 1) * GAP) / imgs.length;
    const photoHeight = Math.round(photoWidth * 0.75);
    positions = imgs.map((img, i) => ({ x: PAD + i * (photoWidth + GAP), y: PAD, w: photoWidth, h: photoHeight, img }));
    totalHeight = PAD + photoHeight + (isPolaroid ? POLAROID_BOTTOM : 0) + FOOTER + PAD;
  } else if (isPolaroid) {
    const photoHeight = Math.round(innerWidth * 0.8);
    positions = imgs.map((img, i) => ({ x: PAD, y: PAD + i * (photoHeight + POLAROID_BOTTOM + GAP), w: innerWidth, h: photoHeight, img }));
    totalHeight = PAD + imgs.length * (photoHeight + POLAROID_BOTTOM) + (imgs.length - 1) * GAP + FOOTER + PAD;
  } else {
    const photoHeight = Math.round(innerWidth * 0.75);
    positions = imgs.map((img, i) => ({ x: PAD, y: PAD + i * (photoHeight + GAP), w: innerWidth, h: photoHeight, img }));
    totalHeight = PAD + imgs.length * photoHeight + (imgs.length - 1) * GAP + FOOTER + PAD;
  }

  const canvas = document.createElement('canvas');
  canvas.width = STRIP_WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fill background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STRIP_WIDTH, totalHeight);
  drawFrameDecoration(ctx, customization.frameId, STRIP_WIDTH, totalHeight, PAD, Boolean(customization.showText && customization.showThemeLabels), STRIP_FONTS[customization.fontFamily || 'Serif'] || STRIP_FONTS.Serif);

  // Draw photos with filter
  for (const pos of positions) {
    const img = pos.img;
    const imgRatio = img.width / img.height;
    const targetRatio = pos.w / pos.h;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    // Cover crop - center the image
    if (imgRatio > targetRatio) {
      sw = img.height * targetRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / targetRatio;
      sy = (img.height - sh) / 2;
    }
    drawFilteredImage(ctx, img, filterCss, sx, sy, sw, sh, pos.x, pos.y, pos.w, pos.h);

    // Polaroid bottom gap
    if (isPolaroid) {
      ctx.fillStyle = bg;
      const bottomY = pos.y + pos.h;
      ctx.fillRect(pos.x, bottomY, pos.w, POLAROID_BOTTOM);
    }
  }

  // Template-specific color overlays
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

  if (customization.template === '35MM FILM') drawTexture(ctx, 'GRAIN', STRIP_WIDTH, totalHeight, 0.35);

  // Draw texture overlay
  const texDef = STRIP_TEXTURES[customization.texture];
  if (texDef && texDef.opacity > 0) {
    drawTexture(ctx, customization.texture, STRIP_WIDTH, totalHeight, texDef.opacity);
  }

  // Text rendering
  const isDarkBg = ['BLACK', 'NAVY', 'DARK', 'BROWN', 'RED', 'BURGUNDY', 'OLIVE', 'CHARCOAL', 'FOREST', 'SLATE'].includes(customization.background);
  const autoColor = frame?.ink || (isDarkBg ? '#ffffff' : '#202125');
  const textColor = customization.textColor === 'AUTO' ? autoColor : (TEXT_COLORS[customization.textColor] || autoColor);
  const accent = ACCENT_COLORS[customization.accentColor] || '';

  const lastPos = positions[positions.length - 1];
  const footerY = lastPos.y + lastPos.h + (isPolaroid ? POLAROID_BOTTOM : 0) + 16;

  ctx.textAlign = 'center';
  const font = STRIP_FONTS[customization.fontFamily || 'Serif'] || STRIP_FONTS.Serif;
  if (customization.showText) {
  if (customization.titleText) {
    ctx.fillStyle = textColor;
    ctx.font = `bold 13px ${font}`;
    ctx.fillText(customization.titleText, STRIP_WIDTH / 2, footerY, innerWidth);
  }

  let lineY = footerY + 16;

  if (accent) {
    ctx.fillStyle = accent;
    ctx.font = `10px ${font}`;
    ctx.fillText('\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014\u2014', STRIP_WIDTH / 2, lineY);
    lineY += 12;
  }

  ctx.font = `10px ${font}`;
  if (customization.namesText) {
    ctx.fillStyle = textColor;
    ctx.font = `bold 12px ${font}`;
    ctx.fillText(customization.namesText, STRIP_WIDTH / 2, lineY, innerWidth);
    lineY += 16;
  }

  ctx.font = `10px ${font}`;
  const metaParts: string[] = [];
  if (customization.locationText) metaParts.push(customization.locationText);
  const dateStr = customization.dateText;
  if (dateStr) metaParts.push(dateStr);
  if (metaParts.length > 0) {
    ctx.fillStyle = textColor;
    ctx.fillText(metaParts.join('  /  '), STRIP_WIDTH / 2, lineY, innerWidth);
    lineY += 14;
  }

  if (customization.messageText) {
    ctx.fillStyle = textColor;
    ctx.font = `italic 11px ${font}`;
    ctx.fillText(customization.messageText, STRIP_WIDTH / 2, lineY, innerWidth);
    lineY += 14;
  }

  if (frame?.mark && customization.showThemeLabels) { ctx.fillStyle = textColor; ctx.font = `bold 10px ${font}`; ctx.fillText(frame.mark, STRIP_WIDTH / 2, totalHeight - 18, innerWidth); }

  }

  // Stickers
  if (customization.stickers.length > 0) {
    ctx.font = '24px serif';
    ctx.textAlign = 'left';
    for (const s of customization.stickers) {
      ctx.fillText(s.emoji, s.x * STRIP_WIDTH, s.y * totalHeight);
    }
  }

  // Render the chosen border into the exported image, not just the preview.
  const border = STRIP_BORDERS[customization.border];
  if (border && border !== 'none') {
    const match = border.match(/(\d+)px \w+ (#[\da-f]+)/i);
    if (match) {
      const width = Number(match[1]); ctx.strokeStyle = match[2]; ctx.lineWidth = width;
      if (customization.border === 'DASHED') ctx.setLineDash([width * 4, width * 3]);
      if (customization.border === 'DOTTED') ctx.setLineDash([width, width * 2]);
      ctx.strokeRect(width / 2, width / 2, STRIP_WIDTH - width, totalHeight - width);
      if (customization.border === 'DOUBLE') ctx.strokeRect(width * 2, width * 2, STRIP_WIDTH - width * 4, totalHeight - width * 4);
      ctx.setLineDash([]);
    }
  }
  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function generateCoupleStrip(
  hostPhotos: string[],
  partnerPhotos: string[],
  _hostLabel: string,
  _partnerLabel: string,
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
    layout: customization.template === 'COUPLE' ? 'sidebyside' : customization.layout,
    titleText: customization.titleText,
    namesText: customization.namesText,
    locationText: customization.locationText,
    messageText: customization.messageText,
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

/** Contain the full strip inside a standard story canvas; never crop a face or decoration. */
export async function generateStory(dataUrl: string, background = '#f3eee6'): Promise<string> {
  const img = await loadImage(dataUrl); const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image export is unavailable.');
  ctx.fillStyle=background;ctx.fillRect(0,0,1080,1920);
  const scale=Math.min(940/img.width,1740/img.height),width=img.width*scale,height=img.height*scale;
  ctx.drawImage(img,(1080-width)/2,(1920-height)/2,width,height);return canvas.toDataURL('image/jpeg',.95);
}
