import { splitIntoChunks } from "../domain/chunker.js";

/**
 * Caso de uso: guardar la lectura completa en un archivo de audio.
 *
 * Recorre el texto fragmento a fragmento pidiéndole el audio al motor, lo
 * junta todo y lo entrega codificado. No reproduce nada: es el mismo motor
 * que se oye, pero volcado a un archivo.
 *
 * Solo funciona con motores que sepan entregar el audio (`render`). La Web
 * Speech API habla directamente por el sistema operativo y no da acceso a la
 * señal, así que con ese motor no hay nada que exportar.
 */
export function createExporter({ encode, chunkSize = 180 }) {
  function canExport(port) {
    return typeof port?.render === "function";
  }

  /**
   * @param {object} options
   * @param {object} options.port    Motor de voz (SpeechPort con render).
   * @param {string} options.text
   * @param {string|null} options.voiceId
   * @param {(step: { done: number, total: number, phase: string }) => void} [options.onProgress]
   * @returns {Promise<{ blob: Blob, extension: string }>}
   */
  async function exportAudio({ port, text, voiceId, onProgress }) {
    if (!canExport(port)) throw new Error("engine-cannot-export");

    const chunks = splitIntoChunks(text, chunkSize);
    if (!chunks.length) throw new Error("no-text");

    const blobs = [];
    for (let i = 0; i < chunks.length; i += 1) {
      onProgress?.({ done: i, total: chunks.length, phase: "rendering" });
      blobs.push(await port.render(chunks[i].text, { voiceId }));
    }

    onProgress?.({ done: chunks.length, total: chunks.length, phase: "encoding" });
    return encode(blobs, onProgress);
  }

  return { exportAudio, canExport };
}
