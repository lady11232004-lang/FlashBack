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
  FILM: { layout: 'vertical', slots: 4, label: 'Film', desc: 'Dark paper with film edges' },
  '35MM FILM': { layout: 'vertical', slots: 4, label: '35mm Film', desc: '35mm-inspired film border' },
  'VINTAGE 70S': { layout: 'vertical', slots: 4, label: 'Vintage 70s', desc: 'Warm paper and vintage border' },
  'DATE STAMP': { layout: 'vertical', slots: 4, label: 'Date Stamp', desc: 'Your photos with a date stamp' },
  POLAROID: { layout: 'polaroid', slots: 3, label: 'Polaroid', desc: '3-frame polaroid style' },
  RETRO: { layout: 'vertical', slots: 6, label: 'Retro', desc: '6-frame retro strip' },
  EDITORIAL: { layout: 'single', slots: 1, label: 'Editorial', desc: 'Single hero frame' },
  'CLEAN MODERN': { layout: 'grid2x2', slots: 4, label: 'Clean Modern', desc: '2x2 grid layout' },
  COUPLE: { layout: 'sidebyside', slots: 4, label: 'Cute Couple', desc: 'Side-by-side couple strip' },
  KODAK: { layout: 'vertical', slots: 4, label: 'Kodak', desc: 'Golden paper and photo border' },
};

export const TEMPLATE_STYLES: Record<string,{background:string;border:string;texture:string}> = { CLASSIC:{background:'CREAM',border:'NONE',texture:'NONE'},MINIMAL:{background:'WHITE',border:'THIN',texture:'NONE'},FILM:{background:'BLACK',border:'FILM_PERF',texture:'NONE'},'35MM FILM':{background:'CHARCOAL',border:'FILM_PERF',texture:'GRAIN'},'VINTAGE 70S':{background:'KRAFT',border:'VINTAGE',texture:'PAPER'},'DATE STAMP':{background:'SAND',border:'THIN',texture:'NONE'},POLAROID:{background:'WHITE',border:'NONE',texture:'PAPER'},RETRO:{background:'SOFT_PINK',border:'DOUBLE',texture:'NONE'},EDITORIAL:{background:'WHITE',border:'ELEGANT',texture:'NONE'},'CLEAN MODERN':{background:'PEARL',border:'NONE',texture:'NONE'},COUPLE:{background:'BLUSH',border:'ROUNDED',texture:'NONE'},KODAK:{background:'MUSTARD',border:'THICK',texture:'PAPER'} };

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
  CUSTOM: '4px solid #202125',
  SCALLOP: '6px solid #c6889b',
  LACE: '4px dotted #ffffff',
  POSTAGE: '5px dashed #ad7253',
  CHECKER: '6px solid #202125',
  CORNERS: '5px solid #5c7868',
};

