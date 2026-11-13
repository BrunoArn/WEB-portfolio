import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSitemapOrigin } from "@/seo/sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
    await connection();
    const origin = getSitemapOrigin();

    return {
        rules: { userAgent: "*", allow: "/" },
        ...(origin && { sitemap: origin + "/sitemap.xml" }),
    };
}