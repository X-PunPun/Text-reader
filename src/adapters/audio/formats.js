/**
 * Formatos de descarga ofrecidos en la interfaz.
 *
 * Los motores locales generan audio de voz mono a 22–24 kHz. Eso condiciona
 * las opciones:
 *
 *  - MPEG-2 Layer III (el que corresponde a 22,05 kHz) tope en 160 kbps, así
 *    que pedir 192 o 320 a esa frecuencia devolvía exactamente el mismo
 *    archivo. Por eso los perfiles de alta calidad remuestrean a 44,1 kHz
 *    antes de codificar.
 *  - Por encima de 192 kbps la mejora sobre una fuente de 22 kHz es
 *    inapreciable; el archivo sí crece. Se ofrece igualmente porque es el
 *    ajuste habitual para archivar o editar después.
 */

export const FORMATS = [
  {
    id: "mp3-128",
    label: "MP3 · 128 kbps",
    extension: "mp3",
    kind: "mp3",
    bitrate: 128,
    sampleRate: null // se mantiene el original
  },
  {
    id: "mp3-192",
    label: "MP3 · 192 kbps · HD",
    extension: "mp3",
    kind: "mp3",
    bitrate: 192,
    sampleRate: 44100
  },
  {
    id: "mp3-320",
    label: "MP3 · 320 kbps · HQ",
    extension: "mp3",
    kind: "mp3",
    bitrate: 320,
    sampleRate: 44100
  },
  {
    id: "wav",
    label: "WAV · PCM 16-bit",
    extension: "wav",
    kind: "wav",
    bitrate: null,
    sampleRate: null
  }
];

export const DEFAULT_FORMAT = "mp3-192";

export function findFormat(id) {
  return FORMATS.find((format) => format.id === id) || FORMATS.find((f) => f.id === DEFAULT_FORMAT);
}
