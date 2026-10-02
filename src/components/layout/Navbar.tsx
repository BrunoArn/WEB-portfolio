"use client";

import { Container } from "@/components/layout/Container";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { locales } from "@/i18n/config";

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
        `relative block py-[var(--space-4)] text-[length:var(--font-size-label)] font-medium transition-colors duration-[var(--motion-fast)] ${isActive
            ? "text-[var(--color-text-primary)] after:absolute after:inset-x-0 after:-bottom-[var(--space-4)] after:h-[2px] after:bg-[var(--color-accent)]"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        }`;

    return (
        <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-app-border bg-app-background md:block">
            <Container>
                <nav className="flex items-center justify-between">
                    <ul className="flex items-center gap-(--space-24) py-(--space-16)">
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
            </Container>
        </header>
    );
}