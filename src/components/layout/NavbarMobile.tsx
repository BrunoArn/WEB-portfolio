import { Container } from "@/components/layout/Container";

type NavbarMobileProps = {
  name: string;
};

export function NavbarMobile({ name }: NavbarMobileProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-app-background md:hidden">
      <Container>
        <div className="flex items-center justify-between py-(--space-20)">
          <span className="text-(length:--font-size-label) font-medium text-app-text-primary">
            {name}
          </span>

          <button
            type="button"
            className="text-(length:--font-size-label) font-medium text-app-text-primary"
            aria-label="Open navigation menu"
          >
            [MENU]
          </button>
        </div>
      </Container>
    </header>
  );
}