/**
 * Navegación entre las versiones de idioma.
 *
 * Cada idioma es una URL propia (`/`, `/es/`, `/pt/`...) porque su contenido
 * está escrito en el HTML, no traducido en tiempo de ejecución. Elegir un
 * idioma en el selector tiene que llevar a esa página: traducir solo la
 * interfaz dejaría el resto del texto en inglés.
 */

/** Código de idioma que corresponde a la URL actual. */
export function currentLanguageFrom(pathname, codes) {
  const parts = pathname.replace(/index\.html$/, "").split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  return codes.includes(last) ? last : "en";
}

/** Ruta de la versión de un idioma, conservando la carpeta del sitio. */
export function pathForLanguage(code, pathname, codes) {
  const parts = pathname.replace(/index\.html$/, "").split("/").filter(Boolean);
  if (parts.length && codes.includes(parts[parts.length - 1])) parts.pop();

  const base = `/${parts.length ? `${parts.join("/")}/` : ""}`;
  return code === "en" ? base : `${base}${code}/`;
}
