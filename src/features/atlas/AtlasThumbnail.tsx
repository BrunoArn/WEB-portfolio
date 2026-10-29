"use client";

import Image from "next/image";
import { useState } from "react";
import type { AtlasProject } from "./atlas-types";
import styles from "./AtlasMap.module.css";

// Include the approved 20% hover enlargement, without downloading card-size images.
const thumbnailSizes = "(max-width: 760px) 56px, (max-height: 700px) 28px, 64px";
const cardSizes = "(max-width: 472px) calc(100vw - 32px), (max-width: 760px) 440px, 460px";

function DetailImage({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  return <Image src={src} alt="" fill sizes={cardSizes} loading="eager" fetchPriority="high"
    className={`${styles.thumbImage} ${styles.detailImage}`} data-ready={ready}
    onLoad={() => setReady(true)} onError={() => setReady(false)} />;
}

export function AtlasThumbnail({ image, unavailable, selected }: {
  image: AtlasProject["image"]; unavailable: string; selected: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const available = image && failedSource !== image.src;
  // This wrapper is moved into the card and back by the interaction controller.
  // Keep it and the small image mounted throughout the complete transition.
  return <span className={styles.thumb} role="img" aria-label={available ? image.alt : unavailable} data-atlas-missing={!available}>
    {available ? <>
      <Image src={image.src} alt="" fill sizes={thumbnailSizes} className={styles.thumbImage}
        onError={() => setFailedSource(image.src)} />
      {selected && <DetailImage key={image.src} src={image.src} />}
    </> : <svg className={styles.thumbIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="1.5" /><path d="m3 17 6-5 4 3 3-3 5 5" />
    </svg>}
  </span>;
}