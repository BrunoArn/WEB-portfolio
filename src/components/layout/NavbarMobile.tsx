"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { locales } from "@/i18n/config";

type Locale = (typeof locales)[number];

type NavbarMobileProps = {
    name: string;
    openMenuLabel: string;
    closeMenuLabel: string;
    currentLocale: Locale;
    professionalLinks: {
        github?: string;
        linkedin?: string;
    };
    labels: {
        home: string;
        projects: string;
        about: string;
    };
};

export function NavbarMobile({
    name,
    openMenuLabel,
    closeMenuLabel,
    currentLocale,
    professionalLinks,
    labels,
}: NavbarMobileProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const desktopMediaQuery = window.matchMedia("(min-width: 48rem)");
        const previousOverflow = document.body.style.overflow;

        const syncScrollLock = () => {
            document.body.style.overflow = desktopMediaQuery.matches
                ? previousOverflow
                : "hidden";
        };

        syncScrollLock();

        desktopMediaQuery.addEventListener("change", syncScrollLock);

        return () => {
            desktopMediaQuery.removeEventListener("change", syncScrollLock);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const panel = panelRef.current;
        const menuButton = menuButtonRef.current;

        if (!panel || !menuButton) {
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

            const focusableElements = [menuButton, ...panelElements];

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

    useEffect(() => {
        const desktopMediaQuery = window.matchMedia("(min-width: 48rem)");

        const handleBreakpointChange = (event: MediaQueryListEvent) => {
            if (event.matches) {
                setIsOpen(false);
            }
        };

        desktopMediaQuery.addEventListener("change", handleBreakpointChange);

        return () => {
            desktopMediaQuery.removeEventListener("change", handleBreakpointChange);
        };
    }, []);

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-app-background md:hidden">
                <Container>
                    <div className="flex items-center justify-between py-(--space-20)">
                        <span className="text-(length:--font-size-label) font-medium text-app-text-primary">
                            {name}
                        </span>

                        <button
                            ref={menuButtonRef}
                            type="button"
                            className="text-(length:--font-size-label) font-medium text-app-text-primary"
                            aria-label={isOpen ? closeMenuLabel : openMenuLabel}
                            aria-expanded={isOpen}
                            aria-controls="mobile-navigation-panel"
                            onClick={() => setIsOpen((current) => !current)}
                        >
                            [MENU]
                        </button>
                    </div>
                </Container>
            </header>

            <div
                ref={panelRef}
                id="mobile-navigation-panel"
                inert={!isOpen}
                aria-hidden={!isOpen}
                className={`fixed inset-0 z-40 bg-app-background transition-[opacity,transform] duration-(--motion-ui) ease-out motion-reduce:transition-none md:hidden ${isOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-2 opacity-0"
                    }`}
            >
                <Container>
                    <nav
                        aria-label={openMenuLabel}
                        className="flex min-h-dvh flex-col pt-[calc(var(--space-40)+var(--space-40))]"
                    >
                        <ul className="flex flex-col gap-(--space-20)">
                            <li>
                                <Link
                                    href={`/${currentLocale}`}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-(length:--font-size-page-mobile) font-semibold text-app-text-primary"
                                >
                                    {labels.home}
                                </Link>
                            </li>

                            <li className="text-(length:--font-size-page-mobile) font-semibold text-app-text-primary">
                                {labels.projects}
                            </li>

                            <li className="text-(length:--font-size-page-mobile) font-semibold text-app-text-primary">
                                {labels.about}
                            </li>
                        </ul>

                        <div className="mt-auto flex flex-col gap-(--space-20) pb-(--space-24)">
                            <LocaleSwitcher currentLocale={currentLocale} />

                            {(professionalLinks.github || professionalLinks.linkedin) && (
                                <div className="flex gap-(--space-20) text-(length:--font-size-label) font-medium">
                                    {professionalLinks.github && (
                                        <a
                                            href={professionalLinks.github}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-app-text-secondary"
                                        >
                                            GITHUB ↗
                                        </a>
                                    )}

                                    {professionalLinks.linkedin && (
                                        <a
                                            href={professionalLinks.linkedin}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-app-text-secondary"
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