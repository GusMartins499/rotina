"use client";

import { useSyncExternalStore } from "react";
import { chooseTheme, currentTheme, subscribeToTheme, type Theme } from "./theme";

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function serverTheme(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, serverTheme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      className="chip chip-icon"
      data-testid="theme-toggle"
      aria-label="Tema escuro"
      aria-pressed={dark}
      title={dark ? "Tema escuro ativo" : "Tema claro ativo"}
      onClick={() => chooseTheme(dark ? "light" : "dark")}
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
