import type { AtlasAnchor, AtlasContent, AtlasTerritory } from "./atlas-types";
import { getAtlasBackgroundScene, type AtlasBackgroundScene } from "./atlas-background-scene";
import styles from "./AtlasBackground.module.css";
import mapStyles from "./AtlasMap.module.css";

type AtlasBackdropProps = {
    projectSlug?: string;
    projectId?: string;
    projects: AtlasAnchor[];
    territories: AtlasTerritory[];
    terrain: AtlasContent["terrain"];
    framing?: {
        title: string;
        category: string;
        description: string;
        detail: string;
        unavailable: string;
        hasImage: boolean;
        hasDetail: boolean;
    };
};

export async function AtlasBackdrop({ projectSlug, projectId, projects, territories, terrain, framing }: AtlasBackdropProps) {
    let desktop: AtlasBackgroundScene, mobile: AtlasBackgroundScene;
    try {
        [desktop, mobile] = await Promise.all([
            getAtlasBackgroundScene({ projects, territories, terrain, mobile: false }),
            getAtlasBackgroundScene({ projects, territories, terrain, mobile: true }),
        ]);
    } catch {
        // A failed optional decoration must leave the original page usable.
        return null;
    }
    const project = projects.find(anchor => anchor.id === projectId);

    const landscape = (scene: AtlasBackgroundScene, isMobile: boolean) => {
        const zoom = project ? (isMobile ? 1.65 : 1.85) : 1;
        const width = scene.width / zoom, height = scene.height / zoom;
        const x = project ? (isMobile ? project.mx : project.x) * scene.width - width / 2 : 0;
        const y = project ? (isMobile ? project.my : project.y) * scene.height - height / 2 : 0;
        const { left, top, right, bottom } = scene.bounds;
        const mask = `atlas-relief-${scene.id}`;
        return (
            <svg
                key={scene.id}
                className={`${styles.landscape} ${isMobile ? styles.mobile : styles.desktop} ${project ? styles.projectScene : ""} ${isMobile && project ? styles.mobileProject : ""}`}
                viewBox={`${x} ${y} ${width} ${height}`}
                preserveAspectRatio={project ? "xMidYMid meet" : "xMidYMax meet"}
                data-atlas-profile={isMobile ? "mobile" : "desktop"}
                focusable="false"
            >
                <defs>
                    <mask id={mask} x={left} y={top} width={right - left} height={bottom - top} maskUnits="userSpaceOnUse" style={{ maskType: "alpha" }}>
                        {scene.paths.map(({ d, opacity }, index) => <path key={index} d={d} fill="white" fillOpacity={opacity} />)}
                    </mask>
                </defs>
                <image
                    x={left}
                    y={top}
                    width={right - left}
                    height={bottom - top}
                    href={scene.palette}
                    preserveAspectRatio="none"
                    mask={`url(#${mask})`}
                />
            </svg>
        );
    };

    return (
        <div className={styles.backdrop} data-atlas-background={projectSlug ? "project" : "full"} data-project-atlas-background={projectSlug} aria-hidden="true">
            {framing && (
                <div className={`${mapStyles.root} ${styles.cameraReferenceRoot}`} inert>
                    <div className={mapStyles.cardFrame}>
                        <div className={mapStyles.card}>
                            <div className={`${mapStyles.selectedMedia} ${styles.cameraFocus}`} />
                            <div className={mapStyles.selectedCopy}>
                                <p className={mapStyles.selectedCategory}>{framing.category}</p>
                                <div className={mapStyles.selectedTitle}>{framing.title}</div>
                                <p>{framing.description}</p>
                                <p className={mapStyles.mediaNote} hidden={framing.hasImage}>{framing.unavailable}</p>
                                <span className={mapStyles.detailLink} hidden={!framing.hasDetail}>{framing.detail}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {landscape(desktop, false)}
            {landscape(mobile, true)}
        </div>
    );
}
