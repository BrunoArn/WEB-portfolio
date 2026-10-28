export type AtlasCategoryIndex = 0 | 1 | 2;
export type AtlasPoint = [number, number];

export interface AtlasAnchor {
  id: string;
  c: AtlasCategoryIndex;
  x: number;
  y: number;
  mx: number;
  my: number;
  left?: boolean;
}

export interface AtlasProject extends AtlasAnchor {
  placement: string;
  title: string;
  description?: string;
  categoryLabel: string;
  year?: number;
  image?: { src: string; alt: string };
  href?: string;
}

export interface AtlasContent {
  projects: AtlasProject[];
  unplaced: { id: string; title: string; href?: string }[];
  issues: string[];
}

export interface AtlasCategory { name: string; token: string }
export interface AtlasContour { path: AtlasPoint[]; closed: boolean }
export interface AtlasCurve { index: number; contour: AtlasContour }
