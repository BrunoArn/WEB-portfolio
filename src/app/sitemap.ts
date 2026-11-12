import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getSitemapAvailability, getSitemapInventory } from "@/sanity/repositories/sitemap";
import { createSitemap, getSitemapOrigin } from "@/seo/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Keep the XML response request-time while the tagged inventory stays cached.
    await connection();
    const origin = getSitemapOrigin();
    if (!origin) notFound();

    const inventory = await getSitemapInventory();
    return createSitemap(origin, getSitemapAvailability(inventory));
}