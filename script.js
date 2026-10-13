let watches = [];
let wishlist = [];
let selectedTags = new Set();
let compareQueue = [];
let cardViews = {};
let detailCode = null;
let compareOnlyDiff = false;
let returnFocus = {};

const MAX_COMPARE = 4;

const BRAND_COLORS = {
  'Bering':    '#1a9bdc',
  'Casio':     '#e85d04',
  'Spinnaker': '#0b7a6e',
};

function brandColor(brand) {
  return BRAND_COLORS[brand] ?? '#6366f1';
}

function findWatch(code) {
  return watches.find(w => w.code === code) ?? wishlist.find(w => w.code === code);
}

function shortName(w) {
  return w.name.replace(new RegExp(`^${w.brand}\\s+`, 'i'), '');
}

function formatEuro(v) {
  return `${v.toLocaleString('de-DE')} €`;
}

function brandBadge(w) {
  return `<span class="brand-badge" style="--brand-color:${brandColor(w.brand)}">${w.brand}</span>`;
}

function techRow(key, val) {
  return `<li><span class="tech-key">${key}</span><span class="tech-val">${val}</span></li>`;
}

function tagsHtml(w, limit = Infinity) {
  if (!w.tags?.length) return '';
  // aktive Filter-Tags zuerst, damit sie auch gekürzt sichtbar bleiben
  const tags = [...w.tags].sort((a, b) => selectedTags.has(b) - selectedTags.has(a));
  let html = `<div class="tags">`;
  tags.slice(0, limit).forEach(t => {
    html += `<span class="tag${selectedTags.has(t) ? ' tag-active' : ''}">${t}</span>`;
  });
  if (tags.length > limit) html += `<span class="tag tag-more">+${tags.length - limit}</span>`;
  return html + `</div>`;
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
    renderStats();
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

function renderStats() {
  const brands = new Set(watches.map(w => w.brand));
  const total = watches.reduce((sum, w) => sum + (w.value ?? 0), 0);
  const stats = [
    ['Uhren', watches.length],
    ['Marken', brands.size],
  ];
  document.getElementById('stats').innerHTML = stats
    .map(([label, val]) => `<div><dt>${label}</dt><dd>${val}</dd></div>`)
    .join('');
}

function allTags() {
  const tags = new Set();
  watches.forEach(w => w.tags?.forEach(t => tags.add(t)));
  wishlist.forEach(w => w.tags?.forEach(t => tags.add(t)));
  return [...tags].sort();
}

function filteredWatches() {
  if (selectedTags.size === 0) return watches;
  return watches.filter(w => w.tags && [...selectedTags].every(t => w.tags.includes(t)));
}

function renderTagChips() {
  const container = document.getElementById('tagChips');
  container.innerHTML = '';

  if (selectedTags.size > 0) {
    const reset = document.createElement('button');
    reset.className = 'chip chip-reset';
    reset.textContent = '✕ Zurücksetzen';
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

function buildCard(w) {
  const isSelected = compareQueue.includes(w.code);
  const view = cardViews[w.code] ?? 'images';
  const color = brandColor(w.brand);

  const card = document.createElement('article');
  card.className = 'card' + (isSelected ? ' selected' : '') + (view === 'tech' ? ' card--tech' : '');
  card.style.setProperty('--brand-color', color);
  card.tabIndex = 0;
  card.setAttribute('aria-label', `${w.name} – Details anzeigen`);

  let html = `<button class="compare-toggle" aria-pressed="${isSelected}"
    title="${isSelected ? 'Aus Vergleich entfernen' : 'Zum Vergleich hinzufügen'}"
    aria-label="${w.name} ${isSelected ? 'aus Vergleich entfernen' : 'zum Vergleich hinzufügen'}">${isSelected ? '✓' : '+'}</button>`;

  if (view === 'tech' && w.tech) {
    html += `<ul class="tech-list">`;
    for (const key in w.tech) html += techRow(key, w.tech[key]);
    html += `</ul>`;
  } else {
    html += `<div class="card-media"><img src="faces/${w.code}.jpg" loading="lazy" alt="${w.name}"></div>`;
  }

  html += `<div class="card-body">
    ${brandBadge(w)}
    <h3>${shortName(w)}</h3>
    ${tagsHtml(w, 4)}
    <div class="card-footer">
      <div class="view-toggle" role="group" aria-label="Ansicht">
        <button class="vt${view === 'images' ? ' vt-active' : ''}" data-view="images" aria-pressed="${view === 'images'}">Bild</button>
        <button class="vt${view === 'tech'   ? ' vt-active' : ''}" data-view="tech" aria-pressed="${view === 'tech'}">Technik</button>
      </div>
    </div>
  </div>`;

  card.innerHTML = html;

  const img = card.querySelector('img');
  if (img) {
    if (img.complete) img.classList.add('loaded');
    else img.onload = () => img.classList.add('loaded');
  }

  card.querySelectorAll('.vt').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      cardViews[w.code] = btn.dataset.view;
      card.replaceWith(buildCard(w));
    });
  });

  card.querySelector('.compare-toggle').addEventListener('click', e => {
    e.stopPropagation();
    toggleCompare(w.code);
  });

  card.addEventListener('click', () => openDetail(w.code));
  card.addEventListener('keydown', e => {
    if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openDetail(w.code);
    }
  });

  return card;
}

