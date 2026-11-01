import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getAtlasData } from "@/sanity/repositories/atlas";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { AtlasBackdrop } from "./AtlasBackdrop";

type AtlasBackgroundProps = {
    projectSlug?: string;
    locale: Locale;
    labels: Dictionary["atlas"]["content"];
};

export async function AtlasBackground({ projectSlug, locale, labels }: AtlasBackgroundProps) {
    let data;
    try {
        data = await getAtlasData({ revalidate: 60 });
    } catch {
        // This optional decoration must never prevent the page from opening.
        return null;
    }

    const content = adaptAtlasContent(data, locale, labels);
    const selected = projectSlug ? content.projects.find(project => project.placement === projectSlug) : undefined;
    if (projectSlug && !selected) return null;

    return (
        <AtlasBackdrop
            projectSlug={projectSlug}
            projectId={selected?.id}
            terrain={content.terrain}
            projects={content.projects.map(({ id, c, x, y, mx, my, influence }) => ({ id, c, x, y, mx, my, influence }))}
            territories={content.territories}
        />
    );
}
