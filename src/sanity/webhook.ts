import { sanityCacheTags } from "./cache";
import { locales } from "@/i18n/config";

const maximumBodyBytes = 16 * 1024;

export class WebhookRequestError extends Error {
    constructor(public status: number, message: string) { super(message); }
}

/** Bound the actual stream as well as Content-Length before signature verification. */
export async function readWebhookBody(request: Request): Promise<string> {
    if (Number(request.headers.get("content-length")) > maximumBodyBytes) {
        throw new WebhookRequestError(413, "Payload too large");
    }
    const reader = request.body?.getReader();
    if (!reader) throw new WebhookRequestError(400, "Empty payload");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > maximumBodyBytes) {
                await reader.cancel();
                throw new WebhookRequestError(413, "Payload too large");
            }
            chunks.push(value);
        }
    } finally { reader.releaseLock(); }
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
    } catch { throw new WebhookRequestError(400, "Invalid UTF-8 payload"); }
}

type Payload = {
    _id: string;
    _type: string;
    dataset: string;
    operation: "create" | "update" | "delete";
    slug?: string | null;
    previousSlug?: string | null;
    thumbnailChanged?: boolean;
};

function validSlug(value: unknown): boolean {
    if (value == null) return true;
    if (typeof value !== "string" || value.length === 0 || value.length > 200 ||
        value === "." || value === ".." || /[\\/\x00-\x20?#]/u.test(value)) return false;
    try {
        // Leave space for locale/prefix within Next's 1024-character path limit.
        return encodeURIComponent(value).length <= 900;
    } catch { return false; } // Unpaired UTF-16 surrogates cannot form a URL segment.
}

/** The webhook can name content, never arbitrary paths or cache tags. */
export function parseWebhookPayload(raw: string, dataset: string): Payload {
    let value: unknown;
    try { value = JSON.parse(raw); } catch { throw new WebhookRequestError(400, "Invalid JSON payload"); }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new WebhookRequestError(400, "Invalid payload");
    }
    const p = value as Record<string, unknown>;
    if (typeof p._id !== "string" || !/^[a-zA-Z0-9_.-]{1,128}$/.test(p._id) ||
        typeof p._type !== "string" || p._type.length === 0 || p._type.length > 128 ||
        typeof p.dataset !== "string" || typeof p.operation !== "string" || !["create", "update", "delete"].includes(p.operation) ||
        !validSlug(p.slug) || !validSlug(p.previousSlug) ||
        (p.thumbnailChanged !== undefined && typeof p.thumbnailChanged !== "boolean")) {
        throw new WebhookRequestError(400, "Invalid payload");
    }
    if (p.dataset !== dataset) throw new WebhookRequestError(400, "Unexpected dataset");
    return p as Payload;
}

export function webhookInvalidation(payload: Payload): { tags: string[]; paths: string[] } {
    // Defense in depth: drafts and unpublished release versions never invalidate public pages.
    if (payload._id.startsWith("drafts.") || payload._id.startsWith("versions.")) return { tags: [], paths: [] };
    switch (payload._type) {
        case "project": {
            const slugs = [...new Set([payload.previousSlug, payload.slug].filter((slug): slug is string => Boolean(slug)))];
            return { tags: [sanityCacheTags.projects], paths: locales.flatMap(locale => slugs.map(slug => "/" + locale + "/projects/" + encodeURIComponent(slug))) };
        }
        case "category": return { tags: [sanityCacheTags.categories], paths: [] };
        case "atlasSettings": return { tags: [sanityCacheTags.atlas], paths: [] };
        case "aboutPage": return { tags: [sanityCacheTags.about], paths: locales.map(locale => "/" + locale + "/about") };
        case "sanity.fileAsset": return { tags: payload.thumbnailChanged === true ? [sanityCacheTags.projects] : [], paths: [] };
        default: return { tags: [], paths: [] };
    }
}
