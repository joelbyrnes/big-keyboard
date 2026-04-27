// Single place to bump the app version.
const APP_VERSION = "0.2.0";

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
const modeTitle = document.getElementById("mode-title");
const versionLabel = document.getElementById("version-label");
const optionsBtn = document.getElementById("options-btn");
const optionsModal = document.getElementById("options-modal");
const optionsCloseBtn = document.getElementById("options-close-btn");
const keymapResetBtn = document.getElementById("keymap-reset-btn");
const keymapCaptureHint = document.getElementById("keymap-capture-hint");
const speechResetBtn = document.getElementById("speech-reset-btn");
const speechTestBtn = document.getElementById("speech-test-btn");

const KEYMAP_STORAGE_KEY = "bigKeyboard.keymap.v1";

const DEFAULT_KEYMAP = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  delete: "Backspace",
  enter: "Enter",
  space: "Space",
};

let keymap = { ...DEFAULT_KEYMAP };
let keymapCaptureAction = null;

function loadKeymap() {
  try {
    const raw = localStorage.getItem(KEYMAP_STORAGE_KEY);
    if (!raw) {
      keymap = { ...DEFAULT_KEYMAP };
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      keymap = { ...DEFAULT_KEYMAP };
      return;
    }
    keymap = { ...DEFAULT_KEYMAP, ...parsed };
  } catch {
    keymap = { ...DEFAULT_KEYMAP };
  }
}

function saveKeymap() {
  try {
    localStorage.setItem(KEYMAP_STORAGE_KEY, JSON.stringify(keymap));
  } catch {
    // Ignore storage failures (private mode, quotas, etc).
  }
}

function setCaptureHint(text) {
  if (!(keymapCaptureHint instanceof HTMLElement)) {
    return;
  }
  keymapCaptureHint.textContent = text;
}

function renderKeymapUI() {
  if (!(optionsModal instanceof HTMLElement)) {
    return;
  }
  const nodes = optionsModal.querySelectorAll("[data-keymap-value]");
  nodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }
    const action = node.getAttribute("data-keymap-value");
    if (!action) {
      return;
    }
    const code = keymap[action] || DEFAULT_KEYMAP[action] || "";
    node.textContent = code;
  });
}

function beginKeyCapture(action) {
  keymapCaptureAction = action;
  setCaptureHint(`Press a key for “${action}”… (Esc to cancel)`);
}

function cancelKeyCapture() {
  keymapCaptureAction = null;
  setCaptureHint("");
}

function actionForEvent(event) {
  const code = event.code;
  for (const [action, mapped] of Object.entries(keymap)) {
    if (mapped === code) {
      return action;
    }
  }
  return null;
}

const speech = {
  enabled: true,
  lastText: "",
  lastAtMs: 0,
};

function speakSelection(key) {
  if (!speech.enabled) {
    return;
  }
  if (!("speechSynthesis" in window)) {
    return;
  }
  if (!key) {
    return;
  }

  let text = "";
  if (key.type === "char") {
    if (key.value === " ") {
      text = "space";
    } else if (/^[A-Z]$/.test(key.value)) {
      text = key.value.toLowerCase();
    } else {
      text = key.value;
    }
  } else if (key.type === "backspace") {
    text = "delete";
  } else if (key.type === "commit") {
    text = "enter";
  } else {
    text = key.label || "";
  }

  if (!text) {
    return;
  }

  const now = Date.now();
  if (speech.lastText === text && now - speech.lastAtMs < 250) {
    return;
  }
  speech.lastText = text;
  speech.lastAtMs = now;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech failures (permissions, device support, etc).
  }
}

function speakEnteredText() {
  if (!speech.enabled) {
    return;
  }
  if (!("speechSynthesis" in window)) {
    return;
  }

  const text = state.text.trim();
  if (!text) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.toLowerCase());
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech failures (permissions, device support, etc).
  }
}

function resetSpeech() {
  if (!("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    // Some engines can remain paused after lots of cancels.
    window.speechSynthesis.resume();
  } catch {
    // ignore
  }
  speech.lastText = "";
  speech.lastAtMs = 0;
}

function setInputMode(mode) {
  document.body.dataset.inputMode = mode;
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement);
}

function selectByRowCol(row, col) {
  if (Number.isNaN(row) || Number.isNaN(col)) {
    return;
  }
  if (!qwertyLayout[row] || !qwertyLayout[row][col]) {
    return;
  }
  state.selectedRow = row;
  state.selectedCol = col;
  syncPreviewToSelection();
  updateUI();
  speakSelection(qwertyLayout[row][col]);
}

