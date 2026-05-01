// Single place to bump the app version.
const APP_VERSION = "0.3.3";

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
    { label: ",", value: ",", type: "char", width: "half" },
    { label: ".", value: ".", type: "char", width: "half" },
    { label: "?", value: "?", type: "char", width: "half" },
    { label: "!", value: "!", type: "char", width: "half" },
  ],
];

const textOutput = document.getElementById("text-output");
const keyGrid = document.getElementById("key-grid");
const clearBtn = document.getElementById("clear-btn");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const modeTitle = document.getElementById("mode-title");
const versionLabel = document.getElementById("version-label");
const optionsBtn = document.getElementById("options-btn");
const touchscreenStatus = document.getElementById("touchscreen-status");
const optionsModal = document.getElementById("options-modal");
const optionsCloseBtn = document.getElementById("options-close-btn");
const keymapResetBtn = document.getElementById("keymap-reset-btn");
const keymapCaptureHint = document.getElementById("keymap-capture-hint");
const speechResetBtn = document.getElementById("speech-reset-btn");
const speechTestBtn = document.getElementById("speech-test-btn");
const speechEnabledToggle = document.getElementById("speech-enabled-toggle");
const previewBlinkToggle = document.getElementById("preview-blink-toggle");
const touchEnabledToggle = document.getElementById("touch-enabled-toggle");
const middleClickDeleteToggle = document.getElementById("middle-click-delete-toggle");
const themeSelect = document.getElementById("theme-select");

const KEYMAP_STORAGE_KEY = "bigKeyboard.keymap.v1";
const THEME_STORAGE_KEY = "bigKeyboard.theme.v1";
const THEME_OPTIONS = ["system", "dark", "light"];
const SPEECH_STORAGE_KEY = "bigKeyboard.speechEnabled.v1";
const TOUCH_STORAGE_KEY = "bigKeyboard.touchEnabled.v1";
const MIDDLE_CLICK_DELETE_STORAGE_KEY = "bigKeyboard.middleClickDelete.v1";
const PREVIEW_BLINK_STORAGE_KEY = "bigKeyboard.previewBlink.v1";

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

// Prevent OS key-repeat from triggering extra actions:
// once a handled key is processed on keydown, ignore repeats until keyup.
const pressedPhysicalKeys = new Set();

let themePreference = "system";
let systemThemeMedia = null;

const touchSettings = {
  enabled: true,
};

const mouseSettings = {
  middleClickDeletes: false,
};

const uiSettings = {
  previewBlink: true,
};

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

function loadThemePreference() {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value && THEME_OPTIONS.includes(value)) {
      themePreference = value;
    } else {
      themePreference = "system";
    }
  } catch {
    themePreference = "system";
  }
}

function saveThemePreference() {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
  } catch {
    // ignore
  }
}

