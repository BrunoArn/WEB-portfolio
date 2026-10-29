export type AtlasPoint = [number, number];

export interface AtlasAnchor {
  id: string;
  c: string;
  x: number;
  y: number;
  mx: number;
  my: number;
  influence: number;
  left?: boolean;
}

export interface AtlasProject extends AtlasAnchor {
  placement: string;
  color: string;
  title: string;
  description?: string;
  categoryLabel: string;
  year?: number;
  image?: { src: string; alt: string };
  href?: string;
}

export interface AtlasTerritory {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  mx: number;
  my: number;
}

export interface AtlasContent {
  projects: AtlasProject[];
  territories: AtlasTerritory[];
  unplaced: { id: string; title: string; href?: string }[];
  issues: string[];
}

export interface AtlasContour { path: AtlasPoint[]; closed: boolean }
export interface AtlasCurve { index: number; contour: AtlasContour }
