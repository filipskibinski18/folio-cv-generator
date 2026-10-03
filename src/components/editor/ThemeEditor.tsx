import { tr } from '../../lib/i18n';
import { Columns2, PanelLeft, PanelRight, Rows3, RotateCcw } from 'lucide-react';
import type { FontName, LayoutName, ResumeTheme } from '../../types/resume';
import { fontNames } from '../../types/resume';
import { useResumeStore } from '../../store/useResumeStore';
import { defaultTheme } from '../../data/presets';
import { Group, SelectField, Slider } from './Fields';
import { withCvLanguage } from '../../lib/cvLanguage';

export const layouts: { id: LayoutName; label: string; icon: typeof Rows3 }[] = [{ id: 'single', label: 'Jedna kolumna', icon: Rows3 }, { id: 'sidebar-left', label: 'Lewa belka', icon: PanelLeft }, { id: 'sidebar-right', label: 'Prawa belka', icon: PanelRight }, { id: 'grid', label: 'Modern Grid', icon: Columns2 }];
export function LayoutEditor() {
  const theme = useResumeStore(state => state.theme); const update = useResumeStore(state => state.updateTheme);
  return <Group title={tr("Układ strony")} description={tr("Daj swojej historii odpowiednią przestrzeń.")}><div className="layout-options">{layouts.map(({ id, label, icon: Icon }) => <button key={id} className={`layout-option ${theme.layout === id ? 'selected' : ''}`} aria-pressed={theme.layout === id} onClick={() => update({ layout: id })}><Icon size={26} strokeWidth={1.2} /><span>{tr(label)}</span></button>)}</div>
    {theme.layout !== 'single' && theme.layout !== 'grid' && <Slider label={tr("Szerokość kolumny bocznej")} value={theme.sidebarWidth} min={25} max={45} unit="%" onChange={sidebarWidth => update({ sidebarWidth })} />}
    <SelectField label={tr("Wygląd umiejętności")} value={theme.skillStyle} onChange={skillStyle => update({ skillStyle: skillStyle as ResumeTheme['skillStyle'] })} options={[{ value: 'text', label: 'Prosta lista' }, { value: 'tags', label: 'Tagi' }, { value: 'levels', label: 'Lista z poziomami' }]} />
    <label className="section-pagination-toggle"><input type="checkbox" role="switch" checked={theme.keepSectionsTogether} onChange={event => update({ keepSectionsTogether: event.target.checked })} /><span><strong>{tr('Przenoś całe sekcje')}</strong><small>{tr('Sekcja, która nie mieści się na stronie, zacznie się na kolejnej. Dotyczy również kolumn. Sekcje dłuższe od strony mogą się dzielić.')}</small></span></label>
  </Group>;
}
export function ThemeEditor() {
  const theme = useResumeStore(state => state.theme); const update = useResumeStore(state => state.updateTheme);
  const type = <K extends keyof ResumeTheme['typography']>(key: K, value: ResumeTheme['typography'][K]) => update({ typography: { ...theme.typography, [key]: value } });
  const geometry = <K extends keyof ResumeTheme['geometry']>(key: K, value: ResumeTheme['geometry'][K]) => update({ geometry: { ...theme.geometry, [key]: value } });
  const design = <K extends keyof ResumeTheme['design']>(key: K, value: ResumeTheme['design'][K]) => update({ design: { ...theme.design, [key]: value } });
  const palette = ['#25564a', '#293b57', '#ae5b3c', '#6b567d', '#282828', '#37778c'];
  const colorLabels: Record<keyof ResumeTheme['colors'], string> = { accent: 'Akcent', background: 'Tło strony', text: 'Tekst główny', muted: 'Tekst pomocniczy', separator: 'Separatory', sidebar: 'Tło kolumny' };
  return <div className="theme-editor">
    <Group title="Kompozycja i detale graficzne" description="Dopasuj styl niezależnie od wybranego szablonu.">
      <SelectField label="Wygląd wpisów" value={theme.design.entryStyle} onChange={value => design('entryStyle', value as ResumeTheme['design']['entryStyle'])} options={[{ value: 'plain', label: 'Proste bloki' }, { value: 'timeline', label: 'Oś czasu' }, { value: 'table', label: 'Tabela z kolumną dat' }, { value: 'cards', label: 'Karty' }]} />
      <SelectField label="Dekoracje strony" value={theme.design.decoration} onChange={value => design('decoration', value as ResumeTheme['design']['decoration'])} options={[{ value: 'none', label: 'Bez dekoracji' }, { value: 'rule', label: 'Linia akcentu' }, { value: 'frame', label: 'Ramka' }, { value: 'corner', label: 'Geometryczne narożniki' }, { value: 'orbit', label: 'Orbity' }, { value: 'dots', label: 'Mozaika kropek' }]} />
      <SelectField label="Zapis imienia i nazwiska" value={theme.design.nameStyle} onChange={value => design('nameStyle', value as ResumeTheme['design']['nameStyle'])} options={[{ value: 'natural', label: 'Naturalny' }, { value: 'uppercase', label: 'Wielkie litery' }, { value: 'stacked', label: 'W dwóch wierszach' }]} />
      <SelectField label="Dane kontaktowe" value={theme.design.contactPlacement} onChange={value => design('contactPlacement', value as ResumeTheme['design']['contactPlacement'])} options={[{ value: 'header', label: 'W nagłówku' }, { value: 'sidebar', label: 'W kolumnie bocznej' }]} />
      <label className="check-field"><input type="checkbox" checked={theme.design.contactIcons} onChange={event => design('contactIcons', event.target.checked)} />{tr('Ikonki przy danych kontaktowych')}</label>
      {theme.skillStyle === 'levels' && <SelectField label="Oznaczenie poziomów" value={theme.design.skillMeter} onChange={value => design('skillMeter', value as ResumeTheme['design']['skillMeter'])} options={[{ value: 'numbers', label: 'Liczby' }, { value: 'dots', label: 'Kropki' }, { value: 'bars', label: 'Paski' }]} />}
    </Group>
    <Group title={tr("Język i ikonki")}>
      <SelectField label={tr("Język CV")} value={theme.language} options={[{ value: 'pl', label: 'Polski' }, { value: 'en', label: 'English' }]} onChange={value => update(withCvLanguage(theme, value as 'pl' | 'en'))} />
      <p className="panel-footnote">{tr("Język CV zmienia nagłówki i daty. Treść wpisów możesz edytować samodzielnie.")}</p>
      <SelectField label={tr("Styl ikonek")} value={theme.icons.style} options={[{ value: 'none', label: 'Bez ikonek' }, { value: 'outline', label: 'Konturowe' }, { value: 'circle', label: 'Okrągłe plakietki' }, { value: 'square', label: 'Kwadratowe plakietki' }]} onChange={value => update({ icons: { ...theme.icons, style: value as ResumeTheme['icons']['style'] } })} />
      {theme.icons.style !== 'none' && <Slider label={tr("Rozmiar ikonek")} value={theme.icons.size} min={10} max={22} unit="pt" onChange={size => update({ icons: { ...theme.icons, size } })} />}
    </Group>
    <Group title={tr("Nagłówek i zdjęcie")} description={tr("Każdy szablon ma własny kadr i kompozycję.")}>
      <SelectField label={tr("Styl nagłówka")} value={theme.headerStyle} onChange={value => update({ headerStyle: value as ResumeTheme['headerStyle'] })} options={[{ value: 'accent', label: 'Boczny akcent' }, { value: 'banner', label: 'Kolorowy baner' }, { value: 'centered', label: 'Wyśrodkowany' }]} />
      <SelectField label={tr("Styl tytułów sekcji")} value={theme.sectionStyle} onChange={value => update({ sectionStyle: value as ResumeTheme['sectionStyle'] })} options={[{ value: 'underline', label: 'Z separatorem' }, { value: 'filled', label: 'Kolorowe etykiety' }, { value: 'plain', label: 'Czysta typografia' }]} />
      <label className="check-field"><input type="checkbox" checked={theme.photo.isVisible} onChange={event => update({ photo: { ...theme.photo, isVisible: event.target.checked } })} />{tr("Pokaż zdjęcie lub ramkę")}</label>
      <div className="field-grid">
        <SelectField
          label={tr("Kształt zdjęcia")}
          value={theme.photo.shape}
          onChange={value => update({ photo: { ...theme.photo, shape: value as ResumeTheme['photo']['shape'] } })}
          options={[
            { value: 'circle', label: 'Koło (1:1)' },
            { value: 'portrait-rounded', label: 'Portret zaokrąglony (3:4)' },
            { value: 'portrait', label: 'Portret prostokątny (3:4)' },
            { value: 'rounded', label: 'Zaokrąglony kwadrat (1:1)' },
            { value: 'square', label: 'Kwadrat (1:1)' },
          ]}
        />
        <SelectField
          label={tr("Pozycja zdjęcia")}
          value={theme.photo.position}
          onChange={value => update({ photo: { ...theme.photo, position: value as ResumeTheme['photo']['position'] } })}
          options={[
            { value: 'sidebar', label: 'Lewy górny róg (kolumna boczna)' },
            { value: 'left', label: 'Nagłówek — po lewej' },
            { value: 'right', label: 'Nagłówek — po prawej' },
            { value: 'center', label: 'Nagłówek — na środku' },
          ]}
        />
      </div>
      <Slider label={tr("Rozmiar zdjęcia")} value={theme.photo.size} min={16} max={70} unit="mm" onChange={size => update({ photo: { ...theme.photo, size } })} />
      <div className="field-grid">
        <SelectField
          label={tr("Grubość ramki zdjęcia")}
          value={String(theme.photo.borderWidth ?? 1)}
          onChange={val => update({ photo: { ...theme.photo, borderWidth: Number(val) } })}
          options={[
            { value: '0', label: 'Brak ramki' },
            { value: '1', label: 'Cienka (1 pt)' },
            { value: '2', label: 'Średnia (2 pt)' },
            { value: '3', label: 'Gruba (3 pt)' },
            { value: '4', label: 'Bardzo gruba (4 pt)' },
          ]}
        />
        <SelectField
          label={tr("Kolor ramki zdjęcia")}
          value={theme.photo.borderColor ?? 'auto'}
          onChange={val => update({ photo: { ...theme.photo, borderColor: val as any } })}
          options={[
            { value: 'auto', label: 'Automatyczny' },
            { value: 'white', label: 'Biały' },
            { value: 'accent', label: 'Kolor akcentu' },
            { value: 'separator', label: 'Kolor separatora' },
          ]}
        />
      </div>
    </Group>
    <Group title={tr("Paleta kolorów")} description={tr("Jeden dobry akcent potrafi zmienić wszystko.")}><div className="palette">{palette.map(color => <button key={color} title={color} aria-label={`${tr('Akcent')} ${color}`} aria-pressed={theme.colors.accent === color} style={{ backgroundColor: color }} className={`color-swatch ${theme.colors.accent === color ? 'selected' : ''}`} onClick={() => update({ colors: { ...theme.colors, accent: color } })} />)}</div>
      <div className="color-grid">{(Object.keys(colorLabels) as (keyof ResumeTheme['colors'])[]).map(key => <label className="color-field" key={key}><span>{tr(colorLabels[key])}</span><div><input aria-label={tr(colorLabels[key])} type="color" value={theme.colors[key]} onChange={event => update({ colors: { ...theme.colors, [key]: event.target.value } })} /><span>{theme.colors[key].toUpperCase()}</span></div></label>)}</div>
    </Group>
    <Group title={tr("Typografia")}><div className="field-grid"><SelectField label={tr("Tekst główny")} value={theme.typography.fontFamily} options={fontNames.map(value => ({ value, label: value === 'PlayfairDisplay' ? 'Playfair Display' : value === 'SourceSans3' ? 'Source Sans 3' : value === 'CormorantGaramond' ? 'Cormorant Garamond' : value }))} onChange={value => type('fontFamily', value as FontName)} /><SelectField label={tr("Nagłówki")} value={theme.typography.headingFont} options={fontNames.map(value => ({ value, label: value === 'PlayfairDisplay' ? 'Playfair Display' : value === 'SourceSans3' ? 'Source Sans 3' : value === 'CormorantGaramond' ? 'Cormorant Garamond' : value }))} onChange={value => type('headingFont', value as FontName)} /></div>
      <Slider label={tr("Rozmiar tekstu")} value={theme.typography.baseSize} min={8} max={14} step={0.5} unit="pt" onChange={value => type('baseSize', value)} />
      <Slider label={tr("Rozmiar nagłówków")} value={theme.typography.headingSize} min={10} max={20} step={0.5} unit="pt" onChange={value => type('headingSize', value)} />
      <Slider label={tr("Rozmiar imienia i nazwiska")} value={theme.typography.nameSize} min={20} max={44} unit="pt" onChange={value => type('nameSize', value)} />
      <Slider label={tr("Interlinia")} value={theme.typography.lineHeight} min={1.1} max={1.9} step={0.05} onChange={value => type('lineHeight', value)} />
      <Slider label={tr("Odstęp między literami")} value={theme.typography.tracking} min={-0.2} max={2} step={0.1} unit="pt" onChange={value => type('tracking', value)} />
    </Group>
    <Group title={tr("Marginesy i odstępy")} description={tr("Marginesy A4 podane w milimetrach.")}>
      {(['top', 'bottom', 'left', 'right'] as const).map((key, i) => <Slider key={key} label={[tr("Górny"), 'Dolny', 'Lewy', 'Prawy'][i]} value={theme.geometry.margins[key]} min={8} max={30} unit="mm" onChange={value => geometry('margins', { ...theme.geometry.margins, [key]: value })} />)}
      <Slider label={tr("Odstęp między sekcjami")} value={theme.geometry.sectionGap} min={6} max={28} unit="pt" onChange={value => geometry('sectionGap', value)} />
      <Slider label={tr("Odstęp między wpisami")} value={theme.geometry.blockGap} min={3} max={18} unit="pt" onChange={value => geometry('blockGap', value)} />
      <Slider label={tr("Padding sekcji")} value={theme.geometry.sectionPadding} min={0} max={12} unit="pt" onChange={value => geometry('sectionPadding', value)} />
      <Slider label={tr("Odstęp między kolumnami")} value={theme.geometry.columnGap} min={8} max={30} unit="pt" onChange={value => geometry('columnGap', value)} />
      <Slider label="Wewnętrzny odstęp kolumny bocznej" value={theme.design.sidebarPadding} min={8} max={24} unit="pt" onChange={value => design('sidebarPadding', value)} />
      <Slider label="Odstęp nad treścią na każdej stronie" value={theme.design.continuationGap} min={18} max={40} unit="pt" onChange={value => design('continuationGap', value)} />
    </Group>
    <Group title={tr("Detale")}><Slider label={tr("Zaokrąglenia")} value={theme.geometry.radius} min={0} max={12} unit="pt" onChange={value => geometry('radius', value)} /><Slider label={tr("Grubość separatorów")} value={theme.geometry.lineWidth} min={0} max={3} step={0.1} unit="pt" onChange={value => geometry('lineWidth', value)} /></Group>
    <button className="secondary-button full-width" onClick={() => update(structuredClone(defaultTheme))}><RotateCcw size={14} />{tr("Przywróć domyślny wygląd")}</button>
  </div>;
}
