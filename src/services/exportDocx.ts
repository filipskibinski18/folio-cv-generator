import { AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, ImageRun, LevelFormat, Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, WidthType } from 'docx';
import { Buffer } from 'buffer';
import type { Bullet, ResumeData, ResumeTheme, SectionId } from '../types/resume';
import { dateRange, documentFilename, downloadBlob, fullName, inlineRuns, mmToTwip, safeUrl, urlLabel } from '../lib/format';
import { contrastColor, photoForDocx } from '../lib/photo';
import { sectionIconSvg } from '../lib/sectionIcons';

type EmbeddedFonts = NonNullable<ConstructorParameters<typeof Document>[0]['fonts']>;
export function createDocxDocument(data: ResumeData, theme: ResumeTheme, ats = false, fonts: EmbeddedFonts = [], portrait?: Uint8Array, icons: Partial<Record<SectionId, Uint8Array>> = {}): Document {
  const { typography: t, geometry: g, design: d } = theme;
  const c = ats ? { ...theme.colors, background: '#ffffff', sidebar: '#ffffff', text: '#182322', muted: '#475569', accent: '#182322' } : theme.colors;
  let sideContext = false;
  let keepSection = false;
  const darkSide = contrastColor(c.sidebar) === '#ffffff';
  const textColor = (muted = false) => sideContext && darkSide ? (muted ? '#cbd5e1' : '#ffffff') : muted ? c.muted : c.text;
  const accentColor = () => sideContext && darkSide ? '#ffffff' : c.accent;
  const hex = (color: string) => color.slice(1);
  const size = t.baseSize * 2;
  const rich = (text: string, props: { bold?: boolean; color?: string; size?: number; font?: string } = {}) => inlineRuns(text).flatMap(part => part.text.split('\n').map((line, index) => new TextRun({ text: line, break: index > 0 ? 1 : undefined, font: t.fontFamily, size, color: hex(textColor()), ...props, bold: props.bold || part.bold, characterSpacing: Math.round(t.tracking * 20) })));
  const paragraph = (text: string, muted = false) => new Paragraph({ children: rich(text, { color: hex(textColor(muted)) }), indent: { left: g.sectionPadding * 20, right: g.sectionPadding * 20 }, spacing: { after: 70, line: Math.round(t.lineHeight * 240) }, widowControl: true, keepNext: keepSection });
  const title = (value: string) => new Paragraph({ children: rich(value, { bold: true, size: size + 1 }), keepNext: true, spacing: { before: 50, after: 50 } });
  const meta = (value: string) => new Paragraph({ children: rich(value, { color: hex(textColor(true)), size: size - 2 }), keepNext: keepSection, spacing: { after: Math.round(g.blockGap * 10) } });
  const hyperlink = (label: string, url: string) => new Paragraph({ children: safeUrl(url) ? [new ExternalHyperlink({ link: safeUrl(url)!, children: rich(label, { color: hex(accentColor()) }) })] : rich(label), spacing: { after: 80 }, widowControl: true, keepNext: keepSection });
  const bulletParagraphs = (items: Bullet[], depth = 0): Paragraph[] => items.flatMap(item => [
    new Paragraph({ children: rich(item.text), numbering: { reference: 'resume-bullets', level: depth }, spacing: { after: 60, line: Math.round(t.lineHeight * 240) }, widowControl: true, keepNext: keepSection }),
    ...bulletParagraphs(item.children, depth + 1),
  ]);
  const heading = (section: ResumeTheme['sections'][number]) => new Paragraph({ children: [
    ...(!ats && icons[section.id] ? [new ImageRun({ type: 'png', data: Buffer.from(icons[section.id]!), transformation: { width: theme.icons.size * 96 / 72, height: theme.icons.size * 96 / 72 } }), new TextRun('  ')] : []),
    new TextRun({ text: section.title.toLocaleUpperCase(theme.language), font: t.headingFont, bold: true, color: hex(accentColor()), size: t.headingSize * 2 }),
  ], heading: HeadingLevel.HEADING_1, keepNext: true,
    spacing: { before: Math.round(g.sectionGap * 20), after: 130 },
    border: theme.sectionStyle === 'rail' ? { left: { color: hex(accentColor()), style: BorderStyle.SINGLE, size: 12, space: 6 } } : theme.sectionStyle === 'underline' && g.lineWidth ? { bottom: { color: hex(c.separator), style: BorderStyle.SINGLE, size: Math.max(1, Math.round(g.lineWidth * 8)), space: 4 } } : undefined,
    shading: ['filled', 'capsule'].includes(theme.sectionStyle) && !ats ? { fill: hex(c.sidebar), type: ShadingType.CLEAR } : undefined,
  });
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const tableBorders = { top: noBorder, left: noBorder, bottom: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder };
  const entryBlock = (children: Paragraph[]): (Paragraph | Table)[] => {
    if (ats || !['timeline', 'cards'].includes(d.entryStyle)) return children;
    return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { ...tableBorders, left: { style: BorderStyle.SINGLE, size: d.entryStyle === 'cards' ? 18 : 8, color: hex(accentColor()) } },
      rows: [new TableRow({ children: [new TableCell({ children, margins: { left: 180, right: 100, top: d.entryStyle === 'cards' ? 150 : 0, bottom: 100 }, shading: d.entryStyle === 'cards' ? { fill: hex(darkSide ? sideContext ? c.sidebar : c.background : c.sidebar), type: ShadingType.CLEAR } : undefined })] })] }), new Paragraph({ keepNext: keepSection, spacing: { after: g.blockGap * 20, line: 20 } })];
  };
  const dateTable = (date: string, children: Paragraph[]): Table => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: tableBorders,
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ children: [meta(date)], width: { size: 27, type: WidthType.PERCENTAGE }, margins: { top: 0, bottom: 0, left: 0, right: 180 } }), new TableCell({ children, width: { size: 73, type: WidthType.PERCENTAGE }, margins: { top: 0, bottom: 0, left: 0, right: 0 } })] })] });
  const sectionBody = (id: SectionId): (Paragraph | Table)[] => {
    switch (id) {
      case 'summary': return [paragraph(data.summary)];
      case 'experience': return data.experience.flatMap(item => {
        const identity = [title(item.role), new Paragraph({ children: rich(item.company, { bold: true, color: hex(accentColor()) }), keepNext: true })];
        const details = [...(item.description ? [paragraph(item.description)] : []), ...bulletParagraphs(item.bullets)];
        return !ats && d.entryStyle === 'table' ? [dateTable(dateRange(item.startDate, item.endDate, item.current, theme.language), [...identity, ...(item.location ? [meta(item.location)] : [])]), ...details] : entryBlock([...identity, meta([dateRange(item.startDate, item.endDate, item.current, theme.language), item.location].filter(Boolean).join(' · ')), ...details]);
      });
      case 'education': return data.education.flatMap(item => {
        const identity = [title(item.institution), paragraph([item.degree, item.field].filter(Boolean).join(' · '))];
        const details = item.description ? [paragraph(item.description, true)] : [];
        return !ats && d.entryStyle === 'table' ? [dateTable(dateRange(item.startDate, item.endDate, false, theme.language), identity), ...details] : entryBlock([...identity, meta(dateRange(item.startDate, item.endDate, false, theme.language)), ...details]);
      });
      case 'skills': return data.skills.flatMap(category => [title(category.name), ...(theme.skillStyle === 'tags' && !ats ? [new Paragraph({ children: category.skills.flatMap(skill => [new TextRun({ text: ` ${skill.name} `, font: t.fontFamily, size, color: hex(textColor()), shading: { fill: hex(c.sidebar), type: ShadingType.CLEAR } }), new TextRun('  ')]), spacing: { after: Math.round(g.blockGap * 20) }, widowControl: true, keepNext: keepSection })] : category.skills.map(skill => paragraph(`${skill.name}${theme.skillStyle === 'levels' && skill.level ? ` — ${!ats && d.skillMeter !== 'numbers' ? '●'.repeat(skill.level) + '○'.repeat(5 - skill.level) : `${skill.level}/5`}` : ''}`)))]);
      case 'projects': return data.projects.flatMap(item => entryBlock([title(item.name), ...(item.role ? [meta(item.role)] : []), paragraph(item.description), ...bulletParagraphs(item.bullets), ...(item.technologies.length ? [meta(item.technologies.join(' · '))] : []), ...(item.url ? [hyperlink(urlLabel(item.url), item.url)] : [])]));
      case 'certificates': return data.certificates.flatMap(item => entryBlock([title(item.name), meta([item.issuer, item.date].filter(Boolean).join(' · ')), ...(item.url ? [hyperlink(urlLabel(item.url), item.url)] : [])]));
      case 'languages': return data.languages.flatMap(item => entryBlock([title(item.name), paragraph(item.level, true)]));
      case 'links': return data.links.flatMap(item => [hyperlink(item.label || urlLabel(item.url), item.url), meta(urlLabel(item.url))]);
      case 'consent': return [new Paragraph({ children: rich(data.consent, { size: Math.max(14, size - 4), color: hex(c.muted) }), spacing: { before: 220 }, widowControl: true, keepNext: keepSection })];
    }
  };
  const visible = theme.sections.filter(section => section.isVisible && (typeof data[section.id] === 'string' ? Boolean((data[section.id] as string).trim()) : (data[section.id] as unknown[]).length > 0));
  const tail = visible.at(-1);
  const footer = !ats && theme.layout !== 'single' && tail?.id === 'consent' && tail.column === 'main' ? tail : undefined;
  const sections = visible.filter(section => section !== footer);
  const render = (section: ResumeTheme['sections'][number], isSide = false) => {
    sideContext = isSide; keepSection = theme.keepSectionsTogether;
    const children = section.id === 'consent' ? sectionBody(section.id) : [heading(section), ...sectionBody(section.id)];
    keepSection = false;
    // Word's native paragraph chain works inside column cells too. Word can
    // still paginate chains longer than a full page instead of clipping them.
    if (theme.keepSectionsTogether) children.push(new Paragraph({ children: [new TextRun({ text: '', size: 2 })], keepNext: false, spacing: { before: 0, after: 0, line: 1 } }));
    return children;
  };
  const banner = !ats && theme.headerStyle === 'banner';
  const headerColor = banner ? contrastColor(c.accent) : c.text;
  const alignment = theme.headerStyle === 'centered' && !ats ? AlignmentType.CENTER : AlignmentType.LEFT;
  const header = [
    new Paragraph({ children: rich(!ats && d.nameStyle === 'uppercase' ? fullName(data, theme.language).toLocaleUpperCase(theme.language) : !ats && d.nameStyle === 'stacked' ? [data.personal.firstName, data.personal.lastName].filter(Boolean).join('\n') || fullName(data, theme.language) : fullName(data, theme.language), { size: t.nameSize * 2, bold: true, font: t.headingFont, color: hex(headerColor) }), alignment, spacing: { after: 110 }, keepNext: true }),
    new Paragraph({ children: rich(data.personal.title, { size: size + 6, color: hex(banner ? headerColor : c.accent) }), alignment, spacing: { after: 140 }, keepNext: true }),
    ...(!ats && theme.layout !== 'single' && d.contactPlacement === 'sidebar' ? [] : [new Paragraph({ children: rich([data.personal.location, data.personal.email, data.personal.phone, data.personal.website].filter(Boolean).join(' · '), { size: size - 2, color: hex(banner ? headerColor : c.muted) }), alignment, spacing: { after: 100 } })]),
  ];
  const pageWidth = mmToTwip(210 - g.margins.left - g.margins.right);
  const showPhoto = theme.photo.isVisible && !ats;
  const content: (Paragraph | Table)[] = [];
  if (showPhoto || banner) {
    const photoWidth = mmToTwip(theme.photo.size);
    const imagePixels = theme.photo.size * 96 / 25.4;
    const isPortrait = theme.photo.shape === 'portrait' || theme.photo.shape === 'portrait-rounded';
    const heightPixels = isPortrait ? Math.round(imagePixels * 1.3) : imagePixels;
    const identity = new TableCell({ children: header, width: { size: pageWidth - (showPhoto ? photoWidth : 0), type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: banner ? { fill: hex(c.accent), type: ShadingType.CLEAR } : undefined, margins: { top: banner ? 180 : 0, bottom: banner ? 180 : 0, left: 180, right: 180 } });
    const picture = data.personal.photo ? new Paragraph({ children: [new ImageRun({ type: portrait || data.personal.photo.startsWith('data:image/png') ? 'png' : 'jpg', data: portrait ? Buffer.from(portrait) : Buffer.from(data.personal.photo.split(',')[1], 'base64'), transformation: { width: imagePixels, height: heightPixels }, altText: { name: 'Zdjęcie profilowe', title: fullName(data, theme.language), description: `Zdjęcie profilowe — ${fullName(data, theme.language)}` } })], alignment: AlignmentType.CENTER, spacing: { after: 0, before: 0 } }) : new Paragraph({ children: [new TextRun({ text: theme.language === 'en' ? 'PHOTO' : 'MIEJSCE NA ZDJĘCIE', font: t.fontFamily, size: 13, color: hex(accentColor()) })], alignment: AlignmentType.CENTER, spacing: { before: Math.max(0, photoWidth / 2 - 150), after: Math.max(0, photoWidth / 2 - 150) } });
    const imageCell = new TableCell({ children: [picture], width: { size: photoWidth, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, shading: { fill: hex(data.personal.photo && banner ? c.accent : c.sidebar), type: ShadingType.CLEAR }, margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const isLeft = theme.photo.position === 'left' || theme.photo.position === 'sidebar' || theme.photo.position === 'top-left';
    const cells = !showPhoto ? [identity] : isLeft ? [imageCell, identity] : [identity, imageCell];
    const columnWidths = !showPhoto ? [pageWidth] : isLeft ? [photoWidth, pageWidth - photoWidth] : [pageWidth - photoWidth, photoWidth];
    content.push(new Table({ width: { size: pageWidth, type: WidthType.DXA }, layout: TableLayoutType.FIXED, columnWidths, borders: tableBorders, rows: [new TableRow({ children: cells, cantSplit: true })] }), new Paragraph({ spacing: { after: 100, before: 0, line: 100 } }));
  } else content.push(...header);
  if (ats || theme.layout === 'single') content.push(...sections.flatMap(section => render(section)));
  else {
    const ratio = (theme.layout === 'grid' ? 47 : theme.sidebarWidth) / 100;
    sideContext = true;
    const sideContact = d.contactPlacement === 'sidebar' ? [title(theme.language === 'en' ? 'CONTACT' : 'KONTAKT'), ...[data.personal.location, data.personal.email, data.personal.phone, data.personal.website].filter(Boolean).map(value => paragraph(value))] : [];
    const side = [...sideContact, ...sections.filter(s => s.column === 'sidebar').flatMap(section => render(section, true))];
    const main = sections.filter(s => s.column === 'main').flatMap(section => render(section));
    const cell = (children: (Paragraph | Table)[], isSide: boolean) => new TableCell({
      children: children.length ? children : [new Paragraph('')], width: { size: Math.round(pageWidth * (isSide ? ratio : 1 - ratio)), type: WidthType.DXA }, verticalAlign: VerticalAlign.TOP,
      shading: isSide ? { fill: hex(c.sidebar), type: ShadingType.CLEAR } : undefined,
      margins: { top: d.sidebarPadding * 20, bottom: d.sidebarPadding * 20, left: Math.round((isSide ? d.sidebarPadding * 2 : g.columnGap) * 10), right: Math.round((isSide ? d.sidebarPadding * 2 : g.columnGap) * 10) },
    });
    const sideCell = cell(side, true); const mainCell = cell(main, false);
    const cells = theme.layout === 'sidebar-right' ? [mainCell, sideCell] : [sideCell, mainCell];
    content.push(new Table({ width: { size: pageWidth, type: WidthType.DXA }, layout: TableLayoutType.FIXED,
      columnWidths: theme.layout === 'sidebar-right' ? [Math.round(pageWidth * (1 - ratio)), Math.round(pageWidth * ratio)] : [Math.round(pageWidth * ratio), Math.round(pageWidth * (1 - ratio))],
      borders: tableBorders,
      rows: [new TableRow({ children: cells, cantSplit: false })],
    }));
  }
  sideContext = false;
  if (footer) content.push(...sectionBody('consent'));
  return new Document({ creator: 'Folio Resume Studio', title: `${fullName(data, theme.language)} — CV`, description: 'Edytowalne curriculum vitae', fonts,
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
  const portrait = !ats && theme.photo.isVisible && data.personal.photo ? await photoForDocx(data.personal.photo, theme.photo.shape) : undefined;
  const icons: Partial<Record<SectionId, Uint8Array>> = {};
  if (!ats) await Promise.all(theme.sections.map(async section => {
    const svg = sectionIconSvg(section, theme); if (!svg) return;
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 96;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Nie można przygotować ikonek.');
    context.drawImage(image, 0, 0, 96, 96);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Nie można przygotować ikonek.')), 'image/png'));
    icons[section.id] = new Uint8Array(await blob.arrayBuffer());
  }));
  const blob = await Packer.toBlob(createDocxDocument(data, theme, ats, fonts, portrait, icons));
  downloadBlob(blob, documentFilename(data, ats ? 'ATS.docx' : 'docx'));
}
