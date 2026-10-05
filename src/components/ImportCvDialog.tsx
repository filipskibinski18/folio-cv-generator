import { tr } from '../lib/i18n';
import { useRef, useState, useEffect } from 'react';
import { FileUp, LoaderCircle, FileSearch } from 'lucide-react';
import { Dialog } from './Dialog';
import { Field, SelectField } from './editor/Fields';
import { useResumeStore } from '../store/useResumeStore';
import { parseCvFile, type ParsedCvResult } from '../services/cvParser';
import { withCvLanguage } from '../lib/cvLanguage';
export function ImportCvDialog({ initialFile, onClose, notify }: { initialFile?: File | null; onClose: () => void; notify: (message: string) => void }) {
 const store = useResumeStore(); const input = useRef<HTMLInputElement>(null); const abort = useRef<AbortController | null>(null); const request = useRef(0);
 const [file, setFile] = useState<File | null>(initialFile ?? null); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState<ParsedCvResult | null>(null); const [keepPhoto, setKeepPhoto] = useState(true);
 useEffect(() => () => { request.current++; abort.current?.abort(); }, []);
 const selectFile = (file: File) => { request.current++; abort.current?.abort(); setBusy(false); setResult(null); setError(''); setFile(null); if (!/\.(pdf|docx)$/i.test(file.name)) { setError('Wybierz plik z rozszerzeniem .pdf lub .docx.'); return; } if (file.size > 15 * 1024 * 1024) { setError(tr("Plik jest zbyt duży (maksymalny rozmiar to 15 MB).")); return; } setFile(file); };
 useEffect(() => { if (initialFile) selectFile(initialFile); }, [initialFile]);
 const analyze = async () => { if (!file) return; const token = ++request.current; abort.current?.abort(); abort.current = new AbortController(); setBusy(true); setError(''); setResult(null); try { const result = await parseCvFile(file, abort.current.signal); if (token === request.current) setResult(result); } catch (error) { if (token === request.current) setError(error instanceof Error ? error.message : tr("Wystąpił błąd podczas analizowania dokumentu.")); } finally { if (token === request.current) setBusy(false); } };
 const apply = () => { if (!result) return; const data = structuredClone(result.data); if (keepPhoto) data.personal.photo = store.data.personal.photo; const name = `${data.personal.firstName} ${data.personal.lastName}`.trim(); store.importProject(name ? `CV — ${name}` : store.name, data, withCvLanguage(store.theme, result.sourceLanguage ?? store.theme.language)); notify(tr("CV zostało zaimportowane.")); onClose(); };
 return <Dialog title={tr("Wczytaj CV (PDF / Word)")} onClose={onClose}>
 {!result ? <>
 <p className="dialog-description">{tr("Wgraj plik PDF lub Word i sprawdź rozpoznane dane przed ich zastosowaniem. Twój dokument pozostaje na urządzeniu.")}</p>
 <button className="import-file-drop secondary-button full-width" disabled={busy} onClick={() => input.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); event.stopPropagation(); const file = event.dataTransfer.files[0]; if (file) selectFile(file); }}><FileUp size={22} />{file?.name || tr("Przeciągnij plik tutaj lub kliknij, aby wybrać")}</button>
 <input ref={input} type="file" className="sr-only" aria-label={tr('Wybierz plik CV')} accept=".pdf,.docx" onChange={event => { const file = event.target.files?.[0]; if (file) selectFile(file); event.target.value = ''; }} />
 <div className="dialog-actions"><button className="secondary-button" onClick={onClose}>{tr("Anuluj")}</button><button className="primary-button" disabled={!file || busy} onClick={() => void analyze()}>{busy ? <LoaderCircle size={16} className="spin" /> : <FileSearch size={16} />}{tr(busy ? 'Analizowanie…' : 'Analizuj CV')}</button></div>
 </> : <>
 <p className="dialog-description">{tr("Sprawdź rozpoznane dane. Import zastąpi obecną treść; zmianę możesz cofnąć.")}</p>
 <div className="field-grid"><Field label={tr("Imię")} value={result.data.personal.firstName} onChange={value => setResult({ ...result, data: { ...result.data, personal: { ...result.data.personal, firstName: value } } })} /><Field label={tr("Nazwisko")} value={result.data.personal.lastName} onChange={value => setResult({ ...result, data: { ...result.data, personal: { ...result.data.personal, lastName: value } } })} /></div>
 <SelectField label={tr("Język CV")} value={result.sourceLanguage ?? 'pl'} onChange={value => setResult({ ...result, sourceLanguage: value as 'pl' | 'en' })} options={[{ value: 'pl', label: 'Polski' }, { value: 'en', label: 'English' }]} />
 <div className="import-summary">{(['experience', 'education', 'projects', 'certificates', 'languages'] as const).map(key => <div key={key}><strong>{store.theme.sections.find(s => s.id === key)?.title}</strong><span>{result.data[key].length}</span></div>)}</div>
 {result.warnings?.map((warning, index) => <p className="storage-warning" key={index}>{tr(warning)}</p>)}
 <details className="import-review"><summary>{tr("Sprawdź projekty i certyfikaty")}</summary>{result.data.projects.map(item => <div key={item.id}><strong>{item.name}</strong><p>{item.description}</p><ul>{item.bullets.map(b => <li key={b.id}>{b.text}</li>)}</ul></div>)}{result.data.certificates.map(item => <p key={item.id}><strong>{item.name}</strong><br />{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>)}</details>
 {store.data.personal.photo && <label className="check-field"><input type="checkbox" checked={keepPhoto} onChange={event => setKeepPhoto(event.target.checked)} />{tr("Zachowaj obecne zdjęcie")}</label>}
 <div className="dialog-actions"><button className="secondary-button" onClick={() => setResult(null)}>{tr("Wybierz inny plik")}</button><button className="primary-button" onClick={apply}>{tr("Zastosuj import")}</button></div>
 </>}
 {error && <p role="alert" className="error-text">{tr(error)}</p>}
 </Dialog>;
}
