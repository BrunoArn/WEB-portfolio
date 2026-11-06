/** Shared CPU palette mixing for the live map and decorative backgrounds. */
export function writeAtlasColor(
    weights: readonly number[],
    palette: readonly (readonly number[])[],
    pixels: Uint8Array | Uint8ClampedArray,
    offset: number,
) {
    let red = 0, green = 0, blue = 0, hasColor = false;
    for (let category = 0; category < palette.length; category++) {
        const weight = weights[category], color = palette[category];
        hasColor ||= weight > 0;
        red += weight * color[0];
        green += weight * color[1];
        blue += weight * color[2];
    }
    // Keep the existing neutral fallback when no project contributes color.
    pixels[offset] = hasColor ? Math.round(red) : 149;
    pixels[offset + 1] = hasColor ? Math.round(green) : 163;
    pixels[offset + 2] = hasColor ? Math.round(blue) : 155;
}
