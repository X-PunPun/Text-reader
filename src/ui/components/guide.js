import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Guía lateral de uso.
 *
 * El panel está en posición fija, así que no altera la maquetación de la
 * página. Se abre solo cuando hay sitio de sobra a los lados; en pantallas
 * más estrechas queda replegado tras el botón y el usuario decide.
 */
const ROOMY_WIDTH = 1280;

export function createGuide({ panel, toggle, storage }) {
  const saved = storage.get(STORAGE_KEYS.guide, null);
  let open = saved === null ? window.innerWidth >= ROOMY_WIDTH : saved === "1";

  function paint() {
    panel.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    open = !open;
    storage.set(STORAGE_KEYS.guide, open ? "1" : "0");
    paint();
  });

  // Cerrar con Escape mientras está abierto sobre el contenido.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open && window.innerWidth < ROOMY_WIDTH) {
      open = false;
      storage.set(STORAGE_KEYS.guide, "0");
      paint();
    }
  });

  paint();
  return { paint };
}
