const questionList = document.getElementById("questionList");
const emptyState = document.getElementById("emptyState");
const builderTab = document.getElementById("builderTab");
const previewTab = document.getElementById("previewTab");
const previewContent = document.getElementById("previewContent");
const formTitle = document.getElementById("formTitle");
const formBody = document.getElementById("formBody");
const saveBtn = document.getElementById("saveBtn");
const printBtn = document.getElementById("printBtn");
const savePanel = document.getElementById("savePanel");
const saveOutput = document.getElementById("saveOutput");
const closeSavePanel = document.getElementById("closeSavePanel");

let questions = [];
let nextId = 1;

const typeMap = {
  single: { label: "Single Choice", componentId: 1 },
  multiple: { label: "Multiple Choice", componentId: 2 },
  text: { label: "Text", componentId: 3 },
  memo: { label: "Memo", componentId: 4 },
  dropdown: { label: "Dropdown", componentId: 5 },
  date: { label: "Date", componentId: 6 },
  time: { label: "Time", componentId: 7 },
  range: { label: "Range", componentId: 8 }
};

document.querySelectorAll(".tool-btn").forEach(button => {
  button.addEventListener("click", () => {
    switchTab("builder");
    addQuestion(button.dataset.type);
  });
});

document.querySelectorAll(".tab").forEach(button => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

saveBtn.addEventListener("click", () => {
  const payload = buildSavePayload();
  saveOutput.textContent = JSON.stringify(payload, null, 2);
  savePanel.hidden = false;
});

printBtn.addEventListener("click", () => {
  renderPreview();
  window.print();
});

closeSavePanel.addEventListener("click", () => {
  savePanel.hidden = true;
});

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  builderTab.hidden = tab !== "builder";
  previewTab.hidden = tab !== "preview";
  printBtn.hidden = tab !== "preview";

  if (tab === "preview") renderPreview();
}

function addQuestion(type) {
  const meta = typeMap[type];

  const question = {
    id: nextId++,
    formSubId: 0,
    componentId: meta.componentId,
    type,
    groupId: 1,
    groupName: "General",
    required: false,
    text: `New ${meta.label} Question`,
    commentEnabled: false,
    commentTitle: "Please provide details",
    options: [
      { formAnsId: 0, text: "Option 1" },
      { formAnsId: 0, text: "Option 2" }
    ],
    rangeStart: 0,
    rangeEnd: 10,
    rangeStartText: "Poor",
    rangeEndText: "Excellent"
  };

  questions.push(question);
  renderBuilder();
}

function renderBuilder() {
  questionList.innerHTML = "";
  emptyState.style.display = questions.length ? "none" : "block";

  questions.forEach((question, index) => {
    questionList.appendChild(createQuestionCard(question, index));
  });
}

function createQuestionCard(question, index) {
  const card = document.createElement("div");
  card.className = "question-card";
  card.draggable = true;
  card.dataset.id = question.id;

  card.innerHTML = `
    <div class="drag-handle" title="Drag to reorder">=</div>
    <div class="question-main">
      <div class="question-top">
        <div class="question-edit">
          <div class="question-no">Q${index + 1}:</div>
          <textarea class="question-text" data-field="text">${escapeHtml(question.text)}</textarea>
        </div>

        <select class="select" data-field="groupId">
          ${renderGroupOptions(question.groupId)}
        </select>

        <label class="required-wrap">
          <input type="checkbox" data-field="required" ${question.required ? "checked" : ""} />
          Required
        </label>

        <div class="row-actions">
          <button class="icon-btn" data-action="move-up" title="Move up">Up</button>
          <button class="icon-btn" data-action="move-down" title="Move down">Dn</button>
          <button class="icon-btn delete-btn" data-action="delete" title="Delete">Del</button>
        </div>
      </div>

      <div class="preview-control">
        ${renderBuilderControl(question)}
      </div>
    </div>
  `;

  bindCardEvents(card, question);
  bindDragEvents(card);
  return card;
}

function renderGroupOptions(selectedGroupId) {
  const groups = [
    { id: 1, name: "General" },
    { id: 2, name: "Inspection" },
    { id: 3, name: "Safety" },
    { id: 4, name: "Follow Up" }
  ];

  return groups.map(group =>
    `<option value="${group.id}" ${group.id === Number(selectedGroupId) ? "selected" : ""}>${group.name}</option>`
  ).join("");
}

