import { createLocalStorageAdapter } from "../adapters/storage/local-storage.adapter.js";
import { createEngineRegistry } from "../adapters/speech/engine-registry.js";
import { STORAGE_KEYS } from "../core/ports/storage.port.js";
import { createReader } from "../core/usecases/reader.js";
import { createExporter } from "../core/usecases/exporter.js";
import { decodeAndJoin, encodeMp3, encodeWav, resample } from "../adapters/audio/mp3-encoder.js";
import { FORMATS, DEFAULT_FORMAT, findFormat } from "../adapters/audio/formats.js";
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
    if (phase === "downloaded") {
      // La voz ya está en el dispositivo: se repinta la lista para que quede
      // marcada y utilizable sin recargar la página.
      voicePicker?.refreshDownloaded();
      return;
    }
    if (percent === null || percent === undefined) {
      setStatus("status.preparing");
      return;
    }
    const size = voicePicker?.currentVoice?.sizeMb ?? "?";
    setStatus("status.downloading", { n: size, p: percent });
  }
});

const reader = createReader({
  speech: registry.get(storage.get(STORAGE_KEYS.engine, "native") || "native")
});

let status = { key: "status.ready", vars: null, error: false };
let caretTouched = false;
let exporting = false;

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
  el("download-btn").disabled = exporting || !exporter.canExport(registry.get(voicePicker?.engineId || "native"));
  document.body.classList.toggle("is-reading", state !== "idle");
  editor.setLocked(state === "playing" || exporting);
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
  // Mover el cursor no interrumpe la lectura: solo se tiene en cuenta al
  // reanudar desde una pausa.
  onCaretMove: () => {
    if (reader.state !== "playing") caretTouched = true;
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
  onEngineChange: (port) => {
    reader.setEngine(port);
    renderTransport(); // el motor del navegador no puede exportar audio
  },
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
    caretTouched = false; // solo cuenta lo que se mueva a partir de ahora
    setStatus("status.paused");
    return;
  }

  if (reader.state === "paused") {
    reader.resume(caretTouched ? { fromOffset: editor.caret } : {});
    caretTouched = false;
    return;
  }

  if (!editor.value.trim()) {
    setStatus("status.noText", null, true);
    editor.focus();
    return;
  }

  reader.setRate(speed.value());
  reader.play({ fromOffset: caretTouched ? editor.caret : 0 });
  caretTouched = false;
});

el("stop-btn").addEventListener("click", () => {
  reader.stop();
  caretTouched = false;
  editor.clear();
  setStatus("status.stopped");
});

/* ---------------- exportar a archivo ---------------- */

const formatSelect = el("format-select");

FORMATS.forEach((format) => {
  const option = document.createElement("option");
  option.value = format.id;
  option.textContent = format.label;
  formatSelect.appendChild(option);
});
formatSelect.value = storage.get(STORAGE_KEYS.format, DEFAULT_FORMAT) || DEFAULT_FORMAT;
formatSelect.addEventListener("change", () => storage.set(STORAGE_KEYS.format, formatSelect.value));

const exporter = createExporter({
  encode: async (blobs) => {
    const format = findFormat(formatSelect.value);
    const joined = await decodeAndJoin(blobs);

    if (format.kind === "wav") {
      return { blob: encodeWav(joined), extension: "wav" };
    }

    // Los perfiles de alta calidad suben a 44,1 kHz: por debajo, el MP3 no
    // admite más de 160 kbps y pedir 320 no cambiaría nada.
    const track = await resample(joined, format.sampleRate);

    try {
      const blob = await encodeMp3(track, format.bitrate, (percent) =>
        setStatus("status.encoding", { p: percent })
      );
      return { blob, extension: "mp3" };
    } catch (error) {
      // Sin el codificador MP3 se entrega WAV: pesa más pero suena igual.
      return { blob: encodeWav(joined), extension: "wav" };
    }
  }
});

function fileNameFrom(text, extension) {
  const slug = text
    .trim()
    .slice(0, 40)
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .toLowerCase();
  return `${slug || "text-reader"}.${extension}`;
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

el("download-btn").addEventListener("click", async () => {
  const port = registry.get(voicePicker.engineId);

  if (!exporter.canExport(port)) {
    setStatus("status.error", { e: i18n.t("error.engine-cannot-export") }, true);
    return;
  }
  if (!editor.value.trim()) {
    setStatus("status.noText", null, true);
    editor.focus();
    return;
  }

  reader.stop();
  exporting = true;
  renderTransport();

  try {
    const { blob, extension } = await exporter.exportAudio({
      port,
      text: editor.value,
      voiceId: voicePicker.voiceId,
      onProgress: ({ done, total, phase }) => {
        if (phase === "rendering") setStatus("status.rendering", { i: done + 1, n: total });
      }
    });

    const name = fileNameFrom(editor.value, extension);
    saveBlob(blob, name);
    setStatus("status.exported", { name });
  } catch (error) {
    const code = String(error?.message || "");
    setStatus("status.error", { e: describeError(code) }, true);
  } finally {
    exporting = false;
    renderTransport();
  }
});

window.addEventListener("beforeunload", () => registry.cancelAll());

/* ---------------- arranque ---------------- */

i18n.apply();
reader.setText(editor.value);
renderTransport();
voicePicker.loadVoices();