function render() {
  const gallery = document.getElementById('gallery');
  const list = filteredWatches();
  gallery.innerHTML = list.length ? '' : `<p class="empty-state">Keine Uhr hat alle gewählten Tags.</p>`;
  list.forEach(w => gallery.appendChild(buildCard(w)));

  updateCompareButton();
  renderCompareTray();
  renderWishlist();
}

function renderWishlist() {
  const area = document.getElementById('wishlistArea');
  document.getElementById('wishlistSection').hidden = wishlist.length === 0;
  area.innerHTML = '';
  wishlist.forEach(w => area.appendChild(buildCard(w)));
}

/* ─── Vergleichsauswahl ─────────────────────────────────────── */

function toggleCompare(code) {
  if (compareQueue.includes(code)) {
    compareQueue = compareQueue.filter(c => c !== code);
  } else {
    compareQueue.push(code);
    if (compareQueue.length > MAX_COMPARE) compareQueue.shift();
  }

  render();
  if (isOpen('detailOverlay')) renderDetail();
  if (isOpen('compareOverlay')) {
    compareQueue.length === 0 ? closeOverlay('compareOverlay') : renderCompare();
  }
}

function clearCompare() {
  compareQueue = [];
  render();
  if (isOpen('detailOverlay')) renderDetail();
  if (isOpen('compareOverlay')) closeOverlay('compareOverlay');
}

function renderCompareTray() {
  const tray = document.getElementById('compareTray');
  const open = compareQueue.length > 0;
  tray.classList.toggle('open', open);
  tray.inert = !open;
  document.body.classList.toggle('has-tray', open);

  let html = '';
  for (let i = 0; i < MAX_COMPARE; i++) {
    const w = findWatch(compareQueue[i]);
    if (w) {
      html += `<div class="tray-slot" style="--brand-color:${brandColor(w.brand)}">
        <span class="tray-thumb"><img src="faces/${w.code}.jpg" alt="${w.name}" data-detail="${w.code}" title="Details anzeigen"></span>
        <span title="${w.name}">${shortName(w)}</span>
        <button class="tray-remove" data-remove="${w.code}" aria-label="${w.name} entfernen" title="Entfernen">✕</button>
      </div>`;
    } else {
      html += `<div class="tray-slot tray-slot--empty"><span>Uhr wählen</span></div>`;
    }
  }
  document.getElementById('compareTraySlots').innerHTML = html;

  const btn = document.getElementById('trayOpen');
  btn.disabled = compareQueue.length < 2;
  btn.textContent = `Vergleichen (${compareQueue.length}/${MAX_COMPARE})`;
}

/* ─── Overlays ──────────────────────────────────────────────── */

function isOpen(id) {
  return document.getElementById(id).classList.contains('open');
}

function openOverlay(id) {
  const overlay = document.getElementById(id);
  if (!overlay.classList.contains('open')) returnFocus[id] = document.activeElement;
  overlay.classList.add('open');
  overlay.querySelector('.overlay-close').focus();
  syncBodyScroll();
}

function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'detailOverlay') detailCode = null;
  syncBodyScroll();
  const el = returnFocus[id];
  if (el?.isConnected) el.focus();
}

function syncBodyScroll() {
  document.body.style.overflow = document.querySelector('.overlay.open') ? 'hidden' : '';
}

/* ─── Detailansicht ─────────────────────────────────────────── */

