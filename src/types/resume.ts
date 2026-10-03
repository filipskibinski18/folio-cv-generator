import { z } from 'zod';

const text = z.string().max(20000);
const short = z.string().max(300);
const id = z.string().min(1).max(100);
// Only self-contained raster images are persisted or imported; no remote URLs/SVG.
export const photoDataSchema = z.string().max(800000).refine(value => value === '' || /^data:image\/(?:jpeg;base64,\/9j\/[A-Za-z0-9+/]*|png;base64,iVBORw0KGgo[A-Za-z0-9+/]*)={0,2}$/.test(value), 'Zdjęcie musi być lokalnym obrazem JPEG lub PNG.').default('');
export const sectionIds = ['summary', 'experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links', 'consent'] as const;
export type SectionId = (typeof sectionIds)[number];
export const sectionLabels: Record<SectionId, string> = {
  summary: 'O mnie', experience: 'Doświadczenie', education: 'Edukacja', skills: 'Umiejętności',
  projects: 'Projekty', certificates: 'Certyfikaty', languages: 'Języki', links: 'Linki i profile', consent: 'Klauzula RODO',
};
export interface Bullet { id: string; text: string; children: Bullet[] }
const bulletSchema = (depth: number): z.ZodType<Bullet> => z.object({
  id, text,
  children: depth < 3 ? z.array(z.lazy(() => bulletSchema(depth + 1))).max(100) : z.array(z.never()).max(0),
});
export const experienceSchema = z.object({ id, company: short, role: short, location: short, startDate: short, endDate: short, current: z.boolean(), description: text, bullets: z.array(bulletSchema(0)).max(100) });
export const educationSchema = z.object({ id, institution: short, degree: short, field: short, startDate: short, endDate: short, description: text });
export const skillSchema = z.object({ id, name: short, level: z.number().int().min(0).max(5).optional() });
export const skillCategorySchema = z.object({ id, name: short, skills: z.array(skillSchema).max(100) });
export const projectSchema = z.object({ id, name: short, role: short, url: short, description: text, technologies: z.array(short).max(100), bullets: z.array(bulletSchema(0)).max(100) });
export const certificateSchema = z.object({ id, name: short, issuer: short, date: short, url: short });
export const languageSchema = z.object({ id, name: short, level: short });
export const linkSchema = z.object({ id, label: short, url: short });
export const resumeDataSchema = z.object({
  personal: z.object({ firstName: short, lastName: short, title: short, email: short, phone: short, location: short, website: short, photo: photoDataSchema }),
  summary: text,
  experience: z.array(experienceSchema).max(200), education: z.array(educationSchema).max(200),
  skills: z.array(skillCategorySchema).max(100), projects: z.array(projectSchema).max(200),
  certificates: z.array(certificateSchema).max(200), languages: z.array(languageSchema).max(100),
  links: z.array(linkSchema).max(100), consent: text,
}).superRefine((data, context) => {
  const seen = new Set<string>();
  const check = (item: { id: string }, path: (string | number)[]) => {
    if (seen.has(item.id)) context.addIssue({ code: 'custom', message: 'Identyfikatory wpisów muszą być unikalne.', path });
    seen.add(item.id);
  };
  const bullets = (items: Bullet[], path: (string | number)[]) => items.forEach((item, index) => { check(item, [...path, index, 'id']); bullets(item.children, [...path, index, 'children']); });
  for (const key of ['experience', 'education', 'skills', 'projects', 'certificates', 'languages', 'links'] as const) {
    data[key].forEach((item, index) => {
      check(item, [key, index, 'id']);
      if ('bullets' in item) bullets(item.bullets, [key, index, 'bullets']);
      if ('skills' in item) item.skills.forEach((skill, skillIndex) => check(skill, [key, index, 'skills', skillIndex, 'id']));
    });
  }
});
export type ResumeData = z.infer<typeof resumeDataSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type Project = z.infer<typeof projectSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Language = z.infer<typeof languageSchema>;
export type ResumeLink = z.infer<typeof linkSchema>;

