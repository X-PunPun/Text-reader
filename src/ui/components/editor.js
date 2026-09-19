/**
 * Editor de texto con resaltado de lectura.
 *
 * Un <textarea> no admite texto con formato, así que debajo se coloca un
 * espejo con el mismo contenido, misma tipografía y mismas métricas. El
 * espejo pinta los fondos (frase y palabra en curso) y el textarea, con
 * fondo transparente, sigue recibiendo la escritura y el cursor.
 *
 * Las métricas tienen que coincidir al píxel: si el texto del espejo corta
 * las líneas en otro punto que el del textarea, el resaltado se va
 * desplazando. La barra de desplazamiento del textarea le roba ancho al
 * área de texto, así que el espejo reserva ese mismo hueco.
 */
export function createEditor({ textarea, mirror, counter, onCaretMove, onTextChange }) {
  let lastHighlight = null;
  let locked = false;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function updateCounter() {
    counter.textContent = textarea.value.length.toLocaleString();
  }

  /** Iguala el ancho útil del espejo al del textarea (barra incluida). */
  function syncMetrics() {
    const scrollbar = textarea.offsetWidth - textarea.clientWidth;
    const style = getComputedStyle(textarea);
    mirror.style.paddingRight = `${parseFloat(style.paddingRight) + scrollbar}px`;
  }

  function syncScroll() {
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;
  }

  /** Desplaza el textarea si la frase en curso quedó fuera de la vista. */
  function revealCurrent() {
    // con el marcado por líneas puede haber varios; el de la palabra en curso
    // manda, y si no, el primero del fragmento
    const mark = mirror.querySelector(".hl-word") || mirror.querySelector(".hl-sentence");
    if (!mark) return;

    const top = mark.offsetTop;
    const bottom = top + mark.offsetHeight;
    const viewTop = textarea.scrollTop;
    const viewBottom = viewTop + textarea.clientHeight;
    const margin = 48;

    if (top < viewTop + margin) {
      textarea.scrollTop = Math.max(0, top - margin);
      syncScroll();
    } else if (bottom > viewBottom - margin) {
      textarea.scrollTop = bottom - textarea.clientHeight + margin;
      syncScroll();
    }
  }

  /**
   * Envuelve un tramo dejando los saltos de línea FUERA del marcador.
   *
   * Un <mark> que abarca un salto pinta también la línea en blanco, y se ve
   * una barra de color suelta donde no hay texto. Marcando línea a línea el
   * color cae solo sobre letras.
   */
  function markByLines(slice, className) {
    return slice
      .split("\n")
      .map((line) => (line ? `<mark class="${className}">${escapeHtml(line)}</mark>` : ""))
      .join("\n");
  }

  function highlight(range) {
    lastHighlight = range;

    if (!range || range.start === null || range.start === undefined) {
      mirror.innerHTML = "";
      return;
    }

    syncMetrics();

    const text = textarea.value;
    const { start, end, wordStart, wordEnd } = range;
    const html = [escapeHtml(text.slice(0, start))];

    const hasWord =
      typeof wordStart === "number" &&
      typeof wordEnd === "number" &&
      wordStart >= start &&
      wordEnd <= end &&
      wordEnd > wordStart;

    if (hasWord) {
      html.push(markByLines(text.slice(start, wordStart), "hl-sentence"));
      html.push(markByLines(text.slice(wordStart, wordEnd), "hl-word"));
      html.push(markByLines(text.slice(wordEnd, end), "hl-sentence"));
    } else {
      html.push(markByLines(text.slice(start, end), "hl-sentence"));
    }

    html.push(escapeHtml(text.slice(end)));
    html.push(" "); // para que un salto de línea final ocupe altura

    mirror.innerHTML = html.join("");
    syncScroll();
    revealCurrent();
  }

  function clear() {
    highlight(null);
  }

  /* ---------------- eventos ---------------- */

  textarea.addEventListener("input", () => {
    updateCounter();
    clear();
    onTextChange(textarea.value);
  });

  textarea.addEventListener("scroll", syncScroll);

  textarea.addEventListener("click", () => {
    if (!locked) onCaretMove(textarea.selectionStart);
  });

  textarea.addEventListener("keyup", (event) => {
    if (locked) return;
    const navigation = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"];
    if (navigation.includes(event.key)) onCaretMove(textarea.selectionStart);
  });

  // Mientras se lee, el texto queda intacto: ni cursor ni selección. Así no
  // se puede cambiar sin querer el punto desde el que se retoma. El
  // desplazamiento con la rueda sigue funcionando.
  textarea.addEventListener("mousedown", (event) => {
    if (locked) event.preventDefault();
  });

  textarea.addEventListener("selectstart", (event) => {
    if (locked) event.preventDefault();
  });

  textarea.addEventListener("keydown", (event) => {
    if (!locked) return;
    if (event.ctrlKey || event.metaKey || event.key === "Tab") return; // atajos y foco
    event.preventDefault();
  });

  // El textarea se puede redimensionar a mano y la ventana cambia de tamaño:
  // en ambos casos varía el ajuste de línea y hay que repintar.
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      syncMetrics();
      if (lastHighlight) highlight(lastHighlight);
    }).observe(textarea);
  }

  window.addEventListener("resize", () => {
    syncMetrics();
    if (lastHighlight) highlight(lastHighlight);
  });

  updateCounter();
  syncMetrics();

  /** Bloquea cursor, selección y edición mientras suena la lectura. */
  function setLocked(value) {
    locked = value;
    textarea.readOnly = value;
    textarea.classList.toggle("is-locked", value);
    if (value && document.activeElement === textarea) textarea.blur();
  }

  return {
    highlight,
    clear,
    setLocked,
    refresh: () => highlight(lastHighlight),
    get value() { return textarea.value; },
    get caret() { return textarea.selectionStart; },
    focus: () => textarea.focus()
  };
}
