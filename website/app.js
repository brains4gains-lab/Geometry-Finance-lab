const State = Object.freeze({ NONE: "none", LEFT: "left", RIGHT: "right" });
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
let state = State.NONE;
let audioContext;
let activePanelSound;
let transcriptPromise;
let soundEnabled = (() => { try { return localStorage.getItem("gflab-sound") !== "off"; } catch { return true; } })();

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
  accordionToggles.forEach((otherToggle) => {
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

contextTrigger.addEventListener("click", () => toggle(State.LEFT));
toolsTrigger.addEventListener("click", () => toggle(State.RIGHT));
workspace.addEventListener("click", () => { if (state !== State.NONE) setState(State.NONE); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setState(State.NONE); });
sectionButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
accordionToggles.forEach((toggle) => toggle.addEventListener("click", () => toggleAccordion(toggle)));
actionButtons.forEach((button) => button.addEventListener("click", () => { toolStatus.textContent = `${button.textContent} is reserved for a future laboratory action.`; }));
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
