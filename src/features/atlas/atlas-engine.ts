import { createAtlasWebGL } from "./atlas-webgl";
import { atlasRasterResolution } from "./atlas-raster";
import { mountAtlasMotion } from "./atlas-motion";
import { createAtlasGeometryCache } from "./atlas-geometry-cache";
import { positionAtlasProjects, ribbonOutline } from "./atlas-geometry";
import { createAtlasColorField } from "./atlas-field";
import { getAtlasView, type AtlasBounds } from "./atlas-layout";
import { resolveAtlasTerrainSettings, type AtlasTerrainSettings } from "../../../shared/atlas-terrain-settings";
import type { AtlasMotionSettings } from "./atlas-motion-settings";
import type { AtlasAnchor, AtlasTerritory } from "./atlas-types";

type TerrainOptions = {
  staticFallback: boolean;
  onFallback: () => void;
  entrance?: boolean;
  onReady?: () => void;
};

type PreparedTerrain = {
  surfaceKey: string;
  meshKey: string;
  colorField?: { key: string; weightsAt: ReturnType<typeof createAtlasColorField> };
};

type ColorMapInput = {
  weightsAt: ReturnType<typeof createAtlasColorField>;
  width: number;
  height: number;
  screen: AtlasBounds;
  view: ReturnType<typeof getAtlasView>;
  territories: readonly AtlasTerritory[];
  clearing: { cx: number; cy: number; sx: number; sy: number };
};

/** Browser texture preparation; independent from geometry/cache decisions. */
function createAtlasColorMap({ weightsAt, width, height, screen, view, territories, clearing }: ColorMapInput) {
  const { world, scale, offsetX, offsetY } = view;
  const { cx, cy, sx, sy } = clearing;
  const colors = document.createElement("canvas");
  colors.width = Math.max(2, Math.ceil(width / 5));
  colors.height = Math.max(2, Math.ceil(height / 5));
  const paint = colors.getContext("2d")!;
  const pixels = paint.createImageData(colors.width, colors.height);
  const palette = territories.map(territory => [1, 3, 5].map(offset => parseInt(territory.color.slice(offset, offset + 2), 16)));
  const weights = Array<number>(territories.length).fill(0);
  for (let y = 0; y < colors.height; y++) {
    for (let x = 0; x < colors.width; x++) {
      const u = (screen.left + x / (colors.width - 1) * width - offsetX) / scale / world.width;
      const v = (screen.top + y / (colors.height - 1) * height - offsetY) / scale / world.height;
      weightsAt(u, v, weights);
      const i = (y * colors.width + x) * 4;
      let red = 0, green = 0, blue = 0;
      for (let category = 0; category < palette.length; category++) {
        const weight = weights[category], color = palette[category];
        red += weight * color[0];
        green += weight * color[1];
        blue += weight * color[2];
      }
      pixels.data[i] = palette.length ? Math.round(red) : 149;
      pixels.data[i + 1] = palette.length ? Math.round(green) : 163;
      pixels.data[i + 2] = palette.length ? Math.round(blue) : 155;
      pixels.data[i + 3] = Math.round(255 * (1 - .98 * Math.exp(-.5 * (((u - cx) / sx) ** 4 + ((v - cy) / sy) ** 4))));
    }
  }
  paint.putImageData(pixels, 0, 0);
  return colors;
}

