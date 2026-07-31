const storageKey = "geometry-finance-lab-0.1.0";
const question = document.querySelector("#question");
const form = document.querySelector("#observation-form");
const observation = document.querySelector("#observation");
const source = document.querySelector("#source");
const confidence = document.querySelector("#confidence");
const list = document.querySelector("#observation-list");
const count = document.querySelector("#entry-count");
const saveState = document.querySelector("#save-state");
const template = document.querySelector("#observation-template");

let workspace = loadWorkspace();

function loadWorkspace() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || { question: "", observations: [] };
  } catch {
    return { question: "", observations: [] };
  }
}

function saveWorkspace(message = "Saved locally in this browser.") {
  localStorage.setItem(storageKey, JSON.stringify(workspace));
  saveState.textContent = message;
}

function render() {
  question.value = workspace.question;
  list.replaceChildren();
  workspace.observations.forEach((entry) => {
    const item = template.content.cloneNode(true);
    item.querySelector(".confidence").textContent = entry.confidence;
    item.querySelector("time").dateTime = entry.createdAt;
    item.querySelector("time").textContent = new Date(entry.createdAt).toLocaleString();
    item.querySelector(".observation-text").textContent = entry.text;
    item.querySelector(".observation-source").textContent = entry.source || "Source not specified";
    item.querySelector(".delete-entry").addEventListener("click", () => {
      workspace.observations = workspace.observations.filter(({ id }) => id !== entry.id);
      saveWorkspace("Entry removed from local workspace.");
      render();
    });
    list.append(item);
  });
  count.textContent = `${workspace.observations.length} ${workspace.observations.length === 1 ? "entry" : "entries"}`;
}

question.addEventListener("input", () => {
  workspace.question = question.value;
  saveWorkspace("Question saved locally in this browser.");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  workspace.observations.unshift({
    id: crypto.randomUUID(),
    text: observation.value.trim(),
    source: source.value.trim(),
    confidence: confidence.value,
    createdAt: new Date().toISOString()
  });
  form.reset();
  confidence.value = "medium";
  saveWorkspace("Observation saved locally in this browser.");
  render();
});

document.querySelector("#clear-workspace").addEventListener("click", () => {
  if (!window.confirm("Remove all locally stored questions and observations?")) return;
  workspace = { question: "", observations: [] };
  localStorage.removeItem(storageKey);
  saveState.textContent = "Local workspace cleared.";
  render();
});

document.querySelector("#export-ledger").addEventListener("click", () => {
  const file = new Blob([JSON.stringify(workspace, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(file), download: "geometry-finance-ledger.json" });
  link.click();
  URL.revokeObjectURL(link.href);
  saveState.textContent = "Ledger exported as JSON.";
});

render();
