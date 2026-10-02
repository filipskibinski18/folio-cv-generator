import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { createPhotoData, cropRectangle, defaultCrop, loadLocalPhoto, photoRadius } from '../../lib/photo';
import type { PhotoCrop } from '../../lib/photo';
import { Dialog } from '../Dialog';
import { Slider } from './Fields';

export function PhotoEditor() {
  const photo = useResumeStore(state => state.data.personal.photo);
  const theme = useResumeStore(state => state.theme);
  const update = useResumeStore(state => state.updatePersonal);
  const updateTheme = useResumeStore(state => state.updateTheme);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Awaited<ReturnType<typeof loadLocalPhoto>>>();
  const [crop, setCrop] = useState<PhotoCrop>(defaultCrop);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);
  const load = async (file: File) => {
    setError(''); setBusy(true);
    try {
      const result = await loadLocalPhoto(file);
      if (!alive.current) { URL.revokeObjectURL(result.url); return; }
      setSource(result); setCrop({ ...defaultCrop });
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : 'Nie można dodać zdjęcia.'); }
    finally { if (alive.current) setBusy(false); }
  };
  const rect = source ? cropRectangle(source.image.naturalWidth, source.image.naturalHeight, crop) : undefined;
  return <div className="photo-editor">
    <div className="photo-upload-row"><div className="photo-thumbnail" style={{ borderRadius: photoRadius(theme.photo.shape, 64) }}>{photo ? <img src={photo} alt="Twoje zdjęcie profilowe" /> : <Camera size={25} strokeWidth={1.4} />}</div>
      <div className="photo-upload-content"><span className="mini-label">ZDJĘCIE PROFILOWE</span><button className="secondary-button" disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? <LoaderCircle size={14} className="spin" /> : <ImagePlus size={14} />}{photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}</button><small>JPG, PNG lub WEBP · do 10 MB</small></div>
      {photo && <button className="icon-button danger" aria-label="Usuń zdjęcie" onClick={() => update({ photo: '' })}><Trash2 size={15} /></button>}
    </div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Wybierz zdjęcie profilowe" onChange={event => { const file = event.target.files?.[0]; if (file) void load(file); event.target.value = ''; }} />
    <p className="photo-help">Każdy szablon ma miejsce na zdjęcie. Kształt i rozmiar zmienisz w panelu Wygląd.</p>
    {error && <p className="error-text" role="alert">{error}</p>}
    {source && rect && <Dialog title="Dopasuj swoje zdjęcie" onClose={() => setSource(undefined)}>
      <p className="dialog-description">Ustaw kadr. Zdjęcie zostanie zapisane lokalnie w Twoim CV.</p>
      <div className="photo-crop" style={{ borderRadius: photoRadius(theme.photo.shape, 240) }}><img src={source.url} alt="Podgląd kadru zdjęcia" style={{ width: source.image.naturalWidth / rect.size * 240, height: source.image.naturalHeight / rect.size * 240, left: -rect.x / rect.size * 240, top: -rect.y / rect.size * 240 }} /></div>
      <Slider label="Powiększenie zdjęcia" value={crop.zoom} min={1} max={3} step={0.05} onChange={zoom => setCrop(value => ({ ...value, zoom }))} />
      <Slider label="Kadr w poziomie" value={crop.x} min={0} max={100} unit="%" onChange={x => setCrop(value => ({ ...value, x }))} />
      <Slider label="Kadr w pionie" value={crop.y} min={0} max={100} unit="%" onChange={y => setCrop(value => ({ ...value, y }))} />
      <div className="dialog-actions"><button className="secondary-button" onClick={() => setSource(undefined)}>Anuluj</button><button className="primary-button" onClick={() => {
        try { const photo = createPhotoData(source.image, crop); update({ photo }); if (!theme.photo.isVisible) updateTheme({ photo: { ...theme.photo, isVisible: true } }); setSource(undefined); }
        catch (error) { setError(error instanceof Error ? error.message : 'Nie można zapisać zdjęcia.'); setSource(undefined); }
      }}><Camera size={14} />Zapisz zdjęcie</button></div>
    </Dialog>}
  </div>;
}
