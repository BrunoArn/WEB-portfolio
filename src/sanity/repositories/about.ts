
import type { About } from "@/content/types/about";
import type { ContentLanguage } from "@/content/adapters/localization";
import type { SanityAbout } from "@/sanity/types/about";

import { adaptAbout } from "@/content/adapters/about";
import { sanityClient } from "@/sanity/client";
import { aboutQuery } from "@/sanity/queries/about";

export async function getAbout(
    language: ContentLanguage,
): Promise<About | null> {
    const about = await sanityClient.fetch<SanityAbout | null>(
        aboutQuery,
    );

    return about ? adaptAbout(about, language) : null;
}