export const fontNames = ['Inter', 'Lora', 'Roboto', 'Montserrat', 'PlayfairDisplay', 'SourceSans3', 'Oswald', 'CormorantGaramond', 'Caveat'] as const;
export type FontName = (typeof fontNames)[number];
export const layoutNames = ['single', 'sidebar-left', 'sidebar-right', 'grid'] as const;
export type LayoutName = (typeof layoutNames)[number];
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Wymagany kolor HEX, np. #25564a.');
export const resumeThemeSchema = z.object({
  language: z.enum(['pl', 'en']).default('pl'),
  keepSectionsTogether: z.boolean().default(true),
  design: z.object({
    entryStyle: z.enum(['plain', 'timeline', 'table', 'cards']),
    decoration: z.enum(['none', 'rule', 'corner', 'frame', 'orbit', 'dots']),
    nameStyle: z.enum(['natural', 'uppercase', 'stacked']),
    contactPlacement: z.enum(['header', 'sidebar']),
    contactIcons: z.boolean(),
    skillMeter: z.enum(['numbers', 'dots', 'bars']),
    sidebarPadding: z.number().min(8).max(24),
    continuationGap: z.number().min(18).max(40),
  }).default({ entryStyle: 'plain', decoration: 'none', nameStyle: 'natural', contactPlacement: 'header', contactIcons: false, skillMeter: 'numbers', sidebarPadding: 12, continuationGap: 24 }),
  icons: z.object({ style: z.enum(['none', 'outline', 'circle', 'square']), size: z.number().min(10).max(22) }).default({ style: 'none', size: 14 }),
  headerStyle: z.enum(['accent', 'banner', 'centered']).default('accent'),
  sectionStyle: z.enum(['underline', 'filled', 'plain']).default('underline'),
  photo: z.object({
    isVisible: z.boolean(),
    shape: z.enum(['circle', 'rounded', 'portrait-rounded', 'portrait', 'square']).default('circle'),
    size: z.number().min(16).max(70),
    position: z.enum(['sidebar', 'left', 'right', 'center', 'top-left']).default('right'),
    borderWidth: z.number().min(0).max(6).optional(),
    borderColor: z.union([z.enum(['auto', 'accent', 'white', 'separator', 'none']), color]).optional(),
  }).default({ isVisible: true, shape: 'circle', size: 26, position: 'right' }),
  typography: z.object({ fontFamily: z.enum(fontNames), headingFont: z.enum(fontNames), baseSize: z.number().min(8).max(14), headingSize: z.number().min(10).max(20), nameSize: z.number().min(20).max(44), lineHeight: z.number().min(1.1).max(1.9), tracking: z.number().min(-0.2).max(2) }),
  colors: z.object({ accent: color, background: color, text: color, muted: color, separator: color, sidebar: color }),
  geometry: z.object({ margins: z.object({ top: z.number().min(8).max(30), right: z.number().min(8).max(30), bottom: z.number().min(8).max(30), left: z.number().min(8).max(30) }), sectionPadding: z.number().min(0).max(12), sectionGap: z.number().min(6).max(28), blockGap: z.number().min(3).max(18), radius: z.number().min(0).max(12), lineWidth: z.number().min(0).max(3), columnGap: z.number().min(8).max(30) }),
  layout: z.enum(layoutNames), sidebarWidth: z.number().min(25).max(45),
  skillStyle: z.enum(['text', 'tags', 'levels']),
  sections: z.array(z.object({ id: z.enum(sectionIds), title: short, icon: z.enum(['auto', 'none', 'user', 'briefcase', 'book', 'code', 'award', 'globe', 'link', 'shield']).default('auto'), isVisible: z.boolean(), column: z.enum(['main', 'sidebar']) })).length(sectionIds.length).refine(items => new Set(items.map(item => item.id)).size === sectionIds.length, 'Sekcje muszą mieć unikalne identyfikatory.'),
});
export type ResumeTheme = z.infer<typeof resumeThemeSchema>;
export const templateCategoryIds = ['minimal', 'classic', 'business', 'creative', 'editorial', 'technical', 'artistic', 'personal'] as const;
export type TemplateCategory = typeof templateCategoryIds[number];
export interface ResumeTemplate { id: string; name: string; description: string; theme: ResumeTheme; categories?: TemplateCategory[]; createdAt: string; updatedAt: string; builtIn: boolean }
export const templateSchema = z.object({ id, name: z.string().min(1).max(80), description: short, theme: resumeThemeSchema, categories: z.array(z.enum(templateCategoryIds)).max(8).optional(), createdAt: z.string(), updatedAt: z.string(), builtIn: z.boolean() });
export const projectFileSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('folio-resume'), version: z.literal(1), name: short, data: resumeDataSchema, theme: resumeThemeSchema }),
  z.object({ kind: z.literal('folio-template'), version: z.literal(1), template: templateSchema }),
]);
export type ProjectFile = z.infer<typeof projectFileSchema>;
