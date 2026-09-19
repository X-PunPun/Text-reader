/**
 * Formatos de descarga ofrecidos en la interfaz.
 *
 * Dos familias: MP3 (comprimido, para escuchar y compartir) y WAV (sin
 * comprimir, para editar después). Los motores locales generan voz mono a
 * 22–24 kHz, y eso condiciona los perfiles:
 *
 *  - MPEG-2 Layer III, el que corresponde a 22,05 kHz, tope en 160 kbps: sin
 *    remuestrear, pedir 192 o 320 devolvía exactamente el mismo archivo. Por
 *    eso los perfiles altos suben a 44,1 kHz antes de codificar.
 *  - Por encima de 192 kbps la mejora sobre una fuente de 22 kHz es
 *    inapreciable, pero el archivo sí crece.
 *
 * No hay OGG, FLAC ni M4A: ninguna librería que los codifique llegó a
 * funcionar desde un CDN sin empaquetador (libflacjs no llega a inicializar
 * su WebAssembly), y MediaRecorder, que sí sabe Opus y AAC, solo graba en
 * tiempo real — exportar diez minutos de audio tardaría diez minutos.
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
    id: "wav-16",
    label: "WAV · PCM 16-bit",
    extension: "wav",
    kind: "wav",
    bitDepth: 16,
    sampleRate: null
  },
  {
    id: "wav-16-44",
    label: "WAV · PCM 16-bit · 44.1 kHz",
    extension: "wav",
    kind: "wav",
    bitDepth: 16,
    sampleRate: 44100
  },
  {
    id: "wav-24-48",
    label: "WAV · PCM 24-bit · 48 kHz",
    extension: "wav",
    kind: "wav",
    bitDepth: 24,
    sampleRate: 48000
  }
];

export const DEFAULT_FORMAT = "mp3-192";

export function findFormat(id) {
  return FORMATS.find((format) => format.id === id) || FORMATS.find((f) => f.id === DEFAULT_FORMAT);
}
