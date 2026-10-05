import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appThemeMediaQuery, appThemeStorageKey, applyAppTheme, getInitialAppTheme, saveAppTheme } from '../lib/appTheme';

const memory = new Map<string, string>();
const matchMedia = vi.fn();

beforeEach(() => {
  memory.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  });
  matchMedia.mockReturnValue({ matches: false });
  vi.stubGlobal('window', { matchMedia });
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('Interface theme preference', () => {
  it('uses the system preference until the user makes a choice', () => {
    matchMedia.mockReturnValue({ matches: true });
    expect(getInitialAppTheme()).toBe('dark');
    expect(matchMedia).toHaveBeenCalledWith(appThemeMediaQuery);
    matchMedia.mockReturnValue({ matches: false });
    expect(getInitialAppTheme()).toBe('light');
  });

  it.each(['light', 'dark'] as const)('restores the saved %s choice regardless of the system', theme => {
    matchMedia.mockReturnValue({ matches: theme === 'light' });
    saveAppTheme(theme);
    expect(memory.get(appThemeStorageKey)).toBe(theme);
    expect(getInitialAppTheme()).toBe(theme);
    expect(memory.size).toBe(1);
  });

  it('ignores invalid stored preferences', () => {
    memory.set(appThemeStorageKey, 'invalid');
    matchMedia.mockReturnValue({ matches: true });
    expect(getInitialAppTheme()).toBe('dark');
  });

  it('works when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Storage blocked'); },
      setItem: () => { throw new Error('Storage blocked'); },
    });
    matchMedia.mockReturnValue({ matches: true });
    expect(getInitialAppTheme()).toBe('dark');
    expect(() => saveAppTheme('light')).not.toThrow();
  });

  it('applies the theme to the interface root and browser chrome', () => {
    const root = { dataset: {} as Record<string, string> };
    const setAttribute = vi.fn();
    vi.stubGlobal('document', { documentElement: root, querySelector: () => ({ setAttribute }) });
    applyAppTheme('dark');
    expect(root.dataset.theme).toBe('dark');
    expect(setAttribute).toHaveBeenLastCalledWith('content', '#231e25');
    applyAppTheme('light');
    expect(root.dataset.theme).toBe('light');
    expect(setAttribute).toHaveBeenLastCalledWith('content', '#573d53');
  });
});
