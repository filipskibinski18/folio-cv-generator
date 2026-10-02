import { AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, LevelFormat, Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, WidthType } from 'docx';
import { Buffer } from 'buffer';
import type { Bullet, ResumeData, ResumeTheme, SectionId } from '../types/resume';
import { dateRange, documentFilename, downloadBlob, fullName, inlineRuns, mmToTwip, safeUrl, urlLabel } from '../lib/format';

type EmbeddedFonts = NonNullable<ConstructorParameters<typeof Document>[0]['fonts']>;
export function createDocxDocument(data: ResumeData, theme: ResumeTheme, ats = false, fonts: EmbeddedFonts = []): Document {
  const { typography: t, colors: c, geometry: g } = theme;
  const hex = (color: string) => color.slice(1);
  const size = t.baseSize * 2;
  const rich = (text: string, props: { bold?: boolean; color?: string; size?: number; font?: string } = {}) => inlineRuns(text).map(part => new TextRun({ text: part.text, font: t.fontFamily, size, color: hex(c.text), ...props, bold: props.bold || part.bold, characterSpacing: Math.round(t.tracking * 20) }));
  const paragraph = (text: string, muted = false) => new Paragraph({ children: rich(text, { color: hex(muted ? c.muted : c.text) }), indent: { left: g.sectionPadding * 20, right: g.sectionPadding * 20 }, spacing: { after: 70, line: Math.round(t.lineHeight * 240) }, widowControl: true });
  const title = (value: string) => new Paragraph({ children: rich(value, { bold: true, size: size + 1 }), keepNext: true, spacing: { before: 50, after: 50 } });
  const meta = (value: string) => new Paragraph({ children: rich(value, { color: hex(c.muted), size: size - 2 }), spacing: { after: Math.round(g.blockGap * 10) } });
  const hyperlink = (label: string, url: string) => new Paragraph({ children: safeUrl(url) ? [new ExternalHyperlink({ link: safeUrl(url)!, children: rich(label, { color: hex(c.accent) }) })] : rich(label), spacing: { after: 80 }, widowControl: true });
  const bulletParagraphs = (items: Bullet[], depth = 0): Paragraph[] => items.flatMap(item => [
    new Paragraph({ children: rich(item.text), numbering: { reference: 'resume-bullets', level: depth }, spacing: { after: 60, line: Math.round(t.lineHeight * 240) }, widowControl: true }),
    ...bulletParagraphs(item.children, depth + 1),
  ]);
  const heading = (value: string) => new Paragraph({ text: value.toLocaleUpperCase('pl'), heading: HeadingLevel.HEADING_1, keepNext: true,
    spacing: { before: Math.round(g.sectionGap * 20), after: 130 },
    border: g.lineWidth ? { bottom: { color: hex(c.separator), style: BorderStyle.SINGLE, size: Math.max(1, Math.round(g.lineWidth * 8)), space: 4 } } : undefined,
  });
  const sectionBody = (id: SectionId): Paragraph[] => {
    switch (id) {
      case 'summary': return [paragraph(data.summary)];
      case 'experience': return data.experience.flatMap(item => [title(item.role), new Paragraph({ children: rich(item.company, { bold: true, color: hex(c.accent) }), keepNext: true }), meta([dateRange(item.startDate, item.endDate, item.current), item.location].filter(Boolean).join(' · ')), ...(item.description ? [paragraph(item.description)] : []), ...bulletParagraphs(item.bullets)]);
      case 'education': return data.education.flatMap(item => [title(item.institution), paragraph([item.degree, item.field].filter(Boolean).join(' · ')), meta(dateRange(item.startDate, item.endDate)), ...(item.description ? [paragraph(item.description, true)] : [])]);
      case 'skills': return data.skills.flatMap(category => [title(category.name), ...(theme.skillStyle === 'tags' && !ats ? [new Paragraph({ children: category.skills.flatMap(skill => [new TextRun({ text: ` ${skill.name} `, font: t.fontFamily, size, color: hex(c.text), shading: { fill: hex(c.sidebar), type: ShadingType.CLEAR } }), new TextRun('  ')]), spacing: { after: Math.round(g.blockGap * 20) }, widowControl: true })] : category.skills.map(skill => paragraph(`${skill.name}${theme.skillStyle === 'levels' && skill.level ? ` — ${skill.level}/5` : ''}`)))]);
      case 'projects': return data.projects.flatMap(item => [title(item.name), ...(item.role ? [meta(item.role)] : []), paragraph(item.description), ...bulletParagraphs(item.bullets), ...(item.technologies.length ? [meta(item.technologies.join(' · '))] : []), ...(item.url ? [hyperlink(urlLabel(item.url), item.url)] : [])]);
      case 'certificates': return data.certificates.flatMap(item => [title(item.name), meta([item.issuer, item.date].filter(Boolean).join(' · ')), ...(item.url ? [hyperlink(urlLabel(item.url), item.url)] : [])]);
      case 'languages': return data.languages.flatMap(item => [title(item.name), paragraph(item.level, true)]);
      case 'links': return data.links.flatMap(item => [hyperlink(item.label || urlLabel(item.url), item.url), meta(urlLabel(item.url))]);
      case 'consent': return [new Paragraph({ children: rich(data.consent, { size: Math.max(14, size - 4), color: hex(c.muted) }), spacing: { before: 220 }, widowControl: true })];
    }
  };
  const visible = theme.sections.filter(section => section.isVisible && (typeof data[section.id] === 'string' ? Boolean((data[section.id] as string).trim()) : (data[section.id] as unknown[]).length > 0));
  const tail = visible.at(-1);
  const footer = !ats && theme.layout !== 'single' && tail?.id === 'consent' && tail.column === 'main' ? tail : undefined;
  const sections = visible.filter(section => section !== footer);
  const render = (section: ResumeTheme['sections'][number]) => section.id === 'consent' ? sectionBody(section.id) : [heading(section.title), ...sectionBody(section.id)];
  const header = [
    new Paragraph({ children: rich(fullName(data), { size: t.nameSize * 2, bold: true, font: t.headingFont }), spacing: { after: 110 }, keepNext: true }),
    new Paragraph({ children: rich(data.personal.title, { size: size + 6, color: hex(c.accent) }), spacing: { after: 140 }, keepNext: true }),
    new Paragraph({ children: rich([data.personal.location, data.personal.email, data.personal.phone, data.personal.website].filter(Boolean).join(' · '), { size: size - 2, color: hex(c.muted) }), spacing: { after: 220 } }),
  ];
  const content: (Paragraph | Table)[] = [...header];
  if (ats || theme.layout === 'single') content.push(...sections.flatMap(render));
  else {
    const pageWidth = mmToTwip(210 - g.margins.left - g.margins.right);
    const ratio = (theme.layout === 'grid' ? 47 : theme.sidebarWidth) / 100;
    const side = sections.filter(s => s.column === 'sidebar').flatMap(render);
    const main = sections.filter(s => s.column === 'main').flatMap(render);
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    const cell = (children: Paragraph[], isSide: boolean) => new TableCell({
      children: children.length ? children : [new Paragraph('')], width: { size: Math.round(pageWidth * (isSide ? ratio : 1 - ratio)), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
      shading: isSide ? { fill: hex(c.sidebar), type: ShadingType.CLEAR } : undefined,
      margins: { top: 80, bottom: 80, left: Math.round(g.columnGap * 10), right: Math.round(g.columnGap * 10) },
    });
    const sideCell = cell(side, true); const mainCell = cell(main, false);
    const cells = theme.layout === 'sidebar-right' ? [mainCell, sideCell] : [sideCell, mainCell];
    content.push(new Table({ width: { size: pageWidth, type: WidthType.DXA }, layout: TableLayoutType.FIXED,
      columnWidths: theme.layout === 'sidebar-right' ? [Math.round(pageWidth * (1 - ratio)), Math.round(pageWidth * ratio)] : [Math.round(pageWidth * ratio), Math.round(pageWidth * (1 - ratio))],
      borders: { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({ children: cells, cantSplit: false })],
    }));
  }
  if (footer) content.push(...sectionBody('consent'));
  return new Document({ creator: 'Folio Resume Studio', title: `${fullName(data)} — CV`, description: 'Edytowalne curriculum vitae', fonts,
    background: { color: hex(c.background) },
    styles: { default: { document: { run: { font: t.fontFamily, size, color: hex(c.text) }, paragraph: { spacing: { line: Math.round(t.lineHeight * 240) } } }, heading1: { run: { font: t.headingFont, size: t.headingSize * 2, bold: true, color: hex(c.accent) }, paragraph: { keepNext: true } } } },
    numbering: { config: [{ reference: 'resume-bullets', levels: [0, 1, 2, 3].map(level => ({ level, format: LevelFormat.BULLET, text: level % 2 === 0 ? '•' : '◦', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 200 + level * 220, hanging: 160 } } } })) }] },
    sections: [{ properties: { page: { size: { width: mmToTwip(210), height: mmToTwip(297) }, margin: { top: mmToTwip(g.margins.top), right: mmToTwip(g.margins.right), bottom: mmToTwip(g.margins.bottom), left: mmToTwip(g.margins.left) } } }, children: content }],
  });
}
export async function exportDocx(data: ResumeData, theme: ResumeTheme, ats = false) {
  const families = [...new Set([theme.typography.fontFamily, theme.typography.headingFont])];
  const fonts = await Promise.all(families.map(async name => {
    const response = await fetch(`${import.meta.env.BASE_URL}fonts/${name}-400.ttf`);
    if (!response.ok) throw new Error(`Nie udało się załadować fontu ${name}. Odśwież aplikację i spróbuj ponownie.`);
    return { name, data: Buffer.from(await response.arrayBuffer()) };
  }));
  const blob = await Packer.toBlob(createDocxDocument(data, theme, ats, fonts));
  downloadBlob(blob, documentFilename(data, ats ? 'ATS.docx' : 'docx'));
}
