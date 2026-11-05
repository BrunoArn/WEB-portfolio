import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath, revalidateTag } from "next/cache";
import { sanityEnv } from "@/sanity/env";
import { parseWebhookPayload, readWebhookBody, webhookInvalidation, WebhookRequestError } from "@/sanity/webhook";

export const runtime = "nodejs";

function respond(body: object, status = 200) {
    return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
    const secret = process.env.SANITY_REVALIDATE_SECRET;
    if (!secret) return respond({ error: "Webhook is not configured" }, 503);
    const signature = request.headers.get(SIGNATURE_HEADER_NAME);
    if (!signature) return respond({ error: "Invalid signature" }, 401);
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
        return respond({ error: "Expected application/json" }, 415);
    }
    try {
        const body = await readWebhookBody(request);
        if (!await isValidSignature(body, signature, secret)) return respond({ error: "Invalid signature" }, 401);
        const payload = parseWebhookPayload(body, sanityEnv.dataset);
        const { tags, paths } = webhookInvalidation(payload);
        for (const tag of tags) revalidateTag(tag, { expire: 0 });
        for (const path of paths) revalidatePath(path);
        return respond({ revalidated: tags.length > 0 || paths.length > 0, tags, paths });
    } catch (error) {
        if (error instanceof WebhookRequestError) return respond({ error: error.message }, error.status);
        // Do not log signatures, secrets, raw bodies or unpublished content.
        console.error("[sanity-webhook] Request processing failed.");
        return respond({ error: "Webhook processing failed" }, 500);
    }
}
