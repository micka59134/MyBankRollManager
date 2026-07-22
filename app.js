'use strict';

const APP_VERSION = '1.3.0';

/* =========================================================================
   Bankroll Manager — logique applicative
   ========================================================================= */

const PROFILE_STORAGE_KEY = 'bankrollManager.profile';
const PROFILES = ['Tom', 'Micka'];

function storageKeyFor(profile) {
  return `bankrollManager.v1.${profile}`;
}

const TYPES = ['Paris', 'Paris gratuit', 'Dépôt', 'Retrait'];
const BET_TYPES = new Set(['Paris', 'Paris gratuit']);

const DEFAULT_CONSTANTES = {
  bookmakers: ['Winamax', 'Unibet', 'Betsson', 'Parions Sport'],
  competitions: ['Ligue 1', 'Ligue 2', 'Ligue des Champions', 'Ligue Europa', 'Ligue des Nations',
    'Coupe de France', 'Coupe du Monde 2022', 'Coupe du Monde 2026', 'Coupe du Monde des Clubs',
    'Euro 2024', 'JO Paris 2024', 'LaLiga', 'Ligua Portugal', 'Tour de France de cyclisme',
    'NBA', 'NHL', 'Premier League', 'Premiership', 'Serie A', 'Trophée des champions', 'Amicaux'],
  pays: ['France', 'Europe', 'Allemagne', 'Angleterre', 'Ecosse', 'Espagne', 'Etats-Unis', 'Italie', 'Monde', 'Portugal'],
  saisons: ['2022/2023', '2023/2024', '2024/2025', '2025/2026', '2026/2027'],
  typesDeParis: ['Simple', 'Combiné', 'Autre', '3 sur 4', '2 sur 3'],
};

// Drapeau associé à chaque pays (colonne "Pays" du tableau), sous forme d'icônes SVG
// vendorisées (vendor/flags/) plutôt que d'emoji : Windows/Segoe UI Emoji n'affiche pas les
// drapeaux composés d'indicateurs régionaux (🇫🇷, 🇪🇸...) contrairement aux autres émoji, ce
// qui les rendait invisibles pour beaucoup d'utilisateurs. "Monde" reste en emoji 🌍 (un
// pictogramme simple, pas un drapeau, qui s'affiche normalement partout).
const COUNTRY_FLAG_CODES = {
  'France': 'fr',
  'Europe': 'eu',
  'Allemagne': 'de',
  'Angleterre': 'gb-eng',
  'Ecosse': 'gb-sct',
  'Espagne': 'es',
  'Etats-Unis': 'us',
  'Italie': 'it',
  'Portugal': 'pt',
  'Belgique': 'be',
  'Pays-Bas': 'nl',
  'Suisse': 'ch',
  'Brésil': 'br',
  'Argentine': 'ar',
  'Croatie': 'hr',
  'Maroc': 'ma',
  'Qatar': 'qa',
  'Turquie': 'tr',
  'Grèce': 'gr',
};

function countryFlagHtml(pays) {
  if (pays === 'Monde') return '<img class="flag-icon" src="vendor/icons/globe.svg" alt="">';
  const code = COUNTRY_FLAG_CODES[pays];
  if (code) return `<img class="flag-icon" src="vendor/flags/${code}.svg" alt="">`;
  return '<img class="flag-icon" src="vendor/icons/drapeau-blanc.svg" alt="">';
}

// Logo des bookmakers connus (vendor/bookmakers/), en icônes téléchargées une fois et servies
// localement (hors ligne). Un bookmaker ajouté librement par l'utilisateur (sans logo connu)
// se voit attribuer un avatar généré à partir de son initiale, avec une couleur stable dérivée
// de son nom (pas d'appel réseau, fonctionne pour n'importe quel nom).
const BOOKMAKER_LOGOS = {
  'Winamax': 'winamax.png',
  'Unibet': 'unibet.png',
  'Betsson': 'betsson.png',
  'Parions Sport': 'parionssport.png',
};

