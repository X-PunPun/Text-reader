/**
 * Comprueba que el mapa de importaciones cubre todos los módulos.
 *
 * Cada página lleva un mapa que añade la versión a cada archivo, para que el
 * navegador no mezcle código nuevo con código viejo de su caché. Si una clave
 * no coincide exactamente con la URL que el navegador resuelve, ese módulo se
 * carga sin versión y la mezcla vuelve, así que aquí se repite el cálculo del
 * navegador: se resuelve cada import contra la URL de su archivo y se busca
 * la clave que le corresponde.
 *
 * No necesita jsdom:  node tests/import-map.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const results = [];
const check = (name, fn) => {
  try { fn(); results.push(`  ok   ${name}`); }
  catch (error) { results.push(`  FAIL ${name}\n       ${error.message}`); process.exitCode = 1; }
};

function walk(dir, found = []) {
  readdirSync(resolve(root, dir), { withFileTypes: true }).forEach((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(path, found);
    else if (entry.name.endsWith(".js")) found.push(path);
  });
  return found;
}

const modules = walk("src");

function mapOf(page) {
  const html = readFileSync(resolve(root, page), "utf8");
  const raw = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(raw, `${page} no lleva mapa de importaciones`);
  return JSON.parse(raw[1]).imports;
}

/** Resuelve como el navegador: clave relativa contra la URL del documento. */
function resolved(imports, documentUrl) {
  const out = new Map();
  for (const [key, value] of Object.entries(imports)) {
    if (key.startsWith("http")) continue;
    out.set(new URL(key, documentUrl).href, value);
  }
  return out;
}

for (const [page, documentUrl] of [
  ["index.html", "https://site.example/Text-reader/"],
  ["es/index.html", "https://site.example/Text-reader/es/"],
  ["ar/index.html", "https://site.example/Text-reader/ar/"]
]) {
  const imports = mapOf(page);
  const table = resolved(imports, documentUrl);
  const base = new URL("https://site.example/Text-reader/");

  check(`${page}: el mapa cubre los ${modules.length} módulos`, () => {
    const missing = modules.filter((file) => !table.has(new URL(file, base).href));
    assert.deepEqual(missing, [], `sin entrada: ${missing.join(", ")}`);
  });

  check(`${page}: cada import interno encuentra su entrada versionada`, () => {
    const problems = [];

    modules.forEach((file) => {
      const source = readFileSync(resolve(root, file), "utf8");
      const moduleUrl = new URL(file, base);

      for (const match of source.matchAll(/from\s+"(\.[^"]+)"/g)) {
        const target = new URL(match[1], moduleUrl).href;
        const entry = table.get(target);
        if (!entry) problems.push(`${file} -> ${match[1]} (sin entrada)`);
        else if (!entry.includes("?v=")) problems.push(`${file} -> ${match[1]} (sin versión)`);
      }
    });

    assert.deepEqual(problems, []);
  });

  check(`${page}: onnxruntime-web sigue resuelto`, () => {
    assert.ok(imports["onnxruntime-web/wasm"]?.startsWith("https://"));
  });
}

check("todas las páginas comparten la misma versión", () => {
  const versions = ["index.html", "es/index.html", "ja/index.html"].map((page) => {
    const value = Object.values(mapOf(page)).find((v) => v.includes("?v="));
    return value.split("?v=")[1];
  });
  assert.equal(new Set(versions).size, 1, `versiones distintas: ${versions.join(", ")}`);
});

check("las hojas de estilo también van versionadas", () => {
  const html = readFileSync(resolve(root, "es/index.html"), "utf8");
  const sheets = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1]);
  assert.equal(sheets.length, 4);
  sheets.forEach((href) => assert.ok(href.includes("?v="), `sin versión: ${href}`));
});

console.log(results.join("\n"));
console.log(process.exitCode ? "\nHay fallos." : `\n${results.length} comprobaciones correctas.`);
