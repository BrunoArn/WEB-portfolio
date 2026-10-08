
import type { AboutEducation as Education } from "@/content/types/about";

type AboutEducationProps = {
    education: Education[];
    title: string;
};

export function AboutEducation({
    education,
    title,
}: AboutEducationProps) {
    if (education.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-education-title"
            className="py-(--section-spacing-mobile) md:py-(--section-spacing-desktop)"
        >
            <h2
                id="about-education-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <div className="mt-(--space-32) flex flex-col">
                {education.map((entry) => (
                    <article
                        key={entry.id}
                        className="border-t border-app-border py-(--space-24)"
                    >
                        <div className="flex flex-col gap-(--space-8) md:flex-row md:items-baseline md:justify-between md:gap-(--space-24)">
                            <h3 className="text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                                {entry.degree}
                            </h3>

                            {(entry.startYear || entry.endYear) && (
                                <p className="shrink-0 text-(length:--font-size-label) text-app-text-secondary">
                                    {entry.startYear && entry.endYear
                                        ? `${entry.startYear} — ${entry.endYear}`
                                        : (entry.startYear ?? entry.endYear)}
                                </p>
                            )}
                        </div>

                        <p className="mt-(--space-8) text-(length:--font-size-body) text-app-accent">
                            {entry.institution}
                        </p>

                        {entry.description && (
                            <p className="mt-(--space-16) max-w-3xl whitespace-pre-line text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                                {entry.description}
                            </p>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
