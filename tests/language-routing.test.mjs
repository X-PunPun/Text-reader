/**
 * Comprueba el salto entre versiones de idioma.
 *
 * El script que decide el destino va incrustado en el <head> de cada página,
 * porque tiene que ejecutarse antes de pintar nada. Aquí se carga la página
 * de verdad y se le pregunta a ese mismo script a dónde iría, sin navegar.
 *
 * Necesita jsdom:  npm install && node tests/language-routing.test.mjs
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];

/** Carga una pagina real y consulta a su propio script a donde iria. */
function target(file, url, saved) {
  const html = readFileSync(resolve(PROJECT, file), "utf8");
  const dom = new JSDOM(html, { url, runScripts: "dangerously" });
  const answer = dom.window.__langTarget(new URL(url).pathname, saved);
  dom.window.close();
  return answer;
}

const check = (name, fn) => {
  try { fn(); results.push("  ok   " + name); }
  catch (e) { results.push("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; }
};

const ROOT = "https://x-punpun.github.io/Text-reader/";

check("desde la raiz salta al idioma guardado", () =>
  assert.equal(target("index.html", ROOT, "es"), "/Text-reader/es/"));

check("sin preferencia guardada no salta", () =>
  assert.equal(target("index.html", ROOT, null), null));

check("con ingles guardado no salta", () =>
  assert.equal(target("index.html", ROOT, "en"), null));

check("un valor invalido no rompe nada", () =>
  assert.equal(target("index.html", ROOT, "xx"), null));

check("estando ya en esa version no salta (sin bucles)", () =>
  assert.equal(target("es/index.html", ROOT + "es/", "es"), null));

check("llegar a otra version por enlace se respeta", () =>
  assert.equal(target("fr/index.html", ROOT + "fr/", "es"), null));

check("funciona servido desde la raiz del dominio", () =>
  assert.equal(target("index.html", "http://localhost:8080/", "ja"), "/ja/"));

check("tolera index.html en la url", () =>
  assert.equal(target("index.html", ROOT + "index.html", "ko"), "/Text-reader/ko/"));

console.log(results.join("\n"));
console.log(process.exitCode ? "\nHay fallos." : `\n${results.length} comprobaciones correctas.`);
