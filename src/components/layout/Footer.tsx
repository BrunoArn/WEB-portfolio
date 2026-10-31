"use client";

import { usePathname } from "next/navigation";
import { locales } from "@/i18n/config";
import styles from "./Footer.module.css";

type FooterProps = {
    name: string;
    professionalLinks: {
        github: string;
        linkedin: string;
    };
};

export function Footer({
    name,
    professionalLinks,
}: FooterProps) {
    const pathname = usePathname();
    const isHome = locales.some((locale) => pathname === `/${locale}`);
    const linkClassName =
        "inline-flex min-h-10 items-center rounded-(--radius-control) transition-colors duration-(--motion-fast) hover:text-app-accent focus-visible:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-app-accent motion-reduce:transition-none md:min-h-8";

    return (
        <footer
            data-home={isHome}
            className={`${styles.footer} shrink-0 font-interface text-(length:--font-size-label) font-medium leading-(--line-height-label) text-app-text-secondary`}
        >
            <div className={`${styles.content} flex min-h-(--shell-footer-reserve) flex-col justify-center gap-(--space-8) py-(--space-12) md:flex-row md:items-center md:justify-between`}>
                <p>
                    {name}
                </p>

                <div className="flex flex-wrap gap-(--space-20)">
                    <a
                        href={professionalLinks.github}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClassName}
                    >
                        GitHub
                    </a>

                    <a
                        href={professionalLinks.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClassName}
                    >
                        LinkedIn
                    </a>
                </div>
            </div>
        </footer>
    );
}