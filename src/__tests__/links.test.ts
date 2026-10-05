import { describe, expect, it } from 'vitest';
import { breakLongWord, cleanUrl, profileName, urlLabel } from '../lib/format';

describe('Linki w CV', () => {
  it('pokazuje czytelną etykietę bez protokołu, www i parametrów', () => {
    expect(urlLabel('https://www.linkedin.com/in/anowak/?utm_source=share#top')).toBe('linkedin.com/in/anowak');
    expect(urlLabel('mailto:anna@example.com')).toBe('anna@example.com');
    expect(urlLabel('example.com:8080/app')).toBe('example.com:8080/app');
  });
  it('skraca zbyt długi adres do szerokości kolumny, zostawiając pełny link', () => {
    const url = 'https://www.credly.com/badges/c0bfb8ab-09f0-4bc8-be16-0f1d4a5b7e2c/public_url';
    const label = urlLabel(url, 28);
    expect(label.length).toBeLessThanOrEqual(28);
    expect(label.startsWith('credly.com/badges/')).toBe(true);
    expect(label.endsWith('…')).toBe(true);
  });
  it('czyści wklejony adres z białych znaków i parametrów śledzących', () => {
    expect(cleanUrl('  https://www.linkedin.com/in/anowak?trk=public_profile&utm_source=x \n')).toBe('https://www.linkedin.com/in/anowak');
    expect(cleanUrl('youtube.com/watch?v=abc&si=xyz')).toBe('youtube.com/watch?v=abc');
    expect(cleanUrl('github.com/anowak')).toBe('github.com/anowak');
    expect(cleanUrl('anna@example.com')).toBe('anna@example.com');
  });
  it('rozpoznaje popularne profile', () => {
    expect(profileName('https://pl.linkedin.com/in/anowak')).toBe('LinkedIn');
    expect(profileName('github.com/anowak')).toBe('GitHub');
    expect(profileName('example.com')).toBe('');
  });
  it('dzieli tylko bardzo długie ciągi i nie gubi znaków', () => {
    expect(breakLongWord('Projektowanie')).toEqual(['Projektowanie']);
    const email = 'aleksandra.nowak-kowalska@przyklad-firmy.com.pl';
    const parts = breakLongWord(email);
    expect(parts.join('')).toBe(email);
    expect(parts.length).toBeGreaterThan(1);
    expect(Math.max(...parts.map(part => part.length))).toBeLessThanOrEqual(12);
  });
});
