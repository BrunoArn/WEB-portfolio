
import type { AboutSkillGroup } from "@/content/types/about";

type AboutSkillsProps = {
    groups: AboutSkillGroup[];
    title: string;
};

export function AboutSkills({
    groups,
    title,
}: AboutSkillsProps) {
    if (groups.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-skills-title"
            className="rounded-(--radius-card) border border-app-border bg-app-surface p-(--panel-padding-mobile) md:p-(--panel-padding)"
        >
            <h2
                id="about-skills-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <div className="mt-(--space-24) flex flex-col gap-(--space-24)">
                {groups.map((group) => (
                    <div key={group.id}>
                        <h3 className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) tracking-wide text-app-text-secondary">
                            {group.title}
                        </h3>

                        <ul className="mt-(--space-12) flex flex-wrap gap-(--space-8)">
                            {group.skills.map((skill, index) => (
                                <li
                                    key={`${group.id}-${index}`}
                                    className="rounded-(--radius-control) border border-app-border px-(--space-8) py-(--space-4) text-(length:--font-size-label) leading-(--line-height-label) text-app-text-body"
                                >
                                    {skill}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
    );
}