function applyModeForEnvironment() {
  if (isFullscreenActive()) {
    setInputMode("mouse-fullscreen");
    state.selectedRow = null;
    state.selectedCol = null;
    state.pendingCharacter = "";
    updateUI();
    return;
  }

  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
    setInputMode("touch");
    state.selectedRow = null;
    state.selectedCol = null;
    state.pendingCharacter = "";
    updateUI();
    return;
  }

  setInputMode("keyboard");
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 1;
    state.selectedCol = 0;
  }
  syncPreviewToSelection();
  updateUI();
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

  if (versionLabel) {
    versionLabel.textContent = `v${APP_VERSION}`;
  }

  if (modeTitle) {
    if (mode === "touch") {
      modeTitle.textContent = "Touchscreen mode - tap a letter, press delete for errors";
    } else if (mode === "mouse-fullscreen") {
      modeTitle.textContent = "Keyboard/mouse/trackball mode - select a letter and press enter";
    } else {
      modeTitle.textContent = "Keyboard mode - select a letter with the arrow keys and press enter";
    }
  }

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
  speakSelection(selectedKey());
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
  speakSelection(selectedKey());
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

function openOptions() {
  if (!(optionsModal instanceof HTMLElement)) {
    return;
  }
  optionsModal.hidden = false;
  renderKeymapUI();
  cancelKeyCapture();
  if (optionsCloseBtn instanceof HTMLElement) {
    optionsCloseBtn.focus();
  }
}

function closeOptions() {
  if (!(optionsModal instanceof HTMLElement)) {
    return;
  }
  optionsModal.hidden = true;
  cancelKeyCapture();
  if (optionsBtn instanceof HTMLElement) {
    optionsBtn.focus();
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
  // Key capture for remapping (only while modal is open).
  if (keymapCaptureAction && optionsModal && optionsModal.hidden === false) {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelKeyCapture();
      return;
    }
    event.preventDefault();
    keymap[keymapCaptureAction] = event.code;
    saveKeymap();
    renderKeymapUI();
    cancelKeyCapture();
    return;
  }

  if (!isFullscreenActive()) {
    setInputMode("keyboard");
  }
  const mappedAction = actionForEvent(event);
  if (mappedAction === "up") {
    event.preventDefault();
    moveVertical(-1);
    return;
  }
  if (mappedAction === "down") {
    event.preventDefault();
    moveVertical(1);
    return;
  }
  if (mappedAction === "left") {
    event.preventDefault();
    moveHorizontal(-1);
    return;
  }
  if (mappedAction === "right") {
    event.preventDefault();
    moveHorizontal(1);
    return;
  }
  if (mappedAction === "space") {
    event.preventDefault();
    state.text += " ";
    updateUI();
    speakEnteredText();
    return;
  }
  if (mappedAction === "enter") {
    event.preventDefault();
    if (document.body.dataset.inputMode === "mouse-fullscreen") {
      const key = selectedKey();
      if (key) {
        activateKey(key);
      }
      speakEnteredText();
    } else {
      commitPendingCharacter();
      speakEnteredText();
    }
    return;
  }
  if (mappedAction === "delete") {
    event.preventDefault();
    deleteLast();
  }
});

bindTouchOrClick(clearBtn, clearAll);
bindTouchOrClick(fullscreenBtn, () => {
  void toggleFullscreen();
});
bindTouchOrClick(optionsBtn, openOptions);
bindTouchOrClick(optionsCloseBtn, closeOptions);
bindTouchOrClick(keymapResetBtn, () => {
  keymap = { ...DEFAULT_KEYMAP };
  saveKeymap();
  renderKeymapUI();
  cancelKeyCapture();
});
bindTouchOrClick(speechResetBtn, () => {
  resetSpeech();
});
bindTouchOrClick(speechTestBtn, () => {
  resetSpeech();
  try {
    const utterance = new SpeechSynthesisUtterance("speech test");
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore
  }
});

if (optionsModal instanceof HTMLElement) {
  const changeButtons = optionsModal.querySelectorAll("[data-keymap-change]");
  changeButtons.forEach((btn) => {
    if (!(btn instanceof HTMLElement)) {
      return;
    }
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-keymap-change");
      if (!action) {
        return;
      }
      beginKeyCapture(action);
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && optionsModal && optionsModal.hidden === false) {
    event.preventDefault();
    if (keymapCaptureAction) {
      cancelKeyCapture();
    } else {
      closeOptions();
    }
  }
});

