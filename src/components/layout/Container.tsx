import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export function Container({ children }: ContainerProps) {
  return (
    <div className="mx-auto w-full max-w-[var(--layout-max-width)] px-[var(--layout-margin-mobile)] md:px-[var(--layout-margin-desktop)]">
      {children}
    </div>
  );
}