// client/src/utils/theme.js
// Reads/writes theme preference in localStorage and applies data-theme to <html>

export const THEMES = ['system', 'light', 'dark'];

export function getStoredTheme() {
  return localStorage.getItem('partspal_theme') || 'system';
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    // 'system' — follow OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }
  localStorage.setItem('partspal_theme', theme);
}

