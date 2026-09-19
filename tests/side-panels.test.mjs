/**
 * Los bloques de contexto responden al mismo botón: las dos notas laterales
 * y el texto descriptivo del pie.
 *
 * Necesita jsdom:  npm install && node tests/side-panels.test.mjs
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(PROJECT, "index.html"), "utf8");
const results = [];

const check = (name, fn) => {
  try { fn(); results.push(`  ok   ${name}`); }
  catch (error) { results.push(`  FAIL ${name}\n       ${error.message}`); process.exitCode = 1; }
};

async function mount(width, saved) {
  const dom = new JSDOM(html, { url: "https://site.example/Text-reader/" });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.innerWidth = width;

  const store = new Map();
  if (saved !== undefined) store.set("textreader:guide", saved);

  const { createGuide } = await import(
    resolve(PROJECT, "src/ui/components/guide.js") + `?w=${width}&s=${saved}`
  );

  createGuide({
    panels: [
      document.getElementById("guide"),
      document.getElementById("opensource"),
      document.getElementById("about")
    ],
    toggle: document.getElementById("guide-toggle"),
    storage: { get: (k, d) => (store.has(k) ? store.get(k) : d), set: (k, v) => store.set(k, v) }
  });

  return {
    dom,
    store,
    guide: () => document.getElementById("guide").classList.contains("is-open"),
    note: () => document.getElementById("opensource").classList.contains("is-open"),
    about: () => document.getElementById("about").classList.contains("is-open"),
    toggle: () => document.getElementById("guide-toggle"),
    expanded: () => document.getElementById("guide-toggle").getAttribute("aria-expanded")
  };
}

const wide = await mount(1440, undefined);
check("en pantalla ancha los tres empiezan abiertos", () => {
  assert.equal(wide.guide(), true, "guía cerrada");
  assert.equal(wide.note(), true, "nota cerrada");
  assert.equal(wide.about(), true, "texto descriptivo cerrado");
});

check("el botón los cierra a la vez", () => {
  wide.toggle().click();
  assert.equal(wide.guide(), false);
  assert.equal(wide.note(), false);
  assert.equal(wide.about(), false);
  assert.equal(wide.expanded(), "false");
});

check("y los vuelve a abrir juntos", () => {
  wide.toggle().click();
  assert.equal(wide.guide(), true);
  assert.equal(wide.note(), true);
  assert.equal(wide.about(), true);
  assert.equal(wide.expanded(), "true");
});

check("la elección queda guardada", () => {
  assert.equal(wide.store.get("textreader:guide"), "1");
});

const narrow = await mount(900, undefined);
check("en pantalla estrecha empiezan replegados", () => {
  assert.equal(narrow.guide(), false);
  assert.equal(narrow.note(), false);
  assert.equal(narrow.about(), false);
});

const remembered = await mount(900, "1");
check("una preferencia guardada manda sobre el ancho", () => {
  assert.equal(remembered.guide(), true);
  assert.equal(remembered.note(), true);
  assert.equal(remembered.about(), true);
});

check("Escape los cierra cuando tapan el contenido", () => {
  const event = new remembered.dom.window.KeyboardEvent("keydown", { key: "Escape" });
  remembered.dom.window.document.dispatchEvent(event);
  assert.equal(remembered.guide(), false);
  assert.equal(remembered.note(), false);
  assert.equal(remembered.about(), false);
});

check("plegado no significa borrado: el texto sigue en el documento", () => {
  // importa para los buscadores: nada de display:none
  const about = remembered.dom.window.document.getElementById("about");
  assert.ok(about.textContent.includes("gratis") || about.textContent.includes("free"));
  assert.ok(about.querySelectorAll("dt").length >= 4, "faltan las preguntas frecuentes");
});

console.log(results.join("\n"));
console.log(process.exitCode ? "\nHay fallos." : `\n${results.length} comprobaciones correctas.`);