function effectiveTheme() {
  if (themePreference === "dark" || themePreference === "light") {
    return themePreference;
  }
  const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme() {
  const theme = effectiveTheme();
  document.body.dataset.theme = theme;
  if (themeSelect instanceof HTMLSelectElement) {
    themeSelect.value = themePreference;
  }
}

const speech = {
  enabled: true,
  lastText: "",
  lastAtMs: 0,
};

let pendingSpeechTimer = null;
let pendingSpeechText = "";

function clearPendingSpeech() {
  if (pendingSpeechTimer !== null) {
    clearTimeout(pendingSpeechTimer);
    pendingSpeechTimer = null;
  }
  pendingSpeechText = "";
}

function speakNow(text, { force = false } = {}) {
  if (!speech.enabled) {
    return;
  }
  if (!("speechSynthesis" in window)) {
    return;
  }
  if (!text) {
    return;
  }

  const now = Date.now();
  if (!force && speech.lastText === text && now - speech.lastAtMs < 250) {
    return;
  }
  speech.lastText = text;
  speech.lastAtMs = now;

  try {
    // Resume in case the engine got paused/hung after many cancels.
    window.speechSynthesis.resume();
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

function scheduleSpeak(text) {
  if (!speech.enabled) {
    return;
  }
  clearPendingSpeech();
  pendingSpeechText = text;
  // Debounce so rapid selection changes don't cancel speech continuously.
  pendingSpeechTimer = setTimeout(() => {
    pendingSpeechTimer = null;
    const toSpeak = pendingSpeechText;
    pendingSpeechText = "";
    speakNow(toSpeak);
  }, 120);
}

function loadSpeechEnabled() {
  try {
    const raw = localStorage.getItem(SPEECH_STORAGE_KEY);
    if (raw === null) {
      speech.enabled = true;
      return;
    }
    speech.enabled = raw === "1";
  } catch {
    speech.enabled = true;
  }
}

function loadTouchEnabled() {
  try {
    const raw = localStorage.getItem(TOUCH_STORAGE_KEY);
    if (raw === null) {
      touchSettings.enabled = true;
      return;
    }
    touchSettings.enabled = raw === "1";
  } catch {
    touchSettings.enabled = true;
  }
}

function saveTouchEnabled() {
  try {
    localStorage.setItem(TOUCH_STORAGE_KEY, touchSettings.enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

function syncTouchToggleUI() {
  if (touchEnabledToggle instanceof HTMLInputElement) {
    touchEnabledToggle.checked = Boolean(touchSettings.enabled);
  }
}

function deviceHasTouchscreen() {
  if (typeof navigator !== "undefined" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0) {
    return true;
  }
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
    return true;
  }
  return false;
}

function syncTouchStatusUI() {
  if (!(touchscreenStatus instanceof HTMLElement)) {
    return;
  }
  const hasTouch = deviceHasTouchscreen();
  touchscreenStatus.hidden = !hasTouch;
  if (!hasTouch) {
    return;
  }
  touchscreenStatus.textContent = touchSettings.enabled ? "Touchscreen enabled" : "Touchscreen disabled";
}

function loadMiddleClickDelete() {
  try {
    const raw = localStorage.getItem(MIDDLE_CLICK_DELETE_STORAGE_KEY);
    if (raw === null) {
      mouseSettings.middleClickDeletes = false;
      return;
    }
    mouseSettings.middleClickDeletes = raw === "1";
  } catch {
    mouseSettings.middleClickDeletes = false;
  }
}

function saveMiddleClickDelete() {
  try {
    localStorage.setItem(MIDDLE_CLICK_DELETE_STORAGE_KEY, mouseSettings.middleClickDeletes ? "1" : "0");
  } catch {
    // ignore
  }
}

function syncMiddleClickDeleteUI() {
  if (middleClickDeleteToggle instanceof HTMLInputElement) {
    middleClickDeleteToggle.checked = Boolean(mouseSettings.middleClickDeletes);
  }
}

function loadPreviewBlink() {
  try {
    const raw = localStorage.getItem(PREVIEW_BLINK_STORAGE_KEY);
    if (raw === null) {
      uiSettings.previewBlink = true;
      return;
    }
    uiSettings.previewBlink = raw === "1";
  } catch {
    uiSettings.previewBlink = true;
  }
}

function savePreviewBlink() {
  try {
    localStorage.setItem(PREVIEW_BLINK_STORAGE_KEY, uiSettings.previewBlink ? "1" : "0");
  } catch {
    // ignore
  }
}

function syncPreviewBlinkUI() {
  if (previewBlinkToggle instanceof HTMLInputElement) {
    previewBlinkToggle.checked = Boolean(uiSettings.previewBlink);
  }
}

function applyPreviewBlinkSetting() {
  document.body.dataset.previewBlink = uiSettings.previewBlink ? "on" : "off";
}

function saveSpeechEnabled() {
  try {
    localStorage.setItem(SPEECH_STORAGE_KEY, speech.enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

function syncSpeechToggleUI() {
  if (speechEnabledToggle instanceof HTMLInputElement) {
    speechEnabledToggle.checked = Boolean(speech.enabled);
  }
}

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

  scheduleSpeak(text);
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

  clearPendingSpeech();
  speakNow(text.toLowerCase(), { force: true });
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
  clearPendingSpeech();
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
    if (touchSettings.enabled) {
      setInputMode("touch");
      state.selectedRow = null;
      state.selectedCol = null;
      state.pendingCharacter = "";
      updateUI();
      return;
    }
  }

  setInputMode("keyboard");
  if (state.selectedRow === null || state.selectedCol === null) {
    // Default selection: G key (home-row anchor)
    state.selectedRow = 2;
    state.selectedCol = 4;
  }
  syncPreviewToSelection();
  updateUI();
}

function applyTouchEnabledState() {
  if (touchSettings.enabled) {
    return;
  }
  if (document.body.dataset.inputMode !== "touch") {
    return;
  }
  // If touch is disabled while we're in touch mode, fall back to keyboard mode.
  setInputMode("keyboard");
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 2;
    state.selectedCol = 4;
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

/** Touch only: highlight Enter/Delete while finger is down without changing letter selection. */
let touchActionPress = null;

function normalizeForEntry(value) {
  if (typeof value !== "string") {
    return "";
  }
  if (/^[A-Z]$/.test(value)) {
    return value.toLowerCase();
  }
  return value;
}

function selectedKey() {
  if (state.selectedRow === null || state.selectedCol === null) {
    return null;
  }
  return qwertyLayout[state.selectedRow][state.selectedCol];
}

function syncPreviewToSelection() {
  const key = selectedKey();
  if (key && key.type === "char") {
    state.pendingCharacter = normalizeForEntry(key.value);
  }
}

function escapeText(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function displayCharacterForText() {
  const key = selectedKey();
  if (key && key.type === "backspace") {
    return "\u2190";
  }
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
      modeTitle.textContent = "Touchscreen mode - tap to select, then tap Enter to commit";
    } else if (mode === "mouse-fullscreen") {
      modeTitle.textContent = "Keyboard/mouse/trackball mode - select a letter and press enter";
    } else {
      modeTitle.textContent = "Keyboard mode - select a letter with the arrow keys and press enter";
    }
  }

  const preview = escapeText(displayCharacterForText());
  textOutput.innerHTML = `${committed}<span class="preview-char">${preview}</span>`;
  textOutput.setAttribute("aria-label", `Entered text: ${state.text}${state.pendingCharacter}`);

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
      if (
        touchActionPress &&
        touchActionPress.row === rowIndex &&
        touchActionPress.col === colIndex &&
        key.type !== "char"
      ) {
        cell.classList.add("action-pressed");
      }
      cell.textContent = key.label;
      rowElement.appendChild(cell);
    }

    keyGrid.appendChild(rowElement);
  }
}

function selectedCellCenterX() {
  if (state.selectedRow === null || state.selectedCol === null) {
    return null;
  }
  const cell = keyGrid.querySelector(
    `.key-cell[data-row="${state.selectedRow}"][data-col="${state.selectedCol}"]`,
  );
  if (!(cell instanceof HTMLElement)) {
    return null;
  }
  const rect = cell.getBoundingClientRect();
  return rect.left + rect.width / 2;
}

function nearestColInRowByX(rowIndex, targetCenterX) {
  const row = qwertyLayout[rowIndex];
  if (!row || row.length === 0) {
    return null;
  }

  let bestCol = 0;
  let bestDist = Infinity;
  for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
    const cell = keyGrid.querySelector(`.key-cell[data-row="${rowIndex}"][data-col="${colIndex}"]`);
    if (!(cell instanceof HTMLElement)) {
      continue;
    }
    const rect = cell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const dist = Math.abs(centerX - targetCenterX);
    if (dist < bestDist) {
      bestDist = dist;
      bestCol = colIndex;
    }
  }
  return bestCol;
}

function moveVertical(step) {
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 2;
    state.selectedCol = 4;
  }
  const priorCenterX = selectedCellCenterX();
  const nextRow = Math.max(0, Math.min(qwertyLayout.length - 1, state.selectedRow + step));
  state.selectedRow = nextRow;
  if (priorCenterX !== null) {
    const nearest = nearestColInRowByX(nextRow, priorCenterX);
    if (nearest !== null) {
      state.selectedCol = nearest;
    } else {
      const maxCol = qwertyLayout[state.selectedRow].length - 1;
      state.selectedCol = Math.min(state.selectedCol, maxCol);
    }
  } else {
    const maxCol = qwertyLayout[state.selectedRow].length - 1;
    state.selectedCol = Math.min(state.selectedCol, maxCol);
  }
  syncPreviewToSelection();
  updateUI();
  speakSelection(selectedKey());
}

function moveHorizontal(step) {
  if (state.selectedRow === null || state.selectedCol === null) {
    state.selectedRow = 2;
    state.selectedCol = 4;
  }
  const rowLength = qwertyLayout[state.selectedRow].length;
  state.selectedCol = (state.selectedCol + step + rowLength) % rowLength;
  syncPreviewToSelection();
  updateUI();
  speakSelection(selectedKey());
}

function commitPendingCharacter() {
  state.text += normalizeForEntry(state.pendingCharacter);
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
  applyTheme();
  syncSpeechToggleUI();
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
    state.text += normalizeForEntry(key.value);
    if (document.body.dataset.inputMode !== "touch") {
      state.pendingCharacter = normalizeForEntry(key.value);
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
  if (mappedAction) {
    // Suppress unintended repeats from OS key-repeat settings.
    if (pressedPhysicalKeys.has(event.code) || event.repeat) {
      event.preventDefault();
      return;
    }
    pressedPhysicalKeys.add(event.code);
  }
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
      const key = selectedKey();
      if (key && key.type === "backspace") {
        deleteLast();
      } else {
        commitPendingCharacter();
      }
      speakEnteredText();
    }
    return;
  }
  if (mappedAction === "delete") {
    event.preventDefault();
    deleteLast();
  }
});

