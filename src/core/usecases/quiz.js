/**
 * Caso de uso: repaso tipo test con preguntas habladas.
 *
 * Lee una pregunta en voz alta y se detiene. La respuesta permanece tapada
 * hasta que la persona la confirma, momento en el que se descubre y se lee.
 * Después pasa sola a la siguiente.
 *
 * Las preguntas se barajan en cada vuelta: memorizar el orden en el que
 * estaban escritas no ayuda a memorizar las respuestas.
 *
 * Fases:
 *   idle      → parado
 *   question  → leyendo la pregunta
 *   waiting   → esperando a que la persona confirme
 *   answer    → leyendo la respuesta
 *   finished  → recorridas todas
 */
export function createQuiz({ reader, shuffle = defaultShuffle }) {
  let items = [];
  let order = [];
  let position = -1;
  let phase = "idle";
  let run = 0; // invalida una vuelta cancelada

  const listeners = [];

  function on(handler) {
    listeners.push(handler);
    return () => {
      const at = listeners.indexOf(handler);
      if (at >= 0) listeners.splice(at, 1);
    };
  }

  function emit() {
    const state = {
      phase,
      position,
      total: order.length,
      index: order[position] ?? null,
      item: items[order[position]] || null
    };
    listeners.forEach((handler) => handler(state));
  }

  function setPhase(next) {
    phase = next;
    emit();
  }

  /** Habla un texto y resuelve cuando el lector termina. */
  function say(text) {
    return new Promise((resolve) => {
      const off = reader.on("state", ({ state }) => {
        if (state !== "idle") return;
        off();
        resolve();
      });
      reader.setText(text);
      reader.play({ fromOffset: 0 });
    });
  }

  function setItems(next) {
    items = Array.isArray(next) ? next.filter((item) => item.question?.trim()) : [];
    stop();
  }

  async function askCurrent(ticket) {
    const item = items[order[position]];
    if (!item) return;

    setPhase("question");
    await say(item.question);
    if (ticket !== run) return;

    setPhase("waiting");
  }

  function start() {
    if (!items.length) return false;

    run += 1;
    const ticket = run;
    order = shuffle(items.map((_, i) => i));
    position = 0;
    askCurrent(ticket);
    return true;
  }

  /** La persona ya ha respondido: se descubre la respuesta y se lee. */
  async function confirm() {
    if (phase !== "waiting") return;

    const ticket = run;
    const item = items[order[position]];
    setPhase("answer");

    if (item.answer?.trim()) {
      await say(item.answer);
      if (ticket !== run) return;
    }

    if (position + 1 >= order.length) {
      setPhase("finished");
      return;
    }

    position += 1;
    askCurrent(ticket);
  }

  function stop() {
    run += 1;
    reader.stop();
    position = -1;
    order = [];
    setPhase("idle");
  }

  return {
    on,
    setItems,
    start,
    confirm,
    stop,
    get phase() { return phase; },
    get items() { return items.slice(); },
    get order() { return order.slice(); },
    get position() { return position; }
  };
}

/** Fisher-Yates: cada orden posible sale con la misma probabilidad. */
function defaultShuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
