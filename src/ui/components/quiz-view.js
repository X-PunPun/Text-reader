import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Vista del cuestionario: las tarjetas y el diálogo para escribirlas.
 *
 * Las respuestas se muestran desenfocadas hasta que se confirman. No es un
 * secreto criptográfico —están en el HTML— pero basta para que no se lean de
 * reojo antes de intentar responder, que es de lo que se trata.
 *
 * El botón de confirmar vive dentro de la tarjeta que toca, no en la barra
 * de controles: es donde se está mirando cuando hay que pulsarlo.
 *
 * Ninguna tarjeta desaparece durante la vuelta. Las ya respondidas se quedan
 * con la respuesta a la vista para poder repasarlas.
 */
export function createQuizView({ elements, storage, i18n, quiz, onItemsChange }) {
  const { list, progress, editButton, endPanel, dialog, step1, step2, count,
          fields, addButton, nextButton, backButton, saveButton, cancelButton } = elements;

  let items = load();

  function load() {
    try {
      const raw = storage.get(STORAGE_KEYS.quiz, "");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function save() {
    storage.set(STORAGE_KEYS.quiz, JSON.stringify(items));
    quiz.setItems(items);
    onItemsChange?.(items);
  }

  /* ---------------- tarjetas ---------------- */

  function buildCard(item, number, { current, revealed, phase }) {
    const card = document.createElement("li");
    card.className = "quiz-card";
    if (current) card.classList.add("is-current");
    if (revealed) card.classList.add("is-revealed");
    if (revealed && !current) card.classList.add("is-done");

    const head = document.createElement("div");
    head.className = "quiz-card-head";

    const question = document.createElement("p");
    question.className = "quiz-q";
    question.textContent = `${number}. ${item.question}`;
    head.appendChild(question);

    if (revealed) {
      const mark = document.createElement("span");
      mark.className = "quiz-check";
      mark.textContent = "✓";
      mark.title = i18n.t("quiz.done");
      head.appendChild(mark);
    }

    card.appendChild(head);

    if (item.answer?.trim()) {
      const answer = document.createElement("p");
      answer.className = "quiz-a";
      answer.textContent = item.answer;
      card.appendChild(answer);
    }

    // El control de confirmación solo aparece en la tarjeta en turno.
    if (current && phase === "waiting") {
      const confirm = document.createElement("button");
      confirm.type = "button";
      confirm.className = "btn btn-primary quiz-confirm";
      confirm.innerHTML = `<span class="icon" aria-hidden="true">✓</span><span></span>`;
      confirm.lastElementChild.textContent = i18n.t("quiz.reveal");
      confirm.addEventListener("click", () => quiz.confirm());
      card.appendChild(confirm);

      requestAnimationFrame(() => card.scrollIntoView({ block: "nearest", behavior: "smooth" }));
    }

    return card;
  }

  function renderList(state) {
    list.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "quiz-empty";
      empty.textContent = i18n.t("quiz.needQuestions");
      list.appendChild(empty);
      return;
    }

    const running = Boolean(state && state.phase !== "idle" && state.total);
    // Durante una vuelta se muestran en el orden barajado; parado, en el suyo.
    const order = running ? quiz.order : items.map((_, i) => i);

    order.forEach((itemIndex, at) => {
      const item = items[itemIndex];
      if (!item) return;

      const current = running && at === state.position;
      const answered = running && at < state.position;
      const showingNow = current && (state.phase === "answer" || state.phase === "finished");
      const finished = running && state.phase === "finished";

      list.appendChild(
        buildCard(item, at + 1, {
          current,
          revealed: answered || showingNow || finished,
          phase: state?.phase
        })
      );
    });
  }

  function renderProgress(state) {
    if (!items.length) {
      progress.textContent = i18n.t("quiz.empty");
      return;
    }
    if (!state || state.phase === "idle") {
      progress.textContent = i18n.t("quiz.ready", { n: items.length });
      return;
    }
    if (state.phase === "finished") {
      progress.textContent = i18n.t("quiz.finished");
      return;
    }
    progress.textContent = i18n.t("quiz.progress", { i: state.position + 1, n: state.total });
  }

  function render(state) {
    renderList(state);
    renderProgress(state);
    endPanel.hidden = !(state && state.phase === "finished");
  }

  /* ---------------- diálogo ---------------- */

  function addRow(existing = { question: "", answer: "" }) {
    const index = fields.children.length;

    const group = document.createElement("div");
    group.className = "quiz-field";

    const head = document.createElement("div");
    head.className = "quiz-field-head";

    const title = document.createElement("span");
    title.className = "quiz-field-number";
    title.textContent = i18n.t("quiz.q", { n: index + 1 });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "quiz-remove";
    remove.textContent = "×";
    remove.title = i18n.t("quiz.remove");
    remove.setAttribute("aria-label", i18n.t("quiz.remove"));
    remove.addEventListener("click", () => {
      group.remove();
      renumber();
    });

    head.append(title, remove);

    const qInput = document.createElement("input");
    qInput.className = "text-input";
    qInput.type = "text";
    qInput.value = existing.question;
    qInput.dataset.role = "question";
    qInput.placeholder = i18n.t("quiz.q", { n: index + 1 });

    const aInput = document.createElement("input");
    aInput.className = "text-input";
    aInput.type = "text";
    aInput.value = existing.answer;
    aInput.dataset.role = "answer";
    aInput.placeholder = i18n.t("quiz.a", { n: index + 1 });

    group.append(head, qInput, aInput);
    fields.appendChild(group);
    return qInput;
  }

  function renumber() {
    [...fields.children].forEach((group, i) => {
      group.querySelector(".quiz-field-number").textContent = i18n.t("quiz.q", { n: i + 1 });
      group.querySelector('[data-role="question"]').placeholder = i18n.t("quiz.q", { n: i + 1 });
      group.querySelector('[data-role="answer"]').placeholder = i18n.t("quiz.a", { n: i + 1 });
    });
  }

  function buildFields(howMany) {
    fields.innerHTML = "";
    for (let i = 0; i < howMany; i += 1) addRow(items[i]);
  }

  function openDialog() {
    if (items.length) {
      // Ya hay preguntas: se va directo a la lista para editarla.
      buildFields(items.length);
      step1.hidden = true;
      step2.hidden = false;
    } else {
      count.value = "5";
      step1.hidden = false;
      step2.hidden = true;
    }
    dialog.showModal();
  }

  nextButton.addEventListener("click", () => {
    buildFields(Math.min(50, Math.max(1, Number(count.value) || 1)));
    step1.hidden = true;
    step2.hidden = false;
    fields.querySelector("input")?.focus();
  });

  addButton.addEventListener("click", () => {
    const input = addRow();
    input.focus();
    input.scrollIntoView({ block: "nearest" });
  });

  backButton.addEventListener("click", () => {
    step1.hidden = false;
    step2.hidden = true;
  });

  saveButton.addEventListener("click", () => {
    items = [...fields.querySelectorAll(".quiz-field")]
      .map((group) => ({
        question: group.querySelector('[data-role="question"]').value.trim(),
        answer: group.querySelector('[data-role="answer"]').value.trim()
      }))
      .filter((item) => item.question);

    save();
    dialog.close();
    render(null);
  });

  cancelButton.addEventListener("click", () => dialog.close());
  editButton.addEventListener("click", openDialog);

  quiz.setItems(items);

  return {
    render,
    openDialog,
    get items() { return items.slice(); },
    get hasItems() { return items.length > 0; }
  };
}
