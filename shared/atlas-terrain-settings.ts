/** Shared editing contract for Studio, the server adapter and Canvas. */
export interface AtlasTerrainControls {
  amplitude: number;
  elongation: number;
  direction: number;
  connection: number;
  negativeSpace: number;
}
export interface AtlasTerrainSettings {
  desktop: AtlasTerrainControls;
  mobile: AtlasTerrainControls;
}
export const atlasTerrainReference: Readonly<AtlasTerrainControls> = Object.freeze({
  amplitude: 50, elongation: 50, direction: 0, connection: 50, negativeSpace: 50,
});
export const atlasTerrainControlKeys = ['amplitude', 'elongation', 'direction', 'connection', 'negativeSpace'] as const;
export function atlasTerrainLimits(key: keyof AtlasTerrainControls) {
  return key === 'direction' ? {min: -90, max: 90, step: 1} : {min: 0, max: 100, step: 1};
}
export function resolveAtlasTerrainControls(value?: Partial<AtlasTerrainControls> | null): AtlasTerrainControls {
  const result = {...atlasTerrainReference};
  for (const key of atlasTerrainControlKeys) {
    const number = value?.[key], {min, max} = atlasTerrainLimits(key);
    if (typeof number === 'number' && Number.isFinite(number) && number >= min && number <= max) result[key] = number;
  }
  return result;
}
export function resolveAtlasTerrainSettings(value?: {desktop?: Partial<AtlasTerrainControls>; mobile?: Partial<AtlasTerrainControls>} | null): AtlasTerrainSettings {
  return {desktop: resolveAtlasTerrainControls(value?.desktop), mobile: resolveAtlasTerrainControls(value?.mobile)};
}
