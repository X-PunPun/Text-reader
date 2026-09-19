import { SPEEDS, DEFAULT_SPEED_INDEX, clampSpeedIndex, formatSpeed } from "../../core/domain/speeds.js";
import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Barra de velocidad con posiciones fijas, estilo reproductor de vídeo.
 * Las etiquetas de debajo también son botones.
 */
export function createSpeedSlider({ range, badge, marks, storage, onChange }) {
  range.min = "0";
  range.max = String(SPEEDS.length - 1);
  range.step = "1";
  range.value = String(clampSpeedIndex(storage.get(STORAGE_KEYS.speed, DEFAULT_SPEED_INDEX)));

  marks.innerHTML = "";
  SPEEDS.forEach((speed, i) => {
    const mark = document.createElement("button");
    mark.type = "button";
    mark.className = "speed-mark";
    mark.textContent = formatSpeed(speed);
    mark.addEventListener("click", () => {
      range.value = String(i);
      commit();
    });
    marks.appendChild(mark);
  });

  function value() {
    return SPEEDS[clampSpeedIndex(range.value)];
  }

  function paint() {
    const index = clampSpeedIndex(range.value);
    badge.textContent = formatSpeed(SPEEDS[index]);
    range.style.setProperty("--fill", `${(index / (SPEEDS.length - 1)) * 100}%`);
    Array.from(marks.children).forEach((mark, i) => {
      mark.classList.toggle("is-active", i === index);
    });
  }

  function commit() {
    paint();
    storage.set(STORAGE_KEYS.speed, clampSpeedIndex(range.value));
    onChange(value());
  }

  range.addEventListener("input", commit);
  paint();

  return { value, paint };
}
