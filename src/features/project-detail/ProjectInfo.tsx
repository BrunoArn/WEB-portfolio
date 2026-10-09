import type {
    Project,
    ProjectStatus,
} from "@/content/types/project";

type ProjectInfoProps = {
    project: Project;

    labels: Readonly<{
        title: string;
        role: string;
        year: string;
        team: string;
        technologies: string;
        organization: string;
        status: string;

        statuses: Record<ProjectStatus, string>;
    }>;
};

export function ProjectInfo({
    project,
    labels,
}: ProjectInfoProps) {
    return (
        <aside className="min-w-0 [overflow-wrap:anywhere] rounded-(--radius-card) border border-app-border bg-app-surface p-(--panel-padding-mobile) md:p-(--panel-padding)">
            <h2 className="text-(length:--font-size-card-mobile) font-medium leading-(--line-height-card) text-app-text-primary md:text-(length:--font-size-card-desktop)">
                {labels.title}
            </h2>

            <dl className="mt-(--space-24) grid gap-(--space-20)">
                <div>
                    <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                        {labels.role}
                    </dt>

                    <dd className="mt-(--space-8) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary">
                        {project.role}
                    </dd>
                </div>

                <div>
                    <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                        {labels.year}
                    </dt>

                    <dd className="mt-(--space-8) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary">
                        {project.year}
                    </dd>
                </div>

                {project.team.length > 0 && (
                    <div>
                        <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                            {labels.team}
                        </dt>

                        <dd className="mt-(--space-8)">
                            <ul className="grid gap-(--space-8)">
                                {project.team.map((member) => (
                                    <li
                                        key={`${member.name}-${member.role}`}
                                        className="text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary"
                                    >
                                        {member.name}
                                        <span className="text-app-text-secondary">
                                            {" "}· {member.role}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </dd>
                    </div>
                )}

                {project.technologies.length > 0 && (
                    <div>
                        <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                            {labels.technologies}
                        </dt>

                        <dd className="mt-(--space-8) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary">
                            {project.technologies.join(" · ")}
                        </dd>
                    </div>
                )}

                {project.organization && (
                    <div>
                        <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                            {labels.organization}
                        </dt>

                        <dd className="mt-(--space-8) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary">
                            {project.organization}
                        </dd>
                    </div>
                )}

                <div>
                    <dt className="text-(length:--font-size-label) font-medium uppercase leading-(--line-height-label) text-app-text-secondary">
                        {labels.status}
                    </dt>

                    <dd className="mt-(--space-8) text-(length:--font-size-body) leading-(--line-height-body) text-app-text-primary">
                        {labels.statuses[project.status]}
                    </dd>
                </div>
            </dl>
        </aside>
    );
}