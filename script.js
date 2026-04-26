const qwertyLayout = [
  [
    { label: "1", value: "1", type: "char" },
    { label: "2", value: "2", type: "char" },
    { label: "3", value: "3", type: "char" },
    { label: "4", value: "4", type: "char" },
    { label: "5", value: "5", type: "char" },
    { label: "6", value: "6", type: "char" },
    { label: "7", value: "7", type: "char" },
    { label: "8", value: "8", type: "char" },
    { label: "9", value: "9", type: "char" },
    { label: "0", value: "0", type: "char" },
    { label: "Delete", type: "backspace", width: "wide", smallText: true },
  ],
  [
    { label: "Q", value: "Q", type: "char" },
    { label: "W", value: "W", type: "char" },
    { label: "E", value: "E", type: "char" },
    { label: "R", value: "R", type: "char" },
    { label: "T", value: "T", type: "char" },
    { label: "Y", value: "Y", type: "char" },
    { label: "U", value: "U", type: "char" },
    { label: "I", value: "I", type: "char" },
    { label: "O", value: "O", type: "char" },
    { label: "P", value: "P", type: "char" },
  ],
  [
    { label: "A", value: "A", type: "char" },
    { label: "S", value: "S", type: "char" },
    { label: "D", value: "D", type: "char" },
    { label: "F", value: "F", type: "char" },
    { label: "G", value: "G", type: "char" },
    { label: "H", value: "H", type: "char" },
    { label: "J", value: "J", type: "char" },
    { label: "K", value: "K", type: "char" },
    { label: "L", value: "L", type: "char" },
  ],
  [
    { label: "Z", value: "Z", type: "char" },
    { label: "X", value: "X", type: "char" },
    { label: "C", value: "C", type: "char" },
    { label: "V", value: "V", type: "char" },
    { label: "B", value: "B", type: "char" },
    { label: "N", value: "N", type: "char" },
    { label: "M", value: "M", type: "char" },
    { label: "Enter", type: "commit", width: "wide", smallText: true },
  ],
  [
    { label: "Space", value: " ", type: "char", width: "extra-wide", smallText: true },
  ],
];

const textOutput = document.getElementById("text-output");
const keyGrid = document.getElementById("key-grid");

const state = {
  selectedRow: 1,
  selectedCol: 0,
  pendingCharacter: "Q",
  text: "",
};

function selectedKey() {
  return qwertyLayout[state.selectedRow][state.selectedCol];
}

function syncPreviewToSelection() {
  const key = selectedKey();
  if (key.type === "char") {
    state.pendingCharacter = key.value;
  }
}

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function displayCharacterForText() {
  if (state.pendingCharacter === " ") {
    return "\u2423";
  }
  return state.pendingCharacter;
}

function updateUI() {
  const committed = escapeText(state.text);
  const preview = escapeText(displayCharacterForText());
  textOutput.innerHTML = `${committed}<span class="preview-char">${preview}</span>`;
  textOutput.setAttribute("aria-label", `Entered text: ${state.text}${state.pendingCharacter}`);
  renderKeyGrid();
}

function renderKeyGrid() {
  keyGrid.textContent = "";

  for (let rowIndex = 0; rowIndex < qwertyLayout.length; rowIndex += 1) {
    const rowElement = document.createElement("div");
    rowElement.className = "key-row";

    for (let colIndex = 0; colIndex < qwertyLayout[rowIndex].length; colIndex += 1) {
      const key = qwertyLayout[rowIndex][colIndex];
      const cell = document.createElement("div");
      cell.className = "key-cell";
      if (key.width) {
        cell.classList.add(key.width);
      }
      if (key.smallText) {
        cell.classList.add("small-text");
      }
      if (rowIndex === state.selectedRow && colIndex === state.selectedCol) {
        cell.classList.add("selected");
      }
      cell.textContent = key.label;
      rowElement.appendChild(cell);
    }

    keyGrid.appendChild(rowElement);
  }
}

function moveVertical(step) {
  const nextRow = Math.max(0, Math.min(qwertyLayout.length - 1, state.selectedRow + step));
  state.selectedRow = nextRow;
  const maxCol = qwertyLayout[state.selectedRow].length - 1;
  state.selectedCol = Math.min(state.selectedCol, maxCol);
  syncPreviewToSelection();
  updateUI();
}

function moveHorizontal(step) {
  const rowLength = qwertyLayout[state.selectedRow].length;
  state.selectedCol = (state.selectedCol + step + rowLength) % rowLength;
  syncPreviewToSelection();
  updateUI();
}

function commitPendingCharacter() {
  state.text += state.pendingCharacter;
  updateUI();
}

function deleteLast() {
  if (!state.text) {
    return;
  }
  state.text = state.text.slice(0, -1);
  updateUI();
}

function activateSelectedKey() {
  const key = selectedKey();

  if (key.type === "char") {
    state.pendingCharacter = key.value;
    updateUI();
    return;
  }
  if (key.type === "backspace") {
    deleteLast();
    return;
  }
  if (key.type === "commit") {
    commitPendingCharacter();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    moveVertical(-1);
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveVertical(1);
    return;
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveHorizontal(-1);
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveHorizontal(1);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    commitPendingCharacter();
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    deleteLast();
  }
});

syncPreviewToSelection();
updateUI();
