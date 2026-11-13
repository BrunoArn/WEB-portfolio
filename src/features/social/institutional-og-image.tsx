import type { InstitutionalOgCopy } from "@/i18n/institutional-og";
import { ogImageSize, ogPalette } from "./og-image";

const contourRadii = [76, 108, 145, 187, 232, 257, 282, 337, 367, 397, 462];
const sampleCount = 160;

function contourEdge(radius: number, direction: 1 | -1) {
    return Array.from({ length: sampleCount }, (_, index) => {
        const angle = index * 2 * Math.PI / sampleCount;
        const wobble =
            1 + 0.19 * Math.sin(2 * angle + 0.65) +
            0.12 * Math.cos(3 * angle - 0.55 + radius / 530) +
            0.055 * Math.sin(5 * angle + radius / 160);
        const thickness = 0.55 + 1.85 * (0.5 + 0.5 * Math.cos(angle + radius / 265)) ** 2;
        const distance = radius * wobble + direction * thickness / 2;
        const y = 381 + 0.10 * radius + distance * 0.92 * Math.sin(angle);
        const lowerHalf = Math.min(1, Math.max(0, (y - 400) / 180));
        const reach = lowerHalf * lowerHalf * (3 - 2 * lowerHalf);
        const lowerLeftShift = 0.36 * radius * reach * Math.max(0, -Math.cos(angle));
        const x = 1112 - 0.19 * radius + distance * Math.cos(angle) - lowerLeftShift;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
}

function contourPath(radius: number) {
    const outer = contourEdge(radius, 1);
    const inner = contourEdge(radius, -1).reverse();
    return `M${outer.join("L")}ZM${inner.join("L")}Z`;
}

function AtlasContours() {
    const { width, height } = ogImageSize;
    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ position: "absolute", left: 0, top: 0 }}
        >
            <defs>
                <linearGradient id="terrain-ink" gradientUnits="userSpaceOnUse" x1="610" y1="320" x2="1210" y2="560">
                    <stop offset="0%" stopColor="#8e9d91" stopOpacity="0" />
                    <stop offset="48%" stopColor="#8e9d91" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#b2bba6" stopOpacity="0.62" />
                </linearGradient>
                <linearGradient id="terrain-amber" gradientUnits="userSpaceOnUse" x1="610" y1="320" x2="1210" y2="560">
                    <stop offset="0%" stopColor={ogPalette.accent} stopOpacity="0" />
                    <stop offset="48%" stopColor={ogPalette.accent} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={ogPalette.accent} stopOpacity="0.70" />
                </linearGradient>
                <linearGradient id="terrain-right" gradientUnits="userSpaceOnUse" x1="790" y1="0" x2="975" y2="0">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="terrain-lower" gradientUnits="userSpaceOnUse" x1="0" y1="390" x2="0" y2="550">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
                <mask id="terrain-text-clearance" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
                    <rect width={width} height={height} fill="url(#terrain-right)" />
                    <rect width={width} height={height} fill="url(#terrain-lower)" />
                </mask>
            </defs>
            <g mask="url(#terrain-text-clearance)">
                {contourRadii.map((radius) => (
                    <path
                        key={radius}
                        d={contourPath(radius)}
                        fill={radius === 145 || radius === 337 ? "url(#terrain-amber)" : "url(#terrain-ink)"}
                        fillRule="evenodd"
                    />
                ))}
            </g>
        </svg>
    );
}

export function InstitutionalOgImage({ title, subtitle }: InstitutionalOgCopy) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                position: "relative",
                backgroundColor: ogPalette.background,
            }}
        >
            <AtlasContours />
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 88, gap: 20 }}>
                <div
                    style={{
                        color: ogPalette.text,
                        fontFamily: "Inter",
                        fontWeight: 900,
                        fontSize: 88,
                        lineHeight: 1,
                        letterSpacing: -3,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        color: ogPalette.accent,
                        fontFamily: "Geist",
                        fontWeight: 500,
                        fontSize: 27,
                        lineHeight: 1.2,
                        letterSpacing: 2,
                    }}
                >
                    {subtitle}
                </div>
            </div>
        </div>
    );
}
