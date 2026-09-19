/**
 * Pruebas del núcleo, sin navegador: se inyecta un SpeechPort falso.
 * Ejecutar con:  node tests/reader.test.mjs
 */
import assert from "node:assert/strict";
import { splitIntoChunks, chunkIndexAtOffset } from "../src/core/domain/chunker.js";
import { createReader } from "../src/core/usecases/reader.js";
import { clampSpeedIndex, formatSpeed } from "../src/core/domain/speeds.js";

const results = [];
function test(name, fn) {
  try {
    fn();
    results.push(`  ok   ${name}`);
  } catch (error) {
    results.push(`  FAIL ${name}\n       ${error.message}`);
    process.exitCode = 1;
  }
}

/* ---------------- chunker ---------------- */

const TEXT = "Primera frase. Segunda frase mas larga aqui.\n\nTercer parrafo final.";

test("los fragmentos conservan su posicion exacta en el texto", () => {
  const chunks = splitIntoChunks(TEXT);
  chunks.forEach((chunk) => {
    assert.equal(TEXT.slice(chunk.start, chunk.end), chunk.text);
  });
});

test("corta por frase y por parrafo", () => {
  assert.equal(splitIntoChunks(TEXT).length, 3);
});

test("respeta el limite de caracteres sin puntuacion", () => {
  const long = "palabra ".repeat(80);
  splitIntoChunks(long, 60).forEach((chunk) => {
    assert.ok(chunk.text.length <= 70, `fragmento de ${chunk.text.length} caracteres`);
  });
});

test("un texto vacio no produce fragmentos", () => {
  assert.deepEqual(splitIntoChunks("   \n  "), []);
});

test("el offset del cursor cae en el fragmento correcto", () => {
  const chunks = splitIntoChunks(TEXT);
  assert.equal(chunkIndexAtOffset(chunks, 0), 0);
  assert.equal(chunkIndexAtOffset(chunks, 20), 1);
  assert.equal(chunkIndexAtOffset(chunks, TEXT.length - 1), 2);
});

/* ---------------- velocidades ---------------- */

test("la velocidad se limita al rango valido", () => {
  assert.equal(clampSpeedIndex(-5), 0);
  assert.equal(clampSpeedIndex(999), 8);
  assert.equal(clampSpeedIndex("abc"), 3);
});

test("la velocidad se formatea como en un reproductor", () => {
  assert.equal(formatSpeed(1), "1.0x");
  assert.equal(formatSpeed(1.25), "1.25x");
});

/* ---------------- caso de uso ---------------- */

function fakePort() {
  const spoken = [];
  let pending = null;
  return {
    id: "fake",
    supportsBoundary: true,
    spoken,
    isAvailable: () => true,
    listVoices: () => Promise.resolve([]),
    speak: (request) => {
      spoken.push(request.text);
      pending = request;
    },
    finishCurrent: () => pending?.onEnd(),
    boundary: (i, len) => pending?.onBoundary(i, len),
    pause: () => {},
    resume: () => {},
    cancel: () => { pending = null; }
  };
}

test("lee todos los fragmentos en orden y termina en idle", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });

  assert.equal(reader.state, "playing");
  port.finishCurrent();
  port.finishCurrent();
  port.finishCurrent();

  assert.deepEqual(port.spoken, splitIntoChunks(TEXT).map((c) => c.text));
  assert.equal(reader.state, "idle");
});

test("arranca desde el fragmento donde esta el cursor", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 50 });

  assert.equal(port.spoken[0], "Tercer parrafo final.");
});

test("el resaltado apunta al fragmento y a la palabra en curso", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  const seen = [];
  reader.on("highlight", (range) => seen.push(range));

  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });
  port.boundary(8, 5); // "frase" dentro del primer fragmento

  const last = seen[seen.length - 1];
  assert.equal(TEXT.slice(last.start, last.end), "Primera frase.");
  assert.equal(TEXT.slice(last.wordStart, last.wordEnd), "frase");
});

test("pausar y reanudar no reinicia el texto", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });
  reader.pause();
  assert.equal(reader.state, "paused");

  reader.resume();
  assert.equal(reader.state, "playing");
  assert.equal(port.spoken.length, 1);
});

test("reanudar con el cursor movido salta a ese fragmento", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });
  reader.pause();
  reader.resume({ fromOffset: 50 });

  assert.equal(port.spoken[port.spoken.length - 1], "Tercer parrafo final.");
});

test("saltar durante la lectura continua desde el nuevo punto", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });
  reader.seekTo(20);

  assert.equal(reader.state, "playing");
  assert.equal(port.spoken[port.spoken.length - 1], "Segunda frase mas larga aqui.");
});

test("cambiar la velocidad relee el fragmento actual, no el texto entero", () => {
  const port = fakePort();
  const reader = createReader({ speech: port });
  reader.setText(TEXT);
  reader.play({ fromOffset: 0 });
  port.finishCurrent(); // va al segundo fragmento
  reader.setRate(1.5);

  assert.equal(port.spoken[port.spoken.length - 1], "Segunda frase mas larga aqui.");
});

console.log(results.join("\n"));
console.log(process.exitCode ? "\nHay pruebas fallidas." : `\n${results.length} pruebas correctas.`);
