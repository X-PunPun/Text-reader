import en from "./en.js";
import es from "./es.js";
import pt from "./pt.js";
import fr from "./fr.js";
import de from "./de.js";
import it from "./it.js";
import zh from "./zh.js";
import ja from "./ja.js";
import ko from "./ko.js";
import ar from "./ar.js";

/** Idiomas de la interfaz, en el orden en que aparecen en el selector. */
export const LANGUAGES = [
  { code: "en", label: "English", strings: en },
  { code: "es", label: "Español", strings: es },
  { code: "pt", label: "Português", strings: pt },
  { code: "fr", label: "Français", strings: fr },
  { code: "de", label: "Deutsch", strings: de },
  { code: "it", label: "Italiano", strings: it },
  { code: "zh", label: "中文", strings: zh },
  { code: "ja", label: "日本語", strings: ja },
  { code: "ko", label: "한국어", strings: ko },
  { code: "ar", label: "العربية", strings: ar, rtl: true }
];

export const DEFAULT_LANGUAGE = "en";
