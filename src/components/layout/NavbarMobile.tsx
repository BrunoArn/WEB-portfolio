"use client";

import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/layout/Container";

type NavbarMobileProps = {
    name: string;
    openMenuLabel: string;
    closeMenuLabel: string;
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
    labels,
}: NavbarMobileProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

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

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") {
                return;
            }

            setIsOpen(false);

            const isDesktop = window.matchMedia("(min-width: 48rem)").matches;

            if (!isDesktop) {
                requestAnimationFrame(() => {
                    menuButtonRef.current?.focus();
                });
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
                id="mobile-navigation-panel"
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
                            <li className="text-(length:--font-size-page-mobile) font-semibold text-app-text-primary">
                                {labels.home}
                            </li>

                            <li className="text-(length:--font-size-page-mobile) font-semibold text-app-text-primary">
                                {labels.projects}
                            </li>

                            <li className="text-(length:--font-size-page-mobile) font-semibold text-app-text-primary">
                                {labels.about}
                            </li>
                        </ul>
                    </nav>
                </Container>
            </div>
        </>
    );
}