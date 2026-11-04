"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentProps } from "react";

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
    href: string;
};

/** Let Next manage its cache, but only after interaction with this destination. */
export function IntentLink({ href, onPointerEnter, onPointerDown, onFocus, ...props }: IntentLinkProps) {
    const [intentHref, setIntentHref] = useState<string>();
    const pathname = usePathname();

    return (
        <Link
            {...props}
            href={href}
            prefetch={href !== pathname && intentHref === href ? null : false}
            onPointerEnter={(event) => {
                onPointerEnter?.(event);
                if (!event.defaultPrevented && event.pointerType === "mouse" && event.buttons === 0) setIntentHref(href);
            }}
            onPointerDown={(event) => {
                onPointerDown?.(event);
                if (!event.defaultPrevented && event.isPrimary && event.pointerType !== "mouse") setIntentHref(href);
            }}
            onFocus={(event) => {
                onFocus?.(event);
                if (!event.defaultPrevented) setIntentHref(href);
            }}
        />
    );
}
