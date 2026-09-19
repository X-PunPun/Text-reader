/**
 * Genera una página por idioma a partir de index.html.
 *
 * Un buscador indexa texto, y la traducción de la interfaz ocurre en
 * JavaScript: para Google eso es una sola página en inglés. Con una URL por
 * idioma, cada versión tiene su título, su descripción y su contenido ya
 * escritos en el HTML, y las etiquetas hreflang las enlazan entre sí.
 *
 * Uso:  node scripts/build-pages.mjs
 *
 * La plantilla es scripts/page.template.html. Cualquier cambio en la interfaz
 * se hace ahí y luego se vuelve a ejecutar este script; index.html y las
 * carpetas de idioma son salida generada, no se editan a mano.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTENT, SITE } from "./seo-content.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const template = readFileSync(resolve(root, "scripts/page.template.html"), "utf8");
const RTL = new Set(["ar"]);

const escapeAttr = (value) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const escapeHtml = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeJson = (value) => JSON.stringify(value).slice(1, -1);

function build(code) {
  const data = CONTENT[code];
  const isRoot = code === "en";
  const canonical = isRoot ? `${SITE}/` : `${SITE}/${code}/`;

  let page = template;

  // idioma y dirección del documento
  page = page.replace(
    '<html lang="en">',
    `<html lang="${code}"${RTL.has(code) ? ' dir="rtl"' : ""}>`
  );

  // rutas relativas: las subcarpetas suben un nivel
  if (!isRoot) {
    page = page.replace(/(href|src)="src\//g, '$1="../src/');
  }

  const fields = {
    SEO_CANONICAL: canonical,
    SEO_BASE: isRoot ? "." : "..",
    SEO_LOCALE: data.locale,
    SEO_LANG: code
  };

  // atributos del head
  page = page
    .replace(/SEO_TITLE/g, escapeAttr(data.title))
    .replace(/SEO_DESCRIPTION/g, escapeAttr(data.description));

  Object.entries(fields).forEach(([key, value]) => {
    page = page.replace(new RegExp(key, "g"), value);
  });

  // contenido visible
  const body = {
    SEO_H1: data.h1,
    SEO_INTRO: data.intro,
    SEO_HA: data.ha,
    SEO_PA: data.pa,
    SEO_HB: data.hb,
    SEO_PB: data.pb,
    SEO_HC: data.hc,
    SEO_PC: data.pc,
    SEO_HFAQ: data.hfaq
  };
  Object.entries(body).forEach(([key, value]) => {
    page = page.replace(new RegExp(key, "g"), escapeHtml(value));
  });

  data.faq.forEach(([question, answer], i) => {
    page = page
      .replace(new RegExp(`SEO_Q${i + 1}`, "g"), escapeHtml(question))
      .replace(new RegExp(`SEO_A${i + 1}`, "g"), escapeHtml(answer));
  });
  data.features.forEach((feature, i) => {
    page = page.replace(new RegExp(`SEO_F${i + 1}`, "g"), escapeJson(feature));
  });

  // dentro del JSON-LD las comillas ya escapadas de HTML sobran
  page = page.replace(/"name": "([^"]*)"/g, (match) => match.replace(/&quot;/g, "'"));

  const target = isRoot
    ? resolve(root, "index.html")
    : resolve(root, code, "index.html");

  if (!isRoot) mkdirSync(resolve(root, code), { recursive: true });
  writeFileSync(target, page, "utf8");
  return target.replace(root + "/", "");
}

function sitemap(codes) {
  const urls = codes
    .map((code) => {
      const loc = code === "en" ? `${SITE}/` : `${SITE}/${code}/`;
      const alternates = codes
        .map((other) => {
          const href = other === "en" ? `${SITE}/` : `${SITE}/${other}/`;
          return `    <xhtml:link rel="alternate" hreflang="${other}" href="${href}"/>`;
        })
        .join("\n");
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`,
        "    <changefreq>monthly</changefreq>",
        `    <priority>${code === "en" ? "1.0" : "0.8"}</priority>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
}

const codes = Object.keys(CONTENT);
const written = codes.map(build);

writeFileSync(resolve(root, "sitemap.xml"), sitemap(codes), "utf8");
writeFileSync(
  resolve(root, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
  "utf8"
);

console.log(`Generadas ${written.length} páginas:`);
written.forEach((file) => console.log(`  ${file}`));
console.log("  sitemap.xml\n  robots.txt");
