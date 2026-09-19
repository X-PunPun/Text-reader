/**
 * Adaptador: Piper TTS ejecutándose dentro del navegador.
 *
 * Es la alternativa sólida a los servicios remotos: los modelos de voz se
 * descargan una sola vez desde Hugging Face y quedan guardados en el
 * dispositivo (OPFS, el almacén de archivos privado del origen). A partir de
 * ahí la síntesis es local, sin API, sin cuenta y sin conexión.
 *
 * Librería: @mintplex-labs/piper-tts-web (MIT), cargada desde jsDelivr la
 * primera vez que se elige este motor.
 *
 * Implementa SpeechPort, más el `prefetch` opcional.
 */

const LIB_URL = "https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web@1.0.5/dist/piper-tts-web.js";

// Binarios de ONNX Runtime. Tienen que ser de la MISMA version que el modulo
// del import map de index.html, o el motor no encuentra su backend.
const ORT_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.18.0/dist/";
const PREFIX = "piper:";
const CACHE_LIMIT = 3;

export function createPiperAdapter({ onProgress } = {}) {
  const audio = typeof Audio !== "undefined" ? new Audio() : null;

  let lib = null;                // módulo cargado en diferido
  let catalog = null;            // catálogo de voces de la librería
  let session = null;            // sesión de inferencia activa
  let sessionVoice = null;
  const cache = new Map();       // texto -> objectURL ya sintetizado
  const pending = new Map();     // texto -> promesa en curso
  let active = false;

  function isAvailable() {
    // OPFS necesita un contexto seguro: https o localhost.
    return Boolean(audio && typeof navigator !== "undefined" && navigator.storage?.getDirectory);
  }

  async function load() {
    if (lib) return lib;

    // onnxruntime-web se resuelve por el import map de index.html: la
    // libreria lo importa como especificador desnudo y el navegador, sin
    // bundler, no sabria de donde sacarlo.
    const ort = await import("onnxruntime-web/wasm");

    // Los hilos de WebAssembly exigen cross-origin isolation (cabeceras
    // COOP/COEP), que GitHub Pages no permite configurar. Un solo hilo basta:
    // una frase tarda menos de medio segundo.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = ORT_BASE;

    lib = await import(/* @vite-ignore */ LIB_URL);
    // Por defecto apunta a una ruta de CDN que ya no sirve los binarios.
    lib.TtsSession.WASM_LOCATIONS.onnxWasm = ORT_BASE;
    return lib;
  }

  function bareId(voiceId) {
    return String(voiceId || "").replace(PREFIX, "");
  }

  function megabytes(voice) {
    const total = Object.values(voice.files || {}).reduce((sum, file) => sum + (file.size_bytes || 0), 0);
    return Math.round(total / 1024 / 1024);
  }

  /** Voces del catálogo, marcando cuáles ya están en el dispositivo. */
  async function listVoices() {
    const api = await load();
    catalog = catalog || (await api.voices());
    const stored = new Set(await api.stored());

    return Object.values(catalog).map((voice) => ({
      id: PREFIX + voice.key,
      name: voice.name ? `${voice.name} (${voice.quality})` : voice.key,
      lang: voice.language?.code?.replace("_", "-") || voice.key.split("-")[0].replace("_", "-"),
      engine: "piper",
      downloaded: stored.has(voice.key),
      sizeMb: megabytes(voice)
    }));
  }

  async function ensureSession(voiceId) {
    const api = await load();
    const id = bareId(voiceId);

    if (session && sessionVoice === id) return session;

    const stored = new Set(await api.stored());
    if (!stored.has(id)) {
      // Primera vez con esta voz: se descarga el modelo y queda guardado.
      await api.download(id, (progress) => {
        const total = progress?.total || 0;
        const loaded = progress?.loaded || 0;
        onProgress?.({ voiceId: id, percent: total ? Math.round((loaded * 100) / total) : null });
      });
      onProgress?.({ voiceId: id, percent: 100 });
    }

    session = await api.TtsSession.create({ voiceId: id });
    await session.waitReady; // create() vuelve antes de que el motor este listo
    sessionVoice = id;
    return session;
  }

  function trimCache() {
    while (cache.size > CACHE_LIMIT) {
      const oldest = cache.keys().next().value;
      URL.revokeObjectURL(cache.get(oldest));
      cache.delete(oldest);
    }
  }

  async function synthesize(text, voiceId) {
    if (cache.has(text)) return cache.get(text);
    if (pending.has(text)) return pending.get(text);

    const job = (async () => {
      const current = await ensureSession(voiceId);
      onProgress?.({ phase: "synthesizing" });
      const blob = await current.predict(text);
      const url = URL.createObjectURL(blob);
      cache.set(text, url);
      trimCache();
      return url;
    })();

    pending.set(text, job);
    try {
      return await job;
    } finally {
      pending.delete(text);
    }
  }

  /** Va preparando el siguiente fragmento mientras suena el actual. */
  function prefetch(text, { voiceId }) {
    if (!isAvailable() || cache.has(text) || pending.has(text)) return;
    synthesize(text, voiceId).catch(() => {});
  }

  function speak({ text, voiceId, rate, onEnd, onError }) {
    if (!isAvailable()) {
      onError("no-opfs");
      return;
    }

    active = true;
    synthesize(text, voiceId)
      .then((url) => {
        if (!active) return;
        audio.onended = () => active && onEnd();
        audio.onerror = () => {
          if (!active) return;
          active = false;
          onError("playback");
        };
        audio.src = url;
        audio.playbackRate = Math.min(4, Math.max(0.5, rate));
        return audio.play();
      })
      .catch((error) => {
        if (!active) return;
        active = false;
        onError(describe(error));
      });
  }

  function describe(error) {
    const message = String(error?.message || error || "");
    if (/fetch|network|Failed to fetch/i.test(message)) return "model-download";
    if (message.includes("NotAllowedError")) return "autoplay-blocked";
    return "model-load";
  }

  function pause() { audio?.pause(); }

  function resume() { audio?.play().catch(() => {}); }

  function cancel() {
    active = false;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
  }

  /** Borra del dispositivo el modelo de una voz. */
  async function removeVoice(voiceId) {
    const api = await load();
    const id = bareId(voiceId);
    await api.remove(id);
    if (sessionVoice === id) {
      session = null;
      sessionVoice = null;
    }
    cache.forEach((url) => URL.revokeObjectURL(url));
    cache.clear();
  }

  async function storedVoices() {
    const api = await load();
    return (await api.stored()).map((id) => PREFIX + id);
  }

  return {
    id: "piper",
    label: "Piper (local voices)",
    supportsBoundary: false,
    isAvailable,
    listVoices,
    speak,
    prefetch,
    pause,
    resume,
    cancel,
    removeVoice,
    storedVoices
  };
}
