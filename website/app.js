const State = Object.freeze({ NONE: "none", LEFT: "left", RIGHT: "right" });
// These values are the executable counterpart of website/DESIGN_RULES.md.
const DESIGN_RULES = Object.freeze({ theme: "dark", oneOpen: true, phoneFirst: true, minimalLanguage: true });
const root = document.body;
const workspace = document.querySelector("#workspace");
const contextTrigger = document.querySelector("#open-context");
const toolsTrigger = document.querySelector("#open-tools");
const contextPanel = document.querySelector("#context-panel");
const toolsPanel = document.querySelector("#tools-panel");
const pages = [...document.querySelectorAll(".workspace-page")];
const transcriptParts = [...document.querySelectorAll("[data-transcript-part]")];
const sectionButtons = [...document.querySelectorAll("button[data-section]")];
const accordionToggles = [...document.querySelectorAll(".accordion-toggle")];
const actionButtons = [...document.querySelectorAll(".tool-actions button[data-action]")];
const toolStatus = document.querySelector("#tool-status");
const soundToggles = [...document.querySelectorAll("[data-sound-toggle]")];
const searchInput = document.querySelector("#observatory-search");
const searchResults = document.querySelector("#search-results");
const randomObservationButtons = [...document.querySelectorAll('[data-action="random-observation"]')];
const foundingDayCounters = [...document.querySelectorAll("[data-days-since-founding]")];
const languageButtons = [...document.querySelectorAll('[data-action="language"]')];
const abstractCards = [...document.querySelectorAll(".thought-abstract")];
const transferPadFields = [...document.querySelectorAll(".transfer-pad")];
const transferStatus = document.querySelector("#transfer-status");
const verbatimFileSections = [...document.querySelectorAll("[data-verbatim-file]")];
const dailyObservationTitle = document.querySelector("[data-daily-title]");
const dailyObservationBody = document.querySelector("[data-daily-body]");
let state = State.NONE;
let audioContext;
let activePanelSound;
let transcriptPromise;
let soundEnabled = (() => { try { return localStorage.getItem("gflab-sound") !== "off"; } catch { return true; } })();

root.dataset.theme = DESIGN_RULES.theme;
root.dataset.designRules = "0.1";

const dailyObservations = [
  ["Attention is part of the method.", "A place for research should make it easier to remain with one question."],
  ["Trust leaves a trace.", "What we remember together changes what becomes possible next."],
  ["A quiet interface can hold a difficult question.", "Clarity is not emptiness; it is room for thought."],
  ["Curiosity is a form of movement.", "One honest question can make a whole system more alive."],
  ["Cooperation needs a memory.", "Shared history lets people and agents return to the same work with care."]
];

function renderDailyObservation() {
  if (!dailyObservationTitle || !dailyObservationBody) return;
  const start = new Date("2026-01-01T00:00:00");
  const today = new Date();
  const day = Math.max(0, Math.floor((today - start) / 86400000));
  const [title, body] = dailyObservations[day % dailyObservations.length];
  dailyObservationTitle.textContent = title;
  dailyObservationBody.textContent = body;
}

function splitTranscript(text, count) {
  const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/);
  const targetSize = text.length / count;
  const chunks = [];
  let chunk = "";
  paragraphs.forEach((paragraph) => {
    const next = chunk ? `${chunk}\n\n${paragraph}` : paragraph;
    if (chunks.length < count - 1 && chunk.length && next.length > targetSize) {
      chunks.push(chunk);
      chunk = paragraph;
    } else {
      chunk = next;
    }
  });
  chunks.push(chunk);
  while (chunks.length < count) chunks.push("");
  return chunks;
}

async function renderTranscriptPart(target) {
  const content = target.querySelector(".transcript-content");
  if (!content || content.dataset.loaded) return;
  try {
    transcriptPromise ??= fetch("assets/gfl-session-transcript-0003.txt").then((response) => {
      if (!response.ok) throw new Error("Transcript unavailable");
      return response.text();
    });
    const parts = splitTranscript(await transcriptPromise, transcriptParts.length);
    content.textContent = parts[Number(target.dataset.transcriptPart)] || "";
    content.dataset.loaded = "true";
  } catch {
    content.textContent = "The source transcript is temporarily unavailable.";
  }
}

