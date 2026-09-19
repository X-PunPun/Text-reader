import { createLocalStorageAdapter } from "../adapters/storage/local-storage.adapter.js";
import { createEngineRegistry } from "../adapters/speech/engine-registry.js";
import { STORAGE_KEYS } from "../core/ports/storage.port.js";
import { createReader } from "../core/usecases/reader.js";
import { formatSpeed } from "../core/domain/speeds.js";
import { createI18n } from "./i18n/i18n.js";
import { createThemeToggle } from "./components/theme-toggle.js";
import { createSpeedSlider } from "./components/speed-slider.js";
import { createEditor } from "./components/editor.js";
import { createVoicePicker } from "./components/voice-picker.js";

/**
 * Composición: aquí se enchufan los adaptadores al núcleo y la interfaz
 * al caso de uso. Es el único archivo que conoce a todos los demás.
 */

const el = (id) => document.getElementById(id);

const storage = createLocalStorageAdapter();
const i18n = createI18n({ storage });
const registry = createEngineRegistry({
  getTemplate: () => storage.get(STORAGE_KEYS.customEndpoint, ""),
  onDownloadProgress: ({ percent, phase }) => {
    if (phase === "synthesizing") {
      setStatus("status.synthesizing");
      return;
    }
    const size = voicePicker?.currentVoice?.sizeMb ?? "?";
    setStatus("status.downloading", { n: size, p: percent ?? 0 });
  }
});

const reader = createReader({
  speech: registry.get(storage.get(STORAGE_KEYS.engine, "native") || "native")
});

let status = { key: "status.ready", vars: null, error: false };
let caretTouched = false;

/* ---------------- estado visible ---------------- */

function renderStatus() {
  const node = el("status");
  node.textContent = i18n.t(status.key, status.vars);
  node.classList.toggle("is-error", status.error);
}

function setStatus(key, vars, isError = false) {
  status = { key, vars: vars || null, error: isError };
  renderStatus();
}

function describeError(code) {
  const translated = i18n.t(`error.${code}`);
  return translated === `error.${code}` ? code : translated;
}

function renderTransport() {
  const state = reader.state;
  el("play-icon").textContent = state === "playing" ? "❚❚" : "▶";
  el("play-label").textContent =
    state === "playing" ? i18n.t("btn.pause") : state === "paused" ? i18n.t("btn.resume") : i18n.t("btn.play");
  el("stop-btn").disabled = state === "idle";
  document.body.classList.toggle("is-reading", state !== "idle");
}

/* ---------------- componentes ---------------- */

createThemeToggle({ button: el("theme-btn"), icon: el("theme-icon"), storage });

const speed = createSpeedSlider({
  range: el("speed-range"),
  badge: el("speed-badge"),
  marks: el("speed-marks"),
  storage,
  onChange: (value) => reader.setRate(value)
});

const editor = createEditor({
  textarea: el("text-input"),
  mirror: el("editor-mirror"),
  counter: el("char-count"),
  onTextChange: (value) => {
    reader.stop();
    reader.setText(value);
    caretTouched = false;
  },
  onCaretMove: (offset) => {
    caretTouched = true;
    if (reader.state === "playing") reader.seekTo(offset);
  }
});

let voicePicker;
voicePicker = createVoicePicker({
  engineSelect: el("engine-select"),
  voiceSelect: el("voice-select"),
  allLangsCheckbox: el("all-langs"),
  customField: el("custom-field"),
  customInput: el("custom-input"),
  hint: el("engine-hint"),
  removeBtn: el("remove-voice-btn"),
  registry,
  storage,
  i18n,
  onEngineChange: (port) => reader.setEngine(port),
  onVoiceChange: (voiceId) => reader.setVoice(voiceId),
  onStatus: setStatus
});

/* ---------------- idioma ---------------- */

const langSelect = el("lang-select");
i18n.languages.forEach((lang) => {
  const option = document.createElement("option");
  option.value = lang.code;
  option.textContent = lang.label;
  langSelect.appendChild(option);
});
langSelect.value = i18n.code;
langSelect.addEventListener("change", () => i18n.set(langSelect.value));

i18n.onChange(() => {
  voicePicker.retranslate();
  renderTransport();
  renderStatus();
  speed.paint();
});

/* ---------------- reproductor ---------------- */

reader.on("state", renderTransport);

reader.on("highlight", (range) => editor.highlight(range));

reader.on("progress", ({ index, total }) => {
  setStatus("status.playing", { i: index + 1, n: total, s: formatSpeed(speed.value()) });
});

reader.on("error", ({ error }) => {
  setStatus("status.error", { e: describeError(error) }, true);
});

el("play-btn").addEventListener("click", () => {
  if (reader.state === "playing") {
    reader.pause();
    setStatus("status.paused");
    return;
  }

  if (reader.state === "paused") {
    reader.resume(caretTouched ? { fromOffset: editor.caret } : {});
    return;
  }

  if (!editor.value.trim()) {
    setStatus("status.noText", null, true);
    editor.focus();
    return;
  }

  reader.setRate(speed.value());
  reader.play(caretTouched ? { fromOffset: editor.caret } : { fromOffset: 0 });
});

el("stop-btn").addEventListener("click", () => {
  reader.stop();
  caretTouched = false;
  editor.clear();
  setStatus("status.stopped");
});

window.addEventListener("beforeunload", () => registry.cancelAll());

/* ---------------- arranque ---------------- */

i18n.apply();
reader.setText(editor.value);
renderTransport();
voicePicker.loadVoices();
