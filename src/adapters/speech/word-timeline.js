/**
 * Boundaries sintéticos para motores que no informan de la palabra en curso.
 *
 * La Web Speech API avisa en cada palabra con `onboundary`, pero un motor que
 * devuelve un archivo de audio no dice nada: solo se sabe cuánto dura y por
 * dónde va la reproducción. Con eso basta para repartir el texto entre las
 * palabras y seguir la lectura palabra a palabra en vez de resaltar el
 * fragmento entero.
 *
 * El reparto es proporcional al número de caracteres, contando los signos de
 * puntuación como una pausa breve. No es exacto al milisegundo, pero sigue la
 * frase de cerca y es mucho más legible que un bloque de texto marcado.
 */

const PAUSE_WEIGHT = { ",": 1.5, ";": 2, ":": 2, ".": 2.5, "!": 2.5, "?": 2.5, "…": 3 };

/**
 * @param {string} text
 * @returns {{ words: Array<{ start: number, length: number, from: number, to: number }> }}
 */
export function buildWordTimeline(text) {
  const words = [];
  const pattern = /\S+/g;
  let match;
  let total = 0;

  while ((match = pattern.exec(text)) !== null) {
    const word = match[0];
    const last = word[word.length - 1];
    const weight = word.length + (PAUSE_WEIGHT[last] || 0);
    words.push({ start: match.index, length: word.length, weight });
    total += weight;
  }

  // se convierte el peso acumulado en una fracción [0, 1] de la duración
  let acc = 0;
  words.forEach((word) => {
    word.from = acc / total;
    acc += word.weight;
    word.to = acc / total;
  });

  return { words };
}

/**
 * Sigue un elemento <audio> y llama a `onWord(charIndex, charLength)` cada vez
 * que la reproducción entra en una palabra nueva. Devuelve una función para
 * detener el seguimiento.
 *
 * @param {HTMLAudioElement} audio
 * @param {string} text
 * @param {(charIndex: number, charLength: number) => void} onWord
 * @returns {() => void}
 */
export function followAudio(audio, text, onWord) {
  const { words } = buildWordTimeline(text);
  if (!words.length) return () => {};

  let frame = null;
  let current = -1;

  function tick() {
    frame = requestAnimationFrame(tick);

    const duration = audio.duration;
    if (!duration || !isFinite(duration)) return;

    const progress = Math.min(1, audio.currentTime / duration);
    let next = words.findIndex((word) => progress < word.to);
    if (next < 0) next = words.length - 1;

    if (next !== current) {
      current = next;
      onWord(words[next].start, words[next].length);
    }
  }

  frame = requestAnimationFrame(tick);
  return () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };
}
