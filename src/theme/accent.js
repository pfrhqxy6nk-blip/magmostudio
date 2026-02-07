const DEFAULT_ACCENT = {
  start: '#FF9F0A',
  mid: '#FF6B2C',
  end: '#FFD3A1',
};

const PRESET_ACCENTS = [
  { id: 'orange', name: 'Orange', accent: DEFAULT_ACCENT },
  { id: 'apple-blue', name: 'Blue', accent: { start: '#0A84FF', mid: '#5AC8FA', end: '#A7D8FF' } },
  {
    id: 'cyan',
    name: 'Cyan',
    accent: { start: '#64D2FF', mid: '#2EDBFF', end: '#BFEFFF' },
  },
  {
    id: 'teal',
    name: 'Teal',
    accent: { start: '#40C8E0', mid: '#00C7BE', end: '#B9F0EF' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    accent: { start: '#34C759', mid: '#2EE7A6', end: '#B7FBD3' },
  },
  {
    id: 'lime',
    name: 'Lime',
    accent: { start: '#B7FF2A', mid: '#5CFF00', end: '#E9FF8A' },
  },
  {
    id: 'amber',
    name: 'Amber',
    accent: { start: '#FF9F0A', mid: '#FFB340', end: '#FFE1A6' },
  },
  {
    id: 'gold',
    name: 'Gold',
    accent: { start: '#FFCC00', mid: '#FFB800', end: '#FFEBA6' },
  },
  {
    id: 'copper',
    name: 'Copper',
    accent: { start: '#FF6A3D', mid: '#C85B3A', end: '#FFD0C1' },
  },
  {
    id: 'red',
    name: 'Red',
    accent: { start: '#FF453A', mid: '#FF6B8A', end: '#FFC4C0' },
  },
  {
    id: 'rose',
    name: 'Rose',
    accent: { start: '#FF375F', mid: '#FF2D55', end: '#FFB4C5' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    accent: { start: '#5856D6', mid: '#5E5CE6', end: '#C6C7FF' },
  },
  {
    id: 'violet',
    name: 'Violet',
    accent: { start: '#AF52DE', mid: '#BF5AF2', end: '#E9C9FF' },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    accent: { start: '#B0B3BA', mid: '#8E9097', end: '#F2F3F5' },
  },
];

function normalizeHex(hex) {
  if (typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const short = /^#([0-9a-fA-F]{3})$/;
  const full = /^#([0-9a-fA-F]{6})$/;
  if (short.test(withHash)) {
    const [, rgb] = withHash.match(short);
    const r = rgb[0];
    const g = rgb[1];
    const b = rgb[2];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (full.test(withHash)) return withHash.toUpperCase();
  return null;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const n = normalized.slice(1);
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  const to = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function blend(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

function deriveAccentFromStart(startHex) {
  const start = normalizeHex(startHex);
  if (!start) return DEFAULT_ACCENT;
  const mid = blend(start, '#000000', 0.18) || start;
  const end = blend(start, '#FFFFFF', 0.55) || start;
  return { start, mid, end };
}

function applyAccent(accent) {
  if (typeof document === 'undefined') return;
  const start = normalizeHex(accent?.start) || DEFAULT_ACCENT.start;
  const mid = normalizeHex(accent?.mid) || deriveAccentFromStart(start).mid;
  const end = normalizeHex(accent?.end) || deriveAccentFromStart(start).end;

  const rgb = hexToRgb(start) || hexToRgb(DEFAULT_ACCENT.start);
  document.documentElement.style.setProperty('--accent-start', start);
  document.documentElement.style.setProperty('--accent-mid', mid);
  document.documentElement.style.setProperty('--accent-end', end);
  if (rgb) {
    document.documentElement.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }
}

function loadAccent() {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  try {
    const raw = window.localStorage.getItem('accent');
    if (!raw) return DEFAULT_ACCENT;
    const parsed = JSON.parse(raw);
    const start = normalizeHex(parsed?.start);
    const mid = normalizeHex(parsed?.mid);
    const end = normalizeHex(parsed?.end);
    if (!start) return DEFAULT_ACCENT;
    return { start, mid: mid || deriveAccentFromStart(start).mid, end: end || deriveAccentFromStart(start).end };
  } catch {
    return DEFAULT_ACCENT;
  }
}

function saveAccent(accent) {
  if (typeof window === 'undefined') return;
  const start = normalizeHex(accent?.start);
  if (!start) return;
  const derived = deriveAccentFromStart(start);
  const payload = {
    start,
    mid: normalizeHex(accent?.mid) || derived.mid,
    end: normalizeHex(accent?.end) || derived.end,
  };
  window.localStorage.setItem('accent', JSON.stringify(payload));
}

function clearAccent() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('accent');
  applyAccent(DEFAULT_ACCENT);
}

export {
  DEFAULT_ACCENT,
  PRESET_ACCENTS,
  applyAccent,
  clearAccent,
  deriveAccentFromStart,
  loadAccent,
  saveAccent,
};
