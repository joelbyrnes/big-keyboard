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
    { label: ",", value: ",", type: "char" },
    { label: ".", value: ".", type: "char" },
    { label: "?", value: "?", type: "char" },
    { label: "!", value: "!", type: "char" },
  ],
];

const textOutput = document.getElementById("text-output");
const keyGrid = document.getElementById("key-grid");
const clearBtn = document.getElementById("clear-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");

function setInputMode(mode) {
  document.body.dataset.inputMode = mode;
}

const state = {
  selectedRow: null,
  selectedCol: null,
  pendingCharacter: "",
  text: "",
};

function selectedKey() {
  if (state.selectedRow === null || state.selectedCol === null) {
    return null;
  }
  return qwertyLayout[state.selectedRow][state.selectedCol];
}

function syncPreviewToSelection() {
  const key = selectedKey();
  if (key && key.type === "char") {
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
  const mode = document.body.dataset.inputMode;
  const hasText = committed.length > 0;

  if (mode === "touch") {
    textOutput.innerHTML = hasText ? committed : "&nbsp;";
    textOutput.setAttribute("aria-label", `Entered text: ${state.text}`);
  } else {
    const preview = escapeText(displayCharacterForText());
    textOutput.innerHTML = `${committed}<span class="preview-char">${preview}</span>`;
    textOutput.setAttribute("aria-label", `Entered text: ${state.text}${state.pendingCharacter}`);
  }

  // Keep the newest character visible.
  textOutput.scrollLeft = textOutput.scrollWidth;
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
      cell.dataset.row = String(rowIndex);
      cell.dataset.col = String(colIndex);
      if (key.width) {
        cell.classList.add(key.width);
      }
      if (key.smallText) {
        cell.classList.add("small-text");
      }
      if (key.type !== "char") {
        cell.classList.add("action-key");
      }
      if (state.selectedRow !== null && state.selectedCol !== null && rowIndex === state.selectedRow && colIndex === state.selectedCol) {
        cell.classList.add("selected");
      }
      cell.textContent = key.label;
      rowElement.appendChild(cell);
    }

    keyGrid.appendChild(rowElement);
  }
}

function moveVertical(step) {
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 1;
    state.selectedCol = 0;
  }
  const nextRow = Math.max(0, Math.min(qwertyLayout.length - 1, state.selectedRow + step));
  state.selectedRow = nextRow;
  const maxCol = qwertyLayout[state.selectedRow].length - 1;
  state.selectedCol = Math.min(state.selectedCol, maxCol);
  syncPreviewToSelection();
  updateUI();
}

function moveHorizontal(step) {
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 1;
    state.selectedCol = 0;
  }
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

function clearAll() {
  state.text = "";
  updateUI();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await document.documentElement.requestFullscreen();
  } catch {
    // Fullscreen can fail depending on platform/user gesture policies.
  }
}

function activateKey(key) {
  if (key.type === "char") {
    state.text += key.value;
    if (document.body.dataset.inputMode !== "touch") {
      state.pendingCharacter = key.value;
    }
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

function bindTouchOrClick(button, action) {
  if (!button) {
    return;
  }
  button.addEventListener(
    "pointerup",
    (event) => {
      event.preventDefault();
      action();
    },
    { passive: false },
  );

  // Fallback for environments where pointer events are quirky.
  button.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      action();
    },
    { passive: false },
  );

  // Mouse / keyboard activation in desktop browsers.
  button.addEventListener("click", (event) => {
    event.preventDefault();
    action();
  });
}

