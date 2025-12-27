let watches = [];
let currentView = "images";
let currentBrand = "all";
let compareCodeA = "";
let compareCodeB = "";

async function loadData() {
    try {
        const res = await fetch("data/watches.json");
        watches = await res.json();
        populateCompareSelects();
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
            }

            if (currentView === "tech") {
                html += `<ul>`;
                for (const key in w.tech) {
                    html += `<li><strong>${key}:</strong> ${w.tech[key]}</li>`;
                }
                html += `</ul>`;
            }

            if (currentView === "both") {
                html += `
                    <img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}">
                `;
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

    renderComparison();
}

function populateCompareSelects() {
    const selectA = document.getElementById("compareSelectA");
    const selectB = document.getElementById("compareSelectB");

    watches.forEach(w => {
        const optA = document.createElement("option");
        optA.value = w.code;
        optA.textContent = w.name;
        selectA.appendChild(optA);

        const optB = document.createElement("option");
        optB.value = w.code;
        optB.textContent = w.name;
        selectB.appendChild(optB);
    });
}

function renderComparison() {
  const area = document.getElementById("compareArea");
  area.innerHTML = "";

  const codes = [compareCodeA, compareCodeB].filter(Boolean);
  if (codes.length === 0) return;

  codes.forEach(code => {
    const w = watches.find(x => x.code === code);
    if (!w) return;

    const card = document.createElement("article");
    card.className = "compare-card";

    let html = `<h3>${w.name}</h3>`;

    // Immer Technik im Vergleich
    html += `
      <ul>
        <li><strong>Hersteller:</strong> ${w.brand}</li>
        ${w.value ? `<li><strong>Wert:</strong> ${w.value} €</li>` : ""}
    `;

    if (w.tech) {
      for (const key in w.tech) {
        html += `<li><strong>${key}:</strong> ${w.tech[key]}</li>`;
      }
    }

    html += `</ul>`;

    if (w.tags && w.tags.length) {
      html += `<div class="tags">`;
      w.tags.forEach(t => {
        html += `<span class="tag">${t}</span>`;
      });
      html += `</div>`;
    }

    card.innerHTML = html;
    area.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
    const viewSelect = document.getElementById("viewSelect");
    const brandSelect = document.getElementById("brandSelect");
    const themeToggle = document.getElementById("themeToggle");
    const tagFilter = document.getElementById("tagFilter");
    const compareSelectA = document.getElementById("compareSelectA");
    const compareSelectB = document.getElementById("compareSelectB");

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

    compareSelectA.addEventListener("change", e => {
        compareCodeA = e.target.value;
        renderComparison();
    });

    compareSelectB.addEventListener("change", e => {
        compareCodeB = e.target.value;
        renderComparison();
    });

    loadData();
});
