# Published content cache

Runtime queries use the shared policy in cache.ts: force-cache, one-hour time-based revalidation, and dependency tags. Query results contain both languages; localization happens after fetching, so PT and EN reuse the same data cache entry.

| Query | Tags |
| --- | --- |
| Atlas (Home and decorative backgrounds) | sanity:atlas, sanity:projects, sanity:categories |
| Projects (listing, detail and related) | sanity:projects, sanity:categories |
| Categories | sanity:categories |
| About | sanity:about |

Dependencies are deliberate: invalidating projects also invalidates Atlas data; invalidating categories reaches both project projections and Atlas. Atlas settings can invalidate only sanity:atlas. The same Atlas query/options are used by Home and backgrounds, so these consumers share its cache entry. Changes to backgrounds can cause regeneration of an About route without invalidating its independent textual content query.

Exceptions:

- /[lang]/atlas-preview explicitly requests fresh published data with no-store for map adjustments. It is not a draft preview.
- generateStaticParams obtains currently published slugs without a persistent data cache; new slugs can still render at runtime through dynamicParams=true.

The Sanity client continues using useCdn=false. Next's server cache is the reuse layer; a cache miss reads the API rather than a potentially stale query CDN.

The signed POST /api/sanity/revalidate endpoint is implemented; see [WEBHOOK.md](WEBHOOK.md), [filter](webhook-filter.groq) and [projection](webhook-projection.groq). No live subscription is used. The project's Railway webhook has been configured and validated; each new deployment/environment still needs its own matching endpoint and secret. If an event is missed or the webhook is disabled, published changes rely on the one-hour time-based fallback (stale-while-revalidate on a subsequent visit). Already open browsers are not pushed content updates. A webhook sent to production does not invalidate a local server. Preview remains fresh per server request.

The webhook invalidates projects when a persistent video thumbnail changes on a file asset, as well as handling project/category/about/Atlas document changes. Transient thumbnail-processing claims are excluded by the filter.

The query cache contains content data and asset references, not video/image bodies. Asset traffic and browser/CDN caching remain separate. Existing open tabs and previously prefetched client routes can require a reload after publication.

Validate caching with next build / next start; development HMR does not model production caching reliably. Any future multi-instance deployment needs a cache/invalidation strategy shared across instances.

Listing and related cards share getProjectCards and its lightweight projection/model. Full project data is fetched only for project detail. Both projections share common card fields and the same projects/categories tags, so existing webhook invalidation reaches both cache entries.

The card projection includes the optional localized summary. Only Projects Listing renders it; related cards keep their existing presentation. Missing or blank summaries are omitted without borrowing another language. The full gallery and other detail-only fields remain excluded from the card query.
