export type AppTheme = 'light' | 'dark';
export const appThemeStorageKey = 'folio-ui-theme';
export const appThemeMediaQuery = '(prefers-color-scheme: dark)';

export function isAppTheme(value: unknown): value is AppTheme {
  return value === 'light' || value === 'dark';
}

export function getSavedAppTheme(): AppTheme | null {
  try {
    const value = localStorage.getItem(appThemeStorageKey);
    return isAppTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function getSystemAppTheme(): AppTheme {
  return typeof window !== 'undefined' && window.matchMedia?.(appThemeMediaQuery).matches ? 'dark' : 'light';
}

export function getInitialAppTheme(): AppTheme {
  return getSavedAppTheme() ?? getSystemAppTheme();
}

export function saveAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(appThemeStorageKey, theme);
  } catch {
    // The current session can still switch themes when browser storage is unavailable.
  }
}

export function applyAppTheme(theme: AppTheme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#231e25' : '#573d53');
}