function renderBuilderControl(question) {
  if (question.type === "single") {
    return `${renderBuilderOptions(question, "radio")}${renderCommentToggle(question)}`;
  }

  if (question.type === "multiple") {
    return `${renderBuilderOptions(question, "checkbox")}${renderCommentToggle(question)}`;
  }

  if (question.type === "dropdown") {
    return `${renderBuilderOptions(question, "number")}${renderCommentToggle(question)}`;
  }

  if (question.type === "text") {
    return `<input class="input" placeholder="Short answer" disabled />`;
  }

  if (question.type === "memo") {
    return `<textarea class="input memo" placeholder="Long answer" disabled></textarea>`;
  }

  if (question.type === "date") {
    return `<input class="input" type="date" disabled />`;
  }

  if (question.type === "time") {
    return `<input class="input" type="time" disabled />`;
  }

  if (question.type === "range") {
    return `
      <div class="range-row">
        <input class="input" data-field="rangeStartText" value="${escapeHtml(question.rangeStartText)}" />
        <input class="input" type="number" data-field="rangeStart" value="${question.rangeStart}" />
        <input class="input" data-field="rangeEndText" value="${escapeHtml(question.rangeEndText)}" />
        <input class="input" type="number" data-field="rangeEnd" value="${question.rangeEnd}" />
      </div>
    `;
  }

  return "";
}

function renderBuilderOptions(question, inputType) {
  const rows = question.options.map((option, index) => {
    const marker = inputType === "number"
      ? `<span>${index + 1}.</span>`
      : `<input class="fake-input" type="${inputType}" disabled />`;

    return `
      <div class="option-row">
        ${marker}
        <input class="option-input" data-option-index="${index}" value="${escapeHtml(option.text)}" />
        <button class="icon-btn" data-action="delete-option" data-option-index="${index}">x</button>
      </div>
    `;
  }).join("");

  return `
    <div class="options">
      ${rows}
      <button class="add-option" data-action="add-option">Add Selection</button>
    </div>
  `;
}

function renderCommentToggle(question) {
  return `
    <div class="comment-box">
      <label>
        <input type="checkbox" data-field="commentEnabled" ${question.commentEnabled ? "checked" : ""} />
        Comment Required
      </label>
      ${question.commentEnabled
        ? `<input class="input" data-field="commentTitle" value="${escapeHtml(question.commentTitle)}" />`
        : ""}
    </div>
  `;
}

function bindCardEvents(card, question) {
  card.addEventListener("input", event => {
    const field = event.target.dataset.field;

    if (field === "text") {
      question.text = event.target.value;
    } else if (field) {
      question[field] = event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    }

    const optionIndex = event.target.dataset.optionIndex;
    if (optionIndex !== undefined) {
      question.options[Number(optionIndex)].text = event.target.value;
    }
  });

  card.addEventListener("change", event => {
    const field = event.target.dataset.field;

    if (field === "groupId") {
      question.groupId = Number(event.target.value);
      question.groupName = event.target.options[event.target.selectedIndex].text;
      return;
    }

    if (field) {
      question[field] = event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

      if (field === "commentEnabled") renderBuilder();
    }
  });

  card.addEventListener("click", event => {
    const action = event.target.dataset.action;
    if (!action) return;

    if (action === "move-up") {
      moveQuestion(question.id, -1);
    }

    if (action === "move-down") {
      moveQuestion(question.id, 1);
    }

    if (action === "delete") {
      questions = questions.filter(item => item.id !== question.id);
      renderBuilder();
    }

    if (action === "add-option") {
      question.options.push({ formAnsId: 0, text: `Option ${question.options.length + 1}` });
      renderBuilder();
    }

    if (action === "delete-option") {
      const index = Number(event.target.dataset.optionIndex);
      question.options.splice(index, 1);
      renderBuilder();
    }
  });
}

function moveQuestion(id, direction) {
  const index = questions.findIndex(item => item.id === id);
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= questions.length) return;

  [questions[index], questions[nextIndex]] = [questions[nextIndex], questions[index]];
  renderBuilder();
}

function bindDragEvents(card) {
  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    syncOrderFromDom();
  });

  card.addEventListener("dragover", event => {
    event.preventDefault();

    const dragging = document.querySelector(".dragging");
    const afterElement = getDragAfterElement(questionList, event.clientY);

    if (!afterElement) {
      questionList.appendChild(dragging);
    } else {
      questionList.insertBefore(dragging, afterElement);
    }
  });
}

