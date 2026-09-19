import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Selección de motor y de voz.
 *
 * Por defecto solo se listan las voces del idioma elegido para la página:
 * un navegador puede traer decenas de voces y casi ninguna sirve para el
 * texto que se va a leer. La casilla "All languages" muestra el resto, y si
 * para ese idioma no hay ninguna voz se muestran todas avisando de ello.
 */
export function createVoicePicker({
  engineSelect,
  voiceSelect,
  allLangsCheckbox,
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
  let allVoices = [];   // lo que devuelve el motor
  let shown = [];       // lo que se ve en el desplegable

  /* ---------------- idioma ---------------- */

  function matchesUiLanguage(voice) {
    const lang = String(voice.lang || "").toLowerCase().replace("_", "-");
    const ui = i18n.code.toLowerCase();
    return lang === ui || lang.startsWith(`${ui}-`);
  }

  function applyLanguageFilter(list) {
    if (allLangsCheckbox.checked) return { voices: list, fellBack: false };

    const matching = list.filter(matchesUiLanguage);
    // Sin voces para este idioma (p. ej. japonés en Piper): mejor mostrar
    // todas que dejar el desplegable vacío.
    if (!matching.length) return { voices: list, fellBack: true };
    return { voices: matching, fellBack: false };
  }

  /* ---------------- motores ---------------- */

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

  /* ---------------- voces ---------------- */

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

    shown.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.id;
      option.textContent = optionLabel(voice);
      voiceSelect.appendChild(option);
    });

    if (previous && shown.some((voice) => voice.id === previous)) voiceSelect.value = previous;
    paintRemove();
  }

  function current() {
    return shown.find((voice) => voice.id === voiceSelect.value) || null;
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

  function sortVoices(list) {
    return list.slice().sort((a, b) => {
      // dentro del mismo idioma, primero las que ya están en el dispositivo
      if (Boolean(b.downloaded) !== Boolean(a.downloaded)) return b.downloaded ? 1 : -1;
      return (a.lang || "").localeCompare(b.lang || "") || a.name.localeCompare(b.name);
    });
  }

  function languageName() {
    return i18n.languages.find((lang) => lang.code === i18n.code)?.label || i18n.code;
  }

  /** Reconstruye el desplegable a partir de las voces ya cargadas. */
  function refreshList() {
    if (!allVoices.length) return;

    const { voices, fellBack } = applyLanguageFilter(allVoices);
    shown = sortVoices(voices);
    renderVoices();

    const engineId = engineSelect.value;
    const saved = storage.get(`${STORAGE_KEYS.voice}:${engineId}`);
    const preferred =
      shown.find((voice) => voice.id === saved) ||
      shown.find(matchesUiLanguage) ||
      shown[0];

    if (preferred) {
      voiceSelect.value = preferred.id;
      onVoiceChange(preferred.id);
    }

    paintRemove();
    if (fellBack) onStatus("status.noVoicesForLang", { lang: languageName() });
    else onStatus("status.voices", { n: shown.length });
  }

  async function loadVoices() {
    const engineId = engineSelect.value;
    const port = registry.get(engineId);

    customField.hidden = engineId !== "custom";
    paintHint();

    if (!port.isAvailable()) {
      allVoices = [];
      shown = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus(engineId === "piper" ? "error.no-opfs" : "status.unsupported", null, true);
      paintRemove();
      return;
    }

    voiceSelect.innerHTML = `<option>${i18n.t("select.loading")}</option>`;

    try {
      allVoices = await port.listVoices();
    } catch (error) {
      allVoices = [];
      shown = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.error", { e: i18n.t("error.model-download") }, true);
      paintRemove();
      return;
    }

    if (!allVoices.length) {
      shown = [];
      voiceSelect.innerHTML = `<option>${i18n.t("select.unavailable")}</option>`;
      onStatus("status.noVoices", null, true);
      onVoiceChange(null);
      paintRemove();
      return;
    }

    refreshList();
  }

  /* ---------------- eventos ---------------- */

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

  allLangsCheckbox.checked = storage.get(STORAGE_KEYS.allLanguages, "0") === "1";
  allLangsCheckbox.addEventListener("change", () => {
    storage.set(STORAGE_KEYS.allLanguages, allLangsCheckbox.checked ? "1" : "0");
    refreshList();
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
    /** Al cambiar el idioma de la página cambia también el filtro de voces. */
    retranslate: () => {
      fillEngines();
      paintHint();
      refreshList();
    },
    get engineId() { return engineSelect.value; },
    get voiceId() { return voiceSelect.value; },
    get currentVoice() { return current(); }
  };
}
