import { splitIntoChunks, chunkIndexAtOffset } from "../domain/chunker.js";

/**
 * Caso de uso: leer un texto en voz alta.
 *
 * Es el centro del hexágono: no conoce el DOM ni ningún motor de voz
 * concreto, solo un SpeechPort. La interfaz se entera de todo por eventos.
 *
 * Eventos emitidos:
 *  - "state"     { state: "idle"|"playing"|"paused" }
 *  - "highlight" { start, end, wordStart, wordEnd, index, total }
 *  - "progress"  { index, total }
 *  - "error"     { error }
 */
export function createReader({ speech, chunkSize = 180 }) {
  let port = speech;
  let text = "";
  let chunks = [];
  let index = 0;
  let state = "idle";
  let rate = 1;
  let voiceId = null;
  let generation = 0; // invalida callbacks de fragmentos ya cancelados
  const listeners = new Map();

  /* ---------------- eventos ---------------- */

  function on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, []);
    listeners.get(event).push(handler);
    return () => off(event, handler);
  }

  function off(event, handler) {
    const list = listeners.get(event);
    if (!list) return;
    const at = list.indexOf(handler);
    if (at >= 0) list.splice(at, 1);
  }

  function emit(event, payload) {
    (listeners.get(event) || []).forEach((handler) => handler(payload));
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    emit("state", { state });
  }

  /* ---------------- texto ---------------- */

  function setText(value) {
    text = typeof value === "string" ? value : "";
    chunks = splitIntoChunks(text, chunkSize);
    if (index >= chunks.length) index = 0;
  }

  function emitHighlight(wordStart, wordEnd) {
    const chunk = chunks[index];
    if (!chunk) return;
    emit("highlight", {
      start: chunk.start,
      end: chunk.end,
      wordStart: typeof wordStart === "number" ? wordStart : null,
      wordEnd: typeof wordEnd === "number" ? wordEnd : null,
      index,
      total: chunks.length
    });
  }

  /* ---------------- reproducción ---------------- */

  function speakCurrent() {
    const chunk = chunks[index];
    if (!chunk) {
      stop();
      return;
    }

    const token = generation;
    emitHighlight(null, null);
    emit("progress", { index, total: chunks.length });

    port.speak({
      text: chunk.text,
      voiceId,
      rate,
      onBoundary: (charIndex, charLength) => {
        if (token !== generation) return;
        const wordStart = chunk.start + charIndex;
        const length = charLength || wordLengthAt(chunk.text, charIndex);
        emitHighlight(wordStart, wordStart + length);
      },
      onEnd: () => {
        if (token !== generation || state !== "playing") return;
        if (index + 1 >= chunks.length) {
          stop();
          return;
        }
        index += 1;
        speakCurrent();
      },
      onError: (error) => {
        if (token !== generation) return;
        emit("error", { error });
        stop();
      }
    });
  }

  function wordLengthAt(value, at) {
    const rest = value.slice(at);
    const match = rest.match(/^\S+/);
    return match ? match[0].length : 0;
  }

  /**
   * @param {{ fromOffset?: number }} [options] Posición del cursor en el texto.
   */
  function play(options = {}) {
    if (!chunks.length) return false;

    generation += 1;
    port.cancel();

    if (typeof options.fromOffset === "number") {
      index = chunkIndexAtOffset(chunks, options.fromOffset);
    }
    if (index >= chunks.length) index = 0;

    setState("playing");
    speakCurrent();
    return true;
  }

  function pause() {
    if (state !== "playing") return;
    port.pause();
    setState("paused");
  }

  function resume(options = {}) {
    if (state !== "paused") return;

    // Si el cursor se movió a otro fragmento, se retoma desde allí.
    if (typeof options.fromOffset === "number") {
      const target = chunkIndexAtOffset(chunks, options.fromOffset);
      if (target !== index) {
        index = target;
        play();
        return;
      }
    }

    port.resume();
    setState("playing");
    emitHighlight(null, null);
  }

  function stop() {
    generation += 1;
    port.cancel();
    index = 0;
    setState("idle");
    emit("highlight", { start: null, end: null, wordStart: null, wordEnd: null, index: 0, total: chunks.length });
  }

  /** Salta a la posición del cursor sin cambiar el estado de reproducción. */
  function seekTo(offset) {
    if (!chunks.length) return;
    const target = chunkIndexAtOffset(chunks, offset);
    index = target;

    if (state === "playing") {
      play();
    } else if (state === "paused") {
      generation += 1;
      port.cancel();
      setState("idle");
      emitHighlight(null, null);
    }
  }

  function setRate(value) {
    rate = value;
    if (state === "playing") play(); // reinicia el fragmento con la nueva velocidad
  }

  function setVoice(value) {
    voiceId = value;
    if (state === "playing") play();
  }

  function setEngine(nextPort) {
    const wasPlaying = state === "playing";
    generation += 1;
    port.cancel();
    port = nextPort;
    voiceId = null;
    setState("idle");
    if (wasPlaying) emit("progress", { index, total: chunks.length });
  }

  return {
    on,
    off,
    setText,
    play,
    pause,
    resume,
    stop,
    seekTo,
    setRate,
    setVoice,
    setEngine,
    get state() { return state; },
    get chunkCount() { return chunks.length; },
    get currentIndex() { return index; },
    get engineId() { return port.id; }
  };
}
