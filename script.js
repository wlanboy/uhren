let watches = [];
let currentView = "images";
let currentBrand = "all";
let compareQueue = []; // die letzten zwei angeklickten Uhr-Codes
let wishlist = [];

async function loadData() {
    try {
        const res = await fetch("data/watches.json");
        watches = await res.json();
        const reswish = await fetch("data/wishlist.json");
        wishlist = await reswish.json();
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

function updateCompareButton() {
    const btn = document.getElementById("compareBtn");
    btn.disabled = compareQueue.length < 2;
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
            return selectedTags.every(tag => w.tags.includes(tag));
        })
        .forEach(w => {
            const isSelected = compareQueue.includes(w.code);
            const card = document.createElement("article");
            card.className = "card" + (isSelected ? " selected" : "");

            let html = `<span class="select-check">✓</span>`;
            html += `<h3>${w.name}</h3>`;

            if (currentView === "images" || currentView === "both") {
                html += `<img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}">`;
            }

            if (currentView === "tech" || currentView === "both") {
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

            card.addEventListener("click", () => {
                if (compareQueue.includes(w.code)) {
                    compareQueue = compareQueue.filter(c => c !== w.code);
                } else {
                    compareQueue.push(w.code);
                    if (compareQueue.length > 2) compareQueue.shift();
                }
                render();
            });

            gallery.appendChild(card);
        });

    updateCompareButton();
    renderWishlist();
}

function openCompareOverlay() {
    const overlay = document.getElementById("compareOverlay");
    const area = document.getElementById("compareArea");
    area.innerHTML = "";

    compareQueue.forEach(code => {
        const w = watches.find(x => x.code === code);
        if (!w) return;

        const card = document.createElement("article");
        card.className = "compare-card";

        let html = `<h3>${w.name}</h3>`;
        html += `<img src="faces/${w.code}.jpg" alt="${w.name}">`;

        html += `<ul>
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

    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeCompareOverlay() {
    document.getElementById("compareOverlay").classList.remove("open");
    document.body.style.overflow = "";
}

function renderWishlist() {
    const wishlistArea = document.getElementById("wishlistArea");
    wishlistArea.innerHTML = "";

    wishlist.forEach(w => {
        const card = document.createElement("article");
        card.className = "card";

        let html = `<h3>${w.name}</h3>`;

        html += `<img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}">`;

        if (w.tags && w.tags.length > 0) {
            html += `<div class="tags">`;
            w.tags.forEach(t => {
                html += `<span class="tag">${t}</span>`;
            });
            html += `</div>`;
        }

        html += `<ul>`;

        if (w.tech) {
            for (const key in w.tech) {
                html += `<li><strong>${key}:</strong> ${w.tech[key]}</li>`;
            }
        }

        html += `</ul>`;

        card.innerHTML = html;

        const img = card.querySelector("img");
        if (img) {
            img.onload = () => img.classList.add("loaded");
        }

        wishlistArea.appendChild(card);
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const viewSelect = document.getElementById("viewSelect");
    const brandSelect = document.getElementById("brandSelect");
    const themeToggle = document.getElementById("themeToggle");
    const tagFilter = document.getElementById("tagFilter");
    const compareBtn = document.getElementById("compareBtn");
    const overlayClose = document.getElementById("overlayClose");
    const compareOverlay = document.getElementById("compareOverlay");

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

    compareBtn.addEventListener("click", openCompareOverlay);

    overlayClose.addEventListener("click", closeCompareOverlay);

    compareOverlay.addEventListener("click", e => {
        if (e.target === compareOverlay) closeCompareOverlay();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") closeCompareOverlay();
    });

    loadData();
});
