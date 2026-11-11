import type { Locale } from "./config";

export const institutionalOgPages = ["home", "projects", "about"] as const;

export type InstitutionalOgPage = (typeof institutionalOgPages)[number];

export type InstitutionalOgCopy = {
    title: string;
    subtitle: string;
};

export const institutionalOgCopy = {
    pt: {
        home: {
            title: "BRUNO ARNAUD",
            subtitle: "DESENVOLVIMENTO DE JOGOS · UNITY · VR/XR",
        },
        projects: {
            title: "PROJETOS",
            subtitle: "JOGOS · REALIDADE VIRTUAL · EXPERIÊNCIAS INTERATIVAS",
        },
        about: {
            title: "SOBRE",
            subtitle: "TRAJETÓRIA · EXPERIÊNCIA · COMPETÊNCIAS",
        },
    },
    en: {
        home: {
            title: "BRUNO ARNAUD",
            subtitle: "GAME DEVELOPMENT · UNITY · VR/XR",
        },
        projects: {
            title: "PROJECTS",
            subtitle: "GAMES · VIRTUAL REALITY · INTERACTIVE EXPERIENCES",
        },
        about: {
            title: "ABOUT",
            subtitle: "BACKGROUND · EXPERIENCE · SKILLS",
        },
    },
} satisfies Record<Locale, Record<InstitutionalOgPage, InstitutionalOgCopy>>;

export function isInstitutionalOgPage(page: string): page is InstitutionalOgPage {
    return institutionalOgPages.some((supportedPage) => supportedPage === page);
}