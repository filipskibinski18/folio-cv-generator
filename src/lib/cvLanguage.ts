import type { ResumeTheme, SectionId } from '../types/resume';
import { sectionLabels } from '../types/resume';
export const englishSectionLabels: Record<SectionId, string> = { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certificates: 'Certifications', languages: 'Languages', links: 'Links & profiles', interests: 'Interests', consent: 'Data processing consent' };
export function withCvLanguage(theme: ResumeTheme, language: 'pl' | 'en'): ResumeTheme {
  return { ...theme, language, sections: theme.sections.map(section => ({ ...section, title: [sectionLabels[section.id], englishSectionLabels[section.id]].includes(section.title) ? (language === 'en' ? englishSectionLabels : sectionLabels)[section.id] : section.title })) };
}
