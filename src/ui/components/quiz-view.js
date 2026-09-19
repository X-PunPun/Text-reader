import { STORAGE_KEYS } from "../../core/ports/storage.port.js";

/**
 * Vista del cuestionario: las tarjetas y el diálogo para escribirlas.
 *
 * Las respuestas se muestran desenfocadas hasta que se confirman. No es un
 * secreto criptográfico —están en el HTML— pero basta para que no se lean de
 * reojo antes de intentar responder, que es de lo que se trata.
 */
export function createQuizView({ elements, storage, i18n, quiz, onItemsChange }) {
  const { list, progress, editButton, dialog, step1, step2, count, fields,
          nextButton, backButton, saveButton, cancelButton } = elements;

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

  function renderList(state) {
    list.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "quiz-empty";
      empty.textContent = i18n.t("quiz.needQuestions");
      list.appendChild(empty);
      return;
    }

    // Durante una vuelta se muestran en el orden barajado; parado, en el suyo.
    const order = state?.total ? quiz.order : items.map((_, i) => i);

    order.forEach((itemIndex, at) => {
      const item = items[itemIndex];
      if (!item) return;

      const card = document.createElement("li");
      card.className = "quiz-card";

      const isCurrent = state && at === state.position && state.phase !== "idle";
      const revealed = state && at < state.position;
      const showingAnswer = isCurrent && (state.phase === "answer" || state.phase === "finished");

      if (isCurrent) card.classList.add("is-current");
      if (revealed) card.classList.add("is-done", "is-revealed");
      if (showingAnswer) card.classList.add("is-revealed");

      const question = document.createElement("p");
      question.className = "quiz-q";
      question.textContent = `${at + 1}. ${item.question}`;
      card.appendChild(question);

      if (item.answer?.trim()) {
        const answer = document.createElement("p");
        answer.className = "quiz-a";
        answer.textContent = item.answer;
        card.appendChild(answer);
      }

      list.appendChild(card);
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
  }

  /* ---------------- diálogo ---------------- */

  function buildFields(howMany) {
    fields.innerHTML = "";

    for (let i = 0; i < howMany; i += 1) {
      const existing = items[i] || { question: "", answer: "" };

      const group = document.createElement("div");
      group.className = "quiz-field";

      const qLabel = document.createElement("label");
      qLabel.textContent = i18n.t("quiz.q", { n: i + 1 });
      const qInput = document.createElement("input");
      qInput.className = "text-input";
      qInput.type = "text";
      qInput.value = existing.question;
      qInput.dataset.role = "question";
      qLabel.htmlFor = qInput.id = `quiz-q-${i}`;

      const aLabel = document.createElement("label");
      aLabel.textContent = i18n.t("quiz.a", { n: i + 1 });
      const aInput = document.createElement("input");
      aInput.className = "text-input";
      aInput.type = "text";
      aInput.value = existing.answer;
      aInput.dataset.role = "answer";
      aLabel.htmlFor = aInput.id = `quiz-a-${i}`;

      group.append(qLabel, qInput, aLabel, aInput);
      fields.appendChild(group);
    }
  }

  function openDialog() {
    count.value = String(items.length || 5);
    step1.hidden = false;
    step2.hidden = true;
    dialog.showModal();
  }

  nextButton.addEventListener("click", () => {
    const howMany = Math.min(50, Math.max(1, Number(count.value) || 1));
    buildFields(howMany);
    step1.hidden = true;
    step2.hidden = false;
    fields.querySelector("input")?.focus();
  });

  backButton.addEventListener("click", () => {
    step1.hidden = false;
    step2.hidden = true;
  });

  saveButton.addEventListener("click", () => {
    const groups = [...fields.querySelectorAll(".quiz-field")];
    items = groups
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
