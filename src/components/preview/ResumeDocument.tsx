import { Document, Page, View, Text, Link, Image, Svg, Circle, Path, Rect } from '@react-pdf/renderer';
import { isValidElement, type ReactNode } from 'react';
import type { Bullet, ResumeData, ResumeTheme, SectionId } from '../../types/resume';
import { dateRange, fullName, inlineRuns, mmToPt, safeUrl, urlLabel } from '../../lib/format';
import { contrastColor, photoRadius } from '../../lib/photo';
import { sectionIconPath } from '../../lib/sectionIcons';
import { editTarget, type Continuation } from '../../lib/previewTargets';

interface Props { data: ResumeData; theme: ResumeTheme; onRender?: (result: unknown) => void; continuations?: Continuation[]; sidebarPages?: number[]; measureOnly?: boolean; sectionHeights?: Partial<Record<SectionId, number>> }
export function ResumeDocument({ data, theme: t, onRender, continuations = [], sidebarPages, measureOnly = false, sectionHeights = {} }: Props) {
  const { typography: type, colors: c, geometry: g } = t;
  const d = t.design;
  const displayName = d.nameStyle === 'stacked' ? [data.personal.firstName, data.personal.lastName].filter(Boolean).join('\n') || fullName(data, t.language) : d.nameStyle === 'uppercase' ? fullName(data, t.language).toLocaleUpperCase(t.language) : fullName(data, t.language);
  const isDarkSidebar = contrastColor(c.sidebar) === '#ffffff';
  const getTextColor = (isSide: boolean, muted = false) => (isSide && isDarkSidebar ? (muted ? '#cbd5e1' : '#ffffff') : (muted ? c.muted : c.text));
  const getAccentColor = (isSide: boolean) => (isSide && isDarkSidebar ? '#ffffff' : c.accent);
  const getSeparatorColor = (isSide: boolean) => (isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.25)' : c.separator);

  // Absolute line heights keep nested body text consistent. Dynamic fixed text
  // uses the renderer default because explicit line heights multiply during reflow.
  const line = (fontSize = type.baseSize) => `${fontSize * type.lineHeight}pt`;
  const rich = (value: string) => inlineRuns(value).map((run, i) => <Text key={i} style={run.bold ? { fontWeight: 700 } : {}}>{run.text}</Text>);
  const body = (value: string, muted = false, isSide = false) => value ? <Text orphans={2} widows={2} style={{ lineHeight: line(), marginBottom: 4, color: getTextColor(isSide, muted) }}>{rich(value)}</Text> : null;
  const link = (label: string, url: string, color = c.accent) => safeUrl(url) ? <Link src={safeUrl(url)!} style={{ color, textDecoration: 'none' }}>{label}</Link> : <Text>{label}</Text>;
  const bullets = (items: Bullet[], depth = 0, isSide = false): ReactNode => items.map(item => <View key={item.id} style={{ marginLeft: depth * 9 }}>
    <View wrap={item.text.length > 350} style={{ flexDirection: 'row', marginBottom: 3 }}><Text style={{ width: 10, color: getAccentColor(isSide), lineHeight: line() }}>•</Text><Text orphans={2} widows={2} style={{ flex: 1, lineHeight: line(), color: getTextColor(isSide) }}>{rich(item.text)}</Text></View>
    {bullets(item.children, depth + 1, isSide)}
  </View>);
  const label = (value: string, size = type.baseSize, isSide = false) => <Text style={{ lineHeight: line(size), fontWeight: 700, fontSize: size, marginBottom: 2, color: getTextColor(isSide) }} minPresenceAhead={size * 2}>{rich(value)}</Text>;
  const meta = (value: string, isSide = false) => value ? <Text style={{ lineHeight: line(type.baseSize - 1), color: getTextColor(isSide, true), fontSize: type.baseSize - 1, marginBottom: 5 }}>{value}</Text> : null;
  const entry = (section: SectionId, key: string, children: ReactNode, keepTogether = false, isSide = false) => <View data-edit={editTarget(section, key)} key={key} wrap={!keepTogether} style={{ marginBottom: g.blockGap, flexShrink: 0,
    borderLeftWidth: d.entryStyle === 'timeline' ? 1.5 : d.entryStyle === 'cards' ? 3 : 0,
    borderLeftColor: getAccentColor(isSide), paddingLeft: d.entryStyle === 'timeline' ? 10 : d.entryStyle === 'cards' ? 9 : 0,
    paddingRight: d.entryStyle === 'cards' ? 9 : 0, paddingTop: d.entryStyle === 'cards' ? 8 : 0, paddingBottom: d.entryStyle === 'cards' ? 8 : 0,
    backgroundColor: d.entryStyle === 'cards' ? (isDarkSidebar ? 'rgba(128,128,128,0.08)' : c.sidebar) : undefined,
    borderRadius: d.entryStyle === 'cards' ? g.radius : 0,
  }}>{children}</View>;
  const meter = (level: number, isSide: boolean) => d.skillMeter === 'dots' ? <Svg width={40} height={8} viewBox="0 0 40 8">{[0, 1, 2, 3, 4].map(i => <Circle key={i} cx={4 + i * 8} cy={4} r={2.4} fill={getAccentColor(isSide)} opacity={i < level ? 1 : .2} />)}</Svg> : <View style={{ width: 40, height: 4, backgroundColor: getSeparatorColor(isSide), borderRadius: 2 }}><View style={{ width: `${level * 20}%`, height: 4, backgroundColor: getAccentColor(isSide), borderRadius: 2 }} /></View>;
  const contactItems = [
    { value: data.personal.location, path: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14z M12 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6' },
    { value: data.personal.email, path: 'M2 4h20v16H2z M2 4l10 9l10-9' },
    { value: data.personal.phone, path: 'M5 2l4 5l-3 3c2 4 4 6 8 8l3-3l5 4c-2 7-8 4-13-1S1 4 5 2z' },
    { value: data.personal.website, path: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20 M2 12h20 M12 2c-6 5-6 15 0 20c6-5 6-15 0-20' },
  ].filter(item => item.value);
  const contacts = (isSide = false, color = c.muted) => <View style={{ flexDirection: isSide ? 'column' : 'row', flexWrap: isSide ? 'nowrap' : 'wrap', gap: 5, width: '100%' }}>{contactItems.map(({ value, path }, i) => <View key={i} wrap={false} style={{ width: isSide ? '100%' : d.contactIcons ? '48%' : undefined, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    {d.contactIcons && <Svg width={10} height={10} viewBox="0 0 24 24"><Path d={path} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
    <Text style={{ flex: d.contactIcons || isSide ? 1 : undefined, flexShrink: 1, fontSize: type.baseSize - 1, lineHeight: line(type.baseSize - 1), color }}>{!d.contactIcons && !isSide && i > 0 ? '·  ' : ''}{value.includes('@') ? link(value, `mailto:${value}`, color) : value === data.personal.website ? link(urlLabel(value), value, color) : value}</Text>
  </View>)}</View>;
  const keepProjectTogether = (item: ResumeData['projects'][number]) => {
    if (!t.keepSectionsTogether || item.bullets.length) return false;
    const pageWidth = mmToPt(210 - g.margins.left - g.margins.right);
    const ratio = (t.layout === 'grid' ? 47 : t.sidebarWidth) / 100;
    const isSidebar = t.sections.find(section => section.id === 'projects')?.column === 'sidebar';
    const width = (t.layout === 'single' ? pageWidth : isSidebar ? pageWidth * ratio - 20 : pageWidth * (1 - ratio) - g.columnGap) - g.sectionPadding * 2;
    const length = [item.name, item.role, item.description, item.url, ...item.technologies].join(' ').length;
    return length < width / (type.baseSize * 0.85) * 12;
  };
  function sectionContent(id: SectionId, isSide = false): ReactNode {
    const sAccent = getAccentColor(isSide);
    switch (id) {
      case 'summary': return body(data.summary, false, isSide);
      case 'experience': return data.experience.map(item => entry('experience', item.id, d.entryStyle === 'table' ? <>
        <View wrap={false} style={{ flexDirection: 'row', gap: 12, marginBottom: 5 }}>
          <View style={{ width: '27%' }}>{meta(dateRange(item.startDate, item.endDate, item.current, t.language), isSide)}</View>
          <View style={{ flex: 1 }}>{label(item.role, type.baseSize + 1, isSide)}{label(item.company, type.baseSize, isSide)}{meta(item.location, isSide)}</View>
        </View>
        <View style={{ marginLeft: '29%' }}>{body(item.description, false, isSide)}{bullets(item.bullets, 0, isSide)}</View>
      </> : <>
        <Text wrap={false} orphans={8} widows={8} minPresenceAhead={type.baseSize * 3} style={{ fontFamily: type.fontFamily, color: getTextColor(isSide), lineHeight: line(type.baseSize + 1), marginBottom: 5 }}>
          <Text style={{ fontWeight: 700, fontSize: type.baseSize + 1, color: getTextColor(isSide) }}>{rich(item.role)}{'\n'}</Text>
          <Text style={{ color: sAccent, fontWeight: 700 }}>{item.company}{'\n'}</Text>
          <Text style={{ color: getTextColor(isSide, true), fontSize: type.baseSize - 1 }}>{[dateRange(item.startDate, item.endDate, item.current, t.language), item.location].filter(Boolean).join('  ·  ')}</Text>
        </Text>
        {body(item.description, false, isSide)}{bullets(item.bullets, 0, isSide)}
      </>, false, isSide));
      case 'education': return data.education.map(item => entry('education', item.id, d.entryStyle === 'table' ? <>
        <View wrap={false} style={{ flexDirection: 'row', gap: 12, marginBottom: 5 }}>
          <View style={{ width: '27%' }}>{meta(dateRange(item.startDate, item.endDate, false, t.language), isSide)}</View>
          <View style={{ flex: 1 }}>{label(item.institution, type.baseSize, isSide)}{body([item.degree, item.field].filter(Boolean).join(' · '), false, isSide)}</View>
        </View><View style={{ marginLeft: '29%' }}>{body(item.description, true, isSide)}</View>
      </> : <>
        <View wrap={false} minPresenceAhead={type.baseSize * 3}>{label(item.institution, type.baseSize, isSide)}{body([item.degree, item.field].filter(Boolean).join(' · '), false, isSide)}{meta(dateRange(item.startDate, item.endDate, false, t.language), isSide)}</View>{body(item.description, true, isSide)}
      </>, item.description.length < 650, isSide));
      case 'skills': return data.skills.map((category, catIndex) => (
        <View data-edit={editTarget('skills', category.id)} key={category.id} wrap={category.skills.length > 20} style={{ marginTop: catIndex > 0 ? (isSide ? 6 : 8) : 0, marginBottom: isSide ? 3 : g.blockGap, flexShrink: 0 }}>
          <View style={{ marginBottom: 3 }}>
            <Text style={{ lineHeight: line(type.baseSize), fontWeight: 700, fontSize: type.baseSize, color: isSide && isDarkSidebar ? '#ffffff' : sAccent, letterSpacing: 0.3 }}>
              {rich(category.name)}
            </Text>
          </View>
          {t.skillStyle === 'tags' ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
              {category.skills.map(skill => (
                <View key={skill.id} wrap={false} style={{
                  backgroundColor: isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.14)' : c.sidebar,
                  borderWidth: g.lineWidth,
                  borderColor: isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.25)' : c.separator,
                  borderRadius: g.radius,
                  padding: '2 5',
                  maxWidth: '100%',
                }}>
                  <Text style={{ lineHeight: line(type.baseSize - 0.5), fontSize: type.baseSize - 0.5, color: getTextColor(isSide) }}>
                    {skill.name}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            category.skills.map(skill => (
              <View key={skill.id} wrap={false} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={{ width: isSide ? 8 : 10, color: isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.5)' : c.accent, fontSize: type.baseSize - 2, lineHeight: line() }}>•</Text>
                <Text style={{ flex: 1, lineHeight: line(), color: getTextColor(isSide) }}>
                  {skill.name}{t.skillStyle === 'levels' && skill.level && d.skillMeter === 'numbers' ? `  ${skill.level}/5` : ''}
                </Text>
                {t.skillStyle === 'levels' && Boolean(skill.level) && d.skillMeter !== 'numbers' && meter(skill.level!, isSide)}
              </View>
            ))
          )}
        </View>
      ));
      case 'projects': return data.projects.map(item => entry('projects', item.id, <>
        <View wrap={false} minPresenceAhead={type.baseSize * 3} style={{ flexShrink: 0 }}>{label(item.name, type.baseSize + 1, isSide)}{meta(item.role, isSide)}</View>{body(item.description, false, isSide)}{bullets(item.bullets, 0, isSide)}
        {item.technologies.length > 0 && meta(item.technologies.join(' · '), isSide)}
        {item.url && <Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1 }}>{link(urlLabel(item.url), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text>}
      </>, keepProjectTogether(item), isSide));
      case 'certificates': return data.certificates.map(item => entry('certificates', item.id, <>{label(item.name, type.baseSize, isSide)}{meta([item.issuer, item.date].filter(Boolean).join(' · '), isSide)}{item.url && <Text style={{ lineHeight: line() }}>{link(urlLabel(item.url), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text>}</>, true, isSide));
      case 'languages': return data.languages.map(item => entry('languages', item.id, <>{label(item.name, type.baseSize, isSide)}{body(item.level, true, isSide)}</>, true, isSide));
      case 'links': return data.links.map(item => <View data-edit={editTarget('links', item.id)} key={item.id} wrap={false} style={{ marginBottom: g.blockGap }}><Text style={{ lineHeight: line() }}>{link(item.label || urlLabel(item.url), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text><Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1, color: getTextColor(isSide, true) }}>{urlLabel(item.url)}</Text></View>);
      case 'consent': return <Text orphans={2} widows={2} style={{ lineHeight: line(Math.max(7, type.baseSize - 2)), fontSize: Math.max(7, type.baseSize - 2), color: getTextColor(isSide, true) }}>{data.consent}</Text>;
    }
  }
  const sections = t.sections.filter(s => s.isVisible && (typeof data[s.id] === 'string' ? Boolean((data[s.id] as string).trim()) : (data[s.id] as unknown[]).length > 0));
  const renderSection = (section: ResumeTheme['sections'][number], isSide = false) => {
    const sAccent = getAccentColor(isSide);
    const sSep = getSeparatorColor(isSide);
    // Headings are siblings of the content blocks so react-pdf can reserve space
    // for the first entry before splitting a long section across pages.
    const heading = section.id !== 'consent' && <View data-edit={editTarget(section.id, undefined, 'layout')} wrap={false} minPresenceAhead={type.baseSize * (section.id === 'education' ? 12 : 6)} style={{ paddingTop: g.sectionPadding, paddingHorizontal: g.sectionPadding, flexShrink: 0 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 7,
        borderBottomColor: sSep,
        borderBottomWidth: t.sectionStyle === 'underline' ? g.lineWidth : 0,
        backgroundColor: ['filled', 'capsule'].includes(t.sectionStyle) ? (isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.12)' : c.sidebar) : undefined,
        borderRadius: t.sectionStyle === 'capsule' ? 12 : t.sectionStyle === 'filled' ? g.radius : 0,
        borderLeftWidth: t.sectionStyle === 'rail' ? 2 : 0, borderLeftColor: sAccent,
        paddingLeft: t.sectionStyle === 'rail' ? 8 : ['filled', 'capsule'].includes(t.sectionStyle) ? 6 : 0,
        paddingRight: ['filled', 'capsule'].includes(t.sectionStyle) ? 6 : 0,
        paddingTop: ['filled', 'capsule'].includes(t.sectionStyle) ? 4 : 0,
        paddingBottom: ['filled', 'capsule'].includes(t.sectionStyle) ? 4 : t.sectionStyle === 'plain' ? 2 : 4,
        marginBottom: 6,
      }}>
        {t.icons.style !== 'none' && sectionIconPath(section) && <View style={{ width: t.icons.size, height: t.icons.size, backgroundColor: t.icons.style === 'outline' ? undefined : sAccent, borderRadius: t.icons.style === 'circle' ? t.icons.size / 2 : 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Svg width={t.icons.size * (t.icons.style === 'outline' ? 1 : .7)} height={t.icons.size * (t.icons.style === 'outline' ? 1 : .7)} viewBox="0 0 24 24"><Path d={sectionIconPath(section)!} stroke={t.icons.style === 'outline' ? sAccent : contrastColor(sAccent)} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View>}
        <Text style={{ flex: 1, lineHeight: line(type.headingSize), color: sAccent, fontFamily: type.headingFont, fontSize: type.headingSize, fontWeight: 700, letterSpacing: isSide && isDarkSidebar ? 1.5 : 1.1 }}>{section.title.toLocaleUpperCase(t.language)}</Text>
      </View>
    </View>;
    const content = sectionContent(section.id, isSide);
    const contentStyle = { flexShrink: 0, marginBottom: section.id === 'consent' ? 0 : g.sectionGap, paddingHorizontal: g.sectionPadding, paddingBottom: g.sectionPadding, paddingTop: section.id === 'consent' ? g.sectionPadding : 0 };
    // Keep a section title with its first short entry as a physical unit. A
    // presence hint alone cannot prevent nested unbreakable entries moving away.
    const first = Array.isArray(content) ? content[0] : undefined;
    const available = mmToPt(297 - g.margins.top - g.margins.bottom) - d.continuationGap - (pinnedFooter ? footerHeight : 0) - (isSide ? d.sidebarPadding * 2 : 0);
    const keepWhole = !measureOnly && t.keepSectionsTogether && sectionHeights[section.id] !== undefined && sectionHeights[section.id]! <= available - 2;
    if (keepWhole) return <View key={section.id} data-section={section.id} wrap={false} style={{ flexShrink: 0 }}>{heading}<View data-edit={['summary', 'consent'].includes(section.id) ? editTarget(section.id) : undefined} style={contentStyle}>{content}</View></View>;
    if (heading && isValidElement<{ wrap?: boolean }>(first) && first.props.wrap === false) return <View key={section.id} data-section={section.id} style={{ flexShrink: 0 }}>
      <View wrap={false}>{heading}<View style={{ paddingHorizontal: g.sectionPadding }}>{first}</View></View>
      <View style={contentStyle}>{(content as ReactNode[]).slice(1)}</View>
    </View>;
    return <View key={section.id} data-section={section.id} style={{ flexShrink: 0 }}>{heading}<View data-edit={['summary', 'consent'].includes(section.id) ? editTarget(section.id) : undefined} style={contentStyle}>{content}</View></View>;
  };
  const multiColumn = t.layout !== 'single';
  const tail = sections.at(-1);
  const footer = multiColumn && tail?.id === 'consent' && tail.column === 'main' ? tail : undefined;
  const consentSize = Math.max(7, type.baseSize - 2);
  const footerWidth = mmToPt(210 - g.margins.left - g.margins.right) - g.sectionPadding * 2;
  const footerLines = data.consent.split(/\r?\n/).reduce((count, line) => count + Math.max(1, Math.ceil(line.length / (footerWidth / (consentSize * .65 + Math.max(0, type.tracking))))), 0);
  const footerHeight = footerLines * consentSize * Math.max(1.5, type.lineHeight) + 6;
  const pinnedFooter = footer && footerHeight < 100;
  const main = sections.filter(s => s.column === 'main' && s !== footer);
  const side = sections.filter(s => s.column === 'sidebar' && s !== footer);
  const sidebarWidth = t.layout === 'grid' ? 47 : t.sidebarWidth;
  const leftSide = t.layout === 'sidebar-left' || t.layout === 'grid';
  const banner = t.headerStyle === 'banner';
  const centered = t.headerStyle === 'centered';
  const headerColor = banner ? contrastColor(c.accent) : c.text;
  const detailColor = banner ? headerColor : c.muted;
  const isSidebarPhoto = (t.photo.position === 'sidebar' || t.photo.position === 'top-left') && multiColumn && t.photo.isVisible;

  const photoWidth = mmToPt(t.photo.size);
  const isPortrait = t.photo.shape === 'portrait' || t.photo.shape === 'portrait-rounded';
  const photoHeight = isPortrait ? photoWidth * 1.28 : photoWidth;
  const radius = photoRadius(t.photo.shape, photoWidth);
  const borderW = t.photo.borderWidth ?? (t.photo.borderColor === 'none' ? 0 : 1);
  const borderCol = t.photo.borderColor === 'white' ? '#ffffff'
    : t.photo.borderColor === 'accent' ? c.accent
    : t.photo.borderColor === 'separator' ? c.separator
    : t.photo.borderColor === 'none' ? 'transparent'
    : (isSidebarPhoto && isDarkSidebar) ? 'rgba(255, 255, 255, 0.45)'
    : banner ? headerColor
    : c.separator;
  const placeholderColor = (isSidebarPhoto && isDarkSidebar) ? '#ffffff' : banner ? headerColor : c.accent;

  // The container masks the image once. Placeholder shading must not show
  // through transparent photo edges or create a second outline around them.
  const portrait = t.photo.isVisible && <View data-edit={editTarget('personal', undefined, 'photo')} wrap={false} style={{ width: photoWidth, height: photoHeight, borderRadius: radius, overflow: 'hidden', borderWidth: borderW, borderColor: borderW > 0 ? borderCol : undefined, backgroundColor: data.personal.photo ? undefined : isSidebarPhoto && isDarkSidebar ? 'rgba(255, 255, 255, 0.08)' : c.sidebar, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    {data.personal.photo ? <Image src={data.personal.photo} style={{ width: photoWidth - borderW * 2, height: photoHeight - borderW * 2, objectFit: 'cover', borderRadius: borderW > 0 ? Math.max(0, radius - borderW) : 0, flexShrink: 0 }} /> : <>
      <Svg width={photoWidth * 0.55} height={photoHeight * 0.55} viewBox="0 0 100 100">
        <Circle cx="50" cy="35" r="17" fill={placeholderColor} opacity={0.65} />
        <Path d="M22 84 C22 66 34 56 50 56 C66 56 78 66 78 84 C78 88 75 90 70 90 L30 90 C25 90 22 88 22 84 Z" fill={placeholderColor} opacity={0.65} />
      </Svg>
      <Text style={{ fontSize: 5.5, lineHeight: '7pt', color: placeholderColor, letterSpacing: 0.8, marginTop: 3, fontWeight: 700, opacity: 0.8 }}>{t.language === 'en' ? 'PHOTO' : 'ZDJĘCIE'}</Text>
    </>}
  </View>;

  const sidebarPhoto = isSidebarPhoto && portrait && (
    <View wrap={false} style={{ alignItems: 'center', marginBottom: 10, paddingTop: 2 }}>
      {portrait}
    </View>
  );
  const sidebarSpacer = <View fixed render={({ pageNumber }) => sidebarPages && !sidebarPages.includes(pageNumber) ? null : <View style={{ height: d.sidebarPadding }} />} />;
  const sidebarColumn = <View data-column="sidebar" style={{ width: `${sidebarWidth}%`, alignSelf: 'flex-start', backgroundColor: c.sidebar, paddingHorizontal: d.sidebarPadding, borderRadius: g.radius }}>
    {sidebarSpacer}
    {sidebarPhoto}
    {d.contactPlacement === 'sidebar' && contactItems.length > 0 && <View data-edit={editTarget('personal')} wrap={false} style={{ marginBottom: g.sectionGap + 4 }}>
      <Text style={{ fontFamily: type.headingFont, fontWeight: 700, fontSize: type.headingSize, color: getAccentColor(true), marginBottom: 8 }}>{t.language === 'en' ? 'CONTACT' : 'KONTAKT'}</Text>
      {contacts(true, getTextColor(true))}
    </View>}
    {side.map(s => renderSection(s, true))}
    {sidebarSpacer}
  </View>;

  const mainHeader = isSidebarPhoto && <View data-edit={editTarget('personal')} wrap={false} minPresenceAhead={type.baseSize * 4} style={{
    backgroundColor: banner ? c.accent : undefined,
    paddingTop: banner ? 12 : 0,
    paddingRight: banner ? 12 : 0,
    borderRadius: banner ? g.radius : 0,
    borderLeftWidth: t.headerStyle === 'accent' ? 3 : 0,
    borderLeftColor: c.accent,
    paddingLeft: t.headerStyle === 'accent' || banner ? 12 : 0,
    paddingBottom: banner ? 12 : 6,
    borderBottomWidth: centered ? g.lineWidth : 0,
    borderBottomColor: c.separator,
    marginBottom: g.sectionGap,
  }}>
    <View style={{ marginBottom: 3, width: '100%' }}>
      <Text style={{ fontFamily: type.headingFont, color: headerColor, textAlign: centered ? 'center' : 'left', fontSize: type.nameSize, fontWeight: 700, lineHeight: line(type.nameSize), letterSpacing: -0.5 }}>{displayName}</Text>
    </View>
    {data.personal.title ? <View style={{ marginBottom: 6, width: '100%' }}>
      <Text style={{ lineHeight: line(type.baseSize + 2), color: banner ? headerColor : c.accent, textAlign: centered ? 'center' : 'left', fontSize: type.baseSize + 2, fontWeight: 600 }}>{data.personal.title}</Text>
    </View> : null}
    {d.contactPlacement !== 'sidebar' && contacts(false, detailColor)}
  </View>;

  const mainColumn = <View data-column="main" style={{ flex: 1 }}>
    {mainHeader}
    {main.map(s => renderSection(s, false))}
  </View>;

  const isColumnHeader = centered && t.photo.position === 'center';
  const topHeader = !isSidebarPhoto && <View wrap={false} minPresenceAhead={type.baseSize * 4} style={{
    flexDirection: isColumnHeader ? 'column' : 'row',
    alignItems: 'center',
    gap: 14,
    borderLeftWidth: t.headerStyle === 'accent' ? 3 : 0,
    borderLeftColor: c.accent,
    paddingLeft: t.headerStyle === 'accent' ? 14 : banner ? 16 : 0,
    paddingRight: banner ? 16 : 0,
    paddingTop: banner ? 14 : 0,
    paddingBottom: banner ? 14 : centered ? 10 : 0,
    borderBottomWidth: centered ? g.lineWidth : 0,
    borderBottomColor: c.separator,
    backgroundColor: banner ? c.accent : undefined,
    borderRadius: banner ? g.radius : 0,
    marginBottom: g.sectionGap + 6,
  }}>
    {t.photo.position === 'center' && portrait && <View style={{ marginBottom: 8 }}>{portrait}</View>}
    {(t.photo.position === 'left' || t.photo.position === 'sidebar' || t.photo.position === 'top-left') && portrait}
    <View data-edit={editTarget('personal')} style={{ width: isColumnHeader ? '100%' : undefined, flex: isColumnHeader ? undefined : 1, alignItems: centered ? 'center' : 'flex-start' }}>
      <View style={{ marginBottom: 3, width: '100%' }}>
        <Text style={{ fontFamily: type.headingFont, color: headerColor, textAlign: centered ? 'center' : 'left', fontSize: type.nameSize, fontWeight: 700, lineHeight: line(type.nameSize), letterSpacing: -0.5 }}>{displayName}</Text>
      </View>
      {data.personal.title ? <View style={{ marginBottom: 6, width: '100%' }}>
        <Text style={{ lineHeight: line(type.baseSize + 2), color: banner ? headerColor : c.accent, textAlign: centered ? 'center' : 'left', fontSize: type.baseSize + 2, fontWeight: 600 }}>{data.personal.title}</Text>
      </View> : null}
      {(d.contactPlacement !== 'sidebar' || !multiColumn) && contacts(false, detailColor)}
    </View>
    {t.photo.position === 'right' && portrait}
  </View>;

  return <Document onRender={onRender} title={`${fullName(data, t.language)} — CV`} author={fullName(data, t.language)} subject="Curriculum vitae" language={t.language === 'en' ? 'en-GB' : 'pl-PL'} creator="Folio Resume Studio">
    <Page size={measureOnly ? [595.28, 14400] : "A4"} wrap style={{ paddingTop: mmToPt(g.margins.top), paddingRight: mmToPt(g.margins.right), paddingBottom: mmToPt(g.margins.bottom) + (pinnedFooter ? footerHeight : 0), paddingLeft: mmToPt(g.margins.left), fontFamily: type.fontFamily, fontSize: type.baseSize, letterSpacing: type.tracking, color: c.text, backgroundColor: c.background }}>
      {d.decoration !== 'none' && <Svg fixed width={595.28} height={841.89} viewBox="0 0 595.28 841.89" style={{ position: 'absolute', top: 0, left: 0 }}>
        {d.decoration === 'rule' && <Rect x={mmToPt(g.margins.left)} y={12} width={595.28 - mmToPt(g.margins.left + g.margins.right)} height={3} fill={c.accent} />}
        {d.decoration === 'frame' && <Rect x={14} y={14} width={567.28} height={813.89} fill="none" stroke={c.accent} strokeWidth={.7} opacity={.35} />}
        {d.decoration === 'corner' && <Path d="M475 0H595V120Z M0 742V842H100Z" fill={c.accent} opacity={.07} />}
        {d.decoration === 'orbit' && <><Circle cx={555} cy={45} r={85} fill="none" stroke={c.accent} strokeWidth={1} opacity={.12} /><Circle cx={580} cy={20} r={110} fill="none" stroke={c.accent} strokeWidth={.5} opacity={.14} /></>}
        {d.decoration === 'arch' && <><Path d="M502 5V28a42 42 0 0 0 84 0V5 M511 5V28a33 33 0 0 0 66 0V5" fill="none" stroke={c.accent} strokeWidth={1.2} opacity={.17} /><Path d="M9 826v-23a32 32 0 0 1 64 0v23" fill="none" stroke={c.accent} strokeWidth={.8} opacity={.13} /></>}
        {d.decoration === 'ribbon' && <><Rect x={0} y={0} width={595.28} height={8} fill={c.accent} /><Rect x={0} y={8} width={595.28} height={5} fill={c.sidebar} /><Rect x={0} y={838} width={595.28} height={4} fill={c.accent} opacity={.25} /></>}
        {d.decoration === 'contour' && Array.from({ length: 5 }, (_, i) => <Path key={i} d={`M420 ${i * 6 + 2} Q510 ${i * 6 + 30} 595 ${i * 6 + 4} M0 ${808 + i * 6} Q60 ${780 + i * 6} 150 ${808 + i * 6}`} fill="none" stroke={c.accent} strokeWidth={.6} opacity={.17} />)}
        {d.decoration === 'mosaic' && <><Rect x={558} y={12} width={20} height={20} fill={c.accent} opacity={.17} /><Rect x={541} y={20} width={12} height={12} fill="none" stroke={c.accent} strokeWidth={.6} opacity={.3} /><Circle cx={564} cy={41} r={5} fill={c.accent} opacity={.1} /><Rect x={14} y={813} width={14} height={14} fill={c.accent} opacity={.14} /></>}
        {d.decoration === 'dots' && Array.from({ length: 30 }, (_, i) => <Circle key={i} cx={530 + i % 6 * 9} cy={16 + Math.floor(i / 6) * 9} r={1.1} fill={c.accent} opacity={.22} />)}
      </Svg>}
      <View fixed style={{ height: d.continuationGap }} />
      <Text fixed style={{ position: 'absolute', top: Math.max(6, mmToPt(g.margins.top) / 2 - 4), left: mmToPt(g.margins.left), right: mmToPt(g.margins.right), fontSize: 7, letterSpacing: 0, color: c.muted }} render={({ pageNumber }) => pageNumber > 1 ? `${fullName(data, t.language)}  ·  ${t.language === 'en' ? 'CV — continued' : 'CV — ciąg dalszy'}` : ''} />
      {topHeader}
      {continuations.map((heading, index) => <Text key={`continuation-${index}`} fixed style={{ position: 'absolute', top: mmToPt(g.margins.top) + 4, left: heading.left, width: heading.width, fontSize: 7, letterSpacing: 0, color: c.accent, fontWeight: 700 }} render={({ pageNumber }) => pageNumber === heading.page ? `${heading.title.toLocaleUpperCase(t.language)} · ${t.language === 'en' ? 'CONTINUED' : 'CIĄG DALSZY'}` : ''} />)}
      {multiColumn ? <View style={{ flexDirection: 'row', gap: g.columnGap }}>
        {leftSide ? <>{sidebarColumn}{mainColumn}</> : <>{mainColumn}{sidebarColumn}</>}
      </View> : sections.map(s => renderSection(s, false))}
      {pinnedFooter ? <Text fixed data-edit={editTarget('consent')} style={{ position: 'absolute', bottom: mmToPt(g.margins.bottom), left: mmToPt(g.margins.left) + g.sectionPadding, width: footerWidth, height: footerHeight, fontFamily: type.fontFamily, fontSize: consentSize, color: c.muted }} render={({ pageNumber, totalPages }) => !totalPages || pageNumber === totalPages ? data.consent : ''} /> : footer && renderSection(footer, false)}
      <Text fixed style={{ position: 'absolute', bottom: mmToPt(g.margins.bottom) / 2 - 4, right: mmToPt(g.margins.right), width: 70, height: 10, textAlign: 'right', fontSize: 7, letterSpacing: 0, color: c.muted }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}
