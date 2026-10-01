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
  const asset = image?.image?.asset;

  if (
    typeof asset?._id !== "string" ||
    asset._id.trim().length === 0 ||
    typeof asset.url !== "string" ||
    asset.url.trim().length === 0
  ) {
    throw new Error("Project image is missing a valid asset.");
  }

  const dimensions = asset.metadata?.dimensions;
  const hasValidDimensions =
    dimensions != null &&
    typeof dimensions.width === "number" &&
    Number.isFinite(dimensions.width) &&
    dimensions.width > 0 &&
    typeof dimensions.height === "number" &&
    Number.isFinite(dimensions.height) &&
    dimensions.height > 0;

  return {
    id: asset._id,
    type: "image",
    src: asset.url,
    alt: resolveLocalizedValue(image.alt, language),
    width: hasValidDimensions
      ? dimensions.width
      : undefined,

    height: hasValidDimensions
      ? dimensions.height
      : undefined,
  };
}

export function adaptProjectVideo(
  video: SanityProjectVideo,
): ProjectVideo {
  const asset = video?.video?.asset;

  if (
    typeof asset?._id !== "string" ||
    asset._id.trim().length === 0 ||
    typeof asset.url !== "string" ||
    asset.url.trim().length === 0
  ) {
    throw new Error("Project video is missing a valid asset.");
  }

  return {
    id: asset._id,
    type: "video",
    src: asset.url,
  };
}

export function adaptProjectMedia(
  media: SanityProjectMedia,
  language: ContentLanguage,
): ProjectMedia {
  switch (media?._type) {
    case "projectImage":
      return adaptProjectImage(media, language);

    case "projectVideo":
      return adaptProjectVideo(media);

    default:
      throw new Error(
        `Unsupported project media type: ${(media as { _type?: string })?._type ?? "unknown"
        }.`,
      );
  }
}