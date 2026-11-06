import { defaultLocale, isLocale, type Locale } from "./config";

/** Negotiate only an unlocalized entry URL; explicit routes stay authoritative. */
export function getPreferredLocale(acceptLanguage: string | null): Locale {
    let preferred = defaultLocale;
    let bestQuality = 0;

    for (const entry of (acceptLanguage ?? "").split(",")) {
        const [range, ...parameters] = entry.trim().split(";");
        if (!/^[a-z]{1,8}(?:-[a-z0-9]{1,8})*$/i.test(range)) continue;
        const locale = range.toLowerCase().split("-")[0];
        if (!isLocale(locale)) continue;

        let quality = 1;
        if (parameters.length) {
            const match = parameters.length === 1 && /^\s*q\s*=\s*(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)\s*$/i.exec(parameters[0]);
            if (!match) continue;
            quality = Number(match[1]);
        }
        // A zero quality excludes that entry. Equal qualities keep header order.
        if (quality > bestQuality) {
            preferred = locale;
            bestQuality = quality;
        }
    }

    return preferred;
}