function detailList(w) {
  if (wishlist.includes(w)) return wishlist;
  const list = filteredWatches();
  return list.includes(w) ? list : watches;
}

function openDetail(code) {
  detailCode = code;
  renderDetail();
  openOverlay('detailOverlay');
}

function stepDetail(dir) {
  const w = findWatch(detailCode);
  const list = detailList(w);
  if (list.length < 2) return;
  const idx = list.indexOf(w);
  detailCode = list[(idx + dir + list.length) % list.length].code;
  renderDetail();
}

function renderDetail() {
  const w = findWatch(detailCode);
  if (!w) return;
  const list = detailList(w);
  const idx = list.indexOf(w);
  const inCompare = compareQueue.includes(w.code);

  document.querySelector('#detailOverlay .overlay-inner')
    .style.setProperty('--brand-color', brandColor(w.brand));

  let tech = '';
  if (w.tech) for (const key in w.tech) tech += techRow(key, w.tech[key]);

  const compareLabel = inCompare
    ? '✓ Im Vergleich – entfernen'
    : '+ Zum Vergleich';
  const compareTitle = !inCompare && compareQueue.length >= MAX_COMPARE
    ? ` title="Ersetzt ${findWatch(compareQueue[0]).name}"`
    : '';

  document.getElementById('detailContent').innerHTML = `
    <div class="detail">
      <figure class="detail-media">
        <img src="faces/${w.code}.jpg" alt="${w.name}">
      </figure>
      <div class="detail-body">
        <div class="detail-head">
          ${brandBadge(w)}
          <h2 id="detailTitle">${w.name}</h2>
          <div class="detail-meta">
            <span class="detail-code">${w.code}</span>
            ${w.value ? `<span class="detail-value">${formatEuro(w.value)}</span>` : ''}
          </div>
        </div>
        ${tagsHtml(w)}
        ${tech ? `<ul class="tech-list detail-tech">${tech}</ul>` : ''}
        <div class="detail-actions">
          <button class="${inCompare ? 'btn-ghost' : 'btn-primary'}" data-action="compare"${compareTitle}>${compareLabel}</button>
          ${compareQueue.length >= 2
            ? `<button class="btn-ghost" data-action="open-compare">Vergleich öffnen (${compareQueue.length})</button>`
            : ''}
        </div>
      </div>
    </div>
    ${list.length > 1 ? `<div class="detail-nav">
      <button class="btn-ghost" data-action="prev" aria-label="Vorherige Uhr">‹ Vorherige</button>
      <span>${idx + 1} / ${list.length}</span>
      <button class="btn-ghost" data-action="next" aria-label="Nächste Uhr">Nächste ›</button>
    </div>` : ''}`;
}

/* ─── Vergleich ─────────────────────────────────────────────── */

function openCompareOverlay() {
  if (compareQueue.length < 2) return;
  renderCompare();
  openOverlay('compareOverlay');
}

