import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { Bullet, ResumeData, ResumeTheme, SectionId } from '../../types/resume';
import { dateRange, fullName, inlineRuns, mmToPt, safeUrl, urlLabel } from '../../lib/format';

interface Props { data: ResumeData; theme: ResumeTheme }
export function ResumeDocument({ data, theme: t }: Props) {
  const { typography: type, colors: c, geometry: g } = t;
  // Use absolute line heights so dynamic page numbering cannot multiply inherited values during reflow.
  const line = (fontSize = type.baseSize) => `${fontSize * type.lineHeight}pt`;
  const rich = (value: string) => inlineRuns(value).map((run, i) => <Text key={i} style={run.bold ? { fontWeight: 700 } : {}}>{run.text}</Text>);
  const body = (value: string, muted = false) => value ? <Text orphans={2} widows={2} style={{ lineHeight: line(), marginBottom: 4, color: muted ? c.muted : c.text }}>{rich(value)}</Text> : null;
  const link = (label: string, url: string) => safeUrl(url) ? <Link src={safeUrl(url)!} style={{ color: c.accent, textDecoration: 'none' }}>{label}</Link> : <Text>{label}</Text>;
  const bullets = (items: Bullet[], depth = 0): ReactNode => items.map(item => <View key={item.id} style={{ marginLeft: depth * 9 }}>
    <View style={{ flexDirection: 'row', marginBottom: 3 }}><Text style={{ width: 10, color: c.accent, lineHeight: line() }}>•</Text><Text orphans={2} widows={2} style={{ flex: 1, lineHeight: line() }}>{rich(item.text)}</Text></View>
    {bullets(item.children, depth + 1)}
  </View>);
  const label = (value: string, size = type.baseSize) => <Text style={{ lineHeight: line(size), fontWeight: 700, fontSize: size, marginBottom: 2 }} minPresenceAhead={size * 2}>{rich(value)}</Text>;
  const meta = (value: string) => value ? <Text style={{ lineHeight: line(type.baseSize - 1), color: c.muted, fontSize: type.baseSize - 1, marginBottom: 5 }}>{value}</Text> : null;
  const entry = (key: string, children: ReactNode) => <View key={key} style={{ marginBottom: g.blockGap }}>{children}</View>;
  function sectionContent(id: SectionId): ReactNode {
    switch (id) {
      case 'summary': return body(data.summary);
      case 'experience': return data.experience.map(item => entry(item.id, <>
        <View wrap={false} minPresenceAhead={type.baseSize * 3}>
        {label(item.role, type.baseSize + 1)}
        <Text style={{ lineHeight: line(), color: c.accent, fontWeight: 700, marginBottom: 3 }}>{item.company}</Text>
        {meta([dateRange(item.startDate, item.endDate, item.current), item.location].filter(Boolean).join('  ·  '))}
        </View>
        {body(item.description)}{bullets(item.bullets)}
      </>));
      case 'education': return data.education.map(item => entry(item.id, <>
        {label(item.institution)}{body([item.degree, item.field].filter(Boolean).join(' · '))}
        {meta(dateRange(item.startDate, item.endDate))}{body(item.description, true)}
      </>));
      case 'skills': return data.skills.map(category => entry(category.id, <>
        {label(category.name)}
        {t.skillStyle === 'tags' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>{category.skills.map(skill => <View key={skill.id} wrap={false} style={{ backgroundColor: c.sidebar, borderWidth: g.lineWidth, borderColor: c.separator, borderRadius: g.radius, padding: '3 5', maxWidth: '100%' }}><Text style={{ lineHeight: line(type.baseSize - 0.5), fontSize: type.baseSize - 0.5 }}>{skill.name}</Text></View>)}</View> : category.skills.map(skill => <View key={skill.id} wrap={false} style={{ marginBottom: 2 }}><Text style={{ lineHeight: line() }}>{skill.name}{t.skillStyle === 'levels' && skill.level ? `  ${skill.level}/5` : ''}</Text></View>)}
      </>));
      case 'projects': return data.projects.map(item => entry(item.id, <>
        {label(item.name, type.baseSize + 1)}{meta(item.role)}{body(item.description)}{bullets(item.bullets)}
        {item.technologies.length > 0 && meta(item.technologies.join(' · '))}
        {item.url && <Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1 }}>{link(urlLabel(item.url), item.url)}</Text>}
      </>));
      case 'certificates': return data.certificates.map(item => entry(item.id, <>{label(item.name)}{meta([item.issuer, item.date].filter(Boolean).join(' · '))}{item.url && <Text style={{ lineHeight: line() }}>{link(urlLabel(item.url), item.url)}</Text>}</>));
      case 'languages': return data.languages.map(item => entry(item.id, <>{label(item.name)}{body(item.level, true)}</>));
      case 'links': return data.links.map(item => entry(item.id, <><Text style={{ lineHeight: line() }}>{link(item.label || urlLabel(item.url), item.url)}</Text><Text style={{ lineHeight: line(type.baseSize - 1), fontSize: type.baseSize - 1, color: c.muted }}>{urlLabel(item.url)}</Text></>));
      case 'consent': return <Text orphans={2} widows={2} style={{ lineHeight: line(Math.max(7, type.baseSize - 2)), fontSize: Math.max(7, type.baseSize - 2), color: c.muted }}>{data.consent}</Text>;
    }
  }
  const sections = t.sections.filter(s => s.isVisible && (typeof data[s.id] === 'string' ? Boolean((data[s.id] as string).trim()) : (data[s.id] as unknown[]).length > 0));
  const renderSection = (section: ResumeTheme['sections'][number]) => <View key={section.id} style={{ marginBottom: section.id === 'consent' ? 0 : g.sectionGap, padding: g.sectionPadding }}>
    {section.id !== 'consent' && <View wrap={false} minPresenceAhead={type.baseSize * 4} style={{ borderBottomColor: c.separator, borderBottomWidth: g.lineWidth, paddingBottom: 6, marginBottom: 8 }}>
      <Text minPresenceAhead={type.baseSize * 4} style={{ lineHeight: line(type.headingSize), color: c.accent, fontFamily: type.headingFont, fontSize: type.headingSize, fontWeight: 700, letterSpacing: 1.2 }}>{section.title.toLocaleUpperCase('pl')}</Text>
    </View>}
    {sectionContent(section.id)}
  </View>;
  const multiColumn = t.layout !== 'single';
  const tail = sections.at(-1);
  const footer = multiColumn && tail?.id === 'consent' && tail.column === 'main' ? tail : undefined;
  const main = sections.filter(s => s.column === 'main' && s !== footer);
  const side = sections.filter(s => s.column === 'sidebar' && s !== footer);
  const sidebarWidth = t.layout === 'grid' ? 47 : t.sidebarWidth;
  const leftSide = t.layout === 'sidebar-left' || t.layout === 'grid';
  const sidebarColumn = <View style={{ width: `${sidebarWidth}%`, backgroundColor: c.sidebar, padding: 10, borderRadius: g.radius }}>{side.map(renderSection)}</View>;
  const mainColumn = <View style={{ flex: 1 }}>{main.map(renderSection)}</View>;
  return <Document title={`${fullName(data)} — CV`} author={fullName(data)} subject="Curriculum vitae" language="pl-PL" creator="Folio Resume Studio">
    <Page size="A4" wrap style={{ paddingTop: mmToPt(g.margins.top), paddingRight: mmToPt(g.margins.right), paddingBottom: mmToPt(g.margins.bottom), paddingLeft: mmToPt(g.margins.left), fontFamily: type.fontFamily, fontSize: type.baseSize, letterSpacing: type.tracking, color: c.text, backgroundColor: c.background }}>
      <View style={{ borderLeftWidth: t.layout === 'single' ? 0 : 3, borderLeftColor: c.accent, paddingLeft: t.layout === 'single' ? 0 : 15, marginBottom: 18 }}>
        <Text style={{ fontFamily: type.headingFont, fontSize: type.nameSize, fontWeight: 700, lineHeight: `${type.nameSize * 1.15}pt`, letterSpacing: -0.5 }}>{fullName(data)}</Text>
        <Text style={{ lineHeight: line(), color: c.accent, fontSize: type.baseSize + 3, marginTop: 7, marginBottom: 9 }}>{data.personal.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, fontSize: type.baseSize - 1, color: c.muted }}>
          {[data.personal.location, data.personal.email, data.personal.phone, data.personal.website].filter(Boolean).map((value, i) => <Text key={i} style={{ lineHeight: line(type.baseSize - 1) }}>{i > 0 ? '  ·  ' : ''}{value.includes('@') ? link(value, `mailto:${value}`) : value === data.personal.website ? link(urlLabel(value), value) : value}</Text>)}
        </View>
      </View>
      {multiColumn ? <View style={{ flexDirection: 'row', gap: g.columnGap }}>
        {leftSide ? <>{sidebarColumn}{mainColumn}</> : <>{mainColumn}{sidebarColumn}</>}
      </View> : sections.map(renderSection)}
      {footer && renderSection(footer)}
      <Text fixed style={{ position: 'absolute', bottom: mmToPt(g.margins.bottom) / 2 - 4, right: mmToPt(g.margins.right), width: 70, height: 10, textAlign: 'right', fontSize: 7, color: c.muted }} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}
