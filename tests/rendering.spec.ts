import { test, expect } from '@playwright/test';

test('filters alter exported pixels when canvas filters are unavailable', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const { COLOR_FILTERS, getFilterOverlay } = await import('/src/hooks/useFilters.ts');
    const { drawFilteredImage } = await import('/src/utils/canvasFilter.ts');
    const source = document.createElement('canvas'); source.width = 24; source.height = 24;
    const sourceCtx = source.getContext('2d')!;
    sourceCtx.fillStyle = '#a45c38'; sourceCtx.fillRect(0, 0, 12, 24);
    sourceCtx.fillStyle = '#2468af'; sourceCtx.fillRect(12, 0, 12, 24);
    const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'filter');
    delete (CanvasRenderingContext2D.prototype as Partial<CanvasRenderingContext2D>).filter;
    try {
      return COLOR_FILTERS.map(filter => {
        const canvas = document.createElement('canvas'); canvas.width = 24; canvas.height = 24;
        const ctx = canvas.getContext('2d')!;
        drawFilteredImage(ctx, source, filter.css, 0, 0, 24, 24, 0, 0, 24, 24);
        getFilterOverlay(filter.key)?.(ctx, canvas.width, canvas.height);
        return { key: filter.key, pixel: [...ctx.getImageData(5, 5, 1, 1).data], output: canvas.toDataURL() };
      });
    } finally { if (descriptor) Object.defineProperty(CanvasRenderingContext2D.prototype, 'filter', descriptor); }
  });
  const original = results.find(result => result.key === 'ORIGINAL')!;
  for (const result of results.filter(result => result.key !== 'ORIGINAL')) expect(result.output, result.key).not.toBe(original.output);
  const bw = results.find(result => result.key === 'BW')!.pixel;
  expect(bw[0]).toBe(bw[1]); expect(bw[1]).toBe(bw[2]);
});

test('every template renders its layout and retains colored photos without canvas filter support', async ({ page }) => {
  await page.goto('/');
  const layouts = await page.evaluate(async () => {
    const { generatePhotoStrip, TEMPLATE_LAYOUTS, DEFAULT_CUSTOMIZATION, TEMPLATE_STYLES } = await import('/src/utils/photoStrip.ts');
    const photos = ['#f04040', '#40cf40', '#4040f0', '#e0b030'].map(color => {
      const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 60;
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = color; ctx.fillRect(0, 0, 80, 60);
      return canvas.toDataURL();
    });
    const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'filter');
    delete (CanvasRenderingContext2D.prototype as Partial<CanvasRenderingContext2D>).filter;
    const results = [];
    try {
      for (const [template, def] of Object.entries(TEMPLATE_LAYOUTS)) {
        const src = await generatePhotoStrip(photos, { ...DEFAULT_CUSTOMIZATION, ...TEMPLATE_STYLES[template], template, layout: def.layout });
        const image = new Image(); image.src = src; await image.decode();
        results.push({ template, width: image.width, height: image.height, src });
      }
    } finally { if (descriptor) Object.defineProperty(CanvasRenderingContext2D.prototype, 'filter', descriptor); }
    return results;
  });
  for (const result of layouts) {
    expect(result.width, result.template).toBeGreaterThan(0); expect(result.height, result.template).toBeGreaterThan(0);
  }
  expect(new Set(layouts.map(result => result.src)).size).toBeGreaterThan(7);
  await page.setContent(`<main style="display:flex;flex-wrap:wrap;gap:20px;background:#ddd;padding:20px">${layouts.map(result => `<figure style="margin:0;width:180px"><figcaption>${result.template}</figcaption><img style="width:100%" src="${result.src}" /></figure>`).join('')}</main>`);
  await page.screenshot({ path: 'test-results/templates-fallback.png', fullPage: true });
});

test('session video fills the camera frame without the bottom gap', async ({ page }) => {
  await page.goto('/#preview');
  await expect(page.getByText('READY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start capture', exact: true }).click();
  for (const width of [1440, 1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.locator('.session-feed').evaluate(frame => {
      const container = frame.querySelector('.camera-feed-container')!;
      const video = frame.querySelector('video')!;
      return { inner: container.getBoundingClientRect().height, video: video.getBoundingClientRect().height };
    });
    expect(Math.abs(bounds.inner - bounds.video)).toBeLessThan(1);
    const height = await page.locator('.session-feed').evaluate(frame => {
      const style = getComputedStyle(frame);
      return frame.getBoundingClientRect().height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);
    });
    expect(Math.abs(height - bounds.video)).toBeLessThan(1);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/camera-fixed.png', fullPage: true });
});
