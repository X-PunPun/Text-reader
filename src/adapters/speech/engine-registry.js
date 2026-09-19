import { createWebSpeechAdapter } from "./web-speech.adapter.js";
import { createRemoteTtsAdapter } from "./remote-tts.adapter.js";
import { REMOTE_PROVIDER_IDS, PROVIDERS } from "./providers.js";

/**
 * Registro de motores disponibles. La interfaz pide un motor por su id y
 * recibe siempre un SpeechPort; añadir otro proveedor es añadir una entrada
 * aquí, sin tocar el núcleo.
 */
export function createEngineRegistry({ getTemplate } = {}) {
  const cache = new Map();

  function get(engineId) {
    if (cache.has(engineId)) return cache.get(engineId);

    const port = engineId === "native"
      ? createWebSpeechAdapter()
      : createRemoteTtsAdapter(engineId, { getTemplate });

    cache.set(engineId, port);
    return port;
  }

  function list() {
    return [
      { id: "native", label: "Browser (offline)" },
      ...REMOTE_PROVIDER_IDS.map((id) => ({ id, label: PROVIDERS[id].label }))
    ];
  }

  function cancelAll() {
    cache.forEach((port) => port.cancel());
  }

  return { get, list, cancelAll };
}
