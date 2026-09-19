/**
 * Puerto de salida: persistencia de preferencias (tema, idioma, voz, motor).
 *
 * @typedef {Object} StoragePort
 * @property {(key: string, fallback?: any) => any} get
 * @property {(key: string, value: any) => void} set
 */

export const STORAGE_KEYS = {
  theme: "textreader:theme",
  language: "textreader:lang",
  voice: "textreader:voice",
  engine: "textreader:engine",
  speed: "textreader:speed",
  customEndpoint: "textreader:customEndpoint",
  allLanguages: "textreader:allLanguages",
  format: "textreader:format"
};
