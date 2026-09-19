/**
 * Dominio: partir el texto en fragmentos hablables.
 *
 * Dos motivos para trocear:
 *  1. Chrome corta los enunciados largos de la Web Speech API.
 *  2. Cada fragmento conserva su posición exacta en el texto original
 *     (`start`/`end`), que es lo que permite resaltar mientras se lee
 *     y retomar la lectura desde donde está el cursor.
 *
 * @typedef {{ text: string, start: number, end: number }} Chunk
 */

const DEFAULT_LIMIT = 180;
const SENTENCE_END = /[.!?;:…。！？]$/;

/**
 * @param {string} text
 * @param {number} [limit] Máximo aproximado de caracteres por fragmento.
 * @returns {Chunk[]}
 */
export function splitIntoChunks(text, limit = DEFAULT_LIMIT) {
  if (typeof text !== "string" || !text.trim()) return [];

  const chunks = [];
  const wordPattern = /\S+/g;
  let start = -1;
  let end = -1;
  let match;

  while ((match = wordPattern.exec(text)) !== null) {
    const wordStart = match.index;
    const wordEnd = wordStart + match[0].length;

    if (start === -1) start = wordStart;
    end = wordEnd;

    const endsSentence = SENTENCE_END.test(match[0]);
    const endsParagraph = /\n/.test(text.slice(wordEnd, wordEnd + 2));
    const tooLong = end - start >= limit;

    if (endsSentence || endsParagraph || tooLong) {
      chunks.push({ text: text.slice(start, end), start, end });
      start = -1;
    }
  }

  if (start !== -1) {
    chunks.push({ text: text.slice(start, end), start, end });
  }

  return chunks;
}

/**
 * Índice del fragmento que contiene `offset`, o el siguiente que empieza
 * después. Devuelve 0 si el offset queda antes del primero.
 *
 * @param {Chunk[]} chunks
 * @param {number} offset
 * @returns {number}
 */
export function chunkIndexAtOffset(chunks, offset) {
  if (!chunks.length) return 0;

  for (let i = 0; i < chunks.length; i += 1) {
    if (offset < chunks[i].end) return i;
  }
  return chunks.length - 1;
}
