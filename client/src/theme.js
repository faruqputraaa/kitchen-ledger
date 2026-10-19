// Theme helper — <html data-theme="light|dark">, persisted in localStorage.
const KEY = 'kl-theme';

export function getTheme() {
  try { return localStorage.getItem(KEY) || 'light'; } catch { return 'light'; }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

// Run once on app boot (before first paint of React tree).
export function initTheme() {
  applyTheme(getTheme());
}
