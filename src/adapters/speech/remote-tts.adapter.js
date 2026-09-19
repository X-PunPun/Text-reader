import { PROVIDERS } from "./providers.js";

/**
 * Adaptador: motores de voz remotos que devuelven un archivo de audio.
 * Implementa SpeechPort reproduciendo la respuesta en un <audio>.
 *
 * No informa de la palabra en curso (`supportsBoundary: false`), así que el
 * resaltado avanza frase a frase en vez de palabra a palabra.
 */
export function createRemoteTtsAdapter(providerId, { getTemplate } = {}) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Proveedor desconocido: ${providerId}`);

  const audio = typeof Audio !== "undefined" ? new Audio() : null;
  if (audio) audio.preload = "auto";

  let active = false;

  function isAvailable() {
    return Boolean(audio);
  }

  function listVoices() {
    return Promise.resolve(provider.voices());
  }

  function speak({ text, voiceId, rate, onEnd, onError }) {
    if (!audio) {
      onError("unsupported");
      return;
    }

    const url = provider.url(text.slice(0, provider.maxChars), voiceId, getTemplate?.());
    if (!url) {
      onError("missing-endpoint");
      return;
    }

    active = true;
    audio.onended = () => {
      if (!active) return;
      onEnd();
    };
    audio.onerror = () => {
      if (!active) return;
      active = false;
      // Un <audio> no expone el codigo HTTP: casi siempre significa que el
      // servicio publico no respondio o dejo de estar disponible.
      onError("service-down");
    };

    audio.src = url;
    audio.playbackRate = Math.min(4, Math.max(0.5, rate));
    audio.play().catch((error) => {
      if (!active) return;
      active = false;
      onError(error?.name === "NotAllowedError" ? "autoplay-blocked" : "service-down");
    });
  }

  function pause() {
    audio?.pause();
  }

  function resume() {
    audio?.play().catch(() => {});
  }

  function cancel() {
    active = false;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  return {
    id: provider.id,
    label: provider.label,
    supportsBoundary: false,
    isAvailable,
    listVoices,
    speak,
    pause,
    resume,
    cancel
  };
}
