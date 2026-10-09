
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
        {},
        {
            // Refresh published About content without requiring a new deployment.
            next: { revalidate: 60 },
        },
    );

    return about ? adaptAbout(about, language) : null;
}
