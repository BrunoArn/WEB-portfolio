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

function projectAtlas(width: number, height: number, mobile: boolean, minimumScale: number) {
  const world = mobile ? atlasWorlds.mobile : atlasWorlds.desktop;
  // Mobile follows width with page scrolling; desktop fits the available window.
  const fitScale = mobile ? Math.min(1, width / world.width) : Math.min(width / world.width, height / world.height);
  const scale = mobile ? fitScale : Math.max(fitScale, minimumScale);
  const projectedWidth = world.width * scale;
  const projectedHeight = world.height * scale;
  const offsetX = (width - projectedWidth) / 2;
  // Mobile scrolls from the top; extra terrain below must not move its markers.
  // Desktop keeps the composition anchored to the lower edge of the window.
  const offsetY = mobile ? 0 : Math.max(0, height - projectedHeight);
  // Plane overflow only. Camera limits will also need to include labels and focus clearance.
  const overflowX = scale > width / world.width ? projectedWidth - width : 0;
  const overflowY = scale > height / world.height ? projectedHeight - height : 0;
  const guard = 48 / scale;
  const bounds: AtlasBounds = {
    left: Math.min(world.terrain.left, -offsetX / scale - guard),
    top: Math.min(world.terrain.top, -offsetY / scale - guard),
    right: Math.max(world.terrain.right, (width - offsetX) / scale + guard),
    bottom: Math.max(world.terrain.bottom, (height - offsetY) / scale + guard),
  };
  return { world, fitScale, scale, offsetX, offsetY, projectedWidth, projectedHeight, overflowX, overflowY, bounds };
}

export function getAtlasView(width: number, height: number, mobile: boolean) {
  return projectAtlas(width, height, mobile, 0);
}

/** Candidate for future pan. windowHeight matches the CSS media query, not the map viewport. */
export function getAtlasAdaptiveView(width: number, height: number, mobile: boolean, windowHeight: number) {
  const minimumScale = windowHeight <= 700 ? .70 : .875;
  return projectAtlas(width, height, mobile, minimumScale);
}
