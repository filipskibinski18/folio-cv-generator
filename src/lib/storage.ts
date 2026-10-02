import type { StateStorage } from 'zustand/middleware';

export const storageEvent = 'folio-storage-status';
let errorMessage = '';
export const getStorageError = () => errorMessage;
function report(error: unknown) {
  errorMessage = error ? 'Nie udało się zapisać zmian w przeglądarce. Pobierz kopię projektu JSON.' : '';
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(storageEvent, { detail: errorMessage }));
}
export const safeStorage: StateStorage = {
  getItem: name => { try { return localStorage.getItem(name); } catch (error) { report(error); return null; } },
  setItem: (name, value) => { try { localStorage.setItem(name, value); report(null); } catch (error) { report(error); } },
  removeItem: name => { try { localStorage.removeItem(name); report(null); } catch (error) { report(error); } },
};
