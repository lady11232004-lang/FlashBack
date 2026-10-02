/** Apply the app's CSS filter operations when Canvas 2D filters are unavailable (Safari). */
export function applyPixelFilter(canvas: HTMLCanvasElement, css: string) {
  if (!css || css === 'none') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (const match of css.matchAll(/([\w-]+)\(([-\d.]+)(%|deg|px)?\)/g)) {
    const name = match[1];
    const value = Number(match[2]) / (match[3] === '%' ? 100 : 1);
    if (name === 'blur') {
      // Small, separable Gaussian blur with clamped edges, including subpixel radii.
      const radius = Math.ceil(value * 3);
      if (!radius) continue;
      const weights = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * value ** 2)));
      const sum = weights.reduce((a, b) => a + b, 0);
      const tmp = new Uint8ClampedArray(data.length);
      for (const horizontal of [true, false]) {
        const source = horizontal ? data : tmp;
        const target = horizontal ? tmp : data;
        for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          for (let channel = 0; channel < 4; channel++) {
            let total = 0;
            for (let offset = -radius; offset <= radius; offset++) {
              const sx = horizontal ? Math.min(canvas.width - 1, Math.max(0, x + offset)) : x;
              const sy = horizontal ? y : Math.min(canvas.height - 1, Math.max(0, y + offset));
              total += source[(sy * canvas.width + sx) * 4 + channel] * weights[offset + radius];
            }
            target[index + channel] = total / sum;
          }
        }
      }
      continue;
    }
    const angle = value * Math.PI / 180, cos = Math.cos(angle), sin = Math.sin(angle);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (name === 'brightness') { data[i] = r * value; data[i + 1] = g * value; data[i + 2] = b * value; }
      else if (name === 'contrast') { data[i] = (r - 127.5) * value + 127.5; data[i + 1] = (g - 127.5) * value + 127.5; data[i + 2] = (b - 127.5) * value + 127.5; }
      else if (name === 'grayscale' || name === 'saturate') {
        const saturation = name === 'grayscale' ? 1 - value : value;
        const gray = .2126 * r + .7152 * g + .0722 * b;
        data[i] = gray + saturation * (r - gray); data[i + 1] = gray + saturation * (g - gray); data[i + 2] = gray + saturation * (b - gray);
      } else if (name === 'sepia') {
        data[i] = r * (1 - value) + value * (.393 * r + .769 * g + .189 * b);
        data[i + 1] = g * (1 - value) + value * (.349 * r + .686 * g + .168 * b);
        data[i + 2] = b * (1 - value) + value * (.272 * r + .534 * g + .131 * b);
      } else if (name === 'hue-rotate') {
        data[i] = r * (.213 + cos * .787 - sin * .213) + g * (.715 - cos * .715 - sin * .715) + b * (.072 - cos * .072 + sin * .928);
        data[i + 1] = r * (.213 - cos * .213 + sin * .143) + g * (.715 + cos * .285 + sin * .140) + b * (.072 - cos * .072 - sin * .283);
        data[i + 2] = r * (.213 - cos * .213 - sin * .787) + g * (.715 - cos * .715 + sin * .715) + b * (.072 + cos * .928 + sin * .072);
      }
    }
  }
  ctx.putImageData(image, 0, 0);
}

export function drawFilteredImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, css: string, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
  const supportsNativeFilter = 'filter' in Object.getPrototypeOf(ctx);
  if (supportsNativeFilter) {
    ctx.save(); ctx.filter = css || 'none'; ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh); ctx.restore();
    return;
  }
  const layer = document.createElement('canvas');
  layer.width = Math.max(1, Math.round(dw)); layer.height = Math.max(1, Math.round(dh));
  const layerCtx = layer.getContext('2d');
  if (!layerCtx) throw new Error('Image rendering is unavailable in this browser.');
  layerCtx.drawImage(image, sx, sy, sw, sh, 0, 0, layer.width, layer.height);
  applyPixelFilter(layer, css);
  ctx.drawImage(layer, dx, dy, dw, dh);
}

export function applyFilmGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const pixels = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = ((Math.imul(i + 17, 2654435761) >>> 24) / 255 - .5) * 24;
    for (let channel = 0; channel < 3; channel++) pixels.data[i + channel] += noise;
  }
  ctx.putImageData(pixels, 0, 0);
}