document.addEventListener("keyup", (event) => {
  pressedPhysicalKeys.delete(event.code);
});

window.addEventListener("blur", () => {
  pressedPhysicalKeys.clear();
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
  speakNow("speech test", { force: true });
});

if (speechEnabledToggle instanceof HTMLInputElement) {
  speechEnabledToggle.addEventListener("change", () => {
    speech.enabled = Boolean(speechEnabledToggle.checked);
    saveSpeechEnabled();
    if (!speech.enabled) {
      resetSpeech();
    }
  });
}

if (touchEnabledToggle instanceof HTMLInputElement) {
  touchEnabledToggle.addEventListener("change", () => {
    touchSettings.enabled = Boolean(touchEnabledToggle.checked);
    saveTouchEnabled();
    syncTouchStatusUI();
    applyTouchEnabledState();
  });
}

if (middleClickDeleteToggle instanceof HTMLInputElement) {
  middleClickDeleteToggle.addEventListener("change", () => {
    mouseSettings.middleClickDeletes = Boolean(middleClickDeleteToggle.checked);
    saveMiddleClickDelete();
  });
}

if (previewBlinkToggle instanceof HTMLInputElement) {
  previewBlinkToggle.addEventListener("change", () => {
    uiSettings.previewBlink = Boolean(previewBlinkToggle.checked);
    savePreviewBlink();
    applyPreviewBlinkSetting();
  });
}

