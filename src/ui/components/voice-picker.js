import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Selección de motor y de voz.
 *
 * Motores sin servicio de por medio: el del navegador y Piper, que descarga
 * la voz una vez y la deja guardada en el dispositivo. Los remotos son
 * opcionales y pueden fallar si el servicio está caído.
 */
export function createVoicePicker({
  engineSelect,
  voiceSelect,
  customField,
  customInput,
  hint,
  removeBtn,
  registry,
  storage,
  i18n,
  onEngineChange,
  onVoiceChange,
  onStatus
}) {
  let voices = [];

  function engineLabel(engine) {
    return engine.labelKey ? i18n.t(engine.labelKey) : engine.label;
  }

  function fillEngines() {
    const selected = engineSelect.value || storage.get(STORAGE_KEYS.engine, "native") || "native";
    engineSelect.innerHTML = "";
    registry.list().forEach((engine) => {
      const option = document.createElement("option");
      option.value = engine.id;
      option.textContent = engineLabel(engine);
      engineSelect.appendChild(option);
    });
    engineSelect.value = selected;
  }

  function optionLabel(voice) {
    const parts = [voice.name];
    if (voice.lang) parts.push(`— ${voice.lang}`);
    if (voice.isDefault) parts.push(`(${i18n.t("voice.default")})`);
    if (voice.downloaded) parts.push("✓");
    else if (voice.sizeMb) parts.push(`· ${voice.sizeMb} MB`);
    return parts.join(" ");
  }

  function renderVoices() {
    const previous = voiceSelect.value;
    voiceSelect.innerHTML = "";

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.id;
      option.textContent = optionLabel(voice);
      voiceSelect.appendChild(option);
    });

    if (previous && voices.some((voice) => voice.id === previous)) voiceSelect.value = previous;
    paintRemove();
  }

  function current() {
    return voices.find((voice) => voice.id === voiceSelect.value) || null;
  }

  function paintRemove() {
    const voice = current();
    removeBtn.hidden = !(engineSelect.value === "piper" && voice?.downloaded);
  }

  function paintHint() {
    const engineId = engineSelect.value;
    if (engineId === "native") {
      hint.hidden = true;
      return;
    }
    hint.hidden = false;
    hint.dataset.i18n = engineId === "piper" ? "hint.piper" : "hint.remote";
    hint.textContent = i18n.t(hint.dataset.i18n);
  }

  function sortForUi(list) {
    const ui = i18n.code;
    return list.slice().sort((a, b) => {
      const aMatch = a.lang?.toLowerCase().startsWith(ui) ? 0 : 1;
      const bMatch = b.lang?.toLowerCase().startsWith(ui) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      // dentro del mismo idioma, primero las que ya están descargadas
      if (Boolean(b.downloaded) !== Boolean(a.downloaded)) return b.downloaded ? 1 : -1;
      return (a.lang || "").localeCompare(b.lang || "") || a.name.localeCompare(b.name);
    });
  }

  async function loadVoices() {
    const engineId = engineSelect.value;
    const port = registry.get(engineId);

    customField.hidden = engineId !== "custom";
    paintHint();

    if (!port.isAvailable()) {
      voices = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus(engineId === "piper" ? "error.no-opfs" : "status.unsupported", null, true);
      paintRemove();
      return;
    }

    voiceSelect.innerHTML = `<option>${i18n.t("select.loading")}</option>`;

    try {
      voices = sortForUi(await port.listVoices());
    } catch (error) {
      voices = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.error", { e: i18n.t("error.model-download") }, true);
      paintRemove();
      return;
    }

    if (!voices.length) {
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.noVoices", null, true);
      onVoiceChange(null);
      paintRemove();
      return;
    }

    renderVoices();

    const saved = storage.get(`${STORAGE_KEYS.voice}:${engineId}`);
    const preferred =
      voices.find((voice) => voice.id === saved) ||
      voices.find((voice) => voice.lang?.toLowerCase().startsWith(i18n.code)) ||
      voices[0];

    voiceSelect.value = preferred.id;
    onVoiceChange(preferred.id);
    paintRemove();
    onStatus("status.voices", { n: voices.length });
  }

  engineSelect.addEventListener("change", async () => {
    const engineId = engineSelect.value;
    storage.set(STORAGE_KEYS.engine, engineId);
    onEngineChange(registry.get(engineId));
    await loadVoices();
  });

  voiceSelect.addEventListener("change", () => {
    storage.set(`${STORAGE_KEYS.voice}:${engineSelect.value}`, voiceSelect.value);
    onVoiceChange(voiceSelect.value);
    paintRemove();
  });

  removeBtn.addEventListener("click", async () => {
    const port = registry.get(engineSelect.value);
    const voice = current();
    if (!voice || typeof port.removeVoice !== "function") return;

    removeBtn.disabled = true;
    try {
      await port.removeVoice(voice.id);
      onStatus("status.voiceRemoved");
      await loadVoices();
    } finally {
      removeBtn.disabled = false;
    }
  });

  customInput.value = storage.get(STORAGE_KEYS.customEndpoint, "") || "";
  customInput.addEventListener("change", () => {
    storage.set(STORAGE_KEYS.customEndpoint, customInput.value.trim());
  });

  fillEngines();

  return {
    loadVoices,
    retranslate: () => {
      fillEngines();
      renderVoices();
      paintHint();
    },
    get engineId() { return engineSelect.value; },
    get voiceId() { return voiceSelect.value; },
    get currentVoice() { return current(); }
  };
}
