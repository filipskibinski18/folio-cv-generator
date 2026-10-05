import { fontNames } from '../../types/resume';
import { Font } from '@react-pdf/renderer';
import { breakLongWord } from '../../lib/format';

const source = (url: string) => new URL(`${import.meta.env.BASE_URL}${url}`, globalThis.location.origin).href;
export function registerFonts() {
  for (const family of fontNames) {
    const normal = `fonts/${family}-400.ttf`; const bold = `fonts/${family}-700.ttf`;
    Font.register({ family, fonts: [{ src: source(normal), fontWeight: 400 }, { src: source(bold), fontWeight: 700 }] });
  }
  Font.registerHyphenationCallback(breakLongWord);
}
