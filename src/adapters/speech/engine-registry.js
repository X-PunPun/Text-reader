import { createWebSpeechAdapter } from "./web-speech.adapter.js";
import { createPiperAdapter } from "./piper-local.adapter.js";
import { createRemoteTtsAdapter } from "./remote-tts.adapter.js";
import { REMOTE_PROVIDER_IDS, PROVIDERS } from "./providers.js";

/**
 * Registro de motores disponibles. La interfaz pide un motor por su id y
 * recibe siempre un SpeechPort; añadir otro proveedor es añadir una entrada
 * aquí, sin tocar el núcleo.
 *
 * Orden deliberado: primero los que no dependen de ningún servicio.
 */
export function createEngineRegistry({ getTemplate, onDownloadProgress } = {}) {
  const cache = new Map();

  function build(engineId) {
    if (engineId === "native") return createWebSpeechAdapter();
    if (engineId === "piper") return createPiperAdapter({ onProgress: onDownloadProgress });
    return createRemoteTtsAdapter(engineId, { getTemplate });
  }

  function get(engineId) {
    if (!cache.has(engineId)) cache.set(engineId, build(engineId));
    return cache.get(engineId);
  }

  function list() {
    return [
      { id: "native", labelKey: "engine.native" },
      { id: "piper", labelKey: "engine.piper" },
      ...REMOTE_PROVIDER_IDS.map((id) => ({ id, label: PROVIDERS[id].label }))
    ];
  }

  function cancelAll() {
    cache.forEach((port) => port.cancel());
  }

  return { get, list, cancelAll };
}
