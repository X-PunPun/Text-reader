import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Selección de motor y de voz.
 *
 * El motor nativo del navegador es el predeterminado; los demás son
 * servicios públicos que no piden cuenta. "Custom endpoint" deja pegar
 * la URL de cualquier servicio propio.
 */
export function createVoicePicker({
  engineSelect,
  voiceSelect,
  customField,
  customInput,
  hint,
  registry,
  storage,
  i18n,
  onEngineChange,
  onVoiceChange,
  onStatus
}) {
  let voices = [];

  function fillEngines() {
    engineSelect.innerHTML = "";
    registry.list().forEach((engine) => {
      const option = document.createElement("option");
      option.value = engine.id;
      option.textContent = engine.id === "native" ? i18n.t("engine.native") : engine.label;
      engineSelect.appendChild(option);
    });
    engineSelect.value = storage.get(STORAGE_KEYS.engine, "native");
    if (!engineSelect.value) engineSelect.value = "native";
  }

  function renderVoices() {
    const previous = voiceSelect.value;
    voiceSelect.innerHTML = "";

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.id;
      const suffix = voice.isDefault ? ` (${i18n.t("voice.default")})` : "";
      option.textContent = voice.lang ? `${voice.name} — ${voice.lang}${suffix}` : voice.name;
      voiceSelect.appendChild(option);
    });

    if (previous && voices.some((voice) => voice.id === previous)) voiceSelect.value = previous;
  }

  function sortForUi(list) {
    const ui = i18n.code;
    return list.slice().sort((a, b) => {
      const aMatch = a.lang?.toLowerCase().startsWith(ui) ? 0 : 1;
      const bMatch = b.lang?.toLowerCase().startsWith(ui) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return (a.lang || "").localeCompare(b.lang || "") || a.name.localeCompare(b.name);
    });
  }

  async function loadVoices() {
    const engineId = engineSelect.value;
    const port = registry.get(engineId);

    customField.hidden = engineId !== "custom";
    hint.hidden = engineId === "native";

    if (!port.isAvailable()) {
      voices = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.unsupported", null, true);
      return;
    }

    voiceSelect.innerHTML = `<option>${i18n.t("select.loading")}</option>`;
    voices = sortForUi(await port.listVoices());

    if (!voices.length) {
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.noVoices", null, true);
      onVoiceChange(null);
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
    },
    get engineId() { return engineSelect.value; },
    get voiceId() { return voiceSelect.value; }
  };
}
