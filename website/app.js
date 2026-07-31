const menuButtons = [...document.querySelectorAll(".section-menu button")];
const pages = [...document.querySelectorAll(".section-page")];

function showSection(id, updateHash = true) {
  const target = document.getElementById(id);
  if (!target) return;

  pages.forEach((page) => page.classList.toggle("is-active", page === target));
  menuButtons.forEach((button) => {
    const active = button.dataset.section === id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  document.title = `${target.querySelector(".eyebrow")?.textContent || "Geometry Finance Lab"} · Geometry Finance Lab`;
  if (updateHash) history.replaceState(null, "", `#${id}`);
}

menuButtons.forEach((button) => button.addEventListener("click", () => showSection(button.dataset.section)));
window.addEventListener("hashchange", () => showSection(location.hash.slice(1), false));
showSection(location.hash.slice(1) || "entrance", false);
