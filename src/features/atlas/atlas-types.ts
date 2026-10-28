export type AtlasCategoryIndex = 0 | 1 | 2;
export type AtlasPoint = [number, number];

export interface AtlasProject {
  id: string;
  title: { pt: string; en: string };
  c: AtlasCategoryIndex;
  x: number;
  y: number;
  mx: number;
  my: number;
  left?: boolean;
}

export interface AtlasCategory {
  name: string;
  token: string;
}

export interface AtlasContour {
  path: AtlasPoint[];
  closed: boolean;
}

export interface AtlasCurve {
  index: number;
  contour: AtlasContour;
}
