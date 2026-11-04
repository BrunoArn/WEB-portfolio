import { atlasExtensionHasNoContours, atlasGeometryConfigKey, buildAtlasRelief, containsAtlasBounds, type AtlasReliefCache } from "./atlas-geometry";
import type { AtlasCompositionRegion } from "../../../shared/atlas-composition-regions";
import type { AtlasTerrainControls } from "../../../shared/atlas-terrain-settings";
import type { AtlasAnchor, AtlasCurve } from "./atlas-types";
import type { AtlasBounds } from "./atlas-layout";

type GeometryRequest = {
  width: number;
  height: number;
  projects: readonly AtlasAnchor[];
  mobile: boolean;
  bounds: AtlasBounds;
  controls: AtlasTerrainControls;
  regions: readonly AtlasCompositionRegion[];
};

type GeometryPlan = GeometryRequest & { key: string; configKey: string };
type GeometryEntry = Pick<GeometryPlan, "key" | "configKey" | "bounds"> & { curves: AtlasCurve[] };

/** One mounted scene owns these bounded caches; no browser resources live here. */
export function createAtlasGeometryCache() {
  const samples: AtlasReliefCache = {};
  let current: GeometryEntry | undefined;
  let resting: GeometryEntry | undefined;
  let emptyCoverageKey = "";
  let builds = 0;

  // Resolve coverage before measuring/preparing the surface. This never builds
  // curves, so duplicate resize/font notifications can still exit cheaply.
  function describe(request: GeometryRequest): GeometryPlan {
    const { width, height, projects, mobile, controls, regions } = request;
    const configKey = atlasGeometryConfigKey(width, height, projects, mobile, controls, regions);
    let bounds = request.bounds;
    if (current && configKey === current.configKey && containsAtlasBounds(bounds, current.bounds) && !containsAtlasBounds(current.bounds, bounds)) {
      const coverageKey = JSON.stringify([current.key, bounds]);
      if (coverageKey === emptyCoverageKey || atlasExtensionHasNoContours(width, height, projects, mobile, current.bounds, bounds, controls, regions, samples)) {
        emptyCoverageKey = coverageKey;
        bounds = current.bounds;
      }
    }
    return { ...request, bounds, configKey, key: JSON.stringify([configKey, bounds]) };
  }

  function prepare(plan: GeometryPlan, options: { resting: boolean }): AtlasCurve[] {
    if (current?.key !== plan.key) {
      if (resting?.key === plan.key) {
        current = resting;
      } else {
        const { width, height, projects, mobile, bounds, controls, regions, key, configKey } = plan;
        const curves = buildAtlasRelief(width, height, projects, mobile, bounds, controls, regions, samples);
        current = { key, configKey, bounds, curves };
        builds++;
      }
    }
    if (options.resting) resting = current;
    return current.curves;
  }

  function clear() {
    samples.grid = undefined;
    current = undefined;
    resting = undefined;
    emptyCoverageKey = "";
    builds = 0;
  }

  return { describe, prepare, clear, get builds() { return builds; } };
}
