import { Document, Page, View, Text, Link, Image, Svg, Circle, Path, Rect } from '@react-pdf/renderer';
import { isValidElement, type ReactNode } from 'react';
import type { Bullet, ResumeData, ResumeTheme, SectionId } from '../../types/resume';
import { dateRange, fullName, inlineRuns, mmToPt, safeUrl, urlLabel } from '../../lib/format';
import { contrastColor, photoAspect, photoRadius } from '../../lib/photo';
import { sectionIconPath } from '../../lib/sectionIcons';
import { editTarget, type Continuation } from '../../lib/previewTargets';

interface Props { data: ResumeData; theme: ResumeTheme; onRender?: (result: unknown) => void; continuations?: Continuation[]; sidebarPages?: number[]; measureOnly?: boolean; sectionHeights?: Partial<Record<SectionId, number>> }
export function ResumeDocument({ data, theme: t, onRender, continuations = [], sidebarPages, measureOnly = false, sectionHeights = {} }: Props) {
  const { typography: type, colors: c, geometry: g } = t;
  const d = t.design;
  const displayName = d.nameStyle === 'stacked' ? [data.personal.firstName, data.personal.lastName].filter(Boolean).join('\n') || fullName(data, t.language) : d.nameStyle === 'uppercase' ? fullName(data, t.language).toLocaleUpperCase(t.language) : fullName(data, t.language);
  const isDarkSidebar = d.sidebarStyle !== 'line' && contrastColor(c.sidebar) === '#ffffff';
  const getTextColor = (isSide: boolean, muted = false) => (isSide && isDarkSidebar ? (muted ? '#cbd5e1' : '#ffffff') : (muted ? c.muted : c.text));
  const getAccentColor = (isSide: boolean) => (isSide && isDarkSidebar ? '#ffffff' : c.accent);
  const getSeparatorColor = (isSide: boolean) => (isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.25)' : c.separator);

  // Absolute line heights keep nested body text consistent. Dynamic fixed text
  // uses the renderer default because explicit line heights multiply during reflow.
  const line = (fontSize = type.baseSize) => `${fontSize * type.lineHeight}pt`;
  const rich = (value: string) => inlineRuns(value).map((run, i) => <Text key={i} style={run.bold ? { fontWeight: 700 } : {}}>{run.text}</Text>);
  const body = (value: string, muted = false, isSide = false) => value ? <Text orphans={2} widows={2} style={{ lineHeight: line(), marginBottom: 4, color: getTextColor(isSide, muted) }}>{rich(value)}</Text> : null;
  // Text width of a column; URL labels are shortened to fit it instead of overflowing.
  const pageInner = mmToPt(210 - g.margins.left - g.margins.right);
  const columnRatio = (t.layout === 'grid' ? 47 : t.sidebarWidth) / 100;
  const entryInset = d.entryStyle === 'cards' ? 21 : d.entryStyle === 'timeline' ? 11.5 : 0;
  const textWidth = (isSide: boolean) => (t.layout === 'single' ? pageInner : isSide ? pageInner * columnRatio - d.sidebarPadding * 2 : pageInner * (1 - columnRatio) - g.columnGap) - g.sectionPadding * 2;
  const fitUrl = (url: string, width: number, size = type.baseSize - 1) => urlLabel(url, width / (size * 0.56 + Math.max(0, type.tracking)));
  const link = (label: string, url: string, color = c.accent) => safeUrl(url) ? <Link src={safeUrl(url)!} style={{ color, textDecoration: 'none' }}>{label}</Link> : <Text>{label}</Text>;
  const bullets = (items: Bullet[], depth = 0, isSide = false): ReactNode => items.map(item => <View key={item.id} style={{ marginLeft: depth * 9 }}>
    <View wrap={item.text.length > 350} style={{ flexDirection: 'row', marginBottom: 3 }}><Text style={{ width: 10, color: getAccentColor(isSide), lineHeight: line() }}>•</Text><Text orphans={2} widows={2} style={{ flex: 1, lineHeight: line(), color: getTextColor(isSide) }}>{rich(item.text)}</Text></View>
    {bullets(item.children, depth + 1, isSide)}
  </View>);
  const label = (value: string, size = type.baseSize, isSide = false) => <Text style={{ lineHeight: line(size), fontWeight: 700, fontSize: size, marginBottom: 2, color: getTextColor(isSide) }} minPresenceAhead={size * 2}>{rich(value)}</Text>;
  const meta = (value: string, isSide = false) => value ? <Text style={{ lineHeight: line(type.baseSize - 1), color: getTextColor(isSide, true), fontSize: type.baseSize - 1, marginBottom: 5 }}>{value}</Text> : null;
  const entry = (section: SectionId, key: string, children: ReactNode, keepTogether = false, isSide = false) => { const timeline = d.entryStyle === 'timeline' && !isSide; return <View data-edit={editTarget(section, key)} key={key} wrap={!keepTogether} style={{ marginBottom: g.blockGap, flexShrink: 0,
    borderLeftWidth: timeline ? 1.5 : d.entryStyle === 'cards' ? 3 : 0,
    borderLeftColor: getAccentColor(isSide), paddingLeft: timeline ? 10 : d.entryStyle === 'cards' ? 9 : 0,
    paddingRight: d.entryStyle === 'cards' ? 9 : 0, paddingTop: d.entryStyle === 'cards' ? 8 : 0, paddingBottom: d.entryStyle === 'cards' ? 8 : 0,
    backgroundColor: d.entryStyle === 'cards' ? (isDarkSidebar ? 'rgba(128,128,128,0.08)' : c.sidebar) : undefined,
    borderRadius: d.entryStyle === 'cards' ? g.radius : 0,
  }}>{timeline && <View style={{ position: 'absolute', left: -6.25, top: 2.5, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: getAccentColor(isSide), backgroundColor: c.background }} />}{children}</View>; };
  const meter = (level: number, isSide: boolean) => d.skillMeter === 'dots' ? <Svg width={40} height={8} viewBox="0 0 40 8">{[0, 1, 2, 3, 4].map(i => <Circle key={i} cx={4 + i * 8} cy={4} r={2.4} fill={getAccentColor(isSide)} opacity={i < level ? 1 : .2} />)}</Svg> : <View style={{ width: 40, height: 4, backgroundColor: getSeparatorColor(isSide), borderRadius: 2 }}><View style={{ width: `${level * 20}%`, height: 4, backgroundColor: getAccentColor(isSide), borderRadius: 2 }} /></View>;
  const contactItems = [
    { value: data.personal.location, path: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14z M12 5a3 3 0 1 0 0 6a3 3 0 1 0 0-6' },
    { value: data.personal.email, path: 'M2 4h20v16H2z M2 4l10 9l10-9' },
    { value: data.personal.phone, path: 'M5 2l4 5l-3 3c2 4 4 6 8 8l3-3l5 4c-2 7-8 4-13-1S1 4 5 2z' },
    { value: data.personal.website, path: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20 M2 12h20 M12 2c-6 5-6 15 0 20c6-5 6-15 0-20' },
  ].filter(item => item.value);
  const contacts = (isSide = false, color = c.muted) => {
    const size = type.baseSize - 1;
    const available = isSide ? textWidth(true) - (d.contactIcons ? 16 : 0) : d.contactIcons ? pageInner * .48 - 16 : pageInner;
    // A long e-mail is shrunk to stay on one line; breaking it would insert a hyphen.
    const emailSize = (value: string) => Math.max(6.5, Math.min(size, available / (value.length * 0.54 + 1)));
    return <View style={{ flexDirection: isSide ? 'column' : 'row', flexWrap: isSide ? 'nowrap' : 'wrap', columnGap: 0, rowGap: 5, width: '100%' }}>{contactItems.map(({ value, path }, i) => <View key={i} wrap={false} style={{ width: isSide ? '100%' : d.contactIcons ? '48%' : undefined, marginRight: !isSide && d.contactIcons ? '2%' : 0, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {d.contactIcons && <Svg width={10} height={10} viewBox="0 0 24 24"><Path d={path} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
      <Text style={{ flex: d.contactIcons || isSide ? 1 : undefined, flexShrink: 1, fontSize: value === data.personal.email ? emailSize(value) : size, lineHeight: line(size), color }}>{value === data.personal.email ? link(value, `mailto:${value}`, color) : value === data.personal.website ? link(fitUrl(value, available), value, color) : value}{!d.contactIcons && !isSide && i < contactItems.length - 1 ? '   ·   ' : ''}</Text>
    </View>)}</View>;
  };
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
        {item.url && <Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1 }}>{link(fitUrl(item.url, textWidth(isSide) - entryInset), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text>}
      </>, keepProjectTogether(item), isSide));
      case 'certificates': return data.certificates.map(item => entry('certificates', item.id, <>{label(item.name, type.baseSize, isSide)}{meta([item.issuer, item.date].filter(Boolean).join(' · '), isSide)}{item.url && <Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1 }}>{link(fitUrl(item.url, textWidth(isSide) - entryInset), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text>}</>, true, isSide));
      case 'languages': return data.languages.map(item => entry('languages', item.id, <>{label(item.name, type.baseSize, isSide)}{body(item.level, true, isSide)}</>, true, isSide));
      // Without a profile name the address itself is the link, so it is not repeated below.
      case 'links': return data.links.map(item => <View data-edit={editTarget('links', item.id)} key={item.id} wrap={false} style={{ marginBottom: g.blockGap }}><Text style={{ lineHeight: line() }}>{link(item.label.trim() || fitUrl(item.url, textWidth(isSide), type.baseSize), item.url, isSide && isDarkSidebar ? '#93c5fd' : c.accent)}</Text>{item.label.trim() && item.url.trim() ? <Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1, color: getTextColor(isSide, true) }}>{fitUrl(item.url, textWidth(isSide))}</Text> : null}</View>);
      // Interests without descriptions read as one compact line (or tags) rather than a tall list.
      case 'interests': return data.interests.some(item => item.description.trim())
        ? data.interests.map(item => entry('interests', item.id, <>{label(item.name, type.baseSize, isSide)}{meta(item.description, isSide)}</>, true, isSide))
        : <View data-edit={editTarget('interests')} wrap={false} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.skillStyle === 'tags' ? 3 : 0 }}>{data.interests.filter(item => item.name.trim()).map((item, index, items) => t.skillStyle === 'tags'
          ? <View key={item.id} style={{ backgroundColor: isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.14)' : c.sidebar, borderWidth: g.lineWidth, borderColor: isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.25)' : c.separator, borderRadius: g.radius, padding: '2 5' }}><Text style={{ lineHeight: line(type.baseSize - 0.5), fontSize: type.baseSize - 0.5, color: getTextColor(isSide) }}>{item.name}</Text></View>
          : <Text key={item.id} style={{ lineHeight: line(), color: getTextColor(isSide) }}>{item.name}{index < items.length - 1 ? <Text style={{ color: getAccentColor(isSide) }}>{'  ·  '}</Text> : ''}</Text>)}</View>;
      case 'consent': return <Text orphans={2} widows={2} style={{ lineHeight: line(Math.max(7, type.baseSize - 2)), fontSize: Math.max(7, type.baseSize - 2), color: getTextColor(isSide, true) }}>{data.consent}</Text>;
    }
  }
  const sections = t.sections.filter(s => s.isVisible && (typeof data[s.id] === 'string' ? Boolean((data[s.id] as string).trim()) : (data[s.id] as unknown[]).length > 0));
  const renderSection = (section: ResumeTheme['sections'][number], isSide = false, index = 0) => {
    const sAccent = getAccentColor(isSide);
    const sSep = getSeparatorColor(isSide);
    // A side heading needs a wide single column, and only the main column is numbered;
    // elsewhere both degrade to a bar heading.
    const style = (t.sectionStyle === 'side' && (isSide || t.layout !== 'single')) || (t.sectionStyle === 'numbered' && isSide) ? 'bar' : t.sectionStyle;
    const side = style === 'side';
    const titleColor = ['bar', 'numbered'].includes(style) ? getTextColor(isSide) : sAccent;
    const headingHeight = g.sectionPadding + type.headingSize * type.lineHeight;
    const sideContent = side ? { marginLeft: '27%', marginTop: -headingHeight } : {};
    // Headings are siblings of the content blocks so react-pdf can reserve space
    // for the first entry before splitting a long section across pages.
    const heading = section.id !== 'consent' && <View data-edit={editTarget(section.id, undefined, 'layout')} wrap={false} minPresenceAhead={type.baseSize * (section.id === 'education' ? 12 : 6)} style={{ paddingTop: g.sectionPadding, paddingHorizontal: g.sectionPadding, flexShrink: 0, width: side ? '25%' : undefined }}>
      {style === 'bar' && <View style={{ width: 18, height: 3, backgroundColor: sAccent, marginBottom: 5 }} />}
      <View style={{
        flexDirection: 'row', alignItems: side ? 'flex-start' : 'center', gap: 7,
        borderBottomColor: sSep,
        borderBottomWidth: style === 'underline' ? g.lineWidth : 0,
        backgroundColor: ['filled', 'capsule'].includes(style) ? (isSide && isDarkSidebar ? 'rgba(255, 255, 255, 0.12)' : c.sidebar) : undefined,
        borderRadius: style === 'capsule' ? 12 : style === 'filled' ? g.radius : 0,
        borderLeftWidth: style === 'rail' ? 2 : 0, borderLeftColor: sAccent,
        paddingLeft: style === 'rail' ? 8 : ['filled', 'capsule'].includes(style) ? 6 : 0,
        paddingRight: ['filled', 'capsule'].includes(style) ? 6 : 0,
        paddingTop: ['filled', 'capsule'].includes(style) ? 4 : 0,
        paddingBottom: side ? 0 : ['filled', 'capsule'].includes(style) ? 4 : style === 'plain' ? 2 : 4,
        marginBottom: side ? 0 : 6,
      }}>
        {style === 'numbered' && <Text style={{ fontFamily: type.headingFont, fontSize: type.headingSize * 1.45, lineHeight: line(type.headingSize * 1.45), fontWeight: 700, color: sAccent, letterSpacing: 0 }}>{String(index + 1).padStart(2, '0')}</Text>}
        {t.icons.style !== 'none' && sectionIconPath(section) && <View style={{ width: t.icons.size, height: t.icons.size, backgroundColor: t.icons.style === 'outline' ? undefined : sAccent, borderRadius: t.icons.style === 'circle' ? t.icons.size / 2 : 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Svg width={t.icons.size * (t.icons.style === 'outline' ? 1 : .7)} height={t.icons.size * (t.icons.style === 'outline' ? 1 : .7)} viewBox="0 0 24 24"><Path d={sectionIconPath(section)!} stroke={t.icons.style === 'outline' ? sAccent : contrastColor(sAccent)} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg></View>}
        <Text style={{ flex: style === 'numbered' ? undefined : 1, lineHeight: line(type.headingSize), color: titleColor, fontFamily: type.headingFont, fontSize: type.headingSize, fontWeight: 700, letterSpacing: isSide && isDarkSidebar ? 1.5 : 1.1 }}>{section.title.toLocaleUpperCase(t.language)}</Text>
        {style === 'numbered' && <View style={{ flex: 1, height: Math.max(0.5, g.lineWidth), backgroundColor: sSep, marginLeft: 4 }} />}
      </View>
    </View>;
    const content = sectionContent(section.id, isSide);
    const contentStyle = { flexShrink: 0, marginBottom: section.id === 'consent' ? 0 : g.sectionGap, paddingHorizontal: g.sectionPadding, paddingBottom: g.sectionPadding, paddingTop: section.id === 'consent' ? g.sectionPadding : 0, ...(heading ? sideContent : {}) };
    // Keep a section title with its first short entry as a physical unit. A
    // presence hint alone cannot prevent nested unbreakable entries moving away.
    const first = Array.isArray(content) ? content[0] : undefined;
    const available = mmToPt(297 - g.margins.top - g.margins.bottom) - d.continuationGap - (pinnedFooter ? footerHeight : 0) - (isSide ? d.sidebarPadding * 2 : 0);
    const keepWhole = !measureOnly && t.keepSectionsTogether && sectionHeights[section.id] !== undefined && sectionHeights[section.id]! <= available - 2;
    if (keepWhole) return <View key={section.id} data-section={section.id} wrap={false} style={{ flexShrink: 0 }}>{heading}<View data-edit={['summary', 'consent'].includes(section.id) ? editTarget(section.id) : undefined} style={contentStyle}>{content}</View></View>;
    if (heading && isValidElement<{ wrap?: boolean }>(first) && first.props.wrap === false) return <View key={section.id} data-section={section.id} style={{ flexShrink: 0 }}>
      <View wrap={false}>{heading}<View style={{ paddingHorizontal: g.sectionPadding, ...sideContent }}>{first}</View></View>
      <View style={{ ...contentStyle, marginTop: 0 }}>{(content as ReactNode[]).slice(1)}</View>
    </View>;
    return <View key={section.id} data-section={section.id} style={{ flexShrink: 0 }}>{heading}<View data-edit={['summary', 'consent'].includes(section.id) ? editTarget(section.id) : undefined} style={contentStyle}>{content}</View></View>;
  };
  const multiColumn = t.layout !== 'single';
  const leftSide = t.layout === 'sidebar-left' || t.layout === 'grid';
  const bleed = multiColumn && d.sidebarStyle === 'bleed';
  const sidebarOuter = pageInner * columnRatio;
  // Horizontal extent of the main column on the page, used to keep page furniture off a full-bleed sidebar.
  const mainX = bleed && leftSide ? mmToPt(g.margins.left) + sidebarOuter + g.columnGap : mmToPt(g.margins.left);
  const mainWidth = bleed ? pageInner - sidebarOuter - g.columnGap : pageInner;
  const tail = sections.at(-1);
  const footer = multiColumn && tail?.id === 'consent' && tail.column === 'main' ? tail : undefined;
  const consentSize = Math.max(7, type.baseSize - 2);
  const footerWidth = mainWidth - g.sectionPadding * 2;
  const footerLines = data.consent.split(/\r?\n/).reduce((count, line) => count + Math.max(1, Math.ceil(line.length / (footerWidth / (consentSize * .65 + Math.max(0, type.tracking))))), 0);
  const footerHeight = footerLines * consentSize * Math.max(1.5, type.lineHeight) + 6;
  const pinnedFooter = footer && footerHeight < 100;
  const main = sections.filter(s => s.column === 'main' && s !== footer);
  const side = sections.filter(s => s.column === 'sidebar' && s !== footer);
  const sidebarWidth = t.layout === 'grid' ? 47 : t.sidebarWidth;
  const hero = t.headerStyle === 'hero';
  // Hero is a full-bleed banner; both share the coloured-header colour logic.
  const banner = t.headerStyle === 'banner' || hero;
  const centered = t.headerStyle === 'centered';
  const headerColor = banner ? contrastColor(c.accent) : c.text;
  const detailColor = banner ? headerColor : c.muted;
  const isSidebarPhoto = multiColumn && t.photo.isVisible && !hero && (t.photo.position === 'sidebar' || t.photo.position === 'top-left' || bleed);
  // A full-bleed sidebar runs from the top edge, so the name moves into the main column.
  const headerInMain = multiColumn && !hero && (isSidebarPhoto || bleed);

  const photoWidth = mmToPt(t.photo.size);
  const photoHeight = photoWidth * photoAspect(t.photo.shape);
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
  const lineSide = d.sidebarStyle === 'line';
  const sidebarColumn = <View data-column="sidebar" style={{ width: `${sidebarWidth}%`, alignSelf: lineSide ? 'stretch' : 'flex-start', backgroundColor: d.sidebarStyle === 'box' ? c.sidebar : undefined, borderRadius: d.sidebarStyle === 'box' ? g.radius : 0,
    paddingHorizontal: lineSide ? 0 : d.sidebarPadding, ...(lineSide ? { [leftSide ? 'paddingRight' : 'paddingLeft']: g.columnGap / 2, [leftSide ? 'borderRightWidth' : 'borderLeftWidth']: Math.max(0.5, g.lineWidth), [leftSide ? 'borderRightColor' : 'borderLeftColor']: c.separator } : {}) }}>
    {sidebarSpacer}
    {sidebarPhoto}
    {d.contactPlacement === 'sidebar' && contactItems.length > 0 && <View data-edit={editTarget('personal')} wrap={false} style={{ marginBottom: g.sectionGap + 4 }}>
      <Text style={{ fontFamily: type.headingFont, fontWeight: 700, fontSize: type.headingSize, color: getAccentColor(true), marginBottom: 8 }}>{t.language === 'en' ? 'CONTACT' : 'KONTAKT'}</Text>
      {contacts(true, getTextColor(true))}
    </View>}
    {side.map((s, i) => renderSection(s, true, i))}
    {sidebarSpacer}
  </View>;

  const nameText = (color: string) => <Text style={{ fontFamily: type.headingFont, color, textAlign: centered ? 'center' : 'left', fontSize: type.nameSize, fontWeight: d.nameStyle === 'split' ? 400 : 700, lineHeight: line(type.nameSize), letterSpacing: -0.5 }}>
    {d.nameStyle === 'split' ? <>{data.personal.firstName || fullName(data, t.language)}{data.personal.lastName ? <Text style={{ fontWeight: 700, color: banner ? color : c.accent }}>{'\n'}{data.personal.lastName}</Text> : null}</> : displayName}
  </Text>;
  const mainHeader = headerInMain && <View data-edit={editTarget('personal')} wrap={false} minPresenceAhead={type.baseSize * 4} style={{
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
      {nameText(headerColor)}
    </View>
    {data.personal.title ? <View style={{ marginBottom: 6, width: '100%' }}>
      <Text style={{ lineHeight: line(type.baseSize + 2), color: banner ? headerColor : c.accent, textAlign: centered ? 'center' : 'left', fontSize: type.baseSize + 2, fontWeight: 600 }}>{data.personal.title}</Text>
    </View> : null}
    {d.contactPlacement !== 'sidebar' && contacts(false, detailColor)}
  </View>;

  const mainColumn = <View data-column="main" style={{ flex: 1 }}>
    {mainHeader}
    {main.map((s, i) => renderSection(s, false, i))}
  </View>;

  const isColumnHeader = centered && t.photo.position === 'center';
  const topHeader = !headerInMain && <View wrap={false} minPresenceAhead={type.baseSize * 4} style={{
    flexDirection: isColumnHeader ? 'column' : 'row',
    alignItems: 'center',
    gap: 14,
    borderLeftWidth: t.headerStyle === 'accent' ? 3 : 0,
    borderLeftColor: c.accent,
    paddingLeft: hero ? mmToPt(g.margins.left) : t.headerStyle === 'accent' ? 14 : banner ? 16 : 0,
    paddingRight: hero ? mmToPt(g.margins.right) : banner ? 16 : 0,
    paddingTop: hero ? mmToPt(g.margins.top) + 4 : banner ? 14 : 0,
    paddingBottom: hero ? 18 : banner ? 14 : centered ? 10 : 0,
    borderBottomWidth: centered ? g.lineWidth : 0,
    borderBottomColor: c.separator,
    backgroundColor: banner ? c.accent : undefined,
    borderRadius: banner && !hero ? g.radius : 0,
    // Hero bleeds past the page margins and the fixed top spacer to the paper edge.
    ...(hero ? { marginTop: -(mmToPt(g.margins.top) + d.continuationGap), marginLeft: -mmToPt(g.margins.left), marginRight: -mmToPt(g.margins.right) } : {}),
    marginBottom: g.sectionGap + (hero ? 10 : 6),
  }}>
    {t.photo.position === 'center' && portrait && <View style={{ marginBottom: 8 }}>{portrait}</View>}
    {(t.photo.position === 'left' || t.photo.position === 'sidebar' || t.photo.position === 'top-left') && portrait}
    <View data-edit={editTarget('personal')} style={{ width: isColumnHeader ? '100%' : undefined, flex: isColumnHeader ? undefined : 1, alignItems: centered ? 'center' : 'flex-start' }}>
      <View style={{ marginBottom: 3, width: '100%' }}>
        {nameText(headerColor)}
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
      {bleed && <Svg fixed width={595.28} height={measureOnly ? 14400 : 841.89} style={{ position: 'absolute', top: 0, left: 0 }}><Rect x={leftSide ? 0 : mmToPt(g.margins.left) + pageInner - sidebarOuter} y={0} width={leftSide ? mmToPt(g.margins.left) + sidebarOuter : 595.28 - (mmToPt(g.margins.left) + pageInner - sidebarOuter)} height={measureOnly ? 14400 : 841.89} fill={c.sidebar} /></Svg>}
      {d.decoration !== 'none' && <Svg fixed width={595.28} height={841.89} viewBox="0 0 595.28 841.89" style={{ position: 'absolute', top: 0, left: 0 }}>
        {d.decoration === 'rule' && <Rect x={mmToPt(g.margins.left)} y={12} width={595.28 - mmToPt(g.margins.left + g.margins.right)} height={3} fill={c.accent} />}
        {d.decoration === 'frame' && <Rect x={14} y={14} width={567.28} height={813.89} fill="none" stroke={c.accent} strokeWidth={.7} opacity={.35} />}
        {d.decoration === 'corner' && <Path d="M475 0H595V120Z M0 742V842H100Z" fill={c.accent} opacity={.07} />}
        {d.decoration === 'orbit' && <><Circle cx={555} cy={45} r={85} fill="none" stroke={c.accent} strokeWidth={1} opacity={.12} /><Circle cx={580} cy={20} r={110} fill="none" stroke={c.accent} strokeWidth={.5} opacity={.14} /></>}
        {d.decoration === 'arch' && <><Path d="M502 5V28a42 42 0 0 0 84 0V5 M511 5V28a33 33 0 0 0 66 0V5" fill="none" stroke={c.accent} strokeWidth={1.2} opacity={.17} /><Path d="M9 826v-23a32 32 0 0 1 64 0v23" fill="none" stroke={c.accent} strokeWidth={.8} opacity={.13} /></>}
        {d.decoration === 'ribbon' && <><Rect x={0} y={0} width={595.28} height={8} fill={c.accent} /><Rect x={0} y={8} width={595.28} height={5} fill={c.sidebar} /><Rect x={0} y={838} width={595.28} height={4} fill={c.accent} opacity={.25} /></>}
        {d.decoration === 'contour' && Array.from({ length: 5 }, (_, i) => <Path key={i} d={`M420 ${i * 6 + 2} Q510 ${i * 6 + 30} 595 ${i * 6 + 4} M0 ${808 + i * 6} Q60 ${780 + i * 6} 150 ${808 + i * 6}`} fill="none" stroke={c.accent} strokeWidth={.6} opacity={.17} />)}
        {d.decoration === 'mosaic' && <><Rect x={558} y={12} width={20} height={20} fill={c.accent} opacity={.17} /><Rect x={541} y={20} width={12} height={12} fill="none" stroke={c.accent} strokeWidth={.6} opacity={.3} /><Circle cx={564} cy={41} r={5} fill={c.accent} opacity={.1} /><Rect x={14} y={813} width={14} height={14} fill={c.accent} opacity={.14} /></>}
        {d.decoration === 'blob' && <><Circle cx={575} cy={-20} r={150} fill={c.accent} opacity={.07} /><Circle cx={470} cy={18} r={46} fill={c.accent} opacity={.05} /><Circle cx={-30} cy={870} r={120} fill={c.accent} opacity={.06} /></>}
        {d.decoration === 'diagonal' && <><Path d="M440 0H595.28V155Z" fill={c.accent} opacity={.09} /><Path d="M395 0L595.28 200" stroke={c.accent} strokeWidth={.8} opacity={.25} /><Path d="M0 790L52 841.89H0Z" fill={c.accent} opacity={.09} /></>}
        {d.decoration === 'dots' && Array.from({ length: 30 }, (_, i) => <Circle key={i} cx={530 + i % 6 * 9} cy={16 + Math.floor(i / 6) * 9} r={1.1} fill={c.accent} opacity={.22} />)}
      </Svg>}
      <View fixed style={{ height: d.continuationGap }} />
      <Text fixed style={{ position: 'absolute', top: Math.max(6, mmToPt(g.margins.top) / 2 - 4), left: mainX, width: mainWidth, fontSize: 7, letterSpacing: 0, color: c.muted }} render={({ pageNumber }) => pageNumber > 1 ? `${fullName(data, t.language)}  ·  ${t.language === 'en' ? 'CV — continued' : 'CV — ciąg dalszy'}` : ''} />
      {topHeader}
      {continuations.map((heading, index) => <Text key={`continuation-${index}`} fixed style={{ position: 'absolute', top: mmToPt(g.margins.top) + 4, left: heading.left, width: heading.width, fontSize: 7, letterSpacing: 0, color: c.accent, fontWeight: 700 }} render={({ pageNumber }) => pageNumber === heading.page ? `${heading.title.toLocaleUpperCase(t.language)} · ${t.language === 'en' ? 'CONTINUED' : 'CIĄG DALSZY'}` : ''} />)}
      {multiColumn ? <View style={{ flexDirection: 'row', gap: g.columnGap }}>
        {leftSide ? <>{sidebarColumn}{mainColumn}</> : <>{mainColumn}{sidebarColumn}</>}
      </View> : sections.map((s, i) => renderSection(s, false, i))}
      {pinnedFooter ? <Text fixed data-edit={editTarget('consent')} style={{ position: 'absolute', bottom: mmToPt(g.margins.bottom), left: mainX + g.sectionPadding, width: footerWidth, height: footerHeight, fontFamily: type.fontFamily, fontSize: consentSize, color: c.muted }} render={({ pageNumber, totalPages }) => !totalPages || pageNumber === totalPages ? data.consent : ''} /> : footer && renderSection(footer, false)}
      <Text fixed style={{ position: 'absolute', bottom: mmToPt(g.margins.bottom) / 2 - 4, right: 595.28 - mainX - mainWidth, width: 70, height: 10, textAlign: 'right', fontSize: 7, letterSpacing: 0, color: c.muted }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}
