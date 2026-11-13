import { adaptCategory } from "./category";
import { adaptProjectCard } from "./project";
import type { ContentLanguage } from "./localization";
import type { SanityCategory } from "../../sanity/types/category";
import type { SanityProjectCard } from "../../sanity/types/project";

/** Evaluate adapter failures only. Load data outside this boundary. */
export function isRenderable(adapt: () => unknown): boolean {
    try {
        adapt();
        return true;
    } catch {
        return false;
    }
}

export function canRenderProjectCards(projects: SanityProjectCard[], locale: ContentLanguage): boolean {
    return projects.every((project) => isRenderable(() => adaptProjectCard(project, locale)));
}

export function canRenderCategories(categories: SanityCategory[], locale: ContentLanguage): boolean {
    return categories.every((category) => isRenderable(() => adaptCategory(category, locale)));
}