import { Columns2, PanelLeft, PanelRight, Rows3, RotateCcw } from 'lucide-react';
import type { FontName, LayoutName, ResumeTheme } from '../../types/resume';
import { fontNames } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { defaultTheme } from '../../data/presets';
import { Group, SelectField, Slider } from './Fields';

export const layouts: { id: LayoutName; label: string; icon: typeof Rows3 }[] = [{ id: 'single', label: 'Jedna kolumna', icon: Rows3 }, { id: 'sidebar-left', label: 'Lewa belka', icon: PanelLeft }, { id: 'sidebar-right', label: 'Prawa belka', icon: PanelRight }, { id: 'grid', label: 'Modern Grid', icon: Columns2 }];
export function LayoutEditor() {
  const theme = useResumeStore(state => state.theme); const update = useResumeStore(state => state.updateTheme);
  return <Group title="Układ strony" description="Daj swojej historii odpowiednią przestrzeń."><div className="layout-options">{layouts.map(({ id, label, icon: Icon }) => <button key={id} className={`layout-option ${theme.layout === id ? 'selected' : ''}`} aria-pressed={theme.layout === id} onClick={() => update({ layout: id })}><Icon size={26} strokeWidth={1.2} /><span>{label}</span></button>)}</div>
    {theme.layout !== 'single' && theme.layout !== 'grid' && <Slider label="Szerokość kolumny bocznej" value={theme.sidebarWidth} min={25} max={45} unit="%" onChange={sidebarWidth => update({ sidebarWidth })} />}
    <SelectField label="Wygląd umiejętności" value={theme.skillStyle} onChange={skillStyle => update({ skillStyle: skillStyle as ResumeTheme['skillStyle'] })} options={[{ value: 'text', label: 'Prosta lista' }, { value: 'tags', label: 'Tagi' }, { value: 'levels', label: 'Lista z poziomami' }]} />
  </Group>;
}
export function ThemeEditor() {
  const theme = useResumeStore(state => state.theme); const update = useResumeStore(state => state.updateTheme);
  const type = <K extends keyof ResumeTheme['typography']>(key: K, value: ResumeTheme['typography'][K]) => update({ typography: { ...theme.typography, [key]: value } });
  const geometry = <K extends keyof ResumeTheme['geometry']>(key: K, value: ResumeTheme['geometry'][K]) => update({ geometry: { ...theme.geometry, [key]: value } });
  const palette = ['#25564a', '#293b57', '#ae5b3c', '#6b567d', '#282828', '#37778c'];
  const colorLabels: Record<keyof ResumeTheme['colors'], string> = { accent: 'Akcent', background: 'Tło strony', text: 'Tekst główny', muted: 'Tekst pomocniczy', separator: 'Separatory', sidebar: 'Tło kolumny' };
  return <div className="theme-editor">
    <Group title="Nagłówek i zdjęcie" description="Każdy szablon ma własny kadr i kompozycję.">
      <SelectField label="Styl nagłówka" value={theme.headerStyle} onChange={value => update({ headerStyle: value as ResumeTheme['headerStyle'] })} options={[{ value: 'accent', label: 'Boczny akcent' }, { value: 'banner', label: 'Kolorowy baner' }, { value: 'centered', label: 'Wyśrodkowany' }]} />
      <SelectField label="Styl tytułów sekcji" value={theme.sectionStyle} onChange={value => update({ sectionStyle: value as ResumeTheme['sectionStyle'] })} options={[{ value: 'underline', label: 'Z separatorem' }, { value: 'filled', label: 'Kolorowe etykiety' }, { value: 'plain', label: 'Czysta typografia' }]} />
      <label className="check-field"><input type="checkbox" checked={theme.photo.isVisible} onChange={event => update({ photo: { ...theme.photo, isVisible: event.target.checked } })} />Pokaż zdjęcie lub ramkę</label>
      <div className="field-grid"><SelectField label="Kształt zdjęcia" value={theme.photo.shape} onChange={value => update({ photo: { ...theme.photo, shape: value as ResumeTheme['photo']['shape'] } })} options={[{ value: 'circle', label: 'Koło' }, { value: 'rounded', label: 'Zaokrąglone' }, { value: 'square', label: 'Kwadrat' }]} /><SelectField label="Pozycja zdjęcia" value={theme.photo.position} onChange={value => update({ photo: { ...theme.photo, position: value as ResumeTheme['photo']['position'] } })} options={[{ value: 'left', label: 'Po lewej' }, { value: 'right', label: 'Po prawej' }]} /></div>
      <Slider label="Rozmiar zdjęcia" value={theme.photo.size} min={20} max={40} unit="mm" onChange={size => update({ photo: { ...theme.photo, size } })} />
    </Group>
    <Group title="Paleta kolorów" description="Jeden dobry akcent potrafi zmienić wszystko."><div className="palette">{palette.map(color => <button key={color} title={color} aria-label={`Akcent ${color}`} aria-pressed={theme.colors.accent === color} style={{ backgroundColor: color }} className={`color-swatch ${theme.colors.accent === color ? 'selected' : ''}`} onClick={() => update({ colors: { ...theme.colors, accent: color } })} />)}</div>
      <div className="color-grid">{(Object.keys(colorLabels) as (keyof ResumeTheme['colors'])[]).map(key => <label className="color-field" key={key}><span>{colorLabels[key]}</span><div><input aria-label={colorLabels[key]} type="color" value={theme.colors[key]} onChange={event => update({ colors: { ...theme.colors, [key]: event.target.value } })} /><span>{theme.colors[key].toUpperCase()}</span></div></label>)}</div>
    </Group>
    <Group title="Typografia"><div className="field-grid"><SelectField label="Tekst główny" value={theme.typography.fontFamily} options={fontNames.map(value => ({ value, label: value }))} onChange={value => type('fontFamily', value as FontName)} /><SelectField label="Nagłówki" value={theme.typography.headingFont} options={fontNames.map(value => ({ value, label: value }))} onChange={value => type('headingFont', value as FontName)} /></div>
      <Slider label="Rozmiar tekstu" value={theme.typography.baseSize} min={8} max={14} step={0.5} unit="pt" onChange={value => type('baseSize', value)} />
      <Slider label="Rozmiar nagłówków" value={theme.typography.headingSize} min={10} max={20} step={0.5} unit="pt" onChange={value => type('headingSize', value)} />
      <Slider label="Rozmiar imienia i nazwiska" value={theme.typography.nameSize} min={20} max={44} unit="pt" onChange={value => type('nameSize', value)} />
      <Slider label="Interlinia" value={theme.typography.lineHeight} min={1.1} max={1.9} step={0.05} onChange={value => type('lineHeight', value)} />
      <Slider label="Odstęp między literami" value={theme.typography.tracking} min={-0.2} max={2} step={0.1} unit="pt" onChange={value => type('tracking', value)} />
    </Group>
    <Group title="Marginesy i odstępy" description="Marginesy A4 podane w milimetrach.">
      {(['top', 'bottom', 'left', 'right'] as const).map((key, i) => <Slider key={key} label={['Górny', 'Dolny', 'Lewy', 'Prawy'][i]} value={theme.geometry.margins[key]} min={8} max={30} unit="mm" onChange={value => geometry('margins', { ...theme.geometry.margins, [key]: value })} />)}
      <Slider label="Odstęp między sekcjami" value={theme.geometry.sectionGap} min={6} max={28} unit="pt" onChange={value => geometry('sectionGap', value)} />
      <Slider label="Odstęp między wpisami" value={theme.geometry.blockGap} min={3} max={18} unit="pt" onChange={value => geometry('blockGap', value)} />
      <Slider label="Padding sekcji" value={theme.geometry.sectionPadding} min={0} max={12} unit="pt" onChange={value => geometry('sectionPadding', value)} />
      <Slider label="Odstęp między kolumnami" value={theme.geometry.columnGap} min={8} max={30} unit="pt" onChange={value => geometry('columnGap', value)} />
    </Group>
    <Group title="Detale"><Slider label="Zaokrąglenia" value={theme.geometry.radius} min={0} max={12} unit="pt" onChange={value => geometry('radius', value)} /><Slider label="Grubość separatorów" value={theme.geometry.lineWidth} min={0} max={3} step={0.1} unit="pt" onChange={value => geometry('lineWidth', value)} /></Group>
    <button className="secondary-button full-width" onClick={() => update(structuredClone(defaultTheme))}><RotateCcw size={14} />Przywróć domyślny wygląd</button>
  </div>;
}
