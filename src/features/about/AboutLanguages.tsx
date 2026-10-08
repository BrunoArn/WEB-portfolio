
import type { AboutLanguage } from "@/content/types/about";

type AboutLanguagesProps = {
    languages: AboutLanguage[];
    title: string;
};

export function AboutLanguages({
    languages,
    title,
}: AboutLanguagesProps) {
    if (languages.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-languages-title"
            className="rounded-(--radius-card) border border-app-border bg-app-surface p-(--panel-padding-mobile) md:p-(--panel-padding)"
        >
            <h2
                id="about-languages-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <dl className="mt-(--space-24) flex flex-col gap-(--space-16)">
                {languages.map((language) => (
                    <div
                        key={language.id}
                        className="flex flex-wrap items-baseline justify-between gap-x-(--space-16) gap-y-(--space-4)"
                    >
                        <dt className="text-(length:--font-size-body) font-medium text-app-text-primary">
                            {language.name}
                        </dt>

                        <dd className="text-(length:--font-size-body) text-app-text-secondary">
                            {language.proficiency}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
