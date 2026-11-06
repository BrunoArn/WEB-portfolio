import type { Locale } from "@/i18n/config";

/** Keep active links and Atlas shell treatment consistent in both menus. */
export function getNavigationState(pathname: string, locale: Locale) {
    const homePath = "/" + locale;
    const projectsPath = homePath + "/projects";
    const aboutPath = homePath + "/about";
    const isHomeActive = pathname === homePath;
    return {
        homePath,
        projectsPath,
        aboutPath,
        isHomeActive,
        isAtlasPage: isHomeActive || pathname === homePath + "/atlas-preview",
        isProjectsActive: pathname === projectsPath || pathname.startsWith(projectsPath + "/"),
        isAboutActive: pathname === aboutPath || pathname.startsWith(aboutPath + "/"),
    };
}