const AVATAR_COLORS = ['#4f46e5', '#0ea5e9', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d'];

function bookmakerLogoHtml(name) {
  if (!name) return '';
  const file = BOOKMAKER_LOGOS[name];
  if (file) return `<img class="bookmaker-logo" src="vendor/bookmakers/${file}" alt="">`;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  const initials = name.trim().slice(0, 2).toUpperCase();
  return `<span class="bookmaker-logo bookmaker-avatar" style="background:${color}">${escapeHtml(initials)}</span>`;
}

// Icône (point de couleur) pour un type d'entrée, reprenant les couleurs des pastilles déjà
// utilisées dans le tableau.
function typeIconHtml(type) {
  return `<span class="type-dot type-dot-${type.replace(/\s/g, '-')}"></span>`;
}

// Icône SVG générique par compétition, devinée par mots-clés (pas d'asset dédié par compétition).
// Icônes vendorisées (vendor/icons/) plutôt qu'en emoji, pour un rendu net et cohérent avec les
// drapeaux/logos, indépendant de la police d'émoji du système.
const COMPETITION_ICON_RULES = [
  { test: /NBA/i, file: 'basketball.svg' },
  { test: /NHL/i, file: 'hockey.svg' },
  { test: /Tour de France/i, file: 'cyclisme.svg' },
  { test: /JO |Jeux Olympiques/i, file: 'medaille.svg' },
  { test: /Coupe du Monde/i, file: 'globe.svg' },
];

// Vrais logos des compétitions connues (vendor/competitions/), téléchargés une fois et servis
// localement. Les 3 compétitions UEFA partagent le même logo (favicon du site uefa.com commun
// aux 3), de même pour les 3 variantes de Coupe du Monde (fifa.com) : ce sont des sites distincts
// par organisation, pas par compétition individuelle. "Amicaux" et toute compétition ajoutée
// librement sans logo connu retombent sur l'icône générique par sport (COMPETITION_ICON_RULES).
const COMPETITION_LOGOS = {
  'Ligue 1': 'ligue1.png',
  'Ligue 2': 'ligue2.png',
  'Ligue des Champions': 'uefa.png',
  'Ligue Europa': 'uefa.png',
  'Ligue des Nations': 'uefa.png',
  'Euro 2024': 'uefa.png',
  'Coupe de France': 'fff.png',
  'Coupe du Monde 2022': 'fifa.png',
  'Coupe du Monde 2026': 'fifa.png',
  'Coupe du Monde des Clubs': 'fifa.png',
  'JO Paris 2024': 'jo.png',
  'LaLiga': 'laliga.png',
  'Ligua Portugal': 'ligaportugal.png',
  'Tour de France de cyclisme': 'tourdefrance.png',
  'NBA': 'nba.png',
  'NHL': 'nhl.png',
  'Premier League': 'premierleague.png',
  'Premiership': 'premiership.png',
  'Serie A': 'seriea.png',
  'Trophée des champions': 'lfp.png',
};

const COMPETITION_PAYS = {
  'Ligue 1': 'France', 'Ligue 2': 'France', 'Coupe de France': 'France',
  'Trophée des champions': 'France',
  'LaLiga': 'Espagne', 'Serie A': 'Italie', 'Ligua Portugal': 'Portugal',
  'Premier League': 'Angleterre', 'Premiership': 'Ecosse',
  'Ligue des Champions': 'Europe', 'Ligue Europa': 'Europe',
  'Ligue des Nations': 'Europe', 'Euro 2024': 'Europe',
  'Coupe du Monde 2022': 'Monde', 'Coupe du Monde 2026': 'Monde',
  'Coupe du Monde des Clubs': 'Monde', 'JO Paris 2024': 'Monde',
  'Amicaux': 'Monde',
  'NBA': 'Etats-Unis', 'NHL': 'Etats-Unis',
  'Tour de France de cyclisme': 'France',
};

function competitionIconHtml(name) {
  const logo = COMPETITION_LOGOS[name];
  if (logo) return `<img class="competition-logo" src="vendor/competitions/${logo}" alt="">`;
  const rule = COMPETITION_ICON_RULES.find(r => r.test.test(name));
  const file = rule ? rule.file : 'ballon.svg';
  return `<img class="icon-svg" src="vendor/icons/${file}" alt="">`;
}

/* ===== State ===== */
let currentProfile = localStorage.getItem(PROFILE_STORAGE_KEY) || PROFILES[0];
let state = loadState(currentProfile);
let filters = { search: '', type: '', bookmaker: '', competition: '', pays: '', saison: '' };
let sort = { col: 'date', dir: 'desc' };
let chart = null;
let editingId = null;

function loadState(profile) {
  try {
    const raw = localStorage.getItem(storageKeyFor(profile));
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.constantes = mergeConstantes(DEFAULT_CONSTANTES, parsed.constantes || {});
      for (const e of parsed.entries || []) {
        if (e.pays === undefined) e.pays = null;
        if (e.exported === undefined) e.exported = true;
      }
      if (!parsed.activeBookmakers) parsed.activeBookmakers = [...parsed.constantes.bookmakers];
      if (!parsed.activeCompetitions) parsed.activeCompetitions = [...parsed.constantes.competitions];
      if (!parsed.activePays) parsed.activePays = [...parsed.constantes.pays];
      if (!parsed.activeSaisons) parsed.activeSaisons = [...parsed.constantes.saisons];
      return parsed;
    }
  } catch (e) { console.warn('Etat local corrompu, réinitialisation.', e); }
  return { entries: [], constantes: cloneConstantes(DEFAULT_CONSTANTES), nextOrder: 1, activeBookmakers: [...DEFAULT_CONSTANTES.bookmakers], activeCompetitions: [...DEFAULT_CONSTANTES.competitions], activePays: [...DEFAULT_CONSTANTES.pays], activeSaisons: [...DEFAULT_CONSTANTES.saisons] };
}

function cloneConstantes(c) {
  return JSON.parse(JSON.stringify(c));
}

function mergeConstantes(base, extra) {
  const out = cloneConstantes(base);
  for (const key of Object.keys(out)) {
    const extraList = extra[key] || [];
    out[key] = Array.from(new Set([...out[key], ...extraList])).sort((a, b) => a.localeCompare(b, 'fr'));
  }
  return out;
}

function saveState(autoExport = false) {
  localStorage.setItem(storageKeyFor(currentProfile), JSON.stringify(state));
  if (autoExport) downloadJson();
}

const fileHandles = {};