function getDragAfterElement(container, y) {
  const cards = [...container.querySelectorAll(".question-card:not(.dragging)")];

  return cards.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }

    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function syncOrderFromDom() {
  const ids = [...questionList.querySelectorAll(".question-card")]
    .map(card => Number(card.dataset.id));

  questions = ids.map(id => questions.find(question => question.id === id));
  renderBuilder();
}

function renderPreview() {
  previewContent.innerHTML = `
    <div class="preview-title">${escapeHtml(formTitle.value)}</div>
    <div class="preview-body">${escapeHtml(formBody.value)}</div>
    <div class="line"></div>
    ${questions.length ? questions.map(renderPreviewQuestion).join("") : `<div class="empty-state">No questions.</div>`}
  `;
}

function renderPreviewQuestion(question, index) {
  return `
    <div class="preview-question">
      <div class="preview-question-title">
        ${question.required ? `<span class="required-mark">*</span>` : ""}
        Q${index + 1}: ${escapeHtml(question.text)}
      </div>
      ${renderPreviewControl(question)}
    </div>
  `;
}

function renderPreviewControl(question) {
  if (question.type === "single") {
    return `
      <div class="preview-options">
        ${question.options.map(option => `
          <label class="preview-option">
            <input type="radio" name="q_${question.id}" />
            ${escapeHtml(option.text)}
          </label>
        `).join("")}
      </div>
      ${renderPreviewComment(question)}
    `;
  }

  if (question.type === "multiple") {
    return `
      <div class="preview-options">
        ${question.options.map(option => `
          <label class="preview-option">
            <input type="checkbox" />
            ${escapeHtml(option.text)}
          </label>
        `).join("")}
      </div>
      ${renderPreviewComment(question)}
    `;
  }

  if (question.type === "dropdown") {
    return `
      <select class="input">
        <option value="">Please select</option>
        ${question.options.map(option => `<option>${escapeHtml(option.text)}</option>`).join("")}
      </select>
      ${renderPreviewComment(question)}
    `;
  }

  if (question.type === "text") {
    return `<input class="input" placeholder="Short answer" />`;
  }

  if (question.type === "memo") {
    return `<textarea class="input memo" placeholder="Long answer"></textarea>`;
  }

  if (question.type === "date") {
    return `<input class="input" type="date" />`;
  }

  if (question.type === "time") {
    return `<input class="input" type="time" />`;
  }

  if (question.type === "range") {
    const start = Number(question.rangeStart);
    const end = Number(question.rangeEnd);
    const values = [];

    for (let i = start; i <= end; i++) values.push(i);

    return `
      <div class="preview-options">
        <div>${escapeHtml(question.rangeStartText)} to ${escapeHtml(question.rangeEndText)}</div>
        <div>
          ${values.map(value => `
            <label class="preview-option" style="display:inline-flex; margin-right:12px;">
              <input type="radio" name="q_${question.id}" />
              ${value}${value === 0 ? " (N/A)" : ""}
            </label>
          `).join("")}
        </div>
      </div>
    `;
  }

  return "";
}

function renderPreviewComment(question) {
  if (!question.commentEnabled) return "";

  return `
    <div class="preview-comment">
      <label>${escapeHtml(question.commentTitle)}</label>
      <textarea class="input memo"></textarea>
    </div>
  `;
}

function buildSavePayload() {
  return {
    formId: 123,
    title: formTitle.value,
    body: formBody.value,
    questions: questions.map((question, index) => ({
      formSubId: question.formSubId,
      componentId: question.componentId,
      sort: index + 1,
      groupId: Number(question.groupId),
      mandatoryFlag: question.required ? 1 : 0,
      question: question.text,
      commentFlag: question.commentEnabled ? 1 : 0,
      commentTitle: question.commentEnabled ? question.commentTitle : "",
      answers: ["single", "multiple", "dropdown"].includes(question.type)
        ? question.options.map((option, answerIndex) => ({
            formAnsId: option.formAnsId,
            sort: answerIndex + 1,
            text: option.text
          }))
        : [],
      range: question.type === "range"
        ? {
            startValue: Number(question.rangeStart),
            endValue: Number(question.rangeEnd),
            startText: question.rangeStartText,
            endText: question.rangeEndText
          }
        : null
    }))
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

addQuestion("single");
addQuestion("text");
renderBuilder();
