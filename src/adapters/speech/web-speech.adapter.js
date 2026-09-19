/**
 * Adaptador: Web Speech API del navegador (SpeechSynthesis).
 * Gratuito, sin cuenta y sin red. Es el motor por defecto.
 * Implementa SpeechPort.
 */

const KEEP_ALIVE_MS = 10000;

export function createWebSpeechAdapter() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const Utterance = typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null;

  let voices = [];
  let keepAliveTimer = null;
  let speaking = false;

  function isAvailable() {
    return Boolean(synth && Utterance);
  }

  function refresh() {
    if (!isAvailable()) return [];
    voices = synth.getVoices() || [];
    return voices;
  }

  function toVoiceInfo(voice) {
    return {
      id: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      engine: "native",
      isDefault: Boolean(voice.default)
    };
  }

  function listVoices() {
    if (!isAvailable()) return Promise.resolve([]);

    const current = refresh();
    if (current.length) return Promise.resolve(current.map(toVoiceInfo));

    // Chrome puebla la lista de forma asíncrona.
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve(refresh().map(toVoiceInfo));
      };
      synth.addEventListener?.("voiceschanged", done, { once: true });
      setTimeout(done, 1200);
    });
  }

  function startKeepAlive() {
    stopKeepAlive();
    // Chrome suspende la sintesis pasados ~15 s; este ping la mantiene viva.
    keepAliveTimer = setInterval(() => {
      if (speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, KEEP_ALIVE_MS);
  }

  function stopKeepAlive() {
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }

  function speak({ text, voiceId, rate, onBoundary, onEnd, onError }) {
    if (!isAvailable()) {
      onError("unsupported");
      return;
    }

    const utterance = new Utterance(text);
    const voice = voices.find((item) => item.voiceURI === voiceId);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      onBoundary?.(event.charIndex || 0, event.charLength || 0);
    };

    utterance.onend = () => {
      speaking = false;
      stopKeepAlive();
      onEnd();
    };

    utterance.onerror = (event) => {
      speaking = false;
      stopKeepAlive();
      if (event.error === "interrupted" || event.error === "canceled") return;
      onError(event.error || "unknown");
    };

    speaking = true;
    startKeepAlive();
    synth.speak(utterance);
  }

  function pause() {
    if (isAvailable()) synth.pause();
  }

  function resume() {
    if (isAvailable()) synth.resume();
  }

  function cancel() {
    speaking = false;
    stopKeepAlive();
    if (isAvailable()) synth.cancel();
  }

  return {
    id: "native",
    supportsBoundary: true,
    isAvailable,
    listVoices,
    speak,
    pause,
    resume,
    cancel
  };
}
