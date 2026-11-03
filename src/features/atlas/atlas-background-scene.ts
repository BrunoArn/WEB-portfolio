import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { buildAtlasRelief, positionAtlasProjects, ribbonOutline } from "./atlas-engine";
import { createAtlasColorField } from "./atlas-field";
import { atlasWorlds } from "./atlas-layout";
import type { AtlasAnchor, AtlasContent, AtlasPoint, AtlasTerritory } from "./atlas-types";

type SceneInput = {
    projects: AtlasAnchor[];
    territories: AtlasTerritory[];
    terrain: AtlasContent["terrain"];
    mobile: boolean;
};

export type AtlasBackgroundScene = {
    id: string;
    width: number;
    height: number;
    bounds: { left: number; top: number; right: number; bottom: number };
    geometryHash: string;
    paths: { d: string; opacity: number }[];
    palette: string;
};

// Share geometry between pages/locales/project cameras. The input key changes when
// published Atlas data changes; the bounded cache adds no extra stale period.
const scenes = new Map<string, Promise<AtlasBackgroundScene>>();

/** Drop redundant polygon vertices with a bounded error below one world-unit pixel.
 * The source ribbons remain unchanged; this only compacts their SVG representation. */
export function simplifyAtlasOutline(points: readonly AtlasPoint[], tolerance = .25): AtlasPoint[] {
    if (points.length < 3) return [...points];
    const keep = new Uint8Array(points.length);
    const pending = [0, points.length - 1];
    keep[0] = keep[points.length - 1] = 1;
    while (pending.length) {
        const last = pending.pop()!, first = pending.pop()!;
        const [ax, ay] = points[first], [bx, by] = points[last];
        const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
        let furthest = -1, distance = tolerance * tolerance;
        for (let i = first + 1; i < last; i++) {
            const [x, y] = points[i];
            const t = length ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)) : 0;
            const squared = (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2;
            if (squared > distance) { distance = squared; furthest = i; }
        }
        if (furthest !== -1) {
            keep[furthest] = 1;
            pending.push(first, furthest, furthest, last);
        }
    }
    return points.filter((_, index) => keep[index]);
}

export function getAtlasBackgroundScene(input: SceneInput): Promise<AtlasBackgroundScene> {
    const key = JSON.stringify([input.mobile, input.projects, input.territories.map(({ id, color }) => ({ id, color })), input.terrain]);
    const existing = scenes.get(key);
    if (existing) return existing;

    const result = buildScene(input, createHash("sha256").update(key).digest("hex").slice(0, 16));
    scenes.set(key, result);
    if (scenes.size > 4) scenes.delete(scenes.keys().next().value!);
    void result.catch(() => { if (scenes.get(key) === result) scenes.delete(key); });
    return result;
}

async function buildScene({ projects, territories, terrain, mobile }: SceneInput, id: string): Promise<AtlasBackgroundScene> {
    const world = mobile ? atlasWorlds.mobile : atlasWorlds.desktop;
    const positioned = positionAtlasProjects(projects, mobile);
    // Include the surrounding resting field for wide, tall and zoomed views.
    const domain = {
        left: Math.min(world.terrain.left, -world.width * 2),
        top: Math.min(world.terrain.top, -world.height),
        right: Math.max(world.terrain.right, world.width * 3),
        bottom: Math.max(world.terrain.bottom, world.height * 2),
    };
    const curves = buildAtlasRelief(world.width, world.height, positioned, mobile, domain, terrain[mobile ? "mobile" : "desktop"], terrain.regions);
    const bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    const paths = curves.map(curve => {
        const points = simplifyAtlasOutline(ribbonOutline(curve, 1));
        for (const [x, y] of points) {
            bounds.left = Math.min(bounds.left, x);
            bounds.top = Math.min(bounds.top, y);
            bounds.right = Math.max(bounds.right, x);
            bounds.bottom = Math.max(bounds.bottom, y);
        }
        let previousX = 0, previousY = 0;
        const commands = points.map(([x, y], index) => {
            const roundedX = Math.round(x * 10), roundedY = Math.round(y * 10);
            const command = index ? `${(roundedX - previousX) / 10},${(roundedY - previousY) / 10}` : `${roundedX / 10},${roundedY / 10}l`;
            previousX = roundedX;
            previousY = roundedY;
            return command;
        });
        return {
            d: "M" + commands.join(" ") + "Z",
            opacity: curve.index % 4 === 0 ? .77 : .42,
        };
    });
    if (!paths.length) Object.assign(bounds, { left: 0, top: 0, right: world.width, bottom: world.height });
    bounds.left = Math.floor(bounds.left - 2);
    bounds.top = Math.floor(bounds.top - 2);
    bounds.right = Math.ceil(bounds.right + 2);
    bounds.bottom = Math.ceil(bounds.bottom + 2);

    // The same color field as Canvas, prepared once as a small inline palette.
    const width = Math.max(2, Math.ceil((bounds.right - bounds.left) / 20));
    const height = Math.max(2, Math.ceil((bounds.bottom - bounds.top) / 20));
    const pixels = Buffer.alloc(width * height * 4);
    const colors = territories.map(territory => [1, 3, 5].map(offset => parseInt(territory.color.slice(offset, offset + 2), 16)));
    const weightsAt = createAtlasColorField(positioned, mobile, territories.map(territory => territory.id));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const u = (bounds.left + x / (width - 1) * (bounds.right - bounds.left)) / world.width;
        const v = (bounds.top + y / (height - 1) * (bounds.bottom - bounds.top)) / world.height;
        const weights = weightsAt(u, v);
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) pixels[offset + channel] = colors.length
            ? Math.round(weights.reduce((sum, value, category) => sum + value * colors[category][channel], 0))
            : [149, 163, 155][channel];
        pixels[offset + 3] = 255;
    }
    const palette = await sharp(pixels, { raw: { width, height, channels: 4 } }).png().toBuffer();
    return { id, width: world.width, height: world.height, bounds, geometryHash: createHash("sha256").update(paths.map(p => p.d).join("")).digest("hex"), paths, palette: `data:image/png;base64,${palette.toString("base64")}` };
}
