import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Paneles laterales: la guía de uso y la nota del proyecto.
 *
 * Los dos se abren y se cierran con el mismo botón, porque son lo mismo
 * desde el punto de vista de quien lee: contexto alrededor de la aplicación.
 * Van en posición fija, así que no alteran la maquetación de la página; se
 * muestran solos cuando hay sitio de sobra a los lados y, en pantallas más
 * estrechas, quedan replegados hasta que se piden.
 */
const ROOMY_WIDTH = 1280;

export function createGuide({ panels, toggle, storage }) {
  const saved = storage.get(STORAGE_KEYS.guide, null);
  let open = saved === null ? window.innerWidth >= ROOMY_WIDTH : saved === "1";

  function paint() {
    panels.filter(Boolean).forEach((panel) => panel.classList.toggle("is-open", open));
    toggle.setAttribute("aria-expanded", String(open));
  }

  function set(next) {
    open = next;
    storage.set(STORAGE_KEYS.guide, open ? "1" : "0");
    paint();
  }

  toggle.addEventListener("click", () => set(!open));

  // Cerrar con Escape cuando están montados sobre el contenido.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open && window.innerWidth < ROOMY_WIDTH) set(false);
  });

  paint();
  return { paint };
}
