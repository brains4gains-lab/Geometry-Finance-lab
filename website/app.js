const State = Object.freeze({ NONE: "none", LEFT: "left", RIGHT: "right" });
const root = document.body;
const workspace = document.querySelector("#workspace");
const contextTrigger = document.querySelector("#open-context");
const toolsTrigger = document.querySelector("#open-tools");
const contextPanel = document.querySelector("#context-panel");
const toolsPanel = document.querySelector("#tools-panel");
const pages = [...document.querySelectorAll(".workspace-page")];
const sectionButtons = [...document.querySelectorAll(".section-menu button")];
const toolStatus = document.querySelector("#tool-status");
let state = State.NONE;
let audioContext;
let activeRustle;

function playPanelRustle() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !navigator.userActivation?.isActive) return;
  try {
    audioContext ??= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
    activeRustle?.stop();
    const duration = .12;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const fade = 1 - index / data.length;
      data[index] = (Math.random() * 2 - 1) * fade * fade;
    }
    const source = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = .55;
    gain.gain.setValueAtTime(.016, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    source.connect(filter).connect(gain).connect(audioContext.destination);
    source.start();
    activeRustle = source;
  } catch { /* Keep interaction silent when audio is unavailable or blocked. */ }
}

function setState(next) {
  if (state !== next) playPanelRustle();
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
document.querySelectorAll(".tool-actions button").forEach((button) => button.addEventListener("click", () => { toolStatus.textContent = `${button.textContent} is reserved for a future laboratory action.`; }));
setState(State.NONE);
