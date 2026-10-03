import { describe, expect, it } from 'vitest';
import { colorPalettes, applyColorPalette } from '../data/colorPalettes';
import { defaultTheme } from '../data/presets';

const luminance = (hex: string) => {
  const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (first: string, second: string) => { const values = [luminance(first), luminance(second)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
describe('Complete document palettes', () => {
  it('replaces all six colours and portrait accents without changing composition or data', () => {
    for (const palette of colorPalettes) {
      const changed = applyColorPalette(defaultTheme, palette);
      expect(changed.colors).toEqual(palette.colors);
      expect(changed.photo).toEqual({ ...defaultTheme.photo, borderColor: 'accent' });
      expect(Object.keys(changed)).toEqual(['colors', 'photo']);
    }
  });
  it('keeps text and accents readable on the page and light columns', () => {
    for (const { id, colors } of colorPalettes) {
      for (const color of [colors.text, colors.muted, colors.accent]) expect(contrast(color, colors.background), id).toBeGreaterThanOrEqual(4.5);
      if (luminance(colors.sidebar) > .5) for (const color of [colors.text, colors.muted, colors.accent]) expect(contrast(color, colors.sidebar), id).toBeGreaterThanOrEqual(4.5);
      else expect(contrast('#ffffff', colors.sidebar), id).toBeGreaterThanOrEqual(4.5);
    }
  });
});
