/**
 * Catálogo de motores de voz remotos que no piden cuenta, tarjeta ni API key.
 *
 * Cada proveedor construye una URL que devuelve audio; el adaptador la carga
 * en un <audio>, así que no hace falta que el servidor mande cabeceras CORS.
 *
 * Son servicios públicos de terceros: pueden limitar el ritmo de peticiones o
 * dejar de funcionar sin aviso. Por eso el motor del navegador sigue siendo el
 * predeterminado y estos son opcionales.
 */

/** Voces de StreamElements (catálogo de Amazon Polly, acceso abierto). */
const STREAMELEMENTS_VOICES = [
  { id: "Brian", lang: "en-GB" }, { id: "Amy", lang: "en-GB" }, { id: "Emma", lang: "en-GB" },
  { id: "Joanna", lang: "en-US" }, { id: "Matthew", lang: "en-US" }, { id: "Salli", lang: "en-US" },
  { id: "Joey", lang: "en-US" }, { id: "Nicole", lang: "en-AU" }, { id: "Russell", lang: "en-AU" },
  { id: "Conchita", lang: "es-ES" }, { id: "Enrique", lang: "es-ES" }, { id: "Lucia", lang: "es-ES" },
  { id: "Mia", lang: "es-MX" }, { id: "Miguel", lang: "es-US" }, { id: "Penelope", lang: "es-US" },
  { id: "Ricardo", lang: "pt-BR" }, { id: "Vitoria", lang: "pt-BR" }, { id: "Cristiano", lang: "pt-PT" },
  { id: "Ines", lang: "pt-PT" },
  { id: "Celine", lang: "fr-FR" }, { id: "Mathieu", lang: "fr-FR" }, { id: "Lea", lang: "fr-FR" },
  { id: "Hans", lang: "de-DE" }, { id: "Marlene", lang: "de-DE" }, { id: "Vicki", lang: "de-DE" },
  { id: "Carla", lang: "it-IT" }, { id: "Giorgio", lang: "it-IT" }, { id: "Bianca", lang: "it-IT" },
  { id: "Zhiyu", lang: "zh-CN" },
  { id: "Mizuki", lang: "ja-JP" }, { id: "Takumi", lang: "ja-JP" },
  { id: "Seoyeon", lang: "ko-KR" },
  { id: "Zeina", lang: "ar" }
];

/** Idiomas que acepta el endpoint público de Google Translate. */
const GOOGLE_LANGS = [
  { code: "en", label: "English" }, { code: "es", label: "Español" },
  { code: "pt", label: "Português" }, { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" }, { code: "it", label: "Italiano" },
  { code: "zh-CN", label: "中文" }, { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" }, { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" }, { code: "hi", label: "हिन्दी" }
];

export const PROVIDERS = {
  streamelements: {
    id: "streamelements",
    label: "StreamElements (Polly)",
    maxChars: 300,
    voices: () =>
      STREAMELEMENTS_VOICES.map((voice) => ({
        id: `streamelements:${voice.id}`,
        name: voice.id,
        lang: voice.lang,
        engine: "streamelements"
      })),
    url: (text, voiceId) => {
      const voice = String(voiceId || "streamelements:Brian").split(":")[1];
      return `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(text)}`;
    }
  },

  google: {
    id: "google",
    label: "Google Translate TTS",
    maxChars: 190, // el endpoint corta alrededor de los 200 caracteres
    voices: () =>
      GOOGLE_LANGS.map((lang) => ({
        id: `google:${lang.code}`,
        name: lang.label,
        lang: lang.code,
        engine: "google"
      })),
    url: (text, voiceId) => {
      const lang = String(voiceId || "google:en").split(":")[1];
      return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(lang)}&q=${encodeURIComponent(text)}`;
    }
  },

  custom: {
    id: "custom",
    label: "Custom endpoint",
    maxChars: 500,
    voices: () => [{ id: "custom:default", name: "Custom", lang: "", engine: "custom" }],
    /**
     * Plantilla del usuario. Marcadores admitidos: {text} y {voice}.
     * Ejemplo: https://mi-servidor/tts?q={text}&voice={voice}
     */
    url: (text, voiceId, template) => {
      if (!template) return "";
      return template
        .replace("{text}", encodeURIComponent(text))
        .replace("{voice}", encodeURIComponent(String(voiceId || "").split(":")[1] || ""));
    }
  }
};

export const REMOTE_PROVIDER_IDS = Object.keys(PROVIDERS);