export const STRIP_TEXTURES: Record<string, { label: string; overlay: string; opacity: number }> = {
  NONE: { label: 'None', overlay: '', opacity: 0 },
  PAPER: { label: 'Paper', overlay: 'paper', opacity: 0.15 },
  LINEN: { label: 'Linen', overlay: 'linen', opacity: 0.12 },
  GRAIN: { label: 'Grain', overlay: 'grain', opacity: 0.2 },
  VINTAGE: { label: 'Vintage', overlay: 'vintage', opacity: 0.25 },
  DOTS: { label: 'Dots', overlay: 'dots', opacity: 0.1 },
  NOISE: { label: 'Noise', overlay: 'noise', opacity: 0.15 },
  WASHED: { label: 'Washed', overlay: 'washed', opacity: 0.4 },
  GRID: { label: 'Journal Grid', overlay:'grid', opacity:.4 },
  STRIPES: { label: 'Stripes', overlay:'stripes', opacity:.4 },
  CONFETTI: { label: 'Confetti', overlay:'confetti', opacity:.6 },
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

export const STRIP_FONTS: Record<string,string> = { Sans: 'Arial, sans-serif', Serif: 'Georgia, serif', Mono: 'Courier New, monospace', Script: 'Apple Chancery, cursive', Handwritten: 'Comic Sans MS, cursive', Pacifico: 'Pacifico, cursive', Modern: 'DM Sans, Arial, sans-serif', Typewriter: 'DM Mono, monospace', Classic: 'Times New Roman, serif', Book: 'Palatino, Georgia, serif', Elegant: 'Baskerville, Georgia, serif', Rounded: 'Trebuchet MS, sans-serif', Bold: 'Impact, sans-serif', Clean: 'Verdana, sans-serif', Editorial: 'Garamond, Georgia, serif' };
export type StripCustomization = {
  textX?: number;
  textY?: number;
  textScale?: number;
  textureStrength?: number;
  borderColor?: string;
  borderWidth?: number;
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
  textureStrength: .6,
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
export function drawTexture(ctx: CanvasRenderingContext2D, texture: string, w: number, h: number, opacity: number) {
 if(texture==='NONE'||!texture||opacity<=0)return;
 ctx.save();ctx.globalAlpha=Math.min(1,opacity);const tile=document.createElement('canvas');tile.width=96;tile.height=96;const t=tile.getContext('2d')!;
 t.strokeStyle='#786b58';t.fillStyle='#786b58';t.lineWidth=1;
 if(['PAPER','GRAIN','NOISE'].includes(texture)) {let seed=83;for(let i=0;i<2200;i++){seed=(seed*16807)%2147483647;const x=seed%96;seed=(seed*16807)%2147483647;const y=seed%96;t.fillStyle=i%2?'#fffaf0':'#544b41';t.globalAlpha=texture==='PAPER'?.35:.7;t.fillRect(x,y,texture==='GRAIN'?2:1,texture==='PAPER'?3:1);}}
 else if(['LINEN','GRID','STRIPES'].includes(texture)){const gap=texture==='GRID'?24:texture==='LINEN'?4:12;for(let x=0;x<96;x+=gap){t.beginPath();t.moveTo(x,0);t.lineTo(x,96);t.stroke();}if(texture!=='STRIPES')for(let y=0;y<96;y+=gap){t.beginPath();t.moveTo(0,y);t.lineTo(96,y);t.stroke();}}
 else if(['DOTS','CONFETTI'].includes(texture)){for(let y=6;y<96;y+=16)for(let x=6;x<96;x+=16){t.fillStyle=texture==='CONFETTI'?['#cc708b','#657daa','#c5a34e'][(x+y)%3]:'#786b58';t.beginPath();t.arc(x,y,texture==='DOTS'?1.5:2.5,0,Math.PI*2);t.fill();}}
 else {const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,texture==='WASHED'?'#dbe9e5':'#b88d5d');g.addColorStop(.5,texture==='WASHED'?'#fffafa':'#fff4d0');g.addColorStop(1,texture==='WASHED'?'#e8ddec':'#ad8162');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.restore();return;}
 ctx.fillStyle=ctx.createPattern(tile,'repeat')!;ctx.fillRect(0,0,w,h);ctx.restore();
}

export function drawStripBorder(ctx:CanvasRenderingContext2D,style:string,color:string|undefined,width:number|undefined,w:number,h:number){
 const definition=STRIP_BORDERS[style];if(!definition||style==='NONE')return;
 const match=definition.match(/(\d+)px \w+ (#[\da-f]+)/i);if(!match)return;
 const thickness=Math.max(1,Math.min(18,width||Number(match[1]))),ink=color&&/^#[\da-f]{6}$/i.test(color)?color:match[2];ctx.save();ctx.strokeStyle=ink;ctx.fillStyle=ink;ctx.lineWidth=thickness;
 if(['DASHED','POSTAGE'].includes(style))ctx.setLineDash([thickness*3,thickness*2]);if(['DOTTED','LACE'].includes(style))ctx.setLineDash([1,thickness*2]);
 if(style==='ROUNDED'){ctx.beginPath();ctx.roundRect(thickness/2,thickness/2,w-thickness,h-thickness,Math.min(26,w/12));ctx.stroke();}
 else if(['INSET','GROOVE','RIDGE'].includes(style)){ctx.strokeRect(thickness/2,thickness/2,w-thickness,h-thickness);ctx.lineWidth=Math.max(1,thickness/2);ctx.strokeStyle=style==='RIDGE'?'#ffffffaa':'#00000066';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(0,0);ctx.lineTo(w,0);ctx.stroke();ctx.strokeStyle=style==='RIDGE'?'#00000066':'#ffffffaa';ctx.beginPath();ctx.moveTo(w,0);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.stroke();}
 else if(style==='FILM_PERF'){ctx.fillStyle='#f5efe3';for(let y=12;y<h-12;y+=24){ctx.fillRect(5,y,8,12);ctx.fillRect(w-13,y,8,12);}}
 else if(style==='SCALLOP'){for(let x=0;x<w;x+=16){ctx.beginPath();ctx.arc(x,0,8,0,Math.PI);ctx.fill();ctx.beginPath();ctx.arc(x,h,8,Math.PI,2*Math.PI);ctx.fill();}for(let y=0;y<h;y+=16){ctx.beginPath();ctx.arc(0,y,8,-Math.PI/2,Math.PI/2);ctx.fill();ctx.beginPath();ctx.arc(w,y,8,Math.PI/2,Math.PI*1.5);ctx.fill();}}
 else if(style==='CORNERS'){for(const [x,y] of [[0,0],[w,0],[0,h],[w,h]]){ctx.beginPath();ctx.moveTo(x===0?40:w-40,y);ctx.lineTo(x,y);ctx.lineTo(x,y===0?40:h-40);ctx.stroke();}}
 else if(style==='CHECKER'){for(let x=0;x<w;x+=12){ctx.fillRect(x,0,6,thickness);ctx.fillRect(x,h-thickness,6,thickness);}for(let y=0;y<h;y+=12){ctx.fillRect(0,y,thickness,6);ctx.fillRect(w-thickness,y,thickness,6);}}
 else {ctx.strokeRect(thickness/2,thickness/2,w-thickness,h-thickness);if(style==='DOUBLE'||style==='ELEGANT')ctx.strokeRect(thickness*2,thickness*2,w-thickness*4,h-thickness*4);}
 ctx.restore();
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
  const bg = frame?.color || (/^#[\da-f]{6}$/i.test(customization.background)?customization.background:STRIP_BACKGROUNDS[customization.background]) || '#fafaf7';
  const filterCss = 'none';

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

  const texDef = STRIP_TEXTURES[customization.texture];
  if(texDef)drawTexture(ctx,customization.texture,STRIP_WIDTH,totalHeight,customization.textureStrength ?? Math.max(.35,texDef.opacity));

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

  // Text rendering
  const hexBg=bg.replace('#','');
  const customDark=hexBg.length===6&&(parseInt(hexBg.slice(0,2),16)*.299+parseInt(hexBg.slice(2,4),16)*.587+parseInt(hexBg.slice(4,6),16)*.114)<140;
  const isDarkBg = customDark || ['BLACK', 'NAVY', 'DARK', 'BROWN', 'RED', 'BURGUNDY', 'OLIVE', 'CHARCOAL', 'FOREST', 'SLATE'].includes(customization.background);
  const autoColor = frame?.ink || (isDarkBg ? '#ffffff' : '#202125');
  const textColor = customization.textColor === 'AUTO' ? autoColor : (TEXT_COLORS[customization.textColor] || (/^#[\da-f]{6}$/i.test(customization.textColor)?customization.textColor:autoColor));
  const accent = ACCENT_COLORS[customization.accentColor] || (/^#[\da-f]{6}$/i.test(customization.accentColor)?customization.accentColor:'');

  const lastPos = positions[positions.length - 1];
  const footerY = lastPos.y + lastPos.h + (isPolaroid ? POLAROID_BOTTOM : 0) + 16;

  ctx.textAlign = 'center';
  const font = STRIP_FONTS[customization.fontFamily || 'Serif'] || STRIP_FONTS.Serif;
  if (customization.showText) {
  ctx.save();
  if(customization.textX!==undefined||customization.textY!==undefined){ctx.translate((customization.textX ?? .5)*STRIP_WIDTH-STRIP_WIDTH/2,(customization.textY ?? .85)*totalHeight-footerY);}
  const textScale=Math.max(.5,Math.min(3,customization.textScale || 1));ctx.translate(STRIP_WIDTH/2,footerY);ctx.scale(textScale,textScale);ctx.translate(-STRIP_WIDTH/2,-footerY);
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

  ctx.restore();
  }

  // Stickers
  if (customization.stickers.length > 0) {
    ctx.font = '24px serif';
    ctx.textAlign = 'left';
    for (const s of customization.stickers) {
      ctx.font=`${24*Math.max(.3,Math.min(4,s.size || 1))}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.emoji, s.x * STRIP_WIDTH, s.y * totalHeight);
    }
  }

  drawStripBorder(ctx,customization.border,customization.borderColor,customization.borderWidth,STRIP_WIDTH,totalHeight);
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
