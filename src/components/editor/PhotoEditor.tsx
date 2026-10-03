import { tr } from '../../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, LoaderCircle, Trash2, UserRound, SlidersHorizontal } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { createPhotoData, cropRectangle, defaultCrop, loadLocalPhoto, photoRadius } from '../../lib/photo';
import type { PhotoCrop } from '../../lib/photo';
import type { ResumeTheme } from '../../types/resume';
import { Dialog } from '../Dialog';
import { SelectField, Slider } from './Fields';

export function PhotoEditor({ initialShowSettings = false }: { initialShowSettings?: boolean }) {
  const photo = useResumeStore(state => state.data.personal.photo);
  const theme = useResumeStore(state => state.theme);
  const update = useResumeStore(state => state.updatePersonal);
  const updateTheme = useResumeStore(state => state.updateTheme);
  const fileRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<Awaited<ReturnType<typeof loadLocalPhoto>>>();
  const [crop, setCrop] = useState<PhotoCrop>(defaultCrop);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(initialShowSettings);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url); }, [source]);

  const load = async (file: File) => {
    setError(''); setBusy(true);
    try {
      const result = await loadLocalPhoto(file);
      if (!alive.current) { URL.revokeObjectURL(result.url); return; }
      setSource(result); setCrop({ ...defaultCrop });
    } catch (error) { if (alive.current) setError(error instanceof Error ? error.message : tr("Nie można dodać zdjęcia.")); }
    finally { if (alive.current) setBusy(false); }
  };

  const isPortrait = theme.photo.shape === 'portrait' || theme.photo.shape === 'portrait-rounded';
  const rect = source ? cropRectangle(source.image.naturalWidth, source.image.naturalHeight, crop) : undefined;

  return <div className="photo-editor">
    <div className="photo-upload-row">
      <div className="photo-thumbnail" style={{ borderRadius: photoRadius(theme.photo.shape, 64) }}>
        {photo ? (
          <img src={photo} alt={tr("Twoje zdjęcie profilowe")} />
        ) : (
          <div className="photo-placeholder-icon" title={tr("Miejsce na zdjęcie")}>
            <UserRound size={32} strokeWidth={1.4} />
            <span className="photo-badge"><Camera size={10} strokeWidth={2} /></span>
          </div>
        )}
      </div>
      <div className="photo-upload-content">
        <span className="mini-label">{tr("ZDJĘCIE PROFILOWE")}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="secondary-button" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <LoaderCircle size={14} className="spin" /> : <ImagePlus size={14} />}
            {photo ? tr("Zmień zdjęcie") : tr("Dodaj zdjęcie")}
          </button>
          <button
            type="button"
            className={`secondary-button ${showSettings ? 'selected' : ''}`}
            title={tr("Dopasuj rozmiar i ułożenie zdjęcia")}
            onClick={() => setShowSettings(!showSettings)}
          >
            <SlidersHorizontal size={13} />{tr("Formatuj")}</button>
        </div>
        <small>{tr("JPG, PNG lub WEBP · do 10 MB")}</small>
      </div>
      {photo && <button className="icon-button danger" aria-label={tr("Usuń zdjęcie")} onClick={() => update({ photo: '' })}><Trash2 size={15} /></button>}
    </div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={tr("Wybierz zdjęcie profilowe")} onChange={event => { const file = event.target.files?.[0]; if (file) void load(file); event.target.value = ''; }} />

    {showSettings && (
      <div className="photo-settings-card" style={{ marginTop: 14, padding: 12, border: '1px solid #e2e8dc', borderRadius: 8, background: '#fafcf8' }}>
        <label className="check-field">
          <input type="checkbox" checked={theme.photo.isVisible} onChange={event => updateTheme({ photo: { ...theme.photo, isVisible: event.target.checked } })} />{tr("Pokaż zdjęcie lub ramkę na CV")}</label>
        <div className="field-grid">
          <SelectField
            label={tr("Pozycja na CV")}
            value={theme.photo.position}
            onChange={value => updateTheme({ photo: { ...theme.photo, position: value as ResumeTheme['photo']['position'] } })}
            options={[
              { value: 'sidebar', label: 'Lewy górny róg (kolumna boczna)' },
              { value: 'left', label: 'Nagłówek — po lewej' },
              { value: 'right', label: 'Nagłówek — po prawej' },
              { value: 'center', label: 'Nagłówek — na środku' },
            ]}
          />
          <SelectField
            label={tr("Kształt kadru")}
            value={theme.photo.shape}
            onChange={value => updateTheme({ photo: { ...theme.photo, shape: value as ResumeTheme['photo']['shape'] } })}
            options={[
              { value: 'circle', label: 'Koło (1:1)' },
              { value: 'portrait-rounded', label: 'Portret zaokrąglony (3:4)' },
              { value: 'portrait', label: 'Portret prostokątny (3:4)' },
              { value: 'rounded', label: 'Zaokrąglony kwadrat (1:1)' },
              { value: 'square', label: 'Kwadrat (1:1)' },
            ]}
          />
        </div>
        <Slider label={tr("Rozmiar zdjęcia")} value={theme.photo.size} min={16} max={70} unit="mm" onChange={size => updateTheme({ photo: { ...theme.photo, size } })} />
        <div className="field-grid">
          <SelectField
            label={tr("Grubość ramki")}
            value={String(theme.photo.borderWidth ?? 1)}
            onChange={val => updateTheme({ photo: { ...theme.photo, borderWidth: Number(val) } })}
            options={[
              { value: '0', label: 'Brak ramki' },
              { value: '1', label: 'Cienka (1 pt)' },
              { value: '2', label: 'Średnia (2 pt)' },
              { value: '3', label: 'Gruba (3 pt)' },
              { value: '4', label: 'Bardzo gruba (4 pt)' },
            ]}
          />
          <SelectField
            label={tr("Kolor ramki")}
            value={theme.photo.borderColor ?? 'auto'}
            onChange={val => updateTheme({ photo: { ...theme.photo, borderColor: val as any } })}
            options={[
              { value: 'auto', label: 'Automatyczny' },
              { value: 'white', label: 'Biały' },
              { value: 'accent', label: 'Kolor akcentu' },
              { value: 'separator', label: 'Kolor separatora' },
            ]}
          />
        </div>
      </div>
    )}

    <p className="photo-help">{tr("Wybierz pozycję")}<strong>{tr("„Lewy górny róg”")}</strong>{tr(", aby zdjęcie znalazło się na samej górze bocznego paska, tak jak w najpopularniejszych szablonach CV.")}</p>
    {error && <p className="error-text" role="alert">{error}</p>}
    {source && rect && <Dialog title={tr("Dopasuj swoje zdjęcie")} onClose={() => setSource(undefined)}>
      <p className="dialog-description">{tr("Ustaw kadr. Zdjęcie zostanie zapisane lokalnie w Twoim CV.")}</p>
      <div className="photo-crop" style={{ width: 240, height: isPortrait ? 300 : 240, borderRadius: photoRadius(theme.photo.shape, 240) }}>
        <img
          src={source.url}
          alt={tr("Podgląd kadru zdjęcia")}
          style={{
            width: source.image.naturalWidth / rect.size * 240,
            height: source.image.naturalHeight / rect.size * 240,
            left: -rect.x / rect.size * 240,
            top: -rect.y / rect.size * 240,
          }}
        />
      </div>
      <Slider label={tr("Powiększenie zdjęcia")} value={crop.zoom} min={1} max={3} step={0.05} onChange={zoom => setCrop(value => ({ ...value, zoom }))} />
      <Slider label={tr("Kadr w poziomie")} value={crop.x} min={0} max={100} unit="%" onChange={x => setCrop(value => ({ ...value, x }))} />
      <Slider label={tr("Kadr w pionie")} value={crop.y} min={0} max={100} unit="%" onChange={y => setCrop(value => ({ ...value, y }))} />
      <div className="dialog-actions">
        <button className="secondary-button" onClick={() => setSource(undefined)}>{tr("Anuluj")}</button>
        <button className="primary-button" onClick={() => {
          try {
            const photo = createPhotoData(source.image, crop);
            update({ photo });
            if (!theme.photo.isVisible) updateTheme({ photo: { ...theme.photo, isVisible: true } });
            setSource(undefined);
          } catch (error) {
            setError(error instanceof Error ? error.message : tr("Nie można zapisać zdjęcia."));
            setSource(undefined);
          }
        }}>
          <Camera size={14} />{tr("Zapisz zdjęcie")}</button>
      </div>
    </Dialog>}
  </div>;
}
