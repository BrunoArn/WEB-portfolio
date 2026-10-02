"use client";

import { useState } from "react";

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

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-app-background md:hidden">
        <Container>
          <div className="flex items-center justify-between py-(--space-20)">
            <span className="text-(length:--font-size-label) font-medium text-app-text-primary">
              {name}
            </span>

            <button
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

      {isOpen && (
        <div
          id="mobile-navigation-panel"
          className="fixed inset-0 z-40 bg-app-background md:hidden"
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
      )}
    </>
  );
}