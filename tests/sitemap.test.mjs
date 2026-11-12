import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createTypeScriptLoader } from "./helpers/load-typescript.mjs";

const file = (path) => fileURLToPath(new URL("../" + path, import.meta.url));
const { load } = createTypeScriptLoader();
const { createSitemap, getSitemapOrigin } = load(file("src/seo/sitemap.ts"));
const upstreamFailure = new Error("Sanity unavailable");
const { getSitemapAvailability, getSitemapInventory } = createTypeScriptLoader({
    overrides: {
        "@/content/adapters/about": load(file("src/content/adapters/about.ts")),
        "@/content/adapters/category": load(file("src/content/adapters/category.ts")),
        "@/content/adapters/project": load(file("src/content/adapters/project.ts")),
        "@/i18n/config": load(file("src/i18n/config.ts")),
        "@/sanity/cache": load(file("src/sanity/cache.ts")),
        "@/sanity/client": { sanityClient: { withConfig(config) {
            assert.equal(config.perspective, "published");
            return { async fetch(_query, _params, options) {
                assert.deepEqual(options.next.tags, ["sanity:projects", "sanity:categories", "sanity:about"]);
                assert.equal(options.next.revalidate, 3600);
                throw upstreamFailure;
            } };
        } } },
        "@/sanity/queries/about": load(file("src/sanity/queries/about.ts")),
        "@/sanity/queries/project": load(file("src/sanity/queries/project.ts")),
        "@/sanity/repositories/categories": { categoriesQuery: "[]" },
    },
}).load(file("src/sanity/repositories/sitemap.ts"));

const origin = "https://portfolio.example";
const localized = (text) => ({ pt: text, en: text });
const category = { _id: "games", name: localized("Games"), slug: { current: "games" }, order: 0 };
const about = {
    name: "Bruno Arnaud", headline: localized("Developer"), introduction: localized("Biography"),
    email: "contact@example.org",
};

function project(slug, description = localized("Description")) {
    return {
        _id: slug, slug: { current: slug }, title: localized("Project"), description,
        year: 2026, role: localized("Development"), status: "released", featured: false, order: 0,
        categories: [category], technologies: ["Unity"], team: [], media: [],
        cover: {
            alt: localized("Cover"),
            image: { asset: { _id: "cover", url: "https://cdn.sanity.io/cover.png" } },
        },
    };
}

function entries(sitemapProjects, aboutPage = about) {
    return createSitemap(origin, getSitemapAvailability({ sitemapProjects, about: aboutPage, categories: [category] }));
}

test("Publication requires a validated origin and an exact true flag", () => {
    assert.equal(getSitemapOrigin(origin + "/", "true"), origin);
    for (const bad of ["", "http://portfolio.example", "https://temp.up.railway.app", origin + "/path"]) {
        assert.equal(getSitemapOrigin(bad, "true"), undefined);
    }
    for (const flag of ["", "false", "TRUE", " true "]) {
        assert.equal(getSitemapOrigin(origin, flag), undefined);
    }
});

test("Sitemap tracks published additions, removals and renames with unique reciprocal canonicals", () => {
    const initial = entries([project("old"), project("removed")]);
    assert.ok(initial.some(({ url }) => url.endsWith("/projects/old")));
    const current = entries([project("café & arte"), project("new")]);
    assert.equal(current.length, 10);
    assert.equal(new Set(current.map(({ url }) => url)).size, current.length);
    const pair = {
        pt: origin + "/pt/projects/caf%C3%A9%20%26%20arte",
        en: origin + "/en/projects/caf%C3%A9%20%26%20arte",
    };
    for (const url of Object.values(pair)) {
        assert.deepEqual(current.find((entry) => entry.url === url), { url, alternates: { languages: pair } });
    }
    assert.ok(current.every(({ url }) => !url.endsWith("/old") && !url.endsWith("/removed")));
});

test("Details and About include only renderable languages and exclude ambiguous slugs", () => {
    const current = entries([
        project("partial", { pt: "Descricao" }), project("duplicate"), project("duplicate"),
    ], { ...about, introduction: { en: "Biography" } });
    assert.equal(current.length, 6);
    const partial = current.find(({ url }) => url.endsWith("/projects/partial"));
    assert.deepEqual(partial?.alternates.languages, { pt: origin + "/pt/projects/partial" });
    assert.ok(current.some(({ url }) => url === origin + "/en/about"));
    assert.ok(!current.some(({ url }) => url === origin + "/pt/about" || url.endsWith("/duplicate")));
});

test("Card dependencies affect listing and detail availability in the same locale", () => {
    const invalidCard = { ...project("card"), title: { pt: "Projeto" } };
    const current = entries([invalidCard, project("valid")], null);
    assert.ok(current.some(({ url }) => url === origin + "/en"));
    assert.ok(!current.some(({ url }) => url.startsWith(origin + "/en/projects")));
    assert.ok(current.some(({ url }) => url === origin + "/pt/projects/valid"));
});

test("An unavailable CMS is distinct from a valid inventory with no projects", async () => {
    assert.equal(entries([], null).length, 4);
    await assert.rejects(getSitemapInventory(), upstreamFailure);
});