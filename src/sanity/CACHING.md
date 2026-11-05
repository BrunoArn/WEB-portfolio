# Published content cache

Runtime queries use the shared policy in cache.ts: force-cache, one-hour time-based revalidation, and dependency tags. Query results contain both languages; localization happens after fetching, so PT and EN reuse the same data cache entry.

| Query | Tags |
| --- | --- |
| Atlas (Home and decorative backgrounds) | sanity:atlas, sanity:projects, sanity:categories |
| Projects (listing, detail, featured and related) | sanity:projects, sanity:categories |
| Categories | sanity:categories |
| About | sanity:about |

Dependencies are deliberate: invalidating projects also invalidates Atlas data; invalidating categories reaches both project projections and Atlas. Atlas settings can invalidate only sanity:atlas. The same Atlas query/options are used by Home and backgrounds, so these consumers share its cache entry. Changes to backgrounds can cause regeneration of an About route without invalidating its independent textual content query.

Exceptions:

- /[lang]/atlas-preview explicitly requests fresh published data with no-store for map adjustments. It is not a draft preview.
- generateStaticParams obtains currently published slugs without a persistent data cache; new slugs can still render at runtime through dynamicParams=true.

The Sanity client continues using useCdn=false. Next's server cache is the reuse layer; a cache miss reads the API rather than a potentially stale query CDN.

Stage 1 adds tags but no webhook endpoint or live subscription. Until invalidation is implemented and activated, published changes rely on the one-hour time-based fallback (stale-while-revalidate on the next visit), rather than the former 60 seconds on cached pages. Already open browsers are not pushed content updates. Preview remains fresh per server request.

The future webhook must invalidate projects when a persistent video thumbnail changes on a file asset, as well as handling project/category/about/Atlas document changes. Do not treat transient thumbnail-processing claims as public content changes.

Validate caching with next build / next start; development HMR does not model production caching reliably. Any future multi-instance deployment needs a cache/invalidation strategy shared across instances.
