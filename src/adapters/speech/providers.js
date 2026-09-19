/**
 * Motores de voz que viven en un servidor.
 *
 * Aquí hubo dos servicios públicos (StreamElements y el endpoint de Google
 * Translate). Se retiraron en septiembre de 2026 tras comprobar que ninguno
 * responde desde una web estática: el primero dejó de estar disponible y los
 * demás no envían cabeceras CORS ni aceptan peticiones con Referer ajeno.
 * Están pensados para llamarse desde un bot o un servidor, no desde el
 * navegador, así que mantenerlos solo producía errores.
 *
 * Queda el endpoint propio: cualquier servicio (incluidos los de streaming)
 * funciona si se pasa por un servidor propio o un proxy que añada CORS.
 */

export const PROVIDERS = {
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
