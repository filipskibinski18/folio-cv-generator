import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); }, removeItem: (key: string) => { memory.delete(key); } });
const { useResumeStore } = await import('../store/useResumeStore');
const { presets } = await import('../data/presets');
const { getStorageError } = await import('../lib/storage');

beforeEach(() => { useResumeStore.getState().restoreExample(); useResumeStore.setState({ templates: [], history: [], future: [] }); });
describe('Historia i zapis lokalny', () => {
  it('cofa i ponawia edycję motywu', () => {
    const before = useResumeStore.getState().theme;
    useResumeStore.getState().applyTemplate(presets[1]); expect(useResumeStore.getState().theme.layout).toBe('single');
    useResumeStore.getState().undo(); expect(useResumeStore.getState().theme).toEqual(before);
    expect(useResumeStore.getState().activeTemplateId).toBe('modern');
    useResumeStore.getState().redo(); expect(useResumeStore.getState().theme.layout).toBe('single');
  });
  it('przechowuje dokument i szablony, pomijając historię', () => {
    useResumeStore.getState().updatePersonal({ firstName: 'Michał' });
    useResumeStore.getState().saveTemplate('Moja kolekcja');
    const persisted = JSON.parse(memory.get('folio-resume-v1')!);
    expect(persisted.state.data.personal.firstName).toBe('Michał'); expect(persisted.state.templates).toHaveLength(1);
    expect(persisted.state.history).toBeUndefined();
  });
  it('szablony zawierają tylko motyw i można je aktualizować, klonować i usuwać', () => {
    const id = useResumeStore.getState().saveTemplate('Zielony');
    expect(useResumeStore.getState().templates[0]).not.toHaveProperty('data');
    useResumeStore.getState().updateTheme({ sidebarWidth: 40 }); useResumeStore.getState().updateTemplate(id, 'Zielony 2');
    expect(useResumeStore.getState().templates[0].theme.sidebarWidth).toBe(40);
    useResumeStore.getState().cloneTemplate(useResumeStore.getState().templates[0]); expect(useResumeStore.getState().templates).toHaveLength(2);
    useResumeStore.getState().deleteTemplate(id); expect(useResumeStore.getState().templates).toHaveLength(1);
  });
  it('przesuwa sekcje bez duplikatów', () => {
    useResumeStore.getState().reorderSections('summary', 'skills');
    const ids = useResumeStore.getState().theme.sections.map(s => s.id);
    expect(ids.indexOf('summary')).toBe(3); expect(new Set(ids).size).toBe(9);
  });
  it('zachowuje edycję w pamięci przy braku miejsca w localStorage', () => {
    const mock = vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
    expect(() => useResumeStore.getState().updatePersonal({ firstName: 'Ewa' })).not.toThrow();
    expect(useResumeStore.getState().data.personal.firstName).toBe('Ewa'); expect(getStorageError()).toContain('JSON');
    mock.mockRestore();
  });
});
