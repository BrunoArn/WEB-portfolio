
type AboutLinksProps = {
    githubUrl?: string;
    linkedinUrl?: string;
    itchUrl?: string;
    title: string;
};

export function AboutLinks({
    githubUrl,
    linkedinUrl,
    itchUrl,
    title,
}: AboutLinksProps) {
    const links = [
        { label: "GitHub", href: githubUrl },
        { label: "LinkedIn", href: linkedinUrl },
        { label: "itch.io", href: itchUrl },
    ].filter(
        (link): link is { label: string; href: string } =>
            typeof link.href === "string" && link.href.trim().length > 0,
    );

    if (links.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-links-title"
            className="rounded-(--radius-card) border border-app-border bg-app-surface p-(--panel-padding-mobile) md:p-(--panel-padding)"
        >
            <h2
                id="about-links-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <ul className="mt-(--space-24) flex flex-col gap-(--space-16)">
                {links.map((link) => (
                    <li key={link.label}>
                        <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-10 items-center justify-between gap-(--space-16) rounded-(--radius-control) text-(length:--font-size-body) text-app-text-body transition-colors duration-(--motion-fast) hover:text-app-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                        >
                            <span>{link.label}</span>
                            <span aria-hidden="true">↗</span>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