if (themeSelect instanceof HTMLSelectElement) {
  themeSelect.addEventListener("change", () => {
    const value = themeSelect.value;
    if (THEME_OPTIONS.includes(value)) {
      themePreference = value;
      saveThemePreference();
      applyTheme();
    }
  });
}

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
// - Tap a key to select it (activation requires Enter).
// - Delete activates on press; Enter activates on release (drag ignored for both).
// - Suppress long-press context menus/callouts where possible.
//
// Fullscreen mouse mode:
// - Right-click should also commit the selected key.
document.addEventListener("contextmenu", (event) => {
  if (!event.target || !keyGrid.contains(event.target)) {
    return;
  }

  if (document.body.dataset.inputMode === "mouse-fullscreen") {
    const rawTarget = event.target;
    const cell = rawTarget instanceof HTMLElement ? rawTarget.closest(".key-cell") : null;
    if (cell instanceof HTMLElement) {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        selectByRowCol(row, col);
        activateKey(qwertyLayout[row][col]);
      }
    }
  }

  event.preventDefault();
});

// Fullscreen mouse/trackball support:
// - Move pointer to select (highlight only).
// - Click or press Enter to commit selected key.
keyGrid.addEventListener(
  "auxclick",
  (event) => {
    if (document.body.dataset.inputMode !== "mouse-fullscreen") {
      return;
    }
    if (!mouseSettings.middleClickDeletes) {
      return;
    }
    // Middle mouse button: delete last char.
    if (typeof event.button === "number" && event.button !== 1) {
      return;
    }
    if (event.target && keyGrid.contains(event.target)) {
      event.preventDefault();
      deleteLast();
    }
  },
  { passive: false },
);

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
    if (!touchSettings.enabled) {
      return;
    }
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

    const row = Number(activeCell.dataset.row);
    const col = Number(activeCell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      event.preventDefault();
      return;
    }
    const key = qwertyLayout[row][col];
    if (!key) {
      event.preventDefault();
      return;
    }

    if (key.type === "char") {
      touchActionPress = null;
      state.selectedRow = row;
      state.selectedCol = col;
      syncPreviewToSelection();
      updateUI();
      speakSelection(key);
    } else if (key.type === "backspace") {
      touchActionPress = { row, col };
      updateUI();
      speakSelection(key);
      activateKey(key);
    } else if (key.type === "commit") {
      touchActionPress = { row, col };
      updateUI();
      speakSelection(key);
    }

    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "pointermove",
  (event) => {
    if (!touchSettings.enabled) {
      return;
    }
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
    if (!touchSettings.enabled) {
      return;
    }
    if (event.pointerType && event.pointerType !== "touch") {
      return;
    }
    if (event.pointerId !== activePointerId) {
      return;
    }

    if (activeCell) {
      const row = Number(activeCell.dataset.row);
      const col = Number(activeCell.dataset.col);
      if (!Number.isNaN(row) && !Number.isNaN(col)) {
        const key = qwertyLayout[row]?.[col];
        // Enter commits on release (drag ignored). Delete handled on pointerdown.
        if (key && key.type === "commit") {
          touchActionPress = null;
          activateKey(key);
          speakEnteredText();
        }
      }
    }

    touchActionPress = null;
    activePointerId = null;
    activeCell = null;
    moved = false;
    activatedThisGesture = false;
    updateUI();
    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "pointercancel",
  () => {
    touchActionPress = null;
    activePointerId = null;
    activeCell = null;
    moved = false;
    activatedThisGesture = false;
    updateUI();
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

keyGrid.addEventListener(
  "touchstart",
  (event) => {
    if (!touchSettings.enabled) {
      return;
    }
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
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) {
      event.preventDefault();
      return;
    }
    const key = qwertyLayout[row][col];
    if (!key) {
      event.preventDefault();
      return;
    }

    if (key.type === "char") {
      touchActionPress = null;
      state.selectedRow = row;
      state.selectedCol = col;
      syncPreviewToSelection();
      updateUI();
      speakSelection(key);
    } else if (key.type === "backspace") {
      touchActionPress = { row, col };
      updateUI();
      speakSelection(key);
      activateKey(key);
    } else if (key.type === "commit") {
      touchActionPress = { row, col };
      updateUI();
      speakSelection(key);
    }

    event.preventDefault();
  },
  { passive: false },
);

keyGrid.addEventListener(
  "touchmove",
  (event) => {
    if (!touchSettings.enabled) {
      return;
    }
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
    if (!touchSettings.enabled) {
      return;
    }
    if (activeTouchId === null || !event.changedTouches) {
      return;
    }
    for (let i = 0; i < event.changedTouches.length; i += 1) {
      const t = event.changedTouches[i];
      if (t.identifier !== activeTouchId) {
        continue;
      }

      if (touchStartCell) {
        const row = Number(touchStartCell.dataset.row);
        const col = Number(touchStartCell.dataset.col);
        if (!Number.isNaN(row) && !Number.isNaN(col)) {
          const key = qwertyLayout[row]?.[col];
          if (key && key.type === "commit") {
            touchActionPress = null;
            activateKey(key);
            speakEnteredText();
          }
        }
      }

      touchActionPress = null;
      activeTouchId = null;
      touchStartCell = null;
      touchMoved = false;
      touchActivatedThisGesture = false;
      updateUI();
      event.preventDefault();
      return;
    }
  },
  { passive: false },
);

keyGrid.addEventListener(
  "touchcancel",
  () => {
    touchActionPress = null;
    activeTouchId = null;
    touchStartCell = null;
    touchMoved = false;
    touchActivatedThisGesture = false;
    updateUI();
  },
  { passive: true },
);

// Default mode based on device input characteristics.
document.addEventListener("fullscreenchange", () => {
  applyModeForEnvironment();
});

loadKeymap();
loadThemePreference();
applyTheme();
loadSpeechEnabled();
syncSpeechToggleUI();
loadTouchEnabled();
syncTouchToggleUI();
syncTouchStatusUI();
loadMiddleClickDelete();
syncMiddleClickDeleteUI();
loadPreviewBlink();
syncPreviewBlinkUI();
applyPreviewBlinkSetting();

if (window.matchMedia) {
  systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => {
    if (themePreference === "system") {
      applyTheme();
    }
  };
  if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", handler);
  } else if (typeof systemThemeMedia.addListener === "function") {
    systemThemeMedia.addListener(handler);
  }
}
applyModeForEnvironment();
applyTouchEnabledState();
