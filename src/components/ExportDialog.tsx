import { tr } from '../lib/i18n';
import { useState } from 'react';
import { ArrowDownToLine, Check, FileCode2, FileText, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Dialog } from './Dialog';
import { useResumeStore } from '../store/useResumeStore';
import { exportPdf } from '../services/exportPdf';
import { exportProjectJson } from '../services/projectJson';

export function ExportDialog({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) {
  const { data, theme, name } = useResumeStore(); const [format, setFormat] = useState<'pdf' | 'docx' | 'json'>('pdf'); const [ats, setAts] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const download = async () => {
    setBusy(true); setError('');
    try {
      if (format === 'pdf') await exportPdf(data, theme);
      else if (format === 'docx') { const { exportDocx } = await import('../services/exportDocx'); await exportDocx(data, theme, ats); }
      else exportProjectJson(name, data, theme);
      notify(`Gotowe! Pobrano ${format.toUpperCase()}.`); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : tr("Eksport nie powiódł się. Spróbuj ponownie.")); } finally { setBusy(false); }
  };
  const options = [{ id: 'pdf' as const, icon: FileText, label: 'Dokument PDF', detail: 'Wektorowy, z osadzonymi fontami', badge: 'DO REKRUTACJI' }, { id: 'docx' as const, icon: FileText, label: 'Microsoft Word', detail: 'Edytowalne nagłówki, listy i kolumny', badge: '.DOCX' }, { id: 'json' as const, icon: FileCode2, label: 'Kopia projektu', detail: 'Twoje dane i kompletny motyw', badge: '.JSON' }];
  return <Dialog title={tr("Eksportuj CV")} onClose={() => { if (!busy) onClose(); }}><p className="dialog-description">{tr("Wybierz format, w którym chcesz zapisać dokument.")}</p><div className="export-options">{options.map(({ id, icon: Icon, label, detail, badge }) => <button key={id} className={`export-option ${format === id ? 'selected' : ''}`} onClick={() => setFormat(id)} aria-pressed={format === id} disabled={busy}><span className="export-icon"><Icon size={23} strokeWidth={1.5} /></span><span><strong>{label}</strong><small>{detail}</small></span><span className="format-badge">{badge}</span>{format === id && <Check size={16} />}</button>)}</div>
    {format === 'docx' && <div className="ats-option"><label className="check-field"><input type="checkbox" checked={ats} onChange={event => setAts(event.target.checked)} /><ShieldCheck size={15} />{tr("Układ jednokolumnowy dla ATS")}</label><p>{tr("Eksportuje sekcje w ich kolejności, z prostymi listami, bez zdjęcia i ramki. Word może inaczej dzielić strony niż PDF.")}</p></div>}
    {error && <p className="error-text" role="alert">{error}</p>}<div className="dialog-actions"><span className="export-privacy"><ShieldCheck size={13} />{tr("Eksport w Twojej przeglądarce")}</span><button className="primary-button" onClick={() => { void download(); }} disabled={busy}>{busy ? <LoaderCircle size={15} className="spin" /> : <ArrowDownToLine size={15} />}{busy ? 'Przygotowywanie…' : `Pobierz ${format.toUpperCase()}`}</button></div>
  </Dialog>;
}
