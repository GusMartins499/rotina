import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "./layout";
import { ThemeToggle } from "./ThemeToggle";
import { DARK_SCHEME_QUERY, THEME_SCRIPT, THEME_STORAGE_KEY } from "./theme";

function systemPrefers(scheme: "light" | "dark") {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === DARK_SCHEME_QUERY && scheme === "dark",
  })) as unknown as typeof window.matchMedia;
}

function loadPage() {
  delete document.documentElement.dataset.theme;
  new Function(THEME_SCRIPT)();
}

function renderedTheme() {
  return document.documentElement.dataset.theme;
}

describe("theme toggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    systemPrefers("light");
    delete document.documentElement.dataset.theme;
  });

  it("starts from the system preference on the first visit", () => {
    systemPrefers("dark");

    loadPage();

    expect(renderedTheme()).toBe("dark");
  });

  it("switches to the other theme when toggled", async () => {
    loadPage();
    render(<ThemeToggle />);

    await userEvent.click(screen.getByTestId("theme-toggle"));

    expect(renderedTheme()).toBe("dark");
  });

  it("persists the choice across reloads", async () => {
    loadPage();
    const { unmount } = render(<ThemeToggle />);
    await userEvent.click(screen.getByTestId("theme-toggle"));
    unmount();

    loadPage();
    render(<ThemeToggle />);

    expect(renderedTheme()).toBe("dark");
    expect(screen.getByRole("button", { name: "Tema escuro" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps the chosen theme when the system preference changes", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    systemPrefers("dark");

    loadPage();

    expect(renderedTheme()).toBe("light");
  });

  it("announces the state of the toggle", async () => {
    loadPage();
    render(<ThemeToggle />);
    const toggle = screen.getByRole("button", { name: "Tema escuro" });

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("follows a theme stamped on the document after mount", () => {
    loadPage();
    render(<ThemeToggle />);

    act(() => {
      document.documentElement.dataset.theme = "dark";
    });

    return vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Tema escuro" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
  });

  it("does not flash the wrong theme before hydration", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <p>conteúdo</p>
      </RootLayout>,
    );

    const head = markup.slice(markup.indexOf("<head>"), markup.indexOf("</head>"));
    expect(head).toContain(THEME_SCRIPT);
    expect(markup.indexOf(THEME_SCRIPT)).toBeLessThan(markup.indexOf("<body>"));
  });

  it("falls back to the system preference when storage is blocked", () => {
    systemPrefers("dark");
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    loadPage();

    expect(renderedTheme()).toBe("dark");
    getItem.mockRestore();
  });

  it("keeps the choice on screen when storage refuses to save it", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    loadPage();
    render(<ThemeToggle />);

    await userEvent.click(screen.getByTestId("theme-toggle"));

    expect(renderedTheme()).toBe("dark");
    setItem.mockRestore();
  });
});
