import type { LocalizedValue } from "@/content/adapters/localization";

export interface SanityImageAsset {
  _id: string;
  url: string;

  metadata: {
    dimensions: {
      width: number;
      height: number;
    } | null;
  } | null;
}

export interface SanityFileAsset {
  _id: string;
  url: string;
}

export interface SanityProjectImage {
  _type: "projectImage";

  image: {
    asset: SanityImageAsset;
  };

  alt: LocalizedValue;
}

export interface SanityProjectVideo {
  _type: "projectVideo";

  video: {
    asset: SanityFileAsset;
  };
}

export type SanityProjectMedia =
  | SanityProjectImage
  | SanityProjectVideo;