function normalizeValue(v) {
  return v == null ? '' : String(v).replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

function compareRows(items) {
  const keys = [];
  items.forEach(w => Object.keys(w.tech ?? {}).forEach(k => {
    if (!keys.includes(k)) keys.push(k);
  }));

  const rows = [
    { key: 'Hersteller', values: items.map(w => w.brand) },
    { key: 'Wert', values: items.map(w => w.value ? formatEuro(w.value) : null) },
    ...keys.map(k => ({ key: k, values: items.map(w => w.tech?.[k] ?? null) })),
  ];
  rows.forEach(r => r.diff = new Set(r.values.map(normalizeValue)).size > 1);
  return rows;
}

function renderCompare() {
  const items = compareQueue.map(findWatch).filter(Boolean);
  const rows = compareRows(items);

  const shared = new Set(items[0]?.tags ?? []);
  items.forEach(w => [...shared].forEach(t => { if (!w.tags?.includes(t)) shared.delete(t); }));
  const tagsDiff = items.some(w => (w.tags?.length ?? 0) !== shared.size);

  const diffCount = rows.filter(r => r.diff).length + (tagsDiff ? 1 : 0);
  const candidates = [...watches, ...wishlist].filter(w => !compareQueue.includes(w.code));

  let html = `<div class="compare-toolbar">
    <label class="diff-switch">
      <input type="checkbox" id="onlyDiff"${compareOnlyDiff ? ' checked' : ''}> Nur Unterschiede
    </label>
    <span class="compare-stats">${diffCount} von ${rows.length + 1} Merkmalen unterschiedlich</span>`;

  if (items.length < MAX_COMPARE && candidates.length) {
    html += `<select id="compareAdd" aria-label="Uhr zum Vergleich hinzufügen">
      <option value="">+ Uhr hinzufügen</option>
      ${candidates.map(w => `<option value="${w.code}">${w.name}</option>`).join('')}
    </select>`;
  }
  html += `</div>`;

  html += `<div class="compare-scroll">
    <table class="compare-table${compareOnlyDiff ? ' only-diff' : ''}" style="--cols:${items.length}">
      <colgroup><col class="ct-key-col">${items.map(() => '<col>').join('')}</colgroup>
      <thead><tr><th class="ct-key" scope="col"><span class="visually-hidden">Merkmal</span></th>`;

  items.forEach(w => {
    html += `<th class="ct-watch" scope="col" style="--brand-color:${brandColor(w.brand)}">
      <button class="ct-remove" data-remove="${w.code}" aria-label="${w.name} entfernen" title="Aus Vergleich entfernen">✕</button>
      <div class="ct-media"><img src="faces/${w.code}.jpg" alt="${w.name}" data-detail="${w.code}" title="Details anzeigen"></div>
      ${brandBadge(w)}
      <div class="ct-name">${shortName(w)}</div>
    </th>`;
  });
  html += `</tr></thead><tbody>`;

  rows.forEach(r => {
    html += `<tr class="${r.diff ? 'is-diff' : 'is-same'}"><th scope="row">${r.key}</th>`;
    r.values.forEach(v => { html += `<td>${v ?? '<span class="ct-missing">—</span>'}</td>`; });
    html += `</tr>`;
  });

  html += `<tr class="${tagsDiff ? 'is-diff' : 'is-same'}"><th scope="row">Tags</th>`;
  items.forEach(w => {
    const tags = (w.tags ?? []).map(t => shared.has(t)
      ? `<span class="tag tag-shared">${t}</span>`
      : `<span class="tag tag-active" style="--brand-color:${brandColor(w.brand)}">${t}</span>`
    ).join('');
    html += `<td><div class="tags">${tags || '<span class="ct-missing">—</span>'}</div></td>`;
  });
  html += `</tr></tbody></table></div>
    <p class="compare-legend">
      <span class="legend-mark"></span> abweichende Werte ·
      blasse Tags haben alle Uhren gemeinsam ·
      Bild anklicken für Details
    </p>`;

  document.getElementById('compareArea').innerHTML = html;
}

/* ─── Events ────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');

  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  });

  document.getElementById('compareBtn').addEventListener('click', openCompareOverlay);
  document.getElementById('trayOpen').addEventListener('click', openCompareOverlay);
  document.getElementById('trayClear').addEventListener('click', clearCompare);

  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.closest('[data-close]')) closeOverlay(overlay.id);
    });
  });

  document.getElementById('detailOverlay').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'prev') stepDetail(-1);
    if (action === 'next') stepDetail(1);
    if (action === 'compare') {
      toggleCompare(detailCode);
      document.querySelector('#detailContent [data-action="compare"]')?.focus();
    }
    if (action === 'open-compare') {
      closeOverlay('detailOverlay');
      openCompareOverlay();
    }
  });

  document.getElementById('compareOverlay').addEventListener('change', e => {
    if (e.target.id === 'onlyDiff') {
      compareOnlyDiff = e.target.checked;
      document.querySelector('.compare-table').classList.toggle('only-diff', compareOnlyDiff);
    }
    if (e.target.id === 'compareAdd' && e.target.value) {
      toggleCompare(e.target.value);
    }
  });

  // Entfernen- und Detail-Links in Vergleichstabelle und Leiste
  document.addEventListener('click', e => {
    const remove = e.target.closest('[data-remove]');
    if (remove) return toggleCompare(remove.dataset.remove);
    const detail = e.target.closest('[data-detail]');
    if (detail) openDetail(detail.dataset.detail);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (isOpen('detailOverlay')) closeOverlay('detailOverlay');
      else if (isOpen('compareOverlay')) closeOverlay('compareOverlay');
      return;
    }
    if (isOpen('detailOverlay') && !e.target.matches('input, select, textarea')) {
      if (e.key === 'ArrowLeft') stepDetail(-1);
      if (e.key === 'ArrowRight') stepDetail(1);
    }
  });

  loadData();
});
