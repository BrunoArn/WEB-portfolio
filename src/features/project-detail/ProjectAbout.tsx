import type { Project } from "@/content/types/project";

type ProjectAboutProps = {
    project: Project;
    title: string;
};

export function ProjectAbout({
    project,
    title,
}: ProjectAboutProps) {
    return (
        <section>
            <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                {title}
            </h2>

            <div className="mt-(--space-20) max-w-3xl">
                <p className="text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                    {project.description}
                </p>

                {project.context && (
                    <p className="mt-(--space-16) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-body">
                        {project.context}
                    </p>
                )}
            </div>
        </section>
    );
}