import type {
  ProjectImage,
  ProjectMedia,
  ProjectVideo,
} from "@/content/types/project";

import type {
  SanityProjectImage,
  SanityProjectMedia,
  SanityProjectVideo,
} from "@/sanity/types/media";

import {
  resolveLocalizedValue,
  type ContentLanguage,
} from "./localization";

export function adaptProjectImage(
  image: SanityProjectImage,
  language: ContentLanguage,
): ProjectImage {
  const dimensions = image.image.asset.metadata?.dimensions;

  return {
    id: image.image.asset._id,
    type: "image",
    src: image.image.asset.url,
    alt: resolveLocalizedValue(image.alt, language),
    width: dimensions?.width,
    height: dimensions?.height,
  };
}

export function adaptProjectVideo(
  video: SanityProjectVideo,
): ProjectVideo {
  return {
    id: video.video.asset._id,
    type: "video",
    src: video.video.asset.url,
  };
}

export function adaptProjectMedia(
  media: SanityProjectMedia,
  language: ContentLanguage,
): ProjectMedia {
  switch (media._type) {
    case "projectImage":
      return adaptProjectImage(media, language);

    case "projectVideo":
      return adaptProjectVideo(media);
  }
}