"use client";

import {
    useEffect,
    useRef,
    useState,
    type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/layout/Container";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { locales } from "@/i18n/config";
import styles from "./NavbarMobile.module.css";

type Locale = (typeof locales)[number];

type NavbarMobileProps = {
    openMenuLabel: string;
    closeMenuLabel: string;
    currentLocale: Locale;
    professionalLinks: {
        github?: string;
        linkedin?: string;
    };
    labels: {
        menu: string;
        close: string;
        home: string;
        projects: string;
        about: string;
    };
};

export function NavbarMobile({
    openMenuLabel,
    closeMenuLabel,
    currentLocale,
    professionalLinks,
    labels,
}: NavbarMobileProps) {
    const [isOpen, setIsOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const pathname = usePathname();

    const homePath = `/${currentLocale}`;
    const projectsPath = `/${currentLocale}/projects`;
    const aboutPath = `/${currentLocale}/about`;

    const isHomeActive = pathname === homePath;
    const isProjectsActive =
        pathname === projectsPath || pathname.startsWith(`${projectsPath}/`);
    const isAboutActive =
        pathname === aboutPath || pathname.startsWith(`${aboutPath}/`);

    const mobileNavLinkClass = (isActive: boolean) =>
        `relative inline-block font-heading text-(length:--font-size-page-mobile) font-medium leading-(--line-height-title) text-app-text-primary transition-colors duration-(--motion-fast) hover:text-app-accent motion-reduce:transition-none ${isActive
            ? "after:absolute after:right-0 after:-bottom-(--space-4) after:h-[2px] after:w-(--space-24) after:bg-app-accent"
            : ""
        }`;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const body = document.body;
        const previousOverflow = body.style.overflow;
        body.style.overflow = "hidden";

        const desktopMediaQuery = window.matchMedia("(min-width: 48rem)");

        const handleBreakpointChange = (event: MediaQueryListEvent) => {
            if (!event.matches) {
                return;
            }

            setIsOpen(false);

            requestAnimationFrame(() => {
                const desktopNavigation = document.querySelector<HTMLElement>(
                    '[data-primary-navigation="desktop"]',
                );
                const activeDesktopLink =
                    desktopNavigation?.querySelector<HTMLAnchorElement>(
                        'a[aria-current="page"]',
                    ) ??
                    desktopNavigation?.querySelector<HTMLAnchorElement>(
                        `a[href="${projectsPath}"]`,
                    ) ??
                    desktopNavigation?.querySelector<HTMLAnchorElement>("a[href]");

                activeDesktopLink?.focus();
            });
        };

        desktopMediaQuery.addEventListener("change", handleBreakpointChange);

        return () => {
            desktopMediaQuery.removeEventListener(
                "change",
                handleBreakpointChange,
            );
            body.style.overflow = previousOverflow;
        };
    }, [isOpen, projectsPath]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const panel = panelRef.current;
        const header = headerRef.current;
        const menuButton = menuButtonRef.current;

        if (!panel || !header || !menuButton) {
            return;
        }

        const focusableSelector =
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const getPanelFocusableElements = () =>
            Array.from(
                panel.querySelectorAll<HTMLElement>(focusableSelector),
            );

        const focusFirstPanelElement = () => {
            const [firstElement] = getPanelFocusableElements();
            firstElement?.focus();
        };

        requestAnimationFrame(focusFirstPanelElement);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);

                requestAnimationFrame(() => {
                    menuButton.focus();
                });

                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const panelElements = getPanelFocusableElements();

            if (panelElements.length === 0) {
                event.preventDefault();
                menuButton.focus();
                return;
            }

            const headerElements = Array.from(
                header.querySelectorAll<HTMLElement>(focusableSelector),
            );
            const focusableElements = [...headerElements, ...panelElements];

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey && activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
                return;
            }

            if (!event.shiftKey && activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    const handleInternalNavigation = (
        event: MouseEvent<HTMLAnchorElement>,
        destination: string,
    ) => {
        if (pathname === destination) {
            event.preventDefault();
        }

        setIsOpen(false);

        requestAnimationFrame(() => {
            menuButtonRef.current?.focus();
        });
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const appContent = document.querySelector<HTMLElement>(
            "[data-app-shell-content]",
        );

        if (!appContent) {
            return;
        }

        appContent.inert = true;

        return () => {
            appContent.inert = false;
        };
    }, [isOpen]);

    return (
        <>
            <header
                ref={headerRef}
                className={`${styles.header} fixed inset-x-0 top-0 z-50 md:hidden`}
            >
                <Container>
                    <div className="flex h-(--shell-header-offset) items-center justify-end gap-(--space-24) font-interface">
                        <LocaleSwitcher currentLocale={currentLocale} onNavigate={handleInternalNavigation} />
                        <button
                            ref={menuButtonRef}
                            type="button"
                            className="inline-flex items-center gap-(--space-8) text-(length:--font-size-label) font-medium text-app-text-primary"
                            aria-label={isOpen ? closeMenuLabel : openMenuLabel}
                            aria-expanded={isOpen}
                            aria-controls="mobile-navigation-panel"
                            onClick={() => setIsOpen((current) => !current)}
                        >
                            {isOpen ? labels.close : labels.menu}
                            {isOpen && <span aria-hidden="true">×</span>}
                        </button>
                    </div>
                </Container>
            </header>

            <div
                ref={panelRef}
                id="mobile-navigation-panel"
                inert={!isOpen}
                aria-hidden={!isOpen}
                className={`${styles.panel} fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-app-background transition-[opacity,transform] duration-(--motion-ui) ease-out motion-reduce:transition-none md:hidden ${isOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
            >
                <Container>
                    <nav
                        aria-label={openMenuLabel}
                        className="flex min-h-dvh flex-col items-end gap-(--space-40) pt-[calc(var(--shell-header-offset)+var(--space-32))] text-right"
                    >
                        <ul className="flex flex-col items-end gap-(--space-20)">
                            <li>
                                <Link
                                    href={homePath}
                                    onClick={(event) => handleInternalNavigation(event, homePath)}
                                    aria-current={isHomeActive ? "page" : undefined}
                                    className={mobileNavLinkClass(isHomeActive)}
                                >
                                    {labels.home}
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href={projectsPath}
                                    onClick={(event) => handleInternalNavigation(event, projectsPath)}
                                    aria-current={pathname === projectsPath ? "page" : undefined}
                                    className={mobileNavLinkClass(isProjectsActive)}
                                >
                                    {labels.projects}
                                </Link>
                            </li>

                            <li>
                                <Link
                                    href={aboutPath}
                                    onClick={(event) => handleInternalNavigation(event, aboutPath)}
                                    aria-current={pathname === aboutPath ? "page" : undefined}
                                    className={mobileNavLinkClass(isAboutActive)}
                                >
                                    {labels.about}
                                </Link>
                            </li>
                        </ul>

                        <div className="mt-auto w-full pt-(--space-24)">
                            {(professionalLinks.github || professionalLinks.linkedin) && (
                                <div className="flex flex-wrap justify-end gap-(--space-20) text-(length:--font-size-label) font-medium">
                                    {professionalLinks.github && (
                                        <a
                                            href={professionalLinks.github}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-10 items-center text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-accent motion-reduce:transition-none"
                                        >
                                            GITHUB ↗
                                        </a>
                                    )}

                                    {professionalLinks.linkedin && (
                                        <a
                                            href={professionalLinks.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex min-h-10 items-center text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-accent motion-reduce:transition-none"
                                        >
                                            LINKEDIN ↗
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </Container>
            </div>
        </>
    );
}
