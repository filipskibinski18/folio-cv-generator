import type { ResumeTemplate, TemplateCategory } from '../types/resume';

export const templateCategories: { id: TemplateCategory; label: string; description: string }[] = [
  { id: 'minimal', label: 'Minimalistyczne', description: 'Prosta forma i dużo światła.' },
  { id: 'classic', label: 'Klasyczne', description: 'Ponadczasowe kroje i spokojne kompozycje.' },
  { id: 'business', label: 'Biznesowe', description: 'Wyrazisty profil i uporządkowane doświadczenie.' },
  { id: 'creative', label: 'Kreatywne', description: 'Kolor, karty i geometryczne akcenty.' },
  { id: 'editorial', label: 'Eleganckie', description: 'Szeryfowa typografia i redakcyjny rytm.' },
  { id: 'technical', label: 'Techniczne', description: 'Siatki, tabele i czytelne daty.' },
  { id: 'artistic', label: 'Artystyczne', description: 'Odręczne litery i dekoracyjne detale.' },
];
const legacy: Record<string, TemplateCategory[]> = {
  modern: ['business'], executive: ['classic', 'editorial'], creative: ['business', 'creative'], 'warm-sand': ['classic', 'editorial'],
  emerald: ['business'], nordic: ['business'], minimalist: ['minimal'], bordeaux: ['editorial', 'classic'],
  'classic-swiss': ['classic', 'minimal'], blueprint: ['technical', 'business'], atelier: ['creative'], midnight: ['creative'],
  editorial: ['editorial'], azure: ['business'], sage: ['classic'], cobalt: ['creative'], rose: ['editorial', 'creative'],
  copper: ['editorial'], graphite: ['technical'], violet: ['creative'], ivory: ['editorial', 'classic'], teal: ['technical'],
  mono: ['minimal'], ochre: ['artistic', 'creative'],
};
export function categoriesFor(template: ResumeTemplate): TemplateCategory[] {
  return template.categories?.length ? template.categories : template.builtIn ? legacy[template.id] ?? ['classic'] : ['personal'];
}
