const State = Object.freeze({ NONE: "none", LEFT: "left", RIGHT: "right" });
const root = document.body;
const workspace = document.querySelector("#workspace");
const contextTrigger = document.querySelector("#open-context");
const toolsTrigger = document.querySelector("#open-tools");
const contextPanel = document.querySelector("#context-panel");
const toolsPanel = document.querySelector("#tools-panel");
const pages = [...document.querySelectorAll(".workspace-page")];
const sectionButtons = [...document.querySelectorAll("button[data-section]")];
const accordionToggles = [...document.querySelectorAll(".accordion-toggle")];
const actionButtons = [...document.querySelectorAll(".tool-actions button[data-action]")];
const toolStatus = document.querySelector("#tool-status");
let state = State.NONE;
let audioContext;
let activePanelSound;

function playPanelSound() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !navigator.userActivation?.isActive) return;
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

function showSection(id) {
  const target = document.querySelector(`#${id}`);
  if (!target) return;
  pages.forEach((page) => page.classList.toggle("is-active", page === target));
  sectionButtons.forEach((button) => button.setAttribute("aria-current", String(button.dataset.section === id)));
  document.title = `${target.querySelector("h2").textContent} - Geometry Finance Lab`;
  workspace.scrollTo({ top: 0, behavior: "smooth" });
  setState(State.NONE);
}

contextTrigger.addEventListener("click", () => toggle(State.LEFT));
toolsTrigger.addEventListener("click", () => toggle(State.RIGHT));
workspace.addEventListener("click", () => { if (state !== State.NONE) setState(State.NONE); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setState(State.NONE); });
sectionButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
accordionToggles.forEach((toggle) => toggle.addEventListener("click", () => toggleAccordion(toggle)));
actionButtons.forEach((button) => button.addEventListener("click", () => { toolStatus.textContent = `${button.textContent} is reserved for a future laboratory action.`; }));
setState(State.NONE);
