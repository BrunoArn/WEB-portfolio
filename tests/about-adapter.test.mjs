import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";

// Load the real TypeScript adapters without adding a test runner dependency.
function load(relativePath, imports = {}) {
    const filename = new URL("../" + relativePath, import.meta.url);
    const source = readFileSync(filename, "utf8");
    const js = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.ReactJSX,
        },
    }).outputText;
    const loaded = { exports: {} };
    const execute = vm.runInThisContext("(function(require,module,exports){" + js + "\n})", {
        filename: filename.pathname,
    });
    execute((id) => {
        if (!(id in imports)) throw new Error("Unexpected test import: " + id);
        return imports[id];
    }, loaded, loaded.exports);
    return loaded.exports;
}

const localization = load("src/content/adapters/localization.ts");
const { adaptAbout } = load("src/content/adapters/about.ts", { "./localization": localization });
const { AboutSkills } = load("src/features/about/AboutSkills.tsx", { "react/jsx-runtime": jsxRuntime });
const localized = (pt, en) => ({ pt, en });
function pdf(hash) {
    return { asset: {
        _id: "file-" + hash + "-pdf", _type: "sanity.fileAsset",
        mimeType: "application/pdf", extension: "pdf",
        url: "https://cdn.sanity.io/files/project/production/" + hash + ".pdf",
    } };
}
const base = {
    _id: "aboutPage", name: "QA Name", email: "qa@example.com",
    headline: localized("Título PT", "Headline EN"),
    introduction: localized("Introdução PT", "Intro EN"),
    experience: [{ _key: "exp", role: localized("Cargo PT", "Role EN"), organization: "Org",
        startYear: 2020, endYear: 2025, isCurrent: false,
        description: localized("Experiência PT", "Experience EN") }],
    education: [{ _key: "edu", degree: localized("Curso PT", "Degree EN"), institution: "College",
        startYear: 2015, endYear: 2019, description: localized("Descrição PT", "Description EN") }],
    skillGroups: [{ _key: "skills", title: localized("Grupo PT", "Group EN"), skills: ["Unity", "C#"] }],
    languages: [{ _key: "lang", name: localized("Português", "Portuguese"),
        proficiency: localized("Nativo", "Native") }],
    achievements: [{ _key: "ach", title: localized("Conquista PT", "Achievement EN"), year: 2024,
        description: localized("Descrição PT", "Description EN") }],
    githubUrl: "https://github.com/example", linkedinUrl: "https://www.linkedin.com/in/example",
    itchUrl: "https://example.itch.io/", cvPt: pdf("a".repeat(40)), cvEn: pdf("b".repeat(40)),
};
const fixture = () => structuredClone(base);
const collections = ["experience", "education", "skillGroups", "languages", "achievements"];

for (const lang of ["pt", "en"]) {
    test("Valid complete document has unchanged domain output: " + lang, () => {
        assert.deepEqual(adaptAbout(base, lang), {
            name: "QA Name", email: "qa@example.com", headline: base.headline[lang],
            introduction: base.introduction[lang],
            experience: [{ id: "exp", role: base.experience[0].role[lang], organization: "Org",
                startYear: 2020, endYear: 2025, isCurrent: false, description: base.experience[0].description[lang] }],
            education: [{ id: "edu", degree: base.education[0].degree[lang], institution: "College",
                startYear: 2015, endYear: 2019, description: base.education[0].description[lang] }],
            skillGroups: [{ id: "skills", title: base.skillGroups[0].title[lang], skills: ["Unity", "C#"] }],
            languages: [{ id: "lang", name: base.languages[0].name[lang], proficiency: base.languages[0].proficiency[lang] }],
            achievements: [{ id: "ach", title: base.achievements[0].title[lang], year: 2024,
                description: base.achievements[0].description[lang] }],
            githubUrl: base.githubUrl, linkedinUrl: base.linkedinUrl, itchUrl: base.itchUrl,
            cvUrl: (lang === "pt" ? base.cvPt : base.cvEn).asset.url,
        });
    });
    const other = lang === "pt" ? "en" : "pt";
    for (const value of [undefined, null, {}, { [other]: "Other only" }, { [lang]: "" }, { [lang]: " \n\t" }, { [lang]: 42 }]) {
        test("W2 optional description omitted: " + lang + " " + JSON.stringify(value), () => {
            const input = fixture(); input.education[0].description = value;
            assert.equal(adaptAbout(input, lang).education[0].description, undefined);
        });
    }
    const required = [["headline"], ["introduction"], ["experience", 0, "role"],
        ["experience", 0, "description"], ["education", 0, "degree"], ["skillGroups", 0, "title"],
        ["languages", 0, "name"], ["languages", 0, "proficiency"], ["achievements", 0, "title"],
        ["achievements", 0, "description"]];
    for (const path of required) for (const value of [undefined, { [other]: "Other only" }, { [lang]: " " }, { [lang]: {} }]) {
        test("Required localized field still fails: " + lang + " " + path.join(".") + " " + JSON.stringify(value), () => {
            const input = fixture(); let parent = input;
            for (const key of path.slice(0, -1)) parent = parent[key];
            parent[path.at(-1)] = value;
            assert.throws(() => adaptAbout(input, lang), /Missing localized value/);
        });
    }
    test("CV selection does not fall back: " + lang, () => {
        const input = fixture(); input[lang === "pt" ? "cvPt" : "cvEn"] = null;
        assert.equal(adaptAbout(input, lang).cvUrl, undefined);
    });
}

