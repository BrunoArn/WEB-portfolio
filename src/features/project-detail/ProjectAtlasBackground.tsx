import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getAtlasData } from "@/sanity/repositories/atlas";
import { adaptAtlasContent } from "@/features/atlas/atlas-content";
import { ProjectAtlasBackdrop } from "./ProjectAtlasBackdrop";

type ProjectAtlasBackgroundProps = {
    slug: string;
    locale: Locale;
    labels: Dictionary["atlas"]["content"];
};

export async function ProjectAtlasBackground({ slug, locale, labels }: ProjectAtlasBackgroundProps) {
    let data;
    try {
        data = await getAtlasData({ revalidate: 60 });
    } catch {
        // This optional decoration must never prevent the project from opening.
        return null;
    }

    const content = adaptAtlasContent(data, locale, labels);
    const selected = content.projects.find(project => project.placement === slug);
    if (!selected) return null;

    return (
        <ProjectAtlasBackdrop
            slug={slug}
            projectId={selected.id}
            terrain={content.terrain}
            projects={content.projects.map(({ id, c, x, y, mx, my, influence }) => ({ id, c, x, y, mx, my, influence }))}
            territories={content.territories}
        />
    );
}
