let watches = [];
let currentView = "images";
let currentBrand = "all";

async function loadData() {
  try {
    const res = await fetch("data/watches.json");
    watches = await res.json();
    applySystemThemePreference();
    render();
  } catch (e) {
    console.error("Fehler beim Laden der Daten:", e);
  }
}

function applySystemThemePreference() {
  if (window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.dataset.theme = "dark";
  }
}

function getSelectedTags() {
  const checked = document.querySelectorAll("#tagFilter input:checked");
  return Array.from(checked).map(cb => cb.value);
}

function render() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  const selectedTags = getSelectedTags();

  watches
    .filter(w => currentBrand === "all" || w.brand === currentBrand)
    .filter(w => {
      if (selectedTags.length === 0) return true;
      if (!w.tags) return false;
      // Alle gewählten Tags müssen enthalten sein
      return selectedTags.every(tag => w.tags.includes(tag));
    })
    .forEach(w => {
      const card = document.createElement("article");
      card.className = "card";

      let html = `<h3>${w.name}</h3>`;

      if (currentView === "images") {
        html += `
          <img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}">
        `;
      } else {
        html += `<ul>`;
        for (const key in w.tech) {
          html += `<li><strong>${key}:</strong> ${w.tech[key]}</li>`;
        }
        html += `</ul>`;
      }

      if (w.tags && w.tags.length > 0) {
        html += `<div class="tags">`;
        w.tags.forEach(t => {
          html += `<span class="tag">${t}</span>`;
        });
        html += `</div>`;
      }

      card.innerHTML = html;

      const img = card.querySelector("img");
      if (img) {
        img.onload = () => img.classList.add("loaded");
      }

      gallery.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const viewSelect = document.getElementById("viewSelect");
  const brandSelect = document.getElementById("brandSelect");
  const themeToggle = document.getElementById("themeToggle");
  const tagFilter = document.getElementById("tagFilter");

  viewSelect.addEventListener("change", e => {
    currentView = e.target.value;
    render();
  });

  brandSelect.addEventListener("change", e => {
    currentBrand = e.target.value;
    render();
  });

  themeToggle.addEventListener("click", () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === "dark" ? "light" : "dark";
  });

  tagFilter.addEventListener("change", () => {
    render();
  });

  loadData();
});