for (const email of ["qa@example.com", "first.last+tag@example.co.uk", "o'hara@example.com", "QA@EXAMPLE.COM"]) {
    test("Valid email: " + email, () => {
        const input = fixture(); input.email = email;
        assert.equal(adaptAbout(input, "en").email, email);
    });
}
for (const email of [undefined, null, 42, {}, "", "not-email", "a@@example.com", "a@localhost",
    "a @example.com", "a\n@example.com", "a..b@example.com", ".a@example.com", "a.@example.com",
    "a@example..com", "a@-example.com", "a@example-.com", "a?subject=x@example.com",
    "a#fragment@example.com", "a%0A@example.com", "a".repeat(65) + "@example.com"]) {
    test("Invalid essential email fails: " + JSON.stringify(email), () => {
        const input = fixture(); input.email = email;
        assert.throws(() => adaptAbout(input, "en"), /valid contact email/);
    });
}
for (const value of [null, undefined, [], "wrong", { ...base, name: " " }]) {
    test("Invalid document or essential name fails: " + JSON.stringify(value), () => {
        assert.throws(() => adaptAbout(value, "en"), /valid professional name/);
    });
}

for (const key of ["githubUrl", "linkedinUrl", "itchUrl"]) {
    for (const url of ["https://example.com/path?q=1#part", "HTTPS://example.com", "https://example.com:8443/"]) {
        test("HTTPS accepted: " + key + " " + url, () => {
            const input = fixture(); input[key] = url; assert.equal(adaptAbout(input, "en")[key], url);
        });
    }
    for (const url of [undefined, null, 42, {}, "", " ", "http://example.com", "javascript:alert(1)",
        "data:text/html,QA", "ftp://example.com", "/relative", "//example.com", "https://",
        "https:example.com", "https://example.com/x y", "https://example.com/\npath",
        "https://user:pass@example.com", "https://example.com\\path"]) {
        test("Invalid optional URL omitted: " + key + " " + JSON.stringify(url), () => {
            const input = fixture(); input[key] = url; assert.equal(adaptAbout(input, "en")[key], undefined);
        });
    }
}

for (const key of collections) {
    for (const value of [undefined, null, []]) {
        test("Absent/empty collection: " + key + " " + JSON.stringify(value), () => {
            const input = fixture(); input[key] = value; assert.deepEqual(adaptAbout(input, "en")[key], []);
        });
    }
    test("Non-object items omitted with valid neighbors preserved: " + key, () => {
        const input = fixture(); input[key] = [null, 42, "wrong", [], input[key][0]];
        assert.deepEqual(adaptAbout(input, "en")[key], adaptAbout(base, "en")[key]);
    });
    test("Incomplete record fails explicitly: " + key, () => {
        const input = fixture(); input[key] = [{}];
        assert.throws(() => adaptAbout(input, "en"), /About Page is missing a valid/);
    });
    for (const value of [{}, "wrong", 42]) {
        test("Non-array collection fails explicitly: " + key + " " + JSON.stringify(value), () => {
            const input = fixture(); input[key] = value;
            assert.throws(() => adaptAbout(input, "en"), /must be an array/);
        });
    }
}

