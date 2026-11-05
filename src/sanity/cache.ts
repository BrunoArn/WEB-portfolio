/** Time-based recovery when an on-demand invalidation is missed. */
export const SANITY_REVALIDATE_SECONDS = 60 * 60;

export const sanityCacheTags = {
    atlas: "sanity:atlas",
    projects: "sanity:projects",
    categories: "sanity:categories",
    about: "sanity:about",
} as const;

type SanityCacheGroup = keyof typeof sanityCacheTags;

/** Tag all referenced content groups, not just the query's root document type. */
export function sanityCacheOptions(...groups: SanityCacheGroup[]) {
    return {
        cache: "force-cache" as const,
        next: {
            revalidate: SANITY_REVALIDATE_SECONDS,
            tags: [...new Set(groups.map(group => sanityCacheTags[group]))],
        },
    };
}
