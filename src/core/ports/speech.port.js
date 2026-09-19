/**
 * Puerto de salida: todo motor de voz que quiera usarse con este reproductor
 * debe cumplir este contrato. El núcleo nunca habla con la Web Speech API ni
 * con ninguna API remota directamente, solo con este puerto.
 *
 * @typedef {Object} VoiceInfo
 * @property {string} id        Identificador estable del motor.
 * @property {string} name      Nombre legible.
 * @property {string} lang      Etiqueta BCP-47 ("es-ES", "en-US"...).
 * @property {string} engine    Id del motor que la provee.
 * @property {boolean} [isDefault]
 *
 * @typedef {Object} SpeakRequest
 * @property {string} text
 * @property {string|null} voiceId
 * @property {number} rate
 * @property {(charIndex: number, charLength: number) => void} [onBoundary]
 * @property {() => void} onEnd
 * @property {(error: string) => void} onError
 *
 * @typedef {Object} SpeechPort
 * @property {string} id
 * @property {boolean} supportsBoundary  ¿Informa la palabra en curso?
 * @property {() => boolean} isAvailable
 * @property {() => Promise<VoiceInfo[]>} listVoices
 * @property {(request: SpeakRequest) => void} speak
 * @property {() => void} pause
 * @property {() => void} resume
 * @property {() => void} cancel
 */

/** Claves obligatorias de un SpeechPort, para validar adaptadores. */
export const SPEECH_PORT_METHODS = [
  "isAvailable",
  "listVoices",
  "speak",
  "pause",
  "resume",
  "cancel"
];

/**
 * @param {any} candidate
 * @returns {boolean}
 */
export function isSpeechPort(candidate) {
  return Boolean(
    candidate &&
      typeof candidate.id === "string" &&
      SPEECH_PORT_METHODS.every((method) => typeof candidate[method] === "function")
  );
}