async function downloadJson() {
  const { entries, constantes, ...settings } = state;
  const data = { profile: currentProfile, state: { ...settings, entries } };
  const json = JSON.stringify(data, null, 2);
  const filename = `bankroll_manager_${currentProfile}.json`;

  if (window.showSaveFilePicker) {
    try {
      if (!fileHandles[currentProfile]) {
        fileHandles[currentProfile] = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
      }
      const writable = await fileHandles[currentProfile].createWritable();
      await writable.write(json);
      await writable.close();
      markAllExported();
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('File System Access API error, fallback to download', err);
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  markAllExported();
}

function markAllExported() {
  for (const e of state.entries) e.exported = true;
  saveState();
  refreshAll();
}

function switchProfile(profile) {
  if (profile === currentProfile) return;
  currentProfile = profile;
  localStorage.setItem(PROFILE_STORAGE_KEY, profile);
  state = loadState(currentProfile);
  filters = { search: '', type: '', bookmaker: '', competition: '', pays: '', saison: '' };
  document.getElementById('fSearch').value = '';
  updateProfileUI();
  refreshAll();
}

function updateProfileUI() {
  document.querySelectorAll('.profile-btn').forEach(b => b.classList.toggle('active', b.dataset.profile === currentProfile));
  document.getElementById('emptyProfileName').textContent = currentProfile;
}

function addConstante(listName, value) {
  if (!value) return;
  value = value.trim();
  if (!value) return;
  if (!state.constantes[listName].some(v => v.toLowerCase() === value.toLowerCase())) {
    state.constantes[listName].push(value);
    state.constantes[listName].sort((a, b) => a.localeCompare(b, 'fr'));
  }
}

/* =========================================================================
   Calculs métier
   ========================================================================= */
function computeDerivedFields(entries) {
  const ordered = [...entries].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.order - b.order);
  let cumule = 0;
  for (const e of ordered) {
    let profit = null;
    if (e.type === 'Paris') {
      profit = (numOr0(e.montantGagne)) - (numOr0(e.montantParie));
    } else if (e.type === 'Paris gratuit') {
      profit = numOr0(e.montantGagne);
    }
    cumule += (profit === null ? 0 : profit);
    e.profit = profit;
    e.profitCumule = cumule;
  }
  return ordered;
}

function numOr0(v) {
  return (v === null || v === undefined || v === '') ? 0 : Number(v);
}

function fmtMoney(v) {
  return (v === null || v === undefined) ? '—' :
    Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function fmtDate(isoDate) {
  if (!isoDate) return '—';
  const d = isoToLocalDate(isoDate);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Les dates sont manipulées en "YYYY-MM-DD" pur ; toute conversion via new Date(iso) ou
// toISOString() interprète/produit de l'UTC et décale le jour d'un cran selon le fuseau
// local. On passe donc systématiquement par ces deux helpers en heure locale.
function isoToLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIsoLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* =========================================================================
   Dashboard
   ========================================================================= */

function computeStats(entries) {
  const paris = entries.filter(e => BET_TYPES.has(e.type));
  const totalMise = paris.reduce((s, e) => s + numOr0(e.montantParie), 0);
  const totalGagne = paris.reduce((s, e) => s + numOr0(e.montantGagne), 0);
  const totalDepot = entries.filter(e => e.type === 'Dépôt').reduce((s, e) => s + numOr0(e.credit), 0);
  const totalRetrait = entries.filter(e => e.type === 'Retrait').reduce((s, e) => s + numOr0(e.retrait), 0);
  const profitTotal = entries.reduce((s, e) => s + (e.profit === null ? 0 : e.profit), 0);
  const solde = totalDepot - totalRetrait + profitTotal;
  const gagnants = paris.filter(e => (e.profit || 0) > 0).length;
  const tauxReussite = paris.length ? (gagnants / paris.length) * 100 : 0;
  const roi = totalMise ? (profitTotal / totalMise) * 100 : 0;
  const parisGratuits = entries.filter(e => e.type === 'Paris gratuit');
  const nbParisGratuits = parisGratuits.length;
  const totalMiseGratuit = parisGratuits.reduce((s, e) => s + numOr0(e.montantParie), 0);
  const totalGagneGratuit = parisGratuits.reduce((s, e) => s + numOr0(e.montantGagne), 0);
  return { totalMise, totalGagne, totalDepot, totalRetrait, profitTotal, solde, tauxReussite, roi, nbParis: paris.length, gagnants, nbParisGratuits, totalMiseGratuit, totalGagneGratuit };
}

function renderCards(entries) {
  const s = computeStats(entries);
  const cards = [
    { label: 'Nombre de paris', value: s.nbParis, sub: s.nbParisGratuits ? `dont ${s.nbParisGratuits} gratuit${s.nbParisGratuits > 1 ? 's' : ''}` : '' },
    { label: 'Total misé', value: fmtMoney(s.totalMise), sub: s.totalMiseGratuit ? `dont ${fmtMoney(s.totalMiseGratuit)} en paris gratuits` : '' },
    { label: 'Total gagné', value: fmtMoney(s.totalGagne) },
    { label: 'Nombre de paris gagné', value: `${s.gagnants} (${s.tauxReussite.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %)`, cls: s.gagnants > 0 ? 'positive' : '' },
    { label: 'Profit', value: fmtMoney(s.profitTotal), cls: s.profitTotal >= 0 ? 'positive' : 'negative' },
  ];
  const el = document.getElementById('cards');
  el.innerHTML = cards.map(c => `
    <div class="card">
      <div class="card-label">${c.label}</div>
      <div class="card-value ${c.cls || ''}">${c.value}</div>
      ${c.sub ? `<div class="card-sub">${c.sub}</div>` : ''}
    </div>
  `).join('');
}

function renderChart(entries) {
  // En vue filtrée, le profit cumulé global de chaque entrée (calculé sur toutes les données)
  // n'a plus de sens : on recalcule un cumul propre au seul sous-ensemble filtré.
  const ordered = [...entries].sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.order - b.order);
  let running = 0;
  const labels = [];
  const data = [];
  for (const e of ordered) {
    running += (e.profit === null ? 0 : e.profit);
    labels.push(fmtDate(e.date));
    data.push(running);
  }
  const ctx = document.getElementById('profitChart');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const gridColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
  const textColor = isDark ? '#9198a8' : '#6b7280';
  const greenLine = isDark ? '#34d399' : '#16a34a';
  const redLine = isDark ? '#f87171' : '#dc2626';
  const greenFill = isDark ? 'rgba(52,211,153,.15)' : 'rgba(22,163,74,.10)';
  const redFill = isDark ? 'rgba(248,113,113,.15)' : 'rgba(220,38,38,.10)';

  const segmentColor = (ctx) => ctx.p1.parsed.y >= 0 ? greenLine : redLine;
  const gradientFill = (context) => {
    const chart = context.chart;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return greenFill;
    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    const yScale = chart.scales.y;
    const zeroRatio = yScale.max <= 0 ? 0 : yScale.min >= 0 ? 1 :
      (yScale.max - 0) / (yScale.max - yScale.min);
    gradient.addColorStop(0, greenFill);
    gradient.addColorStop(Math.min(zeroRatio, 1), greenFill);
    gradient.addColorStop(Math.min(zeroRatio, 1), redFill);
    gradient.addColorStop(1, redFill);
    return gradient;
  };

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Profit cumulé',
        data,
        segment: { borderColor: segmentColor },
        backgroundColor: gradientFill,
        fill: true,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => ' ' + fmtMoney(ctx.parsed.y) },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, maxTicksLimit: 10 } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, callback: (v) => v + ' €' } },
      },
    },
  });
}

