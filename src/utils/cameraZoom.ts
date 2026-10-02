export function zoomCrop(width: number, height: number, zoom: number, targetRatio = width / height) {
  const factor = Math.min(3, Math.max(1, zoom));
  const baseWidth = width / height > targetRatio ? height * targetRatio : width;
  const baseHeight = width / height > targetRatio ? height : width / targetRatio;
  const w = baseWidth / factor, h = baseHeight / factor;
  return { x: (width - w) / 2, y: (height - h) / 2, w, h };
}