if (optionsModal instanceof HTMLElement) {
  optionsModal.addEventListener(
    "pointerdown",
    (event) => {
      if (event.target === optionsModal) {
        event.preventDefault();
        closeOptions();
      }
    },
    { passive: false },
  );
}

// Touch / pointer support:
// - Tap a key to activate it immediately (no Enter required).
// - Dragging won't activate.
// - Suppress long-press context menus/callouts where possible.
document.addEventListener("contextmenu", (event) => {
  if (event.target && keyGrid.contains(event.target)) {
    event.preventDefault();
  }
});

// Fullscreen mouse/trackball support:
// - Move pointer to select (highlight only).
// - Click or press Enter to commit selected key.
keyGrid.addEventListener(
  "mousemove",
  (event) => {
    if (document.body.dataset.inputMode !== "mouse-fullscreen") {
      return;
    }
    const rawTarget = event.target;
    const cell = rawTarget instanceof HTMLElement ? rawTarget.closest(".key-cell") : null;
    if (!(cell instanceof HTMLElement)) {
      return;
    }
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }
    if (state.selectedRow === row && state.selectedCol === col) {
      return;
    }
    selectByRowCol(row, col);
  },
  { passive: true },
);

keyGrid.addEventListener(
  "click",
  (event) => {
    if (document.body.dataset.inputMode !== "mouse-fullscreen") {
      return;
    }
    const rawTarget = event.target;
    const cell = rawTarget instanceof HTMLElement ? rawTarget.closest(".key-cell") : null;
    if (!(cell instanceof HTMLElement)) {
      return;
    }
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      return;
    }
    selectByRowCol(row, col);
    activateKey(qwertyLayout[row][col]);
    event.preventDefault();
  },
  { passive: false },
);

// Prevent trackpad/mouse wheel scroll from moving content in fullscreen mouse mode.
document.addEventListener(
  "wheel",
  (event) => {
    if (document.body.dataset.inputMode !== "mouse-fullscreen") {
      return;
    }
    event.preventDefault();
  },
  { passive: false },
);

// Prevent common scroll keys from shifting focus/viewport in fullscreen mouse mode.
document.addEventListener("keydown", (event) => {
  if (document.body.dataset.inputMode !== "mouse-fullscreen") {
    return;
  }
  if (
    event.key === " " ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    event.key === "Home" ||
    event.key === "End"
  ) {
    event.preventDefault();
  }
});

let activePointerId = null;
let activeCell = null;
let moved = false;
let startX = 0;
let startY = 0;
const MOVE_THRESHOLD_PX = 20;
let activatedThisGesture = false;

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
    activatedThisGesture = false;
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

      // Touch mode: if it becomes selected, commit immediately.
      activateKey(qwertyLayout[row][col]);
      activatedThisGesture = true;
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

    if (activeCell && !moved && !activatedThisGesture) {
      const row = Number(activeCell.dataset.row);
      const col = Number(activeCell.dataset.col);
      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        activateKey(qwertyLayout[row][col]);
      }
    }

    activePointerId = null;
    activeCell = null;
    moved = false;
    activatedThisGesture = false;
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
    activatedThisGesture = false;
  },
  { passive: true },
);

// Touch Events fallback (for browsers/devices without reliable Pointer Events).
let activeTouchId = null;
let touchMoved = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartCell = null;
let touchActivatedThisGesture = false;

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
  speakSelection(qwertyLayout[row][col]);
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
    touchActivatedThisGesture = false;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartCell = cell;
    selectCell(cell);

    // Touch mode: if it becomes selected, commit immediately.
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      activateKey(qwertyLayout[row][col]);
      touchActivatedThisGesture = true;
    }

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

      if (touchStartCell && !touchMoved && !touchActivatedThisGesture) {
        const row = Number(touchStartCell.dataset.row);
        const col = Number(touchStartCell.dataset.col);
        if (!Number.isNaN(row) && !Number.isNaN(col)) {
          activateKey(qwertyLayout[row][col]);
        }
      }

      activeTouchId = null;
      touchStartCell = null;
      touchMoved = false;
      touchActivatedThisGesture = false;
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
    touchActivatedThisGesture = false;
  },
  { passive: true },
);

// Default mode based on device input characteristics.
document.addEventListener("fullscreenchange", () => {
  applyModeForEnvironment();
});

loadKeymap();
applyModeForEnvironment();
