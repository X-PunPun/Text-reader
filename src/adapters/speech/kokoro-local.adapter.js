import { followAudio } from "./word-timeline.js";

/**
 * Adaptador: Kokoro TTS en el navegador (kokoro-js sobre Transformers.js).
 *
 * Segunda vía de voces locales, junto a Piper. Diferencias prácticas:
 *
 *  - Un único modelo de ~86 MB que trae las 28 voces; Piper descarga un
 *    modelo por voz (20–110 MB cada uno).
 *  - Voz notablemente más natural, pero mucho más lenta: unos 4 s por frase
 *    frente a los 0,4 s de Piper (medido en el sitio publicado).
 *  - Solo inglés. Para el resto de idiomas, Piper.
 *
 * El modelo se guarda en la caché del navegador, así que la segunda visita
 * no vuelve a descargarlo. Implementa SpeechPort.
 */

const LIB_URL = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.0/+esm";
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const PREFIX = "kokoro:";
const MODEL_MB = 86;
const CACHE_LIMIT = 3;

/** Catálogo fijo: evita descargar 86 MB solo para poder listar las voces. */
const VOICES = [
  ["af_heart", "Heart", "en-US"], ["af_alloy", "Alloy", "en-US"],
  ["af_aoede", "Aoede", "en-US"], ["af_bella", "Bella", "en-US"],
  ["af_jessica", "Jessica", "en-US"], ["af_kore", "Kore", "en-US"],
  ["af_nicole", "Nicole", "en-US"], ["af_nova", "Nova", "en-US"],
  ["af_river", "River", "en-US"], ["af_sarah", "Sarah", "en-US"],
  ["af_sky", "Sky", "en-US"], ["am_adam", "Adam", "en-US"],
  ["am_echo", "Echo", "en-US"], ["am_eric", "Eric", "en-US"],
  ["am_fenrir", "Fenrir", "en-US"], ["am_liam", "Liam", "en-US"],
  ["am_michael", "Michael", "en-US"], ["am_onyx", "Onyx", "en-US"],
  ["am_puck", "Puck", "en-US"], ["am_santa", "Santa", "en-US"],
  ["bf_alice", "Alice", "en-GB"], ["bf_emma", "Emma", "en-GB"],
  ["bf_isabella", "Isabella", "en-GB"], ["bf_lily", "Lily", "en-GB"],
  ["bm_daniel", "Daniel", "en-GB"], ["bm_fable", "Fable", "en-GB"],
  ["bm_george", "George", "en-GB"], ["bm_lewis", "Lewis", "en-GB"]
];

const READY_FLAG = "textreader:kokoroReady";

export function createKokoroAdapter({ onProgress } = {}) {
  const audio = typeof Audio !== "undefined" ? new Audio() : null;

  let model = null;
  let modelJob = null;
  const cache = new Map();   // "voz|texto" -> objectURL
  const pending = new Map();
  let active = false;
  let unfollow = null;

  function isAvailable() {
    return Boolean(audio);
  }

  function downloaded() {
    try { return localStorage.getItem(READY_FLAG) === "1"; } catch (error) { return false; }
  }

  function listVoices() {
    const ready = downloaded();
    return Promise.resolve(
      VOICES.map(([id, name, lang]) => ({
        id: PREFIX + id,
        name,
        lang,
        engine: "kokoro",
        downloaded: ready,
        sizeMb: ready ? 0 : MODEL_MB
      }))
    );
  }

  function bareId(voiceId) {
    return String(voiceId || "").replace(PREFIX, "") || "af_heart";
  }

  /** Carga el modelo una sola vez, aunque se lo pidan varias a la vez. */
  function ensureModel() {
    if (model) return Promise.resolve(model);
    if (modelJob) return modelJob;

    modelJob = (async () => {
      onProgress?.({ percent: null, phase: "downloading" });
      const { KokoroTTS } = await import(/* @vite-ignore */ LIB_URL);
      const loaded = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "q8", device: "wasm" });
      model = loaded;
      try { localStorage.setItem(READY_FLAG, "1"); } catch (error) { /* sin persistencia */ }
      onProgress?.({ percent: 100, phase: "downloaded" });
      return loaded;
    })();

    modelJob.catch(() => { modelJob = null; });
    return modelJob;
  }

  function cacheKey(voiceId, text) {
    return `${bareId(voiceId)}|${text}`;
  }

  function trimCache() {
    while (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      URL.revokeObjectURL(cache.get(oldest));
      cache.delete(oldest);
    }
  }

  async function synthesize(text, voiceId) {
    const key = cacheKey(voiceId, text);
    if (cache.has(key)) return cache.get(key);
    if (pending.has(key)) return pending.get(key);

    const job = (async () => {
      const tts = await ensureModel();
      onProgress?.({ phase: "synthesizing" });
      const result = await tts.generate(text, { voice: bareId(voiceId) });
      const url = URL.createObjectURL(result.toBlob());
      cache.set(key, url);
      trimCache();
      return url;
    })();

    pending.set(key, job);
    try {
      return await job;
    } finally {
      pending.delete(key);
    }
  }

  function prefetch(text, { voiceId }) {
    if (!isAvailable() || !model) return;
    const key = cacheKey(voiceId, text);
    if (cache.has(key) || pending.has(key)) return;
    synthesize(text, voiceId).catch(() => {});
  }

  function stopFollowing() {
    if (unfollow) unfollow();
    unfollow = null;
  }

  function speak({ text, voiceId, rate, onBoundary, onEnd, onError }) {
    if (!isAvailable()) {
      onError("unsupported");
      return;
    }

    active = true;
    stopFollowing();

    synthesize(text, voiceId)
      .then((url) => {
        if (!active) return;
        audio.onended = () => {
          stopFollowing();
          if (active) onEnd();
        };
        audio.onerror = () => {
          stopFollowing();
          if (!active) return;
          active = false;
          onError("playback");
        };
        audio.src = url;
        audio.playbackRate = Math.min(4, Math.max(0.5, rate));
        if (onBoundary) unfollow = followAudio(audio, text, onBoundary);
        return audio.play();
      })
      .catch((error) => {
        if (!active) return;
        active = false;
        const message = String(error?.message || error || "");
        if (message) console.warn("[kokoro]", message);
        onError(/fetch|network/i.test(message) ? "model-download" : "model-load");
      });
  }

  function pause() { audio?.pause(); }
  function resume() { audio?.play().catch(() => {}); }

  function cancel() {
    active = false;
    stopFollowing();
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
  }

  return {
    id: "kokoro",
    label: "Kokoro (local voices)",
    supportsBoundary: true, // deducido del avance del audio
    isAvailable,
    listVoices,
    speak,
    prefetch,
    pause,
    resume,
    cancel
  };
}