async function renderVerbatimFile(target) {
  const content = target.querySelector("[data-verbatim-file]");
  if (!content || content.dataset.loaded) return;
  try {
    const response = await fetch(content.dataset.verbatimFile);
    if (!response.ok) throw new Error("Verbatim file unavailable");
    content.textContent = await response.text();
    content.dataset.loaded = "true";
  } catch {
    content.textContent = "The file is temporarily unavailable.";
  }
}

function playPanelSound() {
  if (!soundEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !navigator.userActivation?.isActive) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
    activePanelSound?.stop();
    const duration = .18;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const time = index / audioContext.sampleRate;
      const body = Math.sin(2 * Math.PI * 72 * time) * Math.exp(-time / .034) * .68;
      const cushion = (Math.random() * 2 - 1) * Math.exp(-time / .026) * .13;
      const clickOne = Math.max(0, time - .125);
      const clickTwo = Math.max(0, time - .148);
      const doubleClick = (Math.sin(2 * Math.PI * 1750 * clickOne) * Math.exp(-clickOne / .004)
        + Math.sin(2 * Math.PI * 1750 * clickTwo) * Math.exp(-clickTwo / .004)) * .18;
      data[index] = body + cushion + doubleClick;
    }
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(.032, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    source.connect(gain).connect(audioContext.destination);
    source.start();
    activePanelSound = source;
  } catch { /* Keep interaction silent when audio is unavailable or blocked. */ }
}

function collapseAccordions() {
  accordionToggles.forEach((toggle) => {
    const panel = document.querySelector(`#${toggle.getAttribute("aria-controls")}`);
    toggle.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  });
}

function setState(next) {
  if (state !== next) playPanelSound();
  if (next !== State.NONE && state !== next) collapseAccordions();
  state = next;
  root.classList.toggle("panel-open", state !== State.NONE);
  root.classList.toggle("state-left", state === State.LEFT);
  root.classList.toggle("state-right", state === State.RIGHT);
  contextTrigger.setAttribute("aria-expanded", String(state === State.LEFT));
  toolsTrigger.setAttribute("aria-expanded", String(state === State.RIGHT));
  contextPanel.setAttribute("aria-hidden", String(state !== State.LEFT));
  toolsPanel.setAttribute("aria-hidden", String(state !== State.RIGHT));
}

function toggle(target) { setState(state === target ? State.NONE : target); }

function toggleAccordion(toggle) {
  const panel = document.querySelector(`#${toggle.getAttribute("aria-controls")}`);
  if (!panel) return;
  const willExpand = toggle.getAttribute("aria-expanded") !== "true";
  // DESIGN_RULES.oneOpen keeps one open item at each menu level.
  const scope = toggle.closest(".submenu") || toggle.closest(".section-menu, .tool-actions");
  const scopedToggles = scope ? [...scope.querySelectorAll(":scope > .menu-group > .accordion-toggle")] : [toggle];
  scopedToggles.forEach((otherToggle) => {
    const otherPanel = document.querySelector(`#${otherToggle.getAttribute("aria-controls")}`);
    otherToggle.setAttribute("aria-expanded", String(otherToggle === toggle && willExpand));
    if (otherPanel) otherPanel.hidden = otherToggle !== toggle || !willExpand;
  });
}

function showSection(id, { updateHash = true } = {}) {
  const target = document.querySelector(`#${id}`);
  if (!target) return;
  pages.forEach((page) => page.classList.toggle("is-active", page === target));
  sectionButtons.forEach((button) => button.setAttribute("aria-current", String(button.dataset.section === id)));
  document.title = `${target.querySelector("h2").textContent} - Geometry Finance Lab`;
  if (target.dataset.transcriptPart !== undefined) renderTranscriptPart(target);
  if (target.querySelector("[data-verbatim-file]")) renderVerbatimFile(target);
  if (updateHash && window.location.hash !== `#${id}`) history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  workspace.scrollTo({ top: 0, behavior: "smooth" });
  setState(State.NONE);
}

