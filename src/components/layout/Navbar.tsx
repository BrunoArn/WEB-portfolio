"use client";

import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { locales } from "@/i18n/config";
import styles from "./Navbar.module.css";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Locale = (typeof locales)[number];

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

    const homePath = `/${currentLocale}`;
    const projectsPath = `/${currentLocale}/projects`;
    const aboutPath = `/${currentLocale}/about`;

    const isHomeActive = pathname === homePath;
    const isProjectsActive =
        pathname === projectsPath || pathname.startsWith(`${projectsPath}/`);
    const isAboutActive =
        pathname === aboutPath || pathname.startsWith(`${aboutPath}/`);

    const navLinkClass = (isActive: boolean) =>
        `relative block py-[var(--space-4)] text-[length:var(--font-size-label)] font-medium transition-colors duration-[var(--motion-fast)] motion-reduce:transition-none ${isActive
            ? "text-[var(--color-text-primary)] after:absolute after:inset-x-0 after:-bottom-[var(--space-4)] after:h-[2px] after:bg-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`;

    return (
        <header
            data-home={isHomeActive}
            className={`${styles.header} fixed inset-x-0 top-0 z-50 hidden md:block`}
        >
            <nav
                data-primary-navigation="desktop"
                className={`${styles.navigation} flex h-(--shell-header-offset) items-center justify-start gap-(--space-32) font-interface`}
            >
                <ul className="flex items-center gap-(--space-24)">
                    <li>
                        <Link
                            href={homePath}
                            aria-current={isHomeActive ? "page" : undefined}
                            className={navLinkClass(isHomeActive)}
                        >
                            {labels.home}
                        </Link>
                    </li>

                    <li>
                        <Link
                            href={projectsPath}
                            aria-current={pathname === projectsPath ? "page" : undefined}
                            className={navLinkClass(isProjectsActive)}
                        >
                            {labels.projects}
                        </Link>
                    </li>

                    <li>
                        <Link
                            href={aboutPath}
                            aria-current={pathname === aboutPath ? "page" : undefined}
                            className={navLinkClass(isAboutActive)}
                        >
                            {labels.about}
                        </Link>
                    </li>
                </ul>

                <LocaleSwitcher currentLocale={currentLocale} />
            </nav>
        </header>
    );
}
