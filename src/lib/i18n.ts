import { useLocaleStore } from '../store/useLocaleStore';
import english from './english.json';
export function tr(value: string | undefined): string {
  if (!value) return '';
  if (useLocaleStore.getState().language !== 'en') return value;
  const key = value.replace(/\s+/g, ' ').trim();
  return (english as Record<string, string>)[key] ?? value;
}
