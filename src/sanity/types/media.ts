export interface SanityImageAsset {
  _ref: string;
}

export interface SanityFileAsset {
  _ref: string;
}

export interface SanityProjectImage {
  _type: "projectImage";

  image: {
    asset: SanityImageAsset;
  };

  alt: {
    pt: string;
    en: string;
  };
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