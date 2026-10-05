import type { ResumeTemplate, TemplateCategory } from '../types/resume';

export const templateCategories: { id: TemplateCategory; label: string; description: string }[] = [
  { id: 'signature', label: 'Wyróżnione', description: 'Nasze typy: kolumny od krawędzi do krawędzi, nagłówki hero i redakcyjne siatki.' },
  { id: 'minimal', label: 'Minimalistyczne', description: 'Prosta forma i dużo światła.' },
  { id: 'classic', label: 'Klasyczne', description: 'Ponadczasowe kroje i spokojne kompozycje.' },
  { id: 'business', label: 'Biznesowe', description: 'Wyrazisty profil i uporządkowane doświadczenie.' },
  { id: 'creative', label: 'Kreatywne', description: 'Kolor, karty i geometryczne akcenty.' },
  { id: 'editorial', label: 'Eleganckie', description: 'Szeryfowa typografia i redakcyjny rytm.' },
  { id: 'technical', label: 'Techniczne', description: 'Siatki, tabele i czytelne daty.' },
  { id: 'artistic', label: 'Artystyczne', description: 'Odręczne litery i dekoracyjne detale.' },
];
export function categoriesFor(template: ResumeTemplate): TemplateCategory[] {
  return template.categories?.length ? template.categories : template.builtIn ? ['classic'] : ['personal'];
}
