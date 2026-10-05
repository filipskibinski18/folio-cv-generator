import { tr } from '../../lib/i18n';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cleanUrl } from '../../lib/format';

export function Field({ label, value, onChange, multiline = false, placeholder, hint, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string; hint?: string; type?: string }) {
  return <label className="field"><span>{tr(label)}</span>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={tr(placeholder)} rows={4} maxLength={20000} /> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={tr(placeholder)} maxLength={300} />}{hint && <small>{tr(hint)}</small>}</label>;
}
/** URL input that tidies pasted links (whitespace, tracking parameters) instead of storing them verbatim. */
export function UrlField({ label, value, onChange, placeholder = 'np. linkedin.com/in/twoj-profil' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="field"><span>{tr(label)}</span><input type="text" inputMode="url" autoComplete="url" spellCheck={false} value={value} placeholder={tr(placeholder)} maxLength={300}
    onChange={event => onChange(event.target.value)}
    onPaste={event => {
      const input = event.currentTarget;
      if (input.selectionStart !== 0 || input.selectionEnd !== input.value.length) return;
      event.preventDefault();
      onChange(cleanUrl(event.clipboardData.getData('text')).slice(0, 300));
    }}
    onBlur={() => { const cleaned = cleanUrl(value); if (cleaned !== value) onChange(cleaned); }} /></label>;
}
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="field"><span>{tr(label)}</span><select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{tr(option.label)}</option>)}</select></label>;
}
export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  const id = useId();
  return <label className="slider-field" htmlFor={id}><span>{tr(label)}<output>{value}{unit && ` ${unit}`}</output></span><input id={id} aria-label={tr(label)} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="control-group"><div className="group-heading"><h3>{tr(title)}</h3>{description && <p>{tr(description)}</p>}</div>{children}</section>;
}
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" className="add-button" onClick={onClick}><Plus size={15} />{children}</button>;
}
export function ItemCard({ title, onDelete, children }: { title: string; onDelete: () => void; children: ReactNode }) {
  return <div className="item-card"><div className="item-card-heading"><span>{tr(title)}</span><button type="button" className="icon-button danger" aria-label={`${tr('Usuń')} ${tr(title)}`} onClick={onDelete}><Trash2 size={14} /></button></div>{children}</div>;
}
