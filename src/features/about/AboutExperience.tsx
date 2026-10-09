
import type { AboutExperience as Experience } from "@/content/types/about";

type AboutExperienceProps = {
    experiences: Experience[];
    title: string;
    presentLabel: string;
};

export function AboutExperience({
    experiences,
    title,
    presentLabel,
}: AboutExperienceProps) {
    if (experiences.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-experience-title"
            className="pt-0"
        >
            <h2
                id="about-experience-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <div className="mt-(--space-32) flex flex-col">
                {experiences.map((experience) => (
                    <article
                        key={experience.id}
                        className="border-t border-app-border py-(--space-24)"
                    >
                        <div className="flex flex-col gap-(--space-8) md:flex-row md:items-baseline md:justify-between md:gap-(--space-24)">
                            <h3 className="min-w-0 wrap-break-word text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                                {experience.role}
                            </h3>

                            <p className="shrink-0 text-(length:--font-size-label) text-app-text-secondary">
                                {experience.startYear} —{" "}
                                {experience.isCurrent
                                    ? presentLabel
                                    : (experience.endYear ?? "")}
                            </p>
                        </div>

                        <p className="wrap-break-word mt-(--space-8) text-(length:--font-size-body) text-app-accent">
                            {experience.organization}
                        </p>

                        <p className="wrap-break-word mt-(--space-16) max-w-3xl whitespace-pre-line text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                            {experience.description}
                        </p>
                    </article>
                ))}
            </div>
        </section>
    );
}