for (const skills of [undefined, null, {}, "Unity", 42, [], [null, {}, "", " "]]) {
    test("Unusable skill group omitted: " + JSON.stringify(skills), () => {
        const input = fixture(); input.skillGroups[0].skills = skills;
        assert.deepEqual(adaptAbout(input, "en").skillGroups, []);
    });
}
test("Mixed skills become render-safe strings, with order and text preserved", () => {
    const input = fixture(); input.skillGroups[0].skills = ["Unity", null, 42, {}, "", " ", "  C#  "];
    const domain = adaptAbout(input, "en");
    assert.deepEqual(domain.skillGroups[0].skills, ["Unity", "  C#  "]);
    const html = renderToStaticMarkup(React.createElement(AboutSkills, { groups: domain.skillGroups, title: "Skills" }));
    assert.match(html, /Unity/); assert.match(html, /C#/);
});
test("Missing required skill title still fails even with invalid skills", () => {
    const input = fixture(); input.skillGroups[0].title = {}; input.skillGroups[0].skills = {};
    assert.throws(() => adaptAbout(input, "en"), /Missing localized value/);
});
for (const [path, value] of [[ ["experience", 0, "organization"], {} ], [["education", 0, "institution"], null],
    [["experience", 0, "startYear"], undefined], [["experience", 0, "startYear"], "2020"],
    [["experience", 0, "endYear"], 2020.5], [["education", 0, "startYear"], NaN],
    [["achievements", 0, "year"], 2101], [["experience", 0, "isCurrent"], "false"]]) {
    test("Invalid scalar field fails explicitly: " + path.join("."), () => {
        const input = fixture(); let parent = input;
        for (const key of path.slice(0, -1)) parent = parent[key]; parent[path.at(-1)] = value;
        assert.throws(() => adaptAbout(input, "en"), /About Page/);
    });
}

test("Optional missing years and current flag retain existing defaults", () => {
    const input = fixture(); input.experience[0].endYear = null; input.experience[0].isCurrent = null;
    input.education[0].startYear = null; input.education[0].endYear = undefined;
    const result = adaptAbout(input, "en"); assert.equal(result.experience[0].endYear, undefined);
    assert.equal(result.experience[0].isCurrent, false); assert.equal(result.education[0].startYear, undefined);
    assert.equal(result.education[0].endYear, undefined);
});
for (const file of [undefined, null, {}, { asset: null }, { asset: [] }, { asset: "wrong" }]) {
    test("Invalid CV structure omitted: " + JSON.stringify(file), () => {
        const input = fixture(); input.cvEn = file; assert.equal(adaptAbout(input, "en").cvUrl, undefined);
    });
}
for (const [key, value] of [["_id", ""], ["_id", "not-file"], ["_id", "file-bad-pdf"],
    ["_type", "sanity.imageAsset"], ["mimeType", undefined], ["mimeType", "image/png"],
    ["extension", undefined], ["extension", "exe"], ["url", "javascript:alert(1)"],
    ["url", "data:application/pdf,QA"], ["url", "http://cdn.sanity.io/files/project/production/a.pdf"],
    ["url", "https://evil.example/fake.pdf"], ["url", "https://cdn.sanity.io/images/project/a.pdf"],
    ["url", "https://cdn.sanity.io/files/"], ["url", "https://cdn.sanity.io/files/project/production/wrong.pdf"],
    ["url", "https://user:pass@cdn.sanity.io/files/project/production/a.pdf"]]) {
    test("Invalid CV asset metadata/URL omitted: " + key + " " + JSON.stringify(value), () => {
        const input = fixture(); input.cvEn.asset[key] = value;
        assert.equal(adaptAbout(input, "en").cvUrl, undefined);
    });
}
test("PDF suffix alone never admits an asset with wrong MIME", () => {
    const input = fixture(); input.cvEn.asset.mimeType = "application/octet-stream";
    assert.equal(adaptAbout(input, "en").cvUrl, undefined);
});