/* =========================================================================
   Filtres & Table
   ========================================================================= */

// Config des 4 menus déroulants à icônes de la barre de filtres. Chaque option est construite
// dynamiquement à partir des constantes courantes (bookmakers, compétitions, saisons ajoutés
// librement par l'utilisateur ont donc aussi leur icône : logo réel ou avatar/pastille de repli).
const ICON_SELECTS = [
  { id: 'fType', filterKey: 'type', placeholder: 'Tous types', getOptions: () => TYPES.map(t => ({ value: t, label: t, icon: typeIconHtml(t) })) },
  { id: 'fBookmaker', filterKey: 'bookmaker', placeholder: 'Tous bookmakers', getOptions: () => { const active = new Set(state.activeBookmakers || []); return state.constantes.bookmakers.filter(b => active.has(b)).map(b => ({ value: b, label: b, icon: bookmakerLogoHtml(b) })); } },
  { id: 'fCompetition', filterKey: 'competition', placeholder: 'Toutes compétitions', getOptions: () => { const active = new Set(state.activeCompetitions || []); return state.constantes.competitions.filter(c => active.has(c)).map(c => ({ value: c, label: c, icon: competitionIconHtml(c) })); } },
  { id: 'fPays', filterKey: 'pays', placeholder: 'Tous pays', getOptions: () => { const active = new Set(state.activePays || []); return state.constantes.pays.filter(p => active.has(p)).map(p => ({ value: p, label: p, icon: countryFlagHtml(p) })); } },
  { id: 'fSaison', filterKey: 'saison', placeholder: 'Toutes saisons', getOptions: () => { const active = new Set(state.activeSaisons || []); return state.constantes.saisons.filter(s => active.has(s)).map(s => ({ value: s, label: s, icon: '<img class="icon-svg" src="vendor/icons/calendrier.svg" alt="">' })); } },
];

function populateFilterOptions() {
  ICON_SELECTS.forEach(renderIconSelectOptions);
}

function renderIconSelectOptions(cfg) {
  const wrap = document.getElementById(cfg.id);
  const menu = wrap.querySelector('.iselect-menu');
  const currentValue = filters[cfg.filterKey];
  const options = [{ value: '', label: cfg.placeholder, icon: null }, ...cfg.getOptions()];
  menu.innerHTML = options.map(o => `
    <div class="iselect-option ${o.value === currentValue ? 'active' : ''}" data-value="${escapeHtml(o.value)}">
      ${o.icon || ''}<span>${escapeHtml(o.label)}</span>
    </div>
  `).join('');
  updateIconSelectLabel(cfg, currentValue);
}

function updateIconSelectLabel(cfg, value) {
  const wrap = document.getElementById(cfg.id);
  const label = wrap.querySelector('.iselect-label');
  if (!value) {
    label.innerHTML = `<span>${escapeHtml(cfg.placeholder)}</span>`;
    return;
  }
  const opt = cfg.getOptions().find(o => o.value === value);
  label.innerHTML = `${(opt && opt.icon) || ''}<span>${escapeHtml(value)}</span>`;
}

function closeAllIconSelects() {
  document.querySelectorAll('.iselect.open').forEach(w => {
    w.classList.remove('open');
    w.querySelector('.iselect-menu').hidden = true;
  });
}

function initIconSelects() {
  ICON_SELECTS.forEach(cfg => {
    const wrap = document.getElementById(cfg.id);
    const btn = wrap.querySelector('.iselect-btn');
    const menu = wrap.querySelector('.iselect-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      closeAllIconSelects();
      if (!isOpen) {
        wrap.classList.add('open');
        menu.hidden = false;
      }
    });

    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.iselect-option');
      if (!opt) return;
      filters[cfg.filterKey] = opt.dataset.value;
      menu.querySelectorAll('.iselect-option').forEach(o => o.classList.toggle('active', o === opt));
      updateIconSelectLabel(cfg, opt.dataset.value);
      closeAllIconSelects();
      applyFilters();
    });
  });

  document.addEventListener('click', closeAllIconSelects);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllIconSelects(); });
}

