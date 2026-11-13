import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { ReactElement } from "react";

export const ogImageSize = { width: 1200, height: 630 };

export const ogPalette = {
    background: "#0b1211",
    text: "#f2f3f4",
    accent: "#E1BE86",
} as const;

const fontDirectory = join(process.cwd(), "src/features/social/fonts");

async function loadFonts() {
    const [inter, geist] = await Promise.all([
        readFile(join(fontDirectory, "Inter-Black.ttf")),
        readFile(join(fontDirectory, "Geist-Medium.ttf")),
    ]);
    return [
        { name: "Inter", data: inter, weight: 900, style: "normal" },
        { name: "Geist", data: geist, weight: 500, style: "normal" },
    ] as const;
}

export async function renderOgImage(
    composition: ReactElement,
    headers: Record<string, string> = {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
    },
) {
    return new ImageResponse(composition, {
        ...ogImageSize,
        fonts: [...await loadFonts()],
        headers,
    });
}
