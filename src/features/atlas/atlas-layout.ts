/** Art-directed worlds. Viewport changes affect their camera, never their aspect. */
export const atlasWorlds = {
  desktop: {
    width: 1440, height: 790,
    terrain: { left: -180, top: -480, right: 1620, bottom: 900 },
  },
  mobile: {
    width: 390, height: 1160,
    terrain: { left: -260, top: -80, right: 650, bottom: 1240 },
  },
} as const;

export interface AtlasBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function getAtlasView(width: number, height: number, mobile: boolean) {
  const world = mobile ? atlasWorlds.mobile : atlasWorlds.desktop;
  // Mobile follows width with page scrolling; desktop fits the available window.
  const scale = mobile ? Math.min(1, width / world.width) : Math.min(width / world.width, height / world.height);
  const offsetX = (width - world.width * scale) / 2;
  // Keep the composition anchored to the lower edge of the available window.
  const offsetY = Math.max(0, height - world.height * scale);
  const guard = 48 / scale;
  const bounds: AtlasBounds = {
    left: Math.min(world.terrain.left, -offsetX / scale - guard),
    top: Math.min(world.terrain.top, -offsetY / scale - guard),
    right: Math.max(world.terrain.right, (width - offsetX) / scale + guard),
    bottom: Math.max(world.terrain.bottom, (height - offsetY) / scale + guard),
  };
  return { world, scale, offsetX, offsetY, bounds };
}
