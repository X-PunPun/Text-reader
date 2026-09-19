import { LANGUAGES, DEFAULT_LANGUAGE } from "./locales/index.js";
import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Traducción de la interfaz. Inglés por defecto; la elección se guarda
 * a través del StoragePort, nunca tocando localStorage directamente.
 */
export function createI18n({ storage }) {
  const byCode = new Map(LANGUAGES.map((lang) => [lang.code, lang]));
  const fallback = byCode.get(DEFAULT_LANGUAGE);
  const listeners = [];

  // Cada página de idioma llega con su propio <html lang>, así que esa es la
  // preferencia por defecto; lo que el usuario elija a mano manda sobre ella.
  const saved = storage.get(STORAGE_KEYS.language);
  const fromPage = document.documentElement.lang;
  let current =
    byCode.get(saved) || byCode.get(fromPage) || fallback;

  function t(key, vars) {
    let value = current.strings[key] ?? fallback.strings[key];
    if (value === undefined) return key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        value = value.split(`{${name}}`).join(String(vars[name]));
      });
    }
    return value;
  }

  function apply(root = document) {
    document.documentElement.lang = current.code;
    document.documentElement.dir = current.rtl ? "rtl" : "ltr";

    root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const text = t(el.dataset.i18nTitle);
      el.setAttribute("title", text);
      el.setAttribute("aria-label", text);
    });

    listeners.forEach((handler) => handler(current.code));
  }

  function set(code) {
    current = byCode.get(code) || fallback;
    storage.set(STORAGE_KEYS.language, current.code);
    apply();
  }

  function onChange(handler) {
    listeners.push(handler);
  }

  return {
    languages: LANGUAGES.map(({ code, label, rtl }) => ({ code, label, rtl: Boolean(rtl) })),
    t,
    set,
    apply,
    onChange,
    get code() { return current.code; }
  };
}
