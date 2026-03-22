"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 dark:hidden"
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark mode"
      >
        <Moon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-9 hidden dark:flex"
        onClick={() => setTheme("light")}
        aria-label="Switch to light mode"
      >
        <Sun className="size-4" />
      </Button>
    </>
  );
}
