import { Container } from "@/components/layout/Container";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { locales } from "@/i18n/config";

import Link from "next/link";

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
    return (
        <header className="fixed inset-x-0 top-0 z-50 hidden border-b border-app-border bg-app-background md:block">
            <Container>
                <nav className="flex items-center justify-between">
                    <ul className="flex items-center gap-(--space-24) py-(--space-16)">
                        <li>
                            <Link
                                href={`/${currentLocale}`}
                                className="relative block py-(--space-4) font-medium text-app-text-primary transition-colors duration-(--motion-fast) after:absolute after:inset-x-0 after:-bottom-(--space-4) after:h-0.5 after:bg-app-accent"
                            >
                                {labels.home}
                            </Link>
                        </li>

                        <li>
                            <Link
                                href={`/${currentLocale}/projects`}
                                className="text-(length:--font-size-label) font-medium text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-text-primary"
                            >
                                {labels.projects}
                            </Link>
                        </li>

                        <li>
                            <Link
                                href={`/${currentLocale}/about`}
                                className="text-(length:--font-size-label) font-medium text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-text-primary"
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