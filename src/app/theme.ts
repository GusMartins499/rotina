export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "rotina-theme";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export const THEME_SCRIPT = `(function () {
  var theme;
  try {
    theme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  } catch (error) {}
  if (theme !== "light" && theme !== "dark") {
    var prefersDark = false;
    try {
      prefersDark = window.matchMedia(${JSON.stringify(DARK_SCHEME_QUERY)}).matches;
    } catch (error) {}
    theme = prefersDark ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();`;

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function chooseTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}
}

export function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
