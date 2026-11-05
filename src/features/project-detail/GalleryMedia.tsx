"use client";

import Image from "next/image";
import { flushSync } from "react-dom";
import { useState, type RefObject, type SyntheticEvent } from "react";
import type { ProjectMedia } from "@/content/types/project";
import { galleryPreviewSizes } from "./gallery-image-prefetch";

type Props = {
    media: ProjectMedia;
    expanded?: boolean;
    labels: Readonly<{ loading: string; error: string; retry: string; expand: string }>;
    videoRef: RefObject<HTMLVideoElement | null>;
    onMetadata: (event: SyntheticEvent<HTMLVideoElement>) => void;
    onCanPlay: (event: SyntheticEvent<HTMLVideoElement>) => void;
    onExpand?: (button: HTMLButtonElement) => void;
};

/** Key each instance by media source so events and retries belong to one selection. */
export function GalleryMedia({ media, expanded = false, labels, videoRef, onMetadata, onCanPlay, onExpand }: Props) {
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [attempt, setAttempt] = useState(0);
    const ready = () => setStatus(current => current === "error" ? current : "ready");
    const image = media.type === "image" ? (
        <Image key={attempt} src={media.src} alt={media.alt}
            {...(expanded ? { width: media.width ?? 1600, height: media.height ?? 900 } : { fill: true })}
            sizes={expanded ? "100vw" : galleryPreviewSizes}
            onLoad={ready} onError={() => setStatus("error")}
            className={expanded ? "pointer-events-auto max-h-full w-auto max-w-full object-contain" : "object-contain"}
        />
    ) : null;

    return (
        <div aria-busy={status === "loading"} className={expanded
            ? "pointer-events-none relative flex h-full w-full min-h-0 min-w-0 items-center justify-center"
            : "relative aspect-video w-full"}>
            {media.type === "image" ? (expanded ? image : (
                <button type="button" aria-label={labels.expand} disabled={status === "error"}
                    onClick={event => onExpand?.(event.currentTarget)}
                    className="absolute inset-0 block h-full w-full cursor-zoom-in overflow-hidden disabled:cursor-default">
                    {image}
                </button>
            )) : (
                <video key={attempt} ref={videoRef} src={media.src} poster={media.thumbnail} controls playsInline preload="metadata"
                    onLoadedMetadata={event => { onMetadata(event); ready(); }}
                    onCanPlay={event => { onCanPlay(event); ready(); }}
                    onPlaying={ready} onPause={ready}
                    onWaiting={event => { if (!event.currentTarget.paused && event.currentTarget.readyState < 3) setStatus(current => current === "error" ? current : "loading"); }}
                    onError={() => setStatus("error")}
                    className={expanded ? "pointer-events-auto max-h-full max-w-full" : "aspect-video w-full bg-black object-contain"}
                />
            )}
            {status !== "ready" && (
                <div className={"pointer-events-none absolute inset-0 flex items-center justify-center p-(--space-16)" + (status === "error" ? " bg-app-surface-elevated" : "")}>
                    <div className="flex max-w-full flex-col items-center gap-(--space-12) rounded-(--radius-control) bg-app-surface-elevated px-(--space-16) py-(--space-12) text-center text-(length:--font-size-label) text-app-text-primary">
                        <p role={status === "error" ? "alert" : "status"}>{status === "error" ? labels.error : labels.loading}</p>
                        {status === "error" && (
                            <button type="button" onClick={() => {
                                flushSync(() => { setStatus("loading"); setAttempt(current => current + 1); });
                                if (media.type === "video") void videoRef.current?.play().catch(() => {});
                            }} className="pointer-events-auto rounded-(--radius-control) px-(--space-16) py-(--space-12) text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent">
                                {labels.retry}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
