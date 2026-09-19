/**
 * Prueba de la vista del cuestionario sobre un DOM simulado.
 *
 * Recorre el flujo entero como lo haría una persona: crear las preguntas en
 * el diálogo, añadir y quitar filas, correr el test pulsando el botón de cada
 * tarjeta y comprobar que la respuesta solo se lee tras confirmar.
 *
 * Necesita jsdom, que no hace falta para usar la aplicación:
 *   npm install
 *   node tests/quiz-view.test.mjs
 */
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(PROJECT, "index.html"), "utf8");

const dom = new JSDOM(html, { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = (fn) => setTimeout(fn, 0);
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.HTMLDialogElement = dom.window.HTMLDialogElement || class {};
dom.window.HTMLElement.prototype.showModal = function () { this.open = true; };
dom.window.HTMLElement.prototype.close = function () { this.open = false; };

const { createQuiz } = await import(resolve(PROJECT, "src/core/usecases/quiz.js"));
const { createQuizView } = await import(resolve(PROJECT, "src/ui/components/quiz-view.js"));

// lector de mentira: habla al instante
const handlers = [];
const spoken = [];
const reader = {
  on: (e, fn) => { handlers.push(fn); return () => handlers.splice(handlers.indexOf(fn), 1); },
  setText: (t) => spoken.push(t),
  play: () => handlers.slice().forEach((fn) => fn({ state: "idle" })),
  stop: () => {}
};

const store = new Map();
const storage = { get: (k, d) => (store.has(k) ? store.get(k) : d), set: (k, v) => store.set(k, v) };
const i18n = { t: (k, v) => (v ? `${k}:${JSON.stringify(v)}` : k), code: "en" };

const el = (id) => document.getElementById(id);
const quiz = createQuiz({ reader, shuffle: (l) => l });

const view = createQuizView({
  elements: {
    list: el("quiz-list"), progress: el("quiz-progress"), editButton: el("quiz-edit"),
    endPanel: el("quiz-end"), dialog: el("quiz-dialog"), step1: el("quiz-step1"),
    step2: el("quiz-step2"), count: el("quiz-count"), fields: el("quiz-fields"),
    addButton: el("quiz-add"), nextButton: el("quiz-next"), backButton: el("quiz-back"),
    saveButton: el("quiz-save"), cancelButton: el("quiz-cancel")
  },
  storage, i18n, quiz
});

quiz.on((state) => view.render(state));

const results = [];
const check = (name, fn) => {
  try { fn(); results.push("  ok   " + name); }
  catch (e) { results.push("  FAIL " + name + "\n       " + e.message); process.exitCode = 1; }
};

/* --- crear preguntas por el dialogo --- */
view.openDialog();
el("quiz-count").value = "3";
el("quiz-next").click();
const groups = () => [...el("quiz-fields").querySelectorAll(".quiz-field")];
check("el dialogo crea tantas filas como se piden", () => assert.equal(groups().length, 3));

groups().forEach((g, i) => {
  g.querySelector('[data-role="question"]').value = `Pregunta ${i + 1}`;
  g.querySelector('[data-role="answer"]').value = `Respuesta ${i + 1}`;
});
el("quiz-add").click();
check("se puede anadir una fila mas", () => assert.equal(groups().length, 4));

groups()[3].querySelector(".quiz-remove").click();
check("se puede quitar una fila", () => assert.equal(groups().length, 3));

el("quiz-save").click();
check("las preguntas se guardan", () => assert.equal(view.items.length, 3));
check("quedan persistidas", () => assert.ok(storage.get("textreader:quiz").includes("Pregunta 1")));

/* --- correr el test --- */
quiz.start();
await new Promise((r) => setTimeout(r, 10));

const cards = () => [...el("quiz-list").querySelectorAll(".quiz-card")];
check("se pintan todas las tarjetas, no solo la actual", () => assert.equal(cards().length, 3));
check("la primera es la que toca", () => assert.ok(cards()[0].classList.contains("is-current")));
check("aparece el boton de confirmar en la tarjeta", () =>
  assert.ok(cards()[0].querySelector(".quiz-confirm"), "falta el boton"));
check("solo lee la pregunta", () => assert.deepEqual(spoken, ["Pregunta 1"]));
check("la respuesta sigue tapada", () =>
  assert.ok(!cards()[0].classList.contains("is-revealed")));

/* --- confirmar desde la tarjeta --- */
cards()[0].querySelector(".quiz-confirm").click();
await new Promise((r) => setTimeout(r, 10));

check("al confirmar lee la respuesta y pasa a la siguiente", () =>
  assert.deepEqual(spoken, ["Pregunta 1", "Respuesta 1", "Pregunta 2"]));
check("la anterior queda visible y marcada", () => {
  const first = cards()[0];
  assert.ok(first.classList.contains("is-revealed"), "deberia estar descubierta");
  assert.ok(first.querySelector(".quiz-check"), "deberia tener la marca");
});
check("la segunda pasa a ser la actual", () => assert.ok(cards()[1].classList.contains("is-current")));

/* --- terminar --- */
cards()[1].querySelector(".quiz-confirm").click();
await new Promise((r) => setTimeout(r, 10));
cards()[2].querySelector(".quiz-confirm").click();
await new Promise((r) => setTimeout(r, 10));

check("al terminar se ofrece repetir o editar", () => assert.equal(el("quiz-end").hidden, false));
check("todas las respuestas quedan a la vista", () =>
  assert.equal(cards().filter((c) => c.classList.contains("is-revealed")).length, 3));
check("ninguna tarjeta desaparece", () => assert.equal(cards().length, 3));

/* --- reeditar conserva lo escrito --- */
view.openDialog();
check("al reeditar se cargan las preguntas existentes", () => {
  assert.equal(groups().length, 3);
  assert.equal(groups()[0].querySelector('[data-role="question"]').value, "Pregunta 1");
});

console.log(results.join("\n"));
console.log(process.exitCode ? "\nHay fallos." : `\n${results.length} comprobaciones correctas.`);
