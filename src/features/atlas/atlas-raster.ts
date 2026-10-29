/** Bound the backing surface while reserving pixel density for the whole camera transition. */
export function atlasRasterResolution(width: number, height: number, deviceRatio: number, zoom = 1) {
  const base = Number.isFinite(deviceRatio) && deviceRatio > 0 ? Math.min(deviceRatio,2) : 1;
  const camera = Number.isFinite(zoom) ? Math.max(1,zoom) : 1;
  const requested = base*camera;
  const maxPixels = 24_000_000, maxSide = 8192;
  const ratio = Math.min(requested,Math.sqrt(maxPixels/((width+1)*(height+1))),(maxSide-1)/width,(maxSide-1)/height);
  return {ratio,requested,limited:ratio<requested,pixelWidth:Math.ceil(width*ratio),pixelHeight:Math.ceil(height*ratio)};
}
