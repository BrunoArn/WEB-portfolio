"use client";

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import type { Locale } from "@/i18n/config";
import { getNavigationState } from "@/components/navigation/navigation-state";
import styles from "./Navbar.module.css";

import { IntentLink } from "@/components/navigation/IntentLink";
import { usePathname } from "next/navigation";

type NavbarProps = {
    currentLocale: Locale;
    labels: {
        home: string;
        projects: string;
        about: string;
    };
};

export function Navbar({ labels, currentLocale }: NavbarProps) {
    const pathname = usePathname();

    const { homePath, projectsPath, aboutPath, isHomeActive, isAtlasPage, isProjectsActive, isAboutActive } =
        getNavigationState(pathname, currentLocale);

    const navLinkClass = (isActive: boolean) =>
        `relative block py-[var(--space-4)] text-[length:var(--font-size-label)] font-medium transition-colors duration-[var(--motion-fast)] motion-reduce:transition-none ${isActive
            ? "text-[var(--color-text-primary)] after:absolute after:inset-x-0 after:-bottom-[var(--space-4)] after:h-[2px] after:bg-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`;

    return (
        <header
            data-home={isHomeActive}
            data-atlas={isAtlasPage}
            className={`${styles.header} fixed inset-x-0 top-0 z-50 hidden md:block`}
        >
            <nav
                data-primary-navigation="desktop"
                className={`${styles.navigation} flex h-(--shell-header-offset) items-center justify-start gap-(--space-32) font-interface`}
            >
                <ul className="flex items-center gap-(--space-24)">
                    <li>
                        <IntentLink
                            href={homePath}
                            aria-current={isHomeActive ? "page" : undefined}
                            className={navLinkClass(isHomeActive)}
                        >
                            {labels.home}
                        </IntentLink>
                    </li>

                    <li>
                        <IntentLink
                            href={projectsPath}
                            aria-current={pathname === projectsPath ? "page" : undefined}
                            className={navLinkClass(isProjectsActive)}
                        >
                            {labels.projects}
                        </IntentLink>
                    </li>

                    <li>
                        <IntentLink
                            href={aboutPath}
                            aria-current={pathname === aboutPath ? "page" : undefined}
                            className={navLinkClass(isAboutActive)}
                        >
                            {labels.about}
                        </IntentLink>
                    </li>
                </ul>

                <LocaleSwitcher currentLocale={currentLocale} />
            </nav>
        </header>
    );
}
