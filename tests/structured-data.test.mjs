import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createTypeScriptLoader } from "./helpers/load-typescript.mjs";

const { load } = createTypeScriptLoader();
const { getWebsiteJsonLd, getProfileJsonLd, getProjectJsonLd, serializeJsonLd } =
    load(fileURLToPath(new URL("../src/seo/structured-data.ts", import.meta.url)));

const origin = "https://portfolio.example";
const siteName = "Bruno Arnaud";
const about = {
    name: siteName,
    introduction: "Biografia profissional.",
    githubUrl: "https://github.com/BrunoArn",
    linkedinUrl: "https://www.linkedin.com/in/bruno-arnaud-2bb586164/",
    itchUrl: "https://brunoarnaud.itch.io/",
};
const project = {
    slug: "café & arte",
    title: "Café e Arte",
    description: "Descrição pública.",
    role: "Desenvolvedor Unity",
    team: [{ name: "Vitor Terra", role: "Música e design de som" }],
    cover: { src: "https://cdn.sanity.io/images/project/production/cafe.png" },
};

test("Home describes one website with both supported languages", () => {
    assert.deepEqual(getWebsiteJsonLd(siteName, origin + "/"), {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": origin + "/#website",
        name: siteName,
        url: origin + "/",
        inLanguage: ["pt", "en"],
    });
});

test("About links two canonical profile pages to one person and website", () => {
    for (const [locale, title, introduction] of [
        ["pt", "Sobre", about.introduction],
        ["en", "About", "Professional introduction."],
    ]) {
        const { "@graph": [page, person] } = getProfileJsonLd(locale, title, { ...about, introduction }, origin);
        assert.deepEqual(page, {
            "@type": "ProfilePage",
            "@id": origin + "/" + locale + "/about#webpage",
            url: origin + "/" + locale + "/about",
            name: title,
            inLanguage: locale,
            isPartOf: { "@id": origin + "/#website" },
            mainEntity: { "@id": origin + "/#person" },
        });
        assert.deepEqual(person, {
            "@type": "Person",
            "@id": origin + "/#person",
            name: siteName,
            description: introduction,
            sameAs: [about.githubUrl, about.linkedinUrl, about.itchUrl],
        });
    }
    const { "@graph": [, person] } = getProfileJsonLd("pt", "Sobre", {
        ...about, githubUrl: "javascript:alert(1)", linkedinUrl: undefined, itchUrl: undefined,
    }, origin);
    assert.equal("sameAs" in person, false);
});

test("Project pages share a CreativeWork id and retain localized descriptions and textual credits", () => {
    for (const [locale, description] of [["pt", project.description], ["en", "Public description."]]) {
        const { "@graph": [page, work] } = getProjectJsonLd(locale, siteName, { ...project, description }, origin);
        const canonical = origin + "/" + locale + "/projects/caf%C3%A9%20%26%20arte";
        const id = origin + "/#project-caf%C3%A9%20%26%20arte";
        assert.deepEqual(page, {
            "@type": "WebPage",
            "@id": canonical + "#webpage",
            url: canonical,
            name: project.title,
            inLanguage: locale,
            isPartOf: { "@id": origin + "/#website" },
            mainEntity: { "@id": id },
        });
        assert.deepEqual(work, {
            "@type": "CreativeWork",
            "@id": id,
            name: project.title,
            description,
            image: project.cover.src,
            creditText: ["Bruno Arnaud — Desenvolvedor Unity", "Vitor Terra — Música e design de som"],
        });
    }
    const { "@graph": [, work] } = getProjectJsonLd("pt", siteName, {
        ...project,
        cover: { src: "/relative.png" },
        team: [{ name: siteName, role: "Programação e game design" }, ...project.team],
    }, origin);
    assert.equal("image" in work, false);
    assert.deepEqual(work.creditText, ["Bruno Arnaud — Programação e game design", "Vitor Terra — Música e design de som"]);
});

test("Absent or invalid origin and invalid project canonicals produce no structured data", () => {
    for (const invalid of ["", "https://temp.up.railway.app", "http://portfolio.example", "https://portfolio.example/path"]) {
        assert.equal(getWebsiteJsonLd(siteName, invalid), undefined);
        assert.equal(getProfileJsonLd("pt", "Sobre", about, invalid), undefined);
        assert.equal(getProjectJsonLd("pt", siteName, project, invalid), undefined);
    }
    assert.equal(getProjectJsonLd("pt", siteName, { ...project, slug: ".." }, origin), undefined);
});

test("JSON-LD serialization preserves content and escapes script-closing markup", () => {
    const data = { description: "Texto </script><script>alert(1)</script> & <" };
    const serialized = serializeJsonLd(data);
    assert.ok(!serialized.includes("<"));
    assert.ok(serialized.includes("\\u003c/script>"));
    assert.deepEqual(JSON.parse(serialized), data);
});
