let watches = [];
let wishlist = [];
let selectedTags = new Set();
let compareQueue = [];
let cardViews = {};

const BRAND_COLORS = {
  'Bering':    '#1a9bdc',
  'Casio':     '#e85d04',
  'Spinnaker': '#0b7a6e',
};

function brandColor(brand) {
  return BRAND_COLORS[brand] ?? '#6366f1';
}

async function loadData() {
  try {
    const [resW, resWish] = await Promise.all([
      fetch('data/watches.json'),
      fetch('data/wishlist.json'),
    ]);
    watches = await resW.json();
    wishlist = await resWish.json();
    applySystemThemePreference();
    renderTagChips();
    render();
  } catch (e) {
    console.error('Fehler beim Laden:', e);
  }
}

function applySystemThemePreference() {
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    document.documentElement.dataset.theme = 'dark';
  }
}

function allTags() {
  const tags = new Set();
  watches.forEach(w => w.tags?.forEach(t => tags.add(t)));
  wishlist.forEach(w => w.tags?.forEach(t => tags.add(t)));
  return [...tags].sort();
}

function renderTagChips() {
  const container = document.getElementById('tagChips');
  container.innerHTML = '';

  if (selectedTags.size > 0) {
    const reset = document.createElement('button');
    reset.className = 'chip chip-reset';
    reset.textContent = '✕ Reset';
    reset.addEventListener('click', () => {
      selectedTags.clear();
      renderTagChips();
      render();
    });
    container.appendChild(reset);
  }

  allTags().forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'chip' + (selectedTags.has(tag) ? ' chip-active' : '');
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      selectedTags.has(tag) ? selectedTags.delete(tag) : selectedTags.add(tag);
      renderTagChips();
      render();
    });
    container.appendChild(btn);
  });
}

function updateCompareButton() {
  const btn = document.getElementById('compareBtn');
  btn.disabled = compareQueue.length < 2;
  btn.textContent = compareQueue.length > 0
    ? `Vergleichen (${compareQueue.length})`
    : 'Vergleichen';
}

function buildCard(w, context = 'gallery') {
  const isSelected = compareQueue.includes(w.code);
  const view = cardViews[w.code] ?? 'images';
  const color = brandColor(w.brand);

  const card = document.createElement('article');
  card.className = 'card' + (isSelected ? ' selected' : '') + (view === 'tech' ? ' card--tech' : '');
  card.style.setProperty('--brand-color', color);

  let html = `<span class="select-check">✓</span>`;

  html += `<div class="card-top">
    <div class="card-title-row">
      <span class="brand-badge" style="background:${color}20;color:${color}">${w.brand}</span>
      <h3>${w.name.replace(w.brand + ' ', '')}</h3>
    </div>`;

  if (context !== 'compare') {
    html += `<div class="view-toggle">
      <button class="vt${view === 'images' ? ' vt-active' : ''}" data-view="images">Bild</button>
      <button class="vt${view === 'tech'   ? ' vt-active' : ''}" data-view="tech">Tech</button>
    </div>`;
  }

  html += `</div>`;

  if (view === 'images' || context === 'compare') {
    html += `<img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}">`;
  }

  if (view === 'tech' || context === 'compare') {
    html += `<ul class="tech-list">`;
    if (context === 'compare') {
      html += `<li><span class="tech-key">Hersteller</span><span class="tech-val">${w.brand}</span></li>`;
      if (w.value) html += `<li><span class="tech-key">Wert</span><span class="tech-val">${w.value} €</span></li>`;
    }
    if (w.tech) {
      for (const key in w.tech) {
        html += `<li><span class="tech-key">${key}</span><span class="tech-val">${w.tech[key]}</span></li>`;
      }
    }
    html += `</ul>`;
  }

  if (w.tags?.length) {
    html += `<div class="tags">`;
    w.tags.forEach(t => {
      const active = selectedTags.has(t);
      html += `<span class="tag${active ? ' tag-active' : ''}"${active ? ` style="background:${color}18;color:${color};border-color:${color}60"` : ''}>${t}</span>`;
    });
    html += `</div>`;
  }

  card.innerHTML = html;

  const img = card.querySelector('img');
  if (img) img.onload = () => img.classList.add('loaded');

  if (context !== 'compare') {
    card.querySelectorAll('.vt').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        cardViews[w.code] = btn.dataset.view;
        card.replaceWith(buildCard(w, context));
      });
    });

    if (context === 'gallery') {
      card.addEventListener('click', () => {
        if (compareQueue.includes(w.code)) {
          compareQueue = compareQueue.filter(c => c !== w.code);
        } else {
          compareQueue.push(w.code);
          if (compareQueue.length > 2) compareQueue.shift();
        }
        render();
      });
    }
  }

  return card;
}

function render() {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  watches
    .filter(w => {
      if (selectedTags.size === 0) return true;
      return w.tags && [...selectedTags].every(t => w.tags.includes(t));
    })
    .forEach(w => gallery.appendChild(buildCard(w, 'gallery')));

  updateCompareButton();
  renderWishlist();
}

function renderWishlist() {
  const area = document.getElementById('wishlistArea');
  area.innerHTML = '';
  wishlist.forEach(w => area.appendChild(buildCard(w, 'wishlist')));
}

function openCompareOverlay() {
  const area = document.getElementById('compareArea');
  area.innerHTML = '';

  compareQueue.forEach(code => {
    const w = watches.find(x => x.code === code);
    if (!w) return;
    const card = buildCard(w, 'compare');
    card.className = 'compare-card';
    card.style.setProperty('--brand-color', brandColor(w.brand));
    area.appendChild(card);
  });

  document.getElementById('compareOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCompareOverlay() {
  document.getElementById('compareOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');

  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  });

  document.getElementById('compareBtn').addEventListener('click', openCompareOverlay);
  document.getElementById('overlayClose').addEventListener('click', closeCompareOverlay);

  const overlay = document.getElementById('compareOverlay');
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCompareOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCompareOverlay(); });

  loadData();
});
