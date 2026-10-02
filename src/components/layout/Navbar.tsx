import { Container } from "@/components/layout/Container";

type NavbarProps = {
  labels: {
    home: string;
    projects: string;
    about: string;
  };
};

export function Navbar({ labels }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-app-background">
      <Container>
        <nav>
          <ul className="flex items-center gap-(--space-24) py-(--space-16)">
            <li className="text-(length:--font-size-label) font-medium text-app-text-primary">
              {labels.home}
            </li>

            <li className="text-(length:--font-size-label) font-medium text-app-text-secondary">
              {labels.projects}
            </li>

            <li className="text-(length:--font-size-label) font-medium text-app-text-secondary">
              {labels.about}
            </li>
          </ul>
        </nav>
      </Container>
    </header>
  );
}