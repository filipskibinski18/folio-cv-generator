import type { SectionId, ResumeTheme } from '../types/resume';
export const iconPaths = {
  user: 'M20 21v-2a7 7 0 0 0-14 0v2 M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
  briefcase: 'M3 7h18v14H3z M8 7V3h8v4 M3 12h18 M10 12v3h4v-3',
  book: 'M2 4h7l3 2l3-2h7v16h-7l-3 2l-3-2H2z M12 6v16',
  code: 'M8 5L2 12l6 7 M16 5l6 7l-6 7 M14 3l-4 18',
  award: 'M12 2a6 6 0 1 0 0 12a6 6 0 1 0 0-12 M8 13l-2 9l6-3l6 3l-2-9',
  globe: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20 M2 12h20 M12 2c-6 5-6 15 0 20c6-5 6-15 0-20',
  link: 'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-3 3 M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l3-3',
  shield: 'M12 2L3 6v6c0 5 9 10 9 10s9-5 9-10V6z M8 12l3 3l5-6',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8a4.5 4.5 0 0 1 8 2.8c0 6-8 11-8 11z',
};
const defaults: Record<SectionId, keyof typeof iconPaths> = { summary: 'user', experience: 'briefcase', education: 'book', skills: 'code', projects: 'code', certificates: 'award', languages: 'globe', links: 'link', interests: 'heart', consent: 'shield' };
export function sectionIconPath(section: ResumeTheme['sections'][number]) { return section.icon === 'none' ? undefined : iconPaths[section.icon === 'auto' ? defaults[section.id] : section.icon]; }
export function sectionIconSvg(section: ResumeTheme['sections'][number], theme: ResumeTheme) {
  const path = sectionIconPath(section); if (!path || theme.icons.style === 'none') return '';
  const badge = ['circle', 'square'].includes(theme.icons.style);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${badge ? `<rect width="32" height="32" rx="${theme.icons.style === 'circle' ? 16 : 2}" fill="${theme.colors.accent}"/>` : ''}<path transform="translate(5 5) scale(.92)" d="${path}" fill="none" stroke="${badge ? '#ffffff' : theme.colors.accent}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
