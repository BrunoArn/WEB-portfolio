type ProjectPlayableProps = {
    source: string;
    projectTitle: string;

    labels: Readonly<{
        title: string;
        frameTitle: string;
    }>;
};

export function ProjectPlayable({
    source,
    projectTitle,
    labels,
}: ProjectPlayableProps) {
    return (
        <section>
            <h2 className="text-(length:--font-size-section-mobile) font-semibold leading-(--line-height-title) text-app-text-primary md:text-(length:--font-size-section-desktop)">
                {labels.title}
            </h2>

            <div className="mt-(--space-20) overflow-hidden rounded-(--radius-large) border border-app-border bg-black">
                <iframe
                    src={source}
                    title={`${labels.frameTitle}: ${projectTitle}`}
                    allow="fullscreen; gamepad"
                    allowFullScreen
                    className="aspect-video w-full border-0"
                />
            </div>
        </section>
    );
}