/** Browser lifetime, canvas surface and renderer coordination for one scene. */
export function mountAtlasTerrain(
  canvas: HTMLCanvasElement,
  viewport: HTMLElement,
  intro: HTMLElement,
  projects: readonly AtlasAnchor[],
  territories: readonly AtlasTerritory[],
  mobileQuery: string,
  initialSettings: AtlasTerrainSettings,
  options: TerrainOptions,
) {
  const gpu = options.staticFallback ? null : createAtlasWebGL(canvas, options.onFallback);
  const ctx = options.staticFallback ? canvas.getContext("2d") : null;
  if (!ctx && !gpu) {
    if (options.staticFallback) queueMicrotask(() => options.onReady?.());
    return {
      entranceAt(_x: number, _y: number) { void _x; void _y; return 0; },
      setReveal(_progress: number) { void _progress; },
      dispose() {},
      extend(_bounds?: AtlasBounds, _zoom?: number) { void _bounds; void _zoom; },
      crop(_bounds?: AtlasBounds) { void _bounds; },
      setSettings(_settings: AtlasTerrainSettings) { void _settings; },
      setMotion(_value: AtlasMotionSettings) { void _value; },
      pulse(_id: string) { void _id; },
    };
  }

  canvas.dataset.renderer = gpu ? "webgl" : "static";
  canvas.dataset.motionActive = "false";
  let revealProgress = options.entrance ? 0 : 1;
  let ready = false;
  let render = () => {};
  const motion = gpu ? mountAtlasMotion(canvas, viewport, () => render()) : null;
  const media = window.matchMedia(mobileQuery);
  const geometry = createAtlasGeometryCache();
  // Surface identity includes raster/crop/text. Mesh identity excludes crop and
  // raster density: those updates must keep resident buffers and ongoing waves.
  // A stable color-field reader is replaced only when its inputs change.
  const prepared: PreparedTerrain = { surfaceKey: "", meshKey: "" };
  let disposed = false;
  let frame = 0;
  let extension: AtlasBounds | undefined;
  let rasterCrop: AtlasBounds | undefined;
  let rasterZoom = 1;
  let settings = resolveAtlasTerrainSettings(initialSettings);

  function draw() {
    frame = 0;
    if (disposed) return;
    const rectangle = viewport.getBoundingClientRect();
    const w = rectangle.width, h = rectangle.height;
    if (!w || !h) return;
    const mobile = media.matches;
    const positioned = positionAtlasProjects(projects, mobile);
    const view = getAtlasView(w, h, mobile);
    const { world, scale, offsetX, offsetY } = view;
    const domain = extension ?? { left: 0, top: 0, right: w, bottom: h };
    const screen = rasterCrop ?? domain;
    const width = screen.right - screen.left, height = screen.bottom - screen.top;
    const requestedBounds = {
      left: Math.min(view.bounds.left, (domain.left - offsetX) / scale - 48 / scale),
      top: Math.min(view.bounds.top, (domain.top - offsetY) / scale - 48 / scale),
      right: Math.max(view.bounds.right, (domain.right - offsetX) / scale + 48 / scale),
      bottom: Math.max(view.bounds.bottom, (domain.bottom - offsetY) / scale + 48 / scale),
    };
    const controls = settings[mobile ? "mobile" : "desktop"];
    const plan = geometry.describe({ width: world.width, height: world.height, projects: positioned, mobile, bounds: requestedBounds, controls, regions: settings.regions });
    const { bounds, key } = plan;
    const raster = atlasRasterResolution(width, height, window.devicePixelRatio || 1, rasterZoom);
    const dpr = raster.ratio;
    const text = intro.getBoundingClientRect();
    const cx = (text.left - rectangle.left + text.width / 2 - offsetX) / scale / world.width;
    const cy = (text.top - rectangle.top + text.height / 2 - offsetY) / scale / world.height;
    const sx = (text.width / 2 + 28) / scale / world.width;
    const sy = (text.height / 2 + 26) / scale / world.height;
    const surfaceKey = JSON.stringify([key, screen, scale, offsetX, offsetY, raster, rasterZoom, cx, cy, sx, sy]);
    if (surfaceKey === prepared.surfaceKey) return;

    const curves = geometry.prepare(plan, { resting: !extension });
    canvas.width = raster.pixelWidth;
    canvas.height = raster.pixelHeight;
    // The raster itself is never squeezed to a fractional CSS aspect ratio.
    canvas.style.width = canvas.width / dpr + "px";
    canvas.style.height = canvas.height / dpr + "px";
    canvas.style.left = screen.left + "px";
    canvas.style.top = screen.top + "px";

    const colorKey = JSON.stringify([plan.configKey, territories.map(territory => territory.id)]);
    if (prepared.colorField?.key !== colorKey) {
      prepared.colorField = { key: colorKey, weightsAt: createAtlasColorField(positioned, mobile, territories.map(territory => territory.id)) };
    }
    const colors = createAtlasColorMap({ width, height, screen, view, territories, clearing: { cx, cy, sx, sy }, weightsAt: prepared.colorField.weightsAt });

    if (gpu && motion) {
      const meshKey = JSON.stringify([key, scale, offsetX, offsetY, cx, cy, sx, sy]);
      const surface = { scale, x: offsetX - screen.left, y: offsetY - screen.top, width: canvas.width / dpr, height: canvas.height / dpr, pixelRatio: dpr };
      if (meshKey !== prepared.meshKey) {
        motion.configure(bounds, world, scale, screen.left, screen.top, offsetX, offsetY, positioned, { cx, cy, sx, sy });
        const ribbons = curves.map(curve => ({ index: curve.index, mesh: motion.prepare(ribbonOutline(curve, scale), curve.contour) }));
        gpu.prepare(ribbons, colors, motion, surface, revealProgress < 1);
        prepared.meshKey = meshKey;
      } else {
        motion.setScreen(screen.left, screen.top);
        gpu.updateSurface(colors, surface, revealProgress < 1);
      }
      render = () => gpu.paint(motion, revealProgress);
    } else if (ctx) {
      // Compatibility recovery draws the resting landscape without a motion loop.
      const paths = curves.map(curve => {
        const { index } = curve, points = ribbonOutline(curve, scale);
        const path = new Path2D();
        points.forEach(([x, y], i) => {
          if (i) path.lineTo(x, y);
          else path.moveTo(x, y);
        });
        path.closePath();
        return { index, path };
      });
      render = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (offsetX - screen.left), dpr * (offsetY - screen.top));
        ctx.fillStyle = "#fff";
        for (const { index, path } of paths) {
          ctx.globalAlpha = index % 4 === 0 ? .77 : .42;
          ctx.fill(path);
        }
        ctx.globalAlpha = 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(colors, 0, 0, width, height);
        ctx.globalCompositeOperation = "source-over";
      };
    }

    render();
    canvas.dataset.rasterZoom = String(rasterZoom);
    canvas.dataset.rasterRatio = String(dpr);
    canvas.dataset.rasterLimited = String(raster.limited);
    canvas.dataset.regionSources = String(settings.regions.filter(region => region[mobile ? "mobile" : "desktop"].enabled).length);
    canvas.dataset.terrainControls = JSON.stringify(controls);
    canvas.dataset.projectSources = String(projects.length);
    canvas.dataset.territories = String(territories.length);
    canvas.dataset.contours = String(curves.length);
    canvas.dataset.geometryBuilds = String(geometry.builds);
    canvas.dataset.worldWidth = String(world.width);
    canvas.dataset.worldHeight = String(world.height);
    canvas.dataset.worldScale = String(scale);
    canvas.dataset.worldOffsetX = String(offsetX);
    canvas.dataset.worldOffsetY = String(offsetY);
    prepared.surfaceKey = surfaceKey;
    if (!ready) {
      ready = true;
      options.onReady?.();
    }
  }

  function schedule() {
    if (!disposed && !frame) frame = requestAnimationFrame(draw);
  }
  const observer = new ResizeObserver(schedule);
  observer.observe(viewport);
  observer.observe(intro);
  window.addEventListener("resize", schedule);
  media.addEventListener("change", schedule);
  document.fonts.ready.then(schedule);
  schedule();

  return {
    entranceAt(x: number, y: number) {
      return gpu?.arrivalAt(x, y) ?? 0;
    },
    setReveal(progress: number) {
      revealProgress = Math.max(0, Math.min(1, progress));
      if (!disposed && !motion?.isRunning()) render();
    },
    setMotion(value: AtlasMotionSettings) {
      motion?.set(value);
    },
    pulse(id: string) {
      motion?.pulse(id);
    },
    setSettings(value: AtlasTerrainSettings) {
      settings = resolveAtlasTerrainSettings(value);
      schedule();
    },
    crop(bounds?: AtlasBounds) {
      rasterCrop = bounds;
      cancelAnimationFrame(frame);
      draw();
    },
    extend(bounds?: AtlasBounds, zoom = 1) {
      extension = bounds;
      rasterCrop = undefined;
      rasterZoom = zoom;
      cancelAnimationFrame(frame);
      draw();
    },
    dispose() {
      disposed = true;
      geometry.clear();
      prepared.surfaceKey = "";
      prepared.meshKey = "";
      prepared.colorField = undefined;
      motion?.dispose();
      gpu?.dispose();
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
    },
  };
}
