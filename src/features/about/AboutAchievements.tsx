
import type { AboutAchievement } from "@/content/types/about";

type AboutAchievementsProps = {
    achievements: AboutAchievement[];
    title: string;
};

export function AboutAchievements({
    achievements,
    title,
}: AboutAchievementsProps) {
    if (achievements.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="about-achievements-title"
            className="pt-(--section-spacing-mobile) pb-(--section-spacing-mobile) md:pt-(--section-spacing-desktop) md:pb-(--section-spacing-desktop)"
        >
            <h2
                id="about-achievements-title"
                className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)"
            >
                {title}
            </h2>

            <div className="mt-(--space-32) flex flex-col">
                {achievements.map((achievement) => (
                    <article
                        key={achievement.id}
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-(--space-20) border-t border-app-border py-(--space-24)"
                    >
                        <span className="text-(length:--font-size-label) font-medium tabular-nums text-app-accent">
                            {achievement.year}
                        </span>

                        <div className="min-w-0">
                            <h3 className="text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                                {achievement.title}
                            </h3>

                            <p className="mt-(--space-8) whitespace-pre-line wrap-break-word text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                                {achievement.description}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
