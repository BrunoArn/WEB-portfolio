import Link from "next/link";

type HomeHeroProps = {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
};

export function HomeHero({
    eyebrow,
    title,
    description,
    ctaLabel,
    ctaHref,
}: HomeHeroProps) {
    return (
        <section className="py-(--section-spacing-mobile) md:py-(--section-spacing-desktop)">
            <div className="max-w-4xl">
                <p className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) tracking-wide text-app-accent">
                    {eyebrow}
                </p>

                <h1 className="mt-(--space-16) text-(length:--font-size-hero-mobile) font-semibold leading-(--line-height-hero) text-app-text-primary md:text-(length:--font-size-hero-desktop)">
                    {title}
                </h1>

                <p className="mt-(--space-16) max-w-3xl text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                    {description}
                </p>

                <Link
                    href={ctaHref}
                    className="mt-(--space-24) inline-flex min-h-10 items-center rounded-(--radius-control) bg-app-accent px-(--space-16) text-(length:--font-size-label) font-medium uppercase text-app-background transition-opacity duration-(--motion-default) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
                >
                    {ctaLabel} ↗
                </Link>
            </div>
        </section>
    );
}