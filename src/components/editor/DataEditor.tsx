import { Plus, CornerDownRight, X } from 'lucide-react';
import type { Bullet, ResumeData, SectionId } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { uid } from '../../lib/format';
import { AddButton, Field, ItemCard, SelectField } from './Fields';

export function PersonalEditor() {
  const personal = useResumeStore(state => state.data.personal); const update = useResumeStore(state => state.updatePersonal);
  return <div className="form-content"><div className="field-grid"><Field label="Imię" value={personal.firstName} onChange={firstName => update({ firstName })} /><Field label="Nazwisko" value={personal.lastName} onChange={lastName => update({ lastName })} /></div>
    <Field label="Stanowisko / tytuł zawodowy" value={personal.title} onChange={title => update({ title })} placeholder="np. Senior Product Designer" />
    <Field label="Adres e-mail" type="email" value={personal.email} onChange={email => update({ email })} />
    <div className="field-grid"><Field label="Telefon" type="tel" value={personal.phone} onChange={phone => update({ phone })} /><Field label="Lokalizacja" value={personal.location} onChange={location => update({ location })} /></div>
    <Field label="Strona internetowa" value={personal.website} onChange={website => update({ website })} placeholder="twojeportfolio.pl" />
    <div className="editor-note"><span className="note-dot" />Pisz konkretnie. Twoje doświadczenie robi różnicę.</div>
  </div>;
}
function BulletsEditor({ bullets, onChange, depth = 0 }: { bullets: Bullet[]; onChange: (items: Bullet[]) => void; depth?: number }) {
  return <div className="bullets-editor"><span className="mini-label">{depth === 0 ? 'Osiągnięcia i obowiązki' : 'Podpunkty'}</span>
    {bullets.map((bullet, index) => <div className="bullet-edit" key={bullet.id}><div className="bullet-row"><span className="bullet-marker">•</span><textarea aria-label={`Punkt ${index + 1}, poziom ${depth + 1}`} rows={2} value={bullet.text} maxLength={20000} onChange={event => onChange(bullets.map(item => item.id === bullet.id ? { ...item, text: event.target.value } : item))} />
      <div className="bullet-actions">{depth < 3 && <button className="icon-button" aria-label="Dodaj podpunkt" onClick={() => onChange(bullets.map(item => item.id === bullet.id ? { ...item, children: [...item.children, { id: uid(), text: '', children: [] }] } : item))}><CornerDownRight size={13} /></button>}
      <button className="icon-button danger" aria-label="Usuń punkt" onClick={() => onChange(bullets.filter(item => item.id !== bullet.id))}><X size={13} /></button></div></div>
      {bullet.children.length > 0 && <BulletsEditor depth={depth + 1} bullets={bullet.children} onChange={children => onChange(bullets.map(item => item.id === bullet.id ? { ...item, children } : item))} />}
    </div>)}
    <button className="text-button" onClick={() => onChange([...bullets, { id: uid(), text: '', children: [] }])}><Plus size={13} />Dodaj punkt</button>
    {depth === 0 && <small className="muted">Użyj **tekstu**, aby wyróżnić wynik pogrubieniem.</small>}
  </div>;
}
export function SectionEditor({ section }: { section: SectionId }) {
  const data = useResumeStore(state => state.data); const setData = useResumeStore(state => state.setData);
  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => setData({ ...data, [key]: value });
  switch (section) {
    case 'summary': return <div className="form-content"><Field label="Podsumowanie zawodowe" multiline value={data.summary} onChange={value => set('summary', value)} hint="3–4 zdania o doświadczeniu, mocnych stronach i kierunku rozwoju. Możesz użyć **pogrubienia**." /></div>;
    case 'consent': return <div className="form-content"><Field label="Treść klauzuli" multiline value={data.consent} onChange={value => set('consent', value)} hint="Dostosuj treść do wymagań ogłoszenia rekrutacyjnego." /></div>;
    case 'experience': return <div className="form-content">{data.experience.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('experience', data.experience.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.company || `Doświadczenie ${index + 1}`} onDelete={() => set('experience', data.experience.filter(entry => entry.id !== item.id))}>
        <Field label="Stanowisko" value={item.role} onChange={role => update({ role })} /><Field label="Firma" value={item.company} onChange={company => update({ company })} />
        <Field label="Lokalizacja / tryb pracy" value={item.location} onChange={location => update({ location })} />
        <div className="field-grid"><Field label="Od" placeholder="2022-03" value={item.startDate} onChange={startDate => update({ startDate })} />{!item.current && <Field label="Do" placeholder="2024-06" value={item.endDate} onChange={endDate => update({ endDate })} />}</div>
        <label className="check-field"><input type="checkbox" checked={item.current} onChange={event => update({ current: event.target.checked })} />Nadal tutaj pracuję</label>
        <Field label="Opis roli" multiline value={item.description} onChange={description => update({ description })} />
        <BulletsEditor bullets={item.bullets} onChange={bullets => update({ bullets })} />
      </ItemCard>;
    })}<AddButton onClick={() => set('experience', [...data.experience, { id: uid(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, description: '', bullets: [] }])}>Dodaj doświadczenie</AddButton></div>;
    case 'education': return <div className="form-content">{data.education.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('education', data.education.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.institution || `Edukacja ${index + 1}`} onDelete={() => set('education', data.education.filter(entry => entry.id !== item.id))}>
        <Field label="Uczelnia / szkoła" value={item.institution} onChange={institution => update({ institution })} /><Field label="Stopień / tytuł" value={item.degree} onChange={degree => update({ degree })} /><Field label="Kierunek" value={item.field} onChange={field => update({ field })} />
        <div className="field-grid"><Field label="Od" value={item.startDate} onChange={startDate => update({ startDate })} /><Field label="Do" value={item.endDate} onChange={endDate => update({ endDate })} /></div>
        <Field label="Dodatkowe informacje" multiline value={item.description} onChange={description => update({ description })} />
      </ItemCard>;
    })}<AddButton onClick={() => set('education', [...data.education, { id: uid(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' }])}>Dodaj edukację</AddButton></div>;
    case 'skills': return <div className="form-content">{data.skills.map((category, index) => {
      const update = (patch: Partial<typeof category>) => set('skills', data.skills.map(entry => entry.id === category.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={category.id} title={category.name || `Kategoria ${index + 1}`} onDelete={() => set('skills', data.skills.filter(entry => entry.id !== category.id))}>
        <Field label="Nazwa kategorii" value={category.name} onChange={name => update({ name })} />
        {category.skills.map(skill => <div className="skill-edit" key={skill.id}><input aria-label="Nazwa umiejętności" value={skill.name} maxLength={300} onChange={event => update({ skills: category.skills.map(s => s.id === skill.id ? { ...s, name: event.target.value } : s) })} />
          <select aria-label={`Poziom: ${skill.name || 'umiejętność'}`} value={skill.level ?? 0} onChange={event => update({ skills: category.skills.map(s => s.id === skill.id ? { ...s, level: Number(event.target.value) || undefined } : s) })}><option value={0}>Bez poziomu</option>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{level}/5</option>)}</select>
          <button className="icon-button danger" aria-label={`Usuń umiejętność ${skill.name}`} onClick={() => update({ skills: category.skills.filter(s => s.id !== skill.id) })}><X size={13} /></button></div>)}
        <button className="text-button" onClick={() => update({ skills: [...category.skills, { id: uid(), name: '' }] })}><Plus size={13} />Dodaj umiejętność</button>
      </ItemCard>;
    })}<AddButton onClick={() => set('skills', [...data.skills, { id: uid(), name: '', skills: [] }])}>Dodaj kategorię</AddButton></div>;
    case 'projects': return <div className="form-content">{data.projects.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('projects', data.projects.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.name || `Projekt ${index + 1}`} onDelete={() => set('projects', data.projects.filter(entry => entry.id !== item.id))}>
        <Field label="Nazwa projektu" value={item.name} onChange={name => update({ name })} /><Field label="Rola / data" value={item.role} onChange={role => update({ role })} /><Field label="Adres projektu" value={item.url} onChange={url => update({ url })} /><Field label="Opis" multiline value={item.description} onChange={description => update({ description })} />
        <Field label="Technologie / tagi" value={item.technologies.join(', ')} onChange={value => update({ technologies: value.split(',').map(v => v.trim()) })} hint="Oddziel tagi przecinkami." /><BulletsEditor bullets={item.bullets} onChange={bullets => update({ bullets })} />
      </ItemCard>;
    })}<AddButton onClick={() => set('projects', [...data.projects, { id: uid(), name: '', role: '', url: '', description: '', technologies: [], bullets: [] }])}>Dodaj projekt</AddButton></div>;
    case 'certificates': return <div className="form-content">{data.certificates.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('certificates', data.certificates.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.name || `Certyfikat ${index + 1}`} onDelete={() => set('certificates', data.certificates.filter(entry => entry.id !== item.id))}>
        <Field label="Nazwa certyfikatu" value={item.name} onChange={name => update({ name })} /><Field label="Organizacja" value={item.issuer} onChange={issuer => update({ issuer })} /><Field label="Data" value={item.date} onChange={date => update({ date })} /><Field label="Link do certyfikatu" value={item.url} onChange={url => update({ url })} />
      </ItemCard>;
    })}<AddButton onClick={() => set('certificates', [...data.certificates, { id: uid(), name: '', issuer: '', date: '', url: '' }])}>Dodaj certyfikat</AddButton></div>;
    case 'languages': return <div className="form-content">{data.languages.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('languages', data.languages.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.name || `Język ${index + 1}`} onDelete={() => set('languages', data.languages.filter(entry => entry.id !== item.id))}><Field label="Język" value={item.name} onChange={name => update({ name })} />
        <Field label="Poziom biegłości" value={item.level} onChange={level => update({ level })} placeholder="np. C1 · zaawansowany" />
        <SelectField label="Wybierz poziom CEFR" value="" onChange={level => { if (level) update({ level }); }} options={[{ value: '', label: 'Własny opis lub wybierz…' }, ...['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Ojczysty'].map(value => ({ value, label: value }))]} />
      </ItemCard>;
    })}<AddButton onClick={() => set('languages', [...data.languages, { id: uid(), name: '', level: '' }])}>Dodaj język</AddButton></div>;
    case 'links': return <div className="form-content">{data.links.map((item, index) => {
      const update = (patch: Partial<typeof item>) => set('links', data.links.map(entry => entry.id === item.id ? { ...entry, ...patch } : entry));
      return <ItemCard key={item.id} title={item.label || `Profil ${index + 1}`} onDelete={() => set('links', data.links.filter(entry => entry.id !== item.id))}><Field label="Nazwa profilu" value={item.label} onChange={label => update({ label })} /><Field label="Adres URL" value={item.url} onChange={url => update({ url })} /></ItemCard>;
    })}<AddButton onClick={() => set('links', [...data.links, { id: uid(), label: '', url: '' }])}>Dodaj link</AddButton></div>;
  }
}
