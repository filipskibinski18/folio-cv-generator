import { describe, expect, it } from 'vitest';
import { defaultTheme, presets } from '../data/presets';
import { withCvLanguage } from '../lib/cvLanguage';
import { dateRange } from '../lib/format';
import { useResumeStore } from '../store/useResumeStore';
describe('Independent resume language', () => {
  it('translates standard headings and dates and preserves custom headings', () => {
    const theme = structuredClone(defaultTheme); theme.sections[0].title = 'My own heading';
    const english = withCvLanguage(theme, 'en');
    expect(english.sections[0].title).toBe('My own heading'); expect(english.sections[1].title).toBe('Experience');
    expect(dateRange('2022-03', '', true, 'en')).toBe('Mar 2022 — Present');
    expect(withCvLanguage(english, 'pl').sections[1].title).toBe('Doświadczenie');
  });
  it('keeps English headings when switching templates', () => {
    useResumeStore.getState().updateTheme(withCvLanguage(defaultTheme, 'en'));
    useResumeStore.getState().applyTemplate(presets[2]);
    expect(useResumeStore.getState().theme.language).toBe('en'); expect(useResumeStore.getState().theme.sections[1].title).toBe('Experience');
  });
});
