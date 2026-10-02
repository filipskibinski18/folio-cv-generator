import type { ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export function Field({ label, value, onChange, multiline = false, placeholder, hint, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; placeholder?: string; hint?: string; type?: string }) {
  return <label className="field"><span>{label}</span>{multiline ? <textarea value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} rows={4} maxLength={20000} /> : <input type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} maxLength={300} />}{hint && <small>{hint}</small>}</label>;
}
export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
export function Slider({ label, value, min, max, step = 1, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void }) {
  return <label className="slider-field"><span>{label}<output>{value}{unit && ` ${unit}`}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}
export function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="control-group"><div className="group-heading"><h3>{title}</h3>{description && <p>{description}</p>}</div>{children}</section>;
}
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return <button type="button" className="add-button" onClick={onClick}><Plus size={15} />{children}</button>;
}
export function ItemCard({ title, onDelete, children }: { title: string; onDelete: () => void; children: ReactNode }) {
  return <div className="item-card"><div className="item-card-heading"><span>{title}</span><button type="button" className="icon-button danger" aria-label={`Usuń ${title}`} onClick={onDelete}><Trash2 size={14} /></button></div>{children}</div>;
}
