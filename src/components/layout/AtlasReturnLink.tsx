import { IntentLink } from "@/components/navigation/IntentLink";
import styles from "./AtlasReturnLink.module.css";

type Props = { href: string; label: string; compactLabel: string; accessibleLabel: string };

export function AtlasReturnLink({ href, label, compactLabel, accessibleLabel }: Props) {
    return (
        <IntentLink href={href} scroll aria-label={accessibleLabel} data-atlas-return className={styles.link}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
                <path d="M14 8H2m6-6-6 6 6 6" />
            </svg>
            <span className={styles.fullLabel}>{label}</span>
            <span className={styles.compactLabel}>{compactLabel}</span>
        </IntentLink>
    );
}
