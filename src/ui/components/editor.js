/**
 * Editor de texto con resaltado de lectura.
 *
 * Un <textarea> no admite texto con formato, así que debajo se coloca un
 * espejo con el mismo contenido, misma tipografía y mismas métricas. El
 * espejo pinta los fondos (frase y palabra en curso) y el textarea, con
 * fondo transparente, sigue recibiendo la escritura y el cursor.
 */
export function createEditor({ textarea, mirror, counter, onCaretMove, onTextChange }) {
  let lastHighlight = null;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function updateCounter() {
    counter.textContent = textarea.value.length.toLocaleString();
  }

  function syncScroll() {
    mirror.scrollTop = textarea.scrollTop;
    mirror.scrollLeft = textarea.scrollLeft;
  }

  /** Desplaza el textarea si la frase en curso quedó fuera de la vista. */
  function revealCurrent() {
    const mark = mirror.querySelector(".hl-sentence");
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

  function highlight(range) {
    lastHighlight = range;

    if (!range || range.start === null || range.start === undefined) {
      mirror.innerHTML = "";
      return;
    }

    const text = textarea.value;
    const { start, end, wordStart, wordEnd } = range;
    const html = [escapeHtml(text.slice(0, start)), '<mark class="hl-sentence">'];

    const hasWord =
      typeof wordStart === "number" &&
      typeof wordEnd === "number" &&
      wordStart >= start &&
      wordEnd <= end &&
      wordEnd > wordStart;

    if (hasWord) {
      html.push(escapeHtml(text.slice(start, wordStart)));
      html.push(`<mark class="hl-word">${escapeHtml(text.slice(wordStart, wordEnd))}</mark>`);
      html.push(escapeHtml(text.slice(wordEnd, end)));
    } else {
      html.push(escapeHtml(text.slice(start, end)));
    }

    html.push("</mark>");
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
    onCaretMove(textarea.selectionStart);
  });

  textarea.addEventListener("keyup", (event) => {
    const navigation = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"];
    if (navigation.includes(event.key)) onCaretMove(textarea.selectionStart);
  });

  updateCounter();

  return {
    highlight,
    clear,
    refresh: () => highlight(lastHighlight),
    get value() { return textarea.value; },
    get caret() { return textarea.selectionStart; },
    focus: () => textarea.focus()
  };
}
