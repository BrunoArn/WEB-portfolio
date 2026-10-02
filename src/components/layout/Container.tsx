import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
};

export function Container({ children }: ContainerProps) {
  return (
    <div className="mx-auto w-full max-w-(--layout-max-width) px-(--layout-margin-mobile) md:px-(--layout-margin-desktop)">
      {children}
    </div>
  );
}