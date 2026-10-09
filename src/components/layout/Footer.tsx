import { Container } from "@/components/layout/Container";

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
    const linkClassName =
        "text-app-text-secondary transition-colors duration-(--motion-fast) hover:text-app-accent focus-visible:text-app-accent";

    return (
        <footer className="border-t border-app-border">
            <Container>
                <div className="flex flex-col gap-(--space-16) py-(--space-24) md:flex-row md:items-center md:justify-between">
                    <p className="text-(length:--font-size-label) font-medium text-app-text-secondary">
                        {name}
                    </p>

                    <div className="flex flex-wrap gap-(--space-20) text-(length:--font-size-label) font-medium">
                        <a
                            href={professionalLinks.github}
                            target="_blank"
                            rel="noreferrer"
                            className={linkClassName}
                        >
                            GITHUB ↗
                        </a>

                        <a
                            href={professionalLinks.linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className={linkClassName}
                        >
                            LINKEDIN ↗
                        </a>
                    </div>
                </div>
            </Container>
        </footer>
    );
}