function populateDatalists() {
  const activeSet = new Set(state.activeBookmakers || []);
  fillDatalist('listBookmaker', state.constantes.bookmakers.filter(b => activeSet.has(b)));
  const activeCompSet = new Set(state.activeCompetitions || []);
  fillDatalist('listCompetition', state.constantes.competitions.filter(c => activeCompSet.has(c)));
  const activePaysSet = new Set(state.activePays || []);
  fillDatalist('listPays', state.constantes.pays.filter(p => activePaysSet.has(p)));
  const activeSaisonSet = new Set(state.activeSaisons || []);
  fillDatalist('listSaison', state.constantes.saisons.filter(s => activeSaisonSet.has(s)));
  fillDatalist('listTypeDeParis', state.constantes.typesDeParis);
}

function fillDatalist(id, values) {
  const dl = document.getElementById(id);
  dl.innerHTML = values.map(v => `<option value="${escapeHtml(v)}">`).join('');
}

function hasActiveFilters() {
  return !!(filters.search || filters.type || filters.bookmaker || filters.competition || filters.pays || filters.saison);
}

// Entrées correspondant aux filtres actifs (recherche, type, bookmaker, compétition, saison),
// sans tri : base commune pour le tableau de bord, le graphique et le tableau, qui reflètent
// ainsi tous la même vue filtrée.
function getFilteredEntries() {
  return state.entries.filter(e => {
    if (filters.type && e.type !== filters.type) return false;
    if (filters.bookmaker && e.bookmaker !== filters.bookmaker) return false;
    if (filters.competition && e.competition !== filters.competition) return false;
    if (filters.pays && e.pays !== filters.pays) return false;
    if (filters.saison && e.saison !== filters.saison) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [e.paris, e.commentaire, e.bookmaker, e.competition].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function getFilteredSortedEntries() {
  const list = getFilteredEntries();

  list.sort((a, b) => {
    let va = a[sort.col], vb = b[sort.col];
    if (sort.col === 'date') { va = va || ''; vb = vb || ''; }
    if (va === null || va === undefined) va = -Infinity;
    if (vb === null || vb === undefined) vb = -Infinity;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

function renderTable() {
  const list = getFilteredSortedEntries();
  document.getElementById('rowCount').textContent = list.length;
  const tbody = document.getElementById('tableBody');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="17" style="text-align:center; padding: 32px; color: var(--text-muted);">Aucune entrée ne correspond aux filtres.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => {
    const profitCls = e.profit === null ? '' : (e.profit > 0 ? 'num-positive' : (e.profit < 0 ? 'num-negative' : ''));
    const cumuleCls = e.profitCumule > 0 ? 'num-positive' : (e.profitCumule < 0 ? 'num-negative' : '');
    let gagneCls = '';
    let gagneText = '—';
    if (BET_TYPES.has(e.type)) {
      const won = e.montantGagne != null && e.montantGagne > 0;
      gagneCls = won ? 'num-positive' : 'num-negative';
      gagneText = e.montantGagne != null ? fmtMoney(e.montantGagne) : 'Perdu';
    }
    return `
    <tr data-id="${e.id}"${e.exported === false ? ' class="row-unsaved"' : ''}>
      <td><span class="pill pill-${e.type.replace(/\s/g, '-')}">${escapeHtml(e.type)}</span></td>
      <td>${fmtDate(e.date)}</td>
      <td class="cell-comment" title="${escapeHtml(e.paris || '')}">${escapeHtml(e.paris || '—')}</td>
      <td>${e.bookmaker ? `${bookmakerLogoHtml(e.bookmaker)} ${escapeHtml(e.bookmaker)}` : '—'}</td>
      <td class="cell-competition" title="${escapeHtml(e.competition || '')}">${e.competition ? `${competitionIconHtml(e.competition)}${escapeHtml(e.competition)}` : '—'}</td>
      <td title="${escapeHtml(e.pays || '')}">${e.pays ? `${countryFlagHtml(e.pays)} ${escapeHtml(e.pays)}` : '—'}</td>
      <td>${escapeHtml(e.saison || '—')}</td>
      <td>${escapeHtml(e.typeDeParis || '—')}</td>
      <td>${e.cote != null ? Number(e.cote).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}</td>
      <td>${e.montantParie != null ? fmtMoney(e.montantParie) : '—'}</td>
      <td>${e.credit != null ? fmtMoney(e.credit) : '—'}</td>
      <td>${e.retrait != null ? fmtMoney(e.retrait) : '—'}</td>
      <td class="${gagneCls}">${gagneText}</td>
      <td class="${profitCls}">${e.profit === null ? '—' : fmtMoney(e.profit)}</td>
      <td class="${cumuleCls}">${fmtMoney(e.profitCumule)}</td>
      <td class="cell-comment" title="${escapeHtml(e.commentaire || '')}">${escapeHtml(e.commentaire || '')}</td>
      <td class="col-actions">
        <div class="row-actions">
          <button class="btn-icon btn-edit" data-id="${e.id}" title="Modifier">✏️</button>
          <button class="btn-icon btn-del" data-id="${e.id}" title="Supprimer">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', () => openModal(b.dataset.id)));
  tbody.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', () => deleteEntry(b.dataset.id)));
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* =========================================================================
   Rendu global
   ========================================================================= */

function refreshAll() {
  computeDerivedFields(state.entries);
  saveState();
  document.getElementById('emptyState').hidden = state.entries.length !== 0;
  document.getElementById('mainView').hidden = state.entries.length === 0;
  if (state.entries.length === 0) return;
  populateFilterOptions();
  applyFilters();
}

// Ré-applique les filtres actifs et rafraîchit tout ce qui en dépend : le tableau de bord,
// le graphique et le tableau montrent ainsi tous la même vue filtrée par bookmaker, compétition,
// saison, etc. — pas seulement le tableau.
function applyFilters() {
  const filtered = getFilteredEntries();
  renderCards(filtered);
  renderChart(filtered);
  renderTable();

  const statusEl = document.getElementById('filterStatus');
  const active = hasActiveFilters();
  statusEl.hidden = !active;
  if (active) {
    document.getElementById('filterStatusCount').textContent = filtered.length;
    document.getElementById('filterStatusTotal').textContent = state.entries.length;
  }
}

/* =========================================================================
   Modal Ajout / Édition
   ========================================================================= */

const modalOverlay = document.getElementById('modalOverlay');
const entryForm = document.getElementById('entryForm');

function openModal(id = null) {
  editingId = id;
  populateDatalists();
  entryForm.reset();
  document.getElementById('btnDelete').hidden = !id;

  let entry = id ? state.entries.find(e => e.id === id) : null;
  const type = entry ? entry.type : 'Paris';

  document.getElementById('modalTitle').textContent = id ? 'Modifier l\'entrée' : 'Ajouter une entrée';
  document.getElementById('fId').value = id || '';
  setSegmented(type);
  document.getElementById('fDate').value = entry ? entry.date : todayIso();
  document.getElementById('fBookmakerInput').value = entry ? (entry.bookmaker || '') : '';
  document.getElementById('fParis').value = entry ? (entry.paris || '') : '';
  document.getElementById('fCompetitionInput').value = entry ? (entry.competition || '') : '';
  document.getElementById('fPays').value = entry ? (entry.pays || '') : '';
  document.getElementById('fSaisonInput').value = entry ? (entry.saison || '') : '';
  document.getElementById('fTypeDeParis').value = entry ? (entry.typeDeParis || '') : '';
  document.getElementById('fCote').value = entry && entry.cote != null ? entry.cote : '';
  document.getElementById('fMontantParie').value = entry && entry.montantParie != null ? entry.montantParie : '';
  const gagne = entry ? (entry.montantGagne != null && entry.montantGagne > 0) : false;
  setResultSegmented(gagne);
  document.getElementById('fMontantGagne').value = entry && entry.montantGagne != null ? entry.montantGagne : '';
  document.getElementById('fCredit').value = entry && entry.credit != null ? entry.credit : '';
  document.getElementById('fRetrait').value = entry && entry.retrait != null ? entry.retrait : '';
  document.getElementById('fCommentaire').value = entry ? (entry.commentaire || '') : '';

  updateFieldVisibility(type);
  updateProfitPreview();
  modalOverlay.hidden = false;
}

function closeModal() {
  modalOverlay.hidden = true;
  editingId = null;
}

function todayIso() {
  return dateToIsoLocal(new Date());
}

function setSegmented(type) {
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.value === type));
}

function currentSegmentedType() {
  const active = document.querySelector('.seg-btn.active');
  return active ? active.dataset.value : 'Paris';
}

function updateFieldVisibility(type) {
  const isBet = BET_TYPES.has(type);
  document.getElementById('betFields').style.display = isBet ? '' : 'none';
  document.getElementById('creditField').style.display = type === 'Dépôt' ? '' : 'none';
  document.getElementById('retraitField').style.display = type === 'Retrait' ? '' : 'none';
  document.getElementById('fParis').required = false;
  document.getElementById('fMontantParie').required = isBet;
  document.getElementById('fCredit').required = type === 'Dépôt';
  document.getElementById('fRetrait').required = type === 'Retrait';
}

function updateProfitPreview() {
  const type = currentSegmentedType();
  const preview = document.getElementById('profitPreview');
  if (!BET_TYPES.has(type)) { preview.hidden = true; return; }
  const gagne = parseFloat(document.getElementById('fMontantGagne').value);
  const mise = parseFloat(document.getElementById('fMontantParie').value);
  const g = isNaN(gagne) ? 0 : gagne;
  const m = isNaN(mise) ? 0 : mise;
  const profit = type === 'Paris gratuit' ? g : (g - m);
  preview.hidden = false;
  const val = document.getElementById('profitPreviewValue');
  val.textContent = fmtMoney(profit);
  val.style.color = profit > 0 ? 'var(--green)' : (profit < 0 ? 'var(--red)' : 'inherit');
}

document.getElementById('typeSegmented').addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  setSegmented(btn.dataset.value);
  updateFieldVisibility(btn.dataset.value);
  updateProfitPreview();
});

['fMontantGagne', 'fMontantParie'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateProfitPreview);
});

document.getElementById('fCompetitionInput').addEventListener('input', () => {
  const comp = document.getElementById('fCompetitionInput').value.trim();
  const pays = COMPETITION_PAYS[comp];
  if (pays) document.getElementById('fPays').value = pays;
});

function isResultGagne() {
  const active = document.querySelector('#resultSegmented .seg-btn.active');
  return active && active.dataset.value === 'gagne';
}

function setResultSegmented(gagne) {
  document.querySelectorAll('#resultSegmented .seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.value === (gagne ? 'gagne' : 'perdu'));
  });
  document.getElementById('montantGagneField').hidden = !gagne;
  if (!gagne) {
    document.getElementById('fMontantGagne').value = '';
  }
  updateProfitPreview();
}

document.getElementById('resultSegmented').addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  setResultSegmented(btn.dataset.value === 'gagne');
});

function autoFillMontantGagne() {
  if (!isResultGagne()) return;
  const cote = parseFloat(document.getElementById('fCote').value);
  const mise = parseFloat(document.getElementById('fMontantParie').value);
  if (!isNaN(cote) && !isNaN(mise) && cote > 0 && mise > 0) {
    document.getElementById('fMontantGagne').value = Math.round(cote * mise * 100) / 100;
    updateProfitPreview();
  }
}
document.getElementById('fCote').addEventListener('input', () => {
  autoFillMontantGagne();
  updateProfitPreview();
});
document.getElementById('fMontantParie').addEventListener('input', () => {
  autoFillMontantGagne();
  updateProfitPreview();
});

entryForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const type = currentSegmentedType();
  const id = document.getElementById('fId').value || crypto.randomUUID();
  const isNew = !document.getElementById('fId').value;

  const bookmaker = document.getElementById('fBookmakerInput').value.trim();
  const competition = document.getElementById('fCompetitionInput').value.trim();
  const pays = document.getElementById('fPays').value.trim();
  const saison = document.getElementById('fSaisonInput').value.trim();
  const typeDeParis = document.getElementById('fTypeDeParis').value.trim();

  addConstante('bookmakers', bookmaker);
  if (BET_TYPES.has(type)) {
    addConstante('competitions', competition);
    addConstante('pays', pays);
    addConstante('saisons', saison);
    addConstante('typesDeParis', typeDeParis);
  }

  const entry = {
    id,
    order: isNew ? (state.nextOrder++) : state.entries.find(x => x.id === id).order,
    type,
    date: document.getElementById('fDate').value,
    bookmaker: bookmaker || null,
    paris: BET_TYPES.has(type) ? (document.getElementById('fParis').value.trim() || null) : null,
    competition: BET_TYPES.has(type) ? (competition || null) : null,
    pays: BET_TYPES.has(type) ? (pays || null) : null,
    saison: BET_TYPES.has(type) ? (saison || null) : null,
    typeDeParis: BET_TYPES.has(type) ? (typeDeParis || null) : null,
    cote: BET_TYPES.has(type) ? emptyToNull(document.getElementById('fCote').value) : null,
    montantParie: BET_TYPES.has(type) ? emptyToNull(document.getElementById('fMontantParie').value) : null,
    montantGagne: BET_TYPES.has(type) ? emptyToNull(document.getElementById('fMontantGagne').value) : null,
    credit: type === 'Dépôt' ? emptyToNull(document.getElementById('fCredit').value) : null,
    retrait: type === 'Retrait' ? emptyToNull(document.getElementById('fRetrait').value) : null,
    commentaire: document.getElementById('fCommentaire').value.trim() || null,
    exported: false,
  };

  if (isNew) {
    state.entries.push(entry);
  } else {
    const idx = state.entries.findIndex(x => x.id === id);
    state.entries[idx] = entry;
  }

  closeModal();
  refreshAll();
  downloadJson();
  showToast(isNew ? 'Entrée ajoutée ✅' : 'Entrée mise à jour ✅');
});

function emptyToNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function deleteEntry(id) {
  const entry = state.entries.find(e => e.id === id);
  if (!entry) return;
  if (!confirm(`Supprimer cette entrée ${entry.type.toLowerCase()} du ${fmtDate(entry.date)} ?`)) return;
  state.entries = state.entries.filter(e => e.id !== id);
  refreshAll();
  downloadJson();
  showToast('Entrée supprimée 🗑️');
}

document.getElementById('btnDelete').addEventListener('click', () => {
  if (editingId) {
    deleteEntry(editingId);
    closeModal();
  }
});

document.getElementById('btnAdd').addEventListener('click', () => openModal());
document.getElementById('btnAddEmpty').addEventListener('click', () => openModal());
document.getElementById('btnImportEmpty').addEventListener('click', () => document.getElementById('fileImportJson').click());
document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modalOverlay.hidden) closeModal(); });

/* =========================================================================
   Filtres UI
   ========================================================================= */

document.getElementById('fSearch').addEventListener('input', (e) => { filters.search = e.target.value; applyFilters(); });
document.getElementById('btnResetFilters').addEventListener('click', () => {
  filters = { search: '', type: '', bookmaker: '', competition: '', pays: '', saison: '' };
  document.getElementById('fSearch').value = '';
  populateFilterOptions();
  applyFilters();
});

document.querySelectorAll('#dataTable thead th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if (sort.col === col) sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
    else { sort.col = col; sort.dir = 'asc'; }
    renderTable();
  });
});

/* =========================================================================
   Thème
   ========================================================================= */

function initTheme() {
  const saved = localStorage.getItem('bankrollManager.theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn();
}
function updateThemeBtn() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.getElementById('btnTheme').textContent = isDark ? '☀️' : '🌙';
}
document.getElementById('btnTheme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('bankrollManager.theme', next);
  updateThemeBtn();
  if (state.entries.length) renderChart(getFilteredEntries());
});

/* =========================================================================
   Toast
   ========================================================================= */

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

/* =========================================================================
   Settings modal
   ========================================================================= */

function renderSettingsSection(containerId, countId, items, activeSet, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = items.map((v, i) => `
    <div class="checkbox-item">
      <input type="checkbox" id="${prefix}${i}" value="${escapeHtml(v)}" ${activeSet.has(v) ? 'checked' : ''}>
      <label for="${prefix}${i}">${escapeHtml(v)}</label>
    </div>
  `).join('');
  const count = items.filter(v => activeSet.has(v)).length;
  document.getElementById(countId).textContent = `${count}/${items.length}`;
}

function openSettings() {
  document.getElementById('settingsProfileName').textContent = currentProfile;
  renderSettingsSection('bookmakerCheckboxes', 'countBookmakers', state.constantes.bookmakers, new Set(state.activeBookmakers || []), 'chkBk');
  renderSettingsSection('competitionCheckboxes', 'countCompetitions', state.constantes.competitions, new Set(state.activeCompetitions || []), 'chkComp');
  renderSettingsSection('paysCheckboxes', 'countPays', state.constantes.pays, new Set(state.activePays || []), 'chkPays');
  renderSettingsSection('saisonCheckboxes', 'countSaisons', state.constantes.saisons, new Set(state.activeSaisons || []), 'chkSaison');
  document.getElementById('settingsOverlay').hidden = false;
}

function closeSettings() {
  document.getElementById('settingsOverlay').hidden = true;
}

function saveSettings() {
  const bkCheckboxes = document.querySelectorAll('#bookmakerCheckboxes input[type="checkbox"]');
  state.activeBookmakers = [...bkCheckboxes].filter(c => c.checked).map(c => c.value);
  const compCheckboxes = document.querySelectorAll('#competitionCheckboxes input[type="checkbox"]');
  state.activeCompetitions = [...compCheckboxes].filter(c => c.checked).map(c => c.value);
  const paysCheckboxes = document.querySelectorAll('#paysCheckboxes input[type="checkbox"]');
  state.activePays = [...paysCheckboxes].filter(c => c.checked).map(c => c.value);
  const saisonCheckboxes = document.querySelectorAll('#saisonCheckboxes input[type="checkbox"]');
  state.activeSaisons = [...saisonCheckboxes].filter(c => c.checked).map(c => c.value);
  saveState();
  closeSettings();
  refreshAll();
  showToast('Paramètres enregistrés ✅');
}

function addSettingsItem(inputId, constKey, activeKey, checkboxesId) {
  const input = document.getElementById(inputId);
  const value = input.value.trim();
  if (!value) return;
  if (state.constantes[constKey].includes(value)) {
    showToast('Cette valeur existe déjà');
    return;
  }
  state.constantes[constKey].push(value);
  state.constantes[constKey].sort((a, b) => a.localeCompare(b, 'fr'));
  if (!state[activeKey]) state[activeKey] = [];
  state[activeKey].push(value);
  saveState();
  input.value = '';
  openSettings();
}

document.getElementById('btnAddBookmaker').addEventListener('click', () => addSettingsItem('newBookmaker', 'bookmakers', 'activeBookmakers', 'bookmakerCheckboxes'));
document.getElementById('btnAddCompetition').addEventListener('click', () => addSettingsItem('newCompetition', 'competitions', 'activeCompetitions', 'competitionCheckboxes'));
document.getElementById('btnAddPays').addEventListener('click', () => addSettingsItem('newPays', 'pays', 'activePays', 'paysCheckboxes'));
document.getElementById('btnAddSaison').addEventListener('click', () => addSettingsItem('newSaison', 'saisons', 'activeSaisons', 'saisonCheckboxes'));

document.getElementById('btnSettings').addEventListener('click', openSettings);
document.getElementById('btnCloseSettings').addEventListener('click', closeSettings);
document.getElementById('btnCancelSettings').addEventListener('click', closeSettings);
document.getElementById('btnSaveSettings').addEventListener('click', saveSettings);
document.getElementById('settingsOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSettings();
});

/* =========================================================================
   Export / Import JSON
   ========================================================================= */

async function exportJson() {
  await downloadJson();
  showToast('Export JSON généré ✅');
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.state || !Array.isArray(data.state.entries)) {
        showToast('Fichier JSON invalide ❌');
        return;
      }
      const profile = data.profile || currentProfile;
      if (profile !== currentProfile) {
        switchProfile(profile);
      }
      state.entries = data.state.entries;
      state.constantes = mergeConstantes(DEFAULT_CONSTANTES, data.state.constantes || {});
      state.nextOrder = data.state.nextOrder || state.entries.length + 1;
      if (data.state.activeBookmakers) state.activeBookmakers = data.state.activeBookmakers;
      if (data.state.activeCompetitions) state.activeCompetitions = data.state.activeCompetitions;
      if (data.state.activePays) state.activePays = data.state.activePays;
      if (data.state.activeSaisons) state.activeSaisons = data.state.activeSaisons;
      const merge = (constList, activeList) => { for (const v of activeList) { if (!constList.some(c => c.toLowerCase() === v.toLowerCase())) constList.push(v); } constList.sort((a, b) => a.localeCompare(b, 'fr')); };
      merge(state.constantes.bookmakers, state.activeBookmakers);
      merge(state.constantes.competitions, state.activeCompetitions);
      merge(state.constantes.pays, state.activePays);
      merge(state.constantes.saisons, state.activeSaisons);
      saveState();
      refreshAll();
      downloadJson();
      showToast(`Import JSON : ${state.entries.length} entrées pour ${profile} ✅`);
    } catch (err) {
      showToast('Erreur lors de l\'import JSON ❌');
      console.error(err);
    }
  };
  reader.readAsText(file);
}

document.getElementById('btnExportJson').addEventListener('click', exportJson);
document.getElementById('btnImportJson').addEventListener('click', () => document.getElementById('fileImportJson').click());
document.getElementById('fileImportJson').addEventListener('change', (e) => {
  if (e.target.files[0]) importJson(e.target.files[0]);
  e.target.value = '';
});

/* =========================================================================
   Init
   ========================================================================= */

document.querySelectorAll('.profile-btn').forEach(b => {
  b.addEventListener('click', () => switchProfile(b.dataset.profile));
});

initIconSelects();
initTheme();
updateProfileUI();
refreshAll();
document.getElementById('appVersion').textContent = APP_VERSION;
