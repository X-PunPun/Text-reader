import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Botón claro / oscuro. Sin preferencia guardada sigue al sistema.
 */
export function createThemeToggle({ button, icon, storage }) {
  function effective() {
    const forced = document.documentElement.getAttribute("data-theme");
    if (forced === "light" || forced === "dark") return forced;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function paint() {
    icon.textContent = effective() === "dark" ? "☀" : "☾";
  }

  button.addEventListener("click", () => {
    const next = effective() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    storage.set(STORAGE_KEYS.theme, next);
    paint();
  });

  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", paint);
  paint();

  return { paint };
}
