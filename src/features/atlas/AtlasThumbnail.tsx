"use client";

import Image from "next/image";
import { ProjectCoverTransition } from "@/components/projects/ProjectCoverTransition";
import { useState } from "react";
import type { AtlasProject } from "./atlas-types";
import styles from "./AtlasMap.module.css";

// Include the approved 20% hover enlargement, without downloading card-size images.
const thumbnailSizes = "(max-width: 760px) 56px, (max-height: 700px) 28px, 64px";
const cardSizes = "(max-width: 472px) calc(100vw - 32px), (max-width: 760px) 440px, 460px";

function DetailImage({ src, sizes = cardSizes, onError }: { src: string; sizes?: string; onError?: () => void }) {
  const [ready, setReady] = useState(false);
  return <Image src={src} alt="" fill sizes={sizes} loading="eager" fetchPriority="high"
    className={[styles.thumbImage, styles.detailImage].join(" ")} data-ready={ready}
    onLoad={() => setReady(true)} onError={() => { setReady(false); onError?.(); }} />;
}

export function AtlasThumbnail({ image, markerImage, unavailable, selected, slug, shareCover = true }: {
  image: AtlasProject["image"]; markerImage?: AtlasProject["markerImage"]; unavailable: string; selected: boolean; slug: string; shareCover?: boolean;
}) {
  const [failedMarker, setFailedMarker] = useState<string | null>(null);
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const cover = image && failedCover !== image.src ? image : undefined;
  const marker = markerImage && failedMarker !== markerImage.src && failedCover !== markerImage.src ? markerImage : cover;
  const displayed = selected ? cover : marker;
  // The interaction controller moves this same wrapper into the card and back.
  // Keep the marker mounted; cover layers exist only while its card is selected.
  return <ProjectCoverTransition slug={slug} enabled={Boolean(cover && selected && shareCover)}>
    <span className={styles.thumb} role="img" aria-label={displayed?.alt ?? unavailable} data-atlas-missing={!cover}>
      {marker && <Image key={marker.src} src={marker.src} alt="" fill sizes={thumbnailSizes}
        className={styles.thumbImage} hidden={selected && !cover}
        onError={() => { setFailedMarker(marker.src); if (marker.src === image?.src) setFailedCover(marker.src); }} />}
      {selected && cover && <>
        {marker?.src !== cover.src && <DetailImage key={"preview-" + cover.src} src={cover.src} sizes={thumbnailSizes}
          onError={() => setFailedCover(cover.src)} />}
        <DetailImage key={cover.src} src={cover.src} />
      </>}
      {!displayed && <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 6-5 4 3 3-3 5 5" />
      </svg>}
    </span>
  </ProjectCoverTransition>;
}
