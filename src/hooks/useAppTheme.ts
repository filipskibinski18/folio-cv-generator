import { useEffect, useRef, useState } from 'react';
import { appThemeMediaQuery, appThemeStorageKey, applyAppTheme, getInitialAppTheme, getSavedAppTheme, isAppTheme, saveAppTheme } from '../lib/appTheme';

export function useAppTheme() {
  const [theme, setTheme] = useState(getInitialAppTheme);
  const followsSystem = useRef(getSavedAppTheme() === null);

  useEffect(() => { applyAppTheme(theme); }, [theme]);
  useEffect(() => {
    const media = window.matchMedia(appThemeMediaQuery);
    const onSystemChange = () => {
      if (followsSystem.current) setTheme(media.matches ? 'dark' : 'light');
    };
    const onStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || (event.key !== appThemeStorageKey && event.key !== null)) return;
      followsSystem.current = !isAppTheme(event.newValue);
      setTheme(isAppTheme(event.newValue) ? event.newValue : media.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', onSystemChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      media.removeEventListener('change', onSystemChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    followsSystem.current = false;
    saveAppTheme(next);
    setTheme(next);
  };
  return { theme, toggleTheme };
}
