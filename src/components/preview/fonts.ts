import { Font } from '@react-pdf/renderer';

const source = (url: string) => new URL(`${import.meta.env.BASE_URL}${url}`, globalThis.location.origin).href;
export function registerFonts() {
  for (const [family, normal, bold] of [['Inter', 'fonts/Inter-400.ttf', 'fonts/Inter-700.ttf'], ['Lora', 'fonts/Lora-400.ttf', 'fonts/Lora-700.ttf'], ['Roboto', 'fonts/Roboto-400.ttf', 'fonts/Roboto-700.ttf']]) {
    Font.register({ family, fonts: [{ src: source(normal), fontWeight: 400 }, { src: source(bold), fontWeight: 700 }] });
  }
  Font.registerHyphenationCallback(word => [word]);
}