function renderSearch(query = "") {
  if (!searchResults) return;
  const normalized = query.trim().toLowerCase();
  const excluded = new Set(["search", "obs-archive", "architecture", "growth-plan", "focus-reading"]);
  const matches = pages.filter((page) => !excluded.has(page.id) && (!normalized || page.textContent.toLowerCase().includes(normalized)));
  searchResults.replaceChildren(...matches.map((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = page.querySelector("h2")?.textContent || page.id;
    button.addEventListener("click", () => showSection(page.id));
    return button;
  }));
}

function updateSoundToggles() {
  soundToggles.forEach((button) => {
    button.textContent = `Sound: ${soundEnabled ? "on" : "off"}`;
    button.setAttribute("aria-pressed", String(soundEnabled));
  });
}

function saveTransferNotebook() {
  try {
    const values = Object.fromEntries(transferPadFields.map((field) => [field.dataset.pad, field.value]));
    localStorage.setItem("gflab-transfer-notebook", JSON.stringify(values));
    if (transferStatus) transferStatus.textContent = "Saved locally in this browser.";
  } catch {
    if (transferStatus) transferStatus.textContent = "This browser could not save the notebook.";
  }
}

function loadTransferNotebook() {
  try {
    const values = JSON.parse(localStorage.getItem("gflab-transfer-notebook") || "{}");
    transferPadFields.forEach((field) => { if (typeof values[field.dataset.pad] === "string") field.value = values[field.dataset.pad]; });
  } catch { /* An empty notebook remains usable if stored data is unavailable. */ }
}

function insertDroppedText(field, text) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  field.value = `${field.value.slice(0, start)}${text}${field.value.slice(end)}`;
  field.setSelectionRange(start + text.length, start + text.length);
  field.focus();
  saveTransferNotebook();
}

contextTrigger.addEventListener("click", () => toggle(State.LEFT));
toolsTrigger.addEventListener("click", () => toggle(State.RIGHT));
workspace.addEventListener("click", () => { if (state !== State.NONE) setState(State.NONE); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setState(State.NONE); });
sectionButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
accordionToggles.forEach((toggle) => toggle.addEventListener("click", () => toggleAccordion(toggle)));
actionButtons.forEach((button) => button.addEventListener("click", () => { toolStatus.textContent = button.textContent + " is reserved for a future laboratory action."; }));
languageButtons.forEach((button) => button.addEventListener("click", () => { if (toolStatus) toolStatus.textContent = "Language control is ready for the next translation layer."; }));
abstractCards.forEach((card) => card.addEventListener("toggle", () => { if (!card.open) return; abstractCards.forEach((other) => { if (other !== card) other.open = false; }); }));
soundToggles.forEach((button) => button.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  try { localStorage.setItem("gflab-sound", soundEnabled ? "on" : "off"); } catch { /* Keep the current session preference. */ }
  updateSoundToggles();
  if (toolStatus) toolStatus.textContent = `Sound is ${soundEnabled ? "on" : "off"}.`;
}));
if (searchInput) {
  searchInput.addEventListener("input", () => renderSearch(searchInput.value));
  renderSearch();
}
window.addEventListener("hashchange", () => {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (id) showSection(id, { updateHash: false });
});
setState(State.NONE);
updateSoundToggles();
const initialSection = decodeURIComponent(window.location.hash.slice(1));
if (initialSection) showSection(initialSection, { updateHash: false });
randomObservationButtons.forEach((button) => button.addEventListener("click", () => {
  const options = ["observations", "values", "principles", "hypothesis", "questions"];
  showSection(options[Math.floor(Math.random() * options.length)]);
}));
loadTransferNotebook();
transferPadFields.forEach((field) => {
  field.addEventListener("input", saveTransferNotebook);
  field.addEventListener("dragover", (event) => event.preventDefault());
  field.addEventListener("drop", (event) => {
    event.preventDefault();
    const text = event.dataTransfer?.getData("text/plain");
    if (text) insertDroppedText(field, text);
  });
});
renderDailyObservation();
foundingDayCounters.forEach((counter) => {
  const founded = new Date(`${counter.dataset.founded}T00:00:00`);
  const days = Math.max(0, Math.floor((Date.now() - founded.getTime()) / 86400000));
  counter.textContent = String(days);
});