document.addEventListener("keydown", (event) => {
  setInputMode("keyboard");
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

bindTouchOrClick(clearBtn, clearAll);
bindTouchOrClick(fullscreenBtn, () => {
  void toggleFullscreen();
});

// Touch / pointer support:
// - Tap a key to activate it immediately (no Enter required).
// - Dragging won't activate.
// - Suppress long-press context menus/callouts where possible.
document.addEventListener("contextmenu", (event) => {
  if (event.target && keyGrid.contains(event.target)) {
    event.preventDefault();
  }
});

let activePointerId = null;
let activeCell = null;
let moved = false;
let startX = 0;
let startY = 0;
const MOVE_THRESHOLD_PX = 20;

function isKeyCell(element) {
  return element instanceof HTMLElement && element.classList.contains("key-cell");
}

keyGrid.addEventListener(
  "pointerdown",
  (event) => {
    if (event.pointerType && event.pointerType !== "touch") {
      return;
    }
    setInputMode("touch");
    const rawTarget = event.target;
    const target =
      rawTarget instanceof HTMLElement ? rawTarget.closest(".key-cell") : null;
    if (!isKeyCell(target)) {
      return;
    }
    activePointerId = event.pointerId;
    activeCell = target;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;

    // Highlight follows touch.
    const row = Number(activeCell.dataset.row);
    const col = Number(activeCell.dataset.col);
    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      state.selectedRow = row;
      state.selectedCol = col;
      syncPreviewToSelection();
      updateUI();
    }

    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType && event.pointerType !== "touch") {
      return;
    }
    if (event.pointerId !== activePointerId) {
      return;
    }
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      moved = true;
    }
    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "pointerup",
  (event) => {
    if (event.pointerType && event.pointerType !== "touch") {
      return;
    }
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (activeCell && !moved) {
      const row = Number(activeCell.dataset.row);
      const col = Number(activeCell.dataset.col);
      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        activateKey(qwertyLayout[row][col]);
      }
    }

    activePointerId = null;
    activeCell = null;
    moved = false;
    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "pointercancel",
  () => {
    activePointerId = null;
    activeCell = null;
    moved = false;
  },
  { passive: true },
);

// Touch Events fallback (for browsers/devices without reliable Pointer Events).
let activeTouchId = null;
let touchMoved = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartCell = null;

function cellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  if (!element) {
    return null;
  }
  const cell = element.closest ? element.closest(".key-cell") : null;
  if (!(cell instanceof HTMLElement)) {
    return null;
  }
  if (!keyGrid.contains(cell)) {
    return null;
  }
  return cell;
}

function selectCell(cell) {
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) {
    return;
  }
  state.selectedRow = row;
  state.selectedCol = col;
  updateUI();
}

keyGrid.addEventListener(
  "touchstart",
  (event) => {
    setInputMode("touch");
    if (!event.changedTouches || event.changedTouches.length === 0) {
      return;
    }
    if (activeTouchId !== null) {
      return;
    }

    const t = event.changedTouches[0];
    const cell = cellFromPoint(t.clientX, t.clientY);
    if (!cell) {
      return;
    }

    activeTouchId = t.identifier;
    touchMoved = false;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartCell = cell;
    selectCell(cell);

    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "touchmove",
  (event) => {
    if (activeTouchId === null || !event.changedTouches) {
      return;
    }
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const t = event.changedTouches[i];
      if (t.identifier !== activeTouchId) {
        continue;
      }
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        touchMoved = true;
      }
      event.preventDefault();
      return;
    }
  },
  { passive: false },
);

keyGrid.addEventListener(
  "touchend",
  (event) => {
    if (activeTouchId === null || !event.changedTouches) {
      return;
    }
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const t = event.changedTouches[i];
      if (t.identifier !== activeTouchId) {
        continue;
      }

      if (touchStartCell && !touchMoved) {
        const row = Number(touchStartCell.dataset.row);
        const col = Number(touchStartCell.dataset.col);
        if (!Number.isNaN(row) && !Number.isNaN(col)) {
          activateKey(qwertyLayout[row][col]);
        }
      }

      activeTouchId = null;
      touchStartCell = null;
      touchMoved = false;
      event.preventDefault();
      return;
    }
  },
  { passive: false },
);

keyGrid.addEventListener(
  "touchcancel",
  () => {
    activeTouchId = null;
    touchStartCell = null;
    touchMoved = false;
  },
  { passive: true },
);

// Default mode based on device input characteristics.
if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
  setInputMode("touch");
} else {
  setInputMode("keyboard");
  state.selectedRow = 1;
  state.selectedCol = 0;
  syncPreviewToSelection();
}

updateUI();
