export function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  localStorage.setItem("theme", theme);
}

export function loadInitialTheme() {
  const saved = localStorage.getItem("theme") as "light" | "dark" | null;
  if (saved) {
    applyTheme(saved);
    return saved;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = prefersDark ? "dark" : "light";
  applyTheme(theme);
  return theme;
}
