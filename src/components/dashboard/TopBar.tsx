import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function TopBar() {
  return (
    <header className="flex h-10 shrink-0 items-center justify-end px-4">
      <ThemeToggle />
    </header>
  );
}
