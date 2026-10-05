import { tr } from '../../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Camera, Crop, ImagePlus, LoaderCircle, Move, RotateCcw, Trash2, UserRound, SlidersHorizontal, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { useResumeStore } from '../../store/useResumeStore';
import { createPhotoData, cropRectangle, defaultCrop, loadLocalPhoto, loadSavedPhoto, maxPhotoZoom, minPhotoZoom, panCrop, photoAspect, photoRadius } from '../../lib/photo';
import type { PhotoCrop } from '../../lib/photo';
import type { ResumeTheme } from '../../types/resume';
import { Dialog } from '../Dialog';
import { SelectField, Slider } from './Fields';

export function PhotoEditor({ initialShowSettings = false, compact = false }: { initialShowSettings?: boolean; compact?: boolean }) {
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

  const reframe = async () => {
    setError('');
    try { const result = await loadSavedPhoto(photo); if (alive.current) { setSource(result); setCrop({ ...defaultCrop }); } }
    catch (error) { if (alive.current) setError(error instanceof Error ? error.message : tr("Nie można dodać zdjęcia.")); }
  };

  const settings = (<div className="photo-settings-card" style={{ marginTop: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--ui-input)' }}>
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
      </div>);

  return <div className={`photo-editor ${compact ? 'photo-editor-compact' : ''}`}>
    {compact ? <>
      <button className="photo-trigger" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={tr(photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie')}>
        {photo ? <img src={photo} alt={tr('Twoje zdjęcie profilowe')} /> : busy ? <LoaderCircle size={22} className="spin" /> : <><span><Plus size={24} strokeWidth={1.6} /></span><span>{tr('Dodaj zdjęcie')}</span></>}
      </button>
      <button className="text-button photo-format-button" onClick={() => setShowSettings(true)}><SlidersHorizontal size={13} />{tr('Formatuj')}</button>
      {photo && <button className="text-button photo-format-button" onClick={() => void reframe()}><Crop size={13} />{tr('Kadruj')}</button>}
      {photo && <button className="text-button danger" onClick={() => update({ photo: '' })}><Trash2 size={13} />{tr('Usuń zdjęcie')}</button>}
    </> : <div className="photo-upload-row">
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
          {photo && <button type="button" className="secondary-button" title={tr("Przesuń lub przybliż zapisane zdjęcie")} onClick={() => void reframe()}><Crop size={13} />{tr("Kadruj")}</button>}
        </div>
        <small>{tr("JPG, PNG lub WEBP · do 10 MB")}</small>
      </div>
      {photo && <button className="icon-button danger" aria-label={tr("Usuń zdjęcie")} onClick={() => update({ photo: '' })}><Trash2 size={15} /></button>}
    </div>}
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={tr("Wybierz zdjęcie profilowe")} onChange={event => { const file = event.target.files?.[0]; if (file) void load(file); event.target.value = ''; }} />

    {showSettings && (compact ? <Dialog title={tr("Formatowanie zdjęcia")} onClose={() => setShowSettings(false)}>{settings}</Dialog> : settings)}

    {!compact && showSettings && <p className="photo-help">{tr("Wybierz pozycję")}<strong>{tr("„Lewy górny róg”")}</strong>{tr(", aby zdjęcie znalazło się na samej górze bocznego paska, tak jak w najpopularniejszych szablonach CV.")}</p>}
    {error && <p className="error-text" role="alert">{error}</p>}
    {source && <Dialog title={tr("Dopasuj swoje zdjęcie")} onClose={() => setSource(undefined)}>
      <p className="dialog-description">{tr("Przeciągnij zdjęcie, aby ustawić kadr. Kółkiem myszy lub suwakiem przybliżysz i oddalisz.")}</p>
      <PhotoCropper image={source.image} url={source.url} crop={crop} onChange={setCrop} shape={theme.photo.shape} />
      <div className="dialog-actions">
        <button className="secondary-button" onClick={() => setSource(undefined)}>{tr("Anuluj")}</button>
        <button className="primary-button" onClick={() => {
          try {
            const photo = createPhotoData(source.image, crop, photoAspect(theme.photo.shape));
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

const frameWidth = 260;
/** Drag-to-pan cropper. The frame matches the photo shape used on the CV. */
function PhotoCropper({ image, url, crop, onChange, shape }: { image: HTMLImageElement; url: string; crop: PhotoCrop; onChange: (crop: PhotoCrop) => void; shape: ResumeTheme['photo']['shape'] }) {
  const aspect = photoAspect(shape);
  const { naturalWidth: width, naturalHeight: height } = image;
  const minZoom = Math.floor(minPhotoZoom(width, height, aspect) * 100) / 100;
  const zoom = Math.max(minZoom, crop.zoom);
  const rect = cropRectangle(width, height, crop, aspect);
  const scale = frameWidth / rect.width;
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; crop: PhotoCrop } | null>(null);
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ crop, onChange });
  latest.current = { crop, onChange };
  const clampZoom = (value: number) => Math.round(Math.min(maxPhotoZoom, Math.max(minZoom, value)) * 100) / 100;
  const zoomTo = (value: number) => onChange({ ...crop, zoom: clampZoom(value) });

  // React registers wheel listeners as passive, so the dialog would scroll instead.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { crop, onChange } = latest.current;
      onChange({ ...crop, zoom: Math.round(Math.min(maxPhotoZoom, Math.max(minZoom, Math.max(minZoom, crop.zoom) * Math.exp(-event.deltaY * 0.0015))) * 100) / 100 });
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [minZoom]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, crop };
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    onChange(panCrop(width, height, start.crop, aspect, frameWidth, event.clientX - start.x, event.clientY - start.y));
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null; setDragging(false);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 40 : 8;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[event.key]) { event.preventDefault(); onChange(panCrop(width, height, crop, aspect, frameWidth, ...moves[event.key])); }
    else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomTo(zoom + 0.1); }
    else if (event.key === '-') { event.preventDefault(); zoomTo(zoom - 0.1); }
  };

  return <div className="photo-cropper">
    <div
      ref={frame}
      className={`photo-crop ${dragging ? 'dragging' : ''}`}
      style={{ width: frameWidth, height: Math.round(frameWidth * aspect), borderRadius: photoRadius(shape, frameWidth) }}
      tabIndex={0}
      role="application"
      aria-label={tr("Kadr zdjęcia. Przeciągnij lub użyj strzałek, aby przesunąć; plus i minus zmieniają powiększenie.")}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={onKeyDown}
    >
      <img src={url} alt="" draggable={false} style={{ width: width * scale, height: height * scale, left: -rect.x * scale, top: -rect.y * scale }} />
      <span className="photo-crop-grid" aria-hidden="true" />
      {!dragging && <span className="photo-crop-hint" aria-hidden="true"><Move size={13} />{tr("Przeciągnij")}</span>}
    </div>
    <div className="photo-zoom-row">
      <button type="button" className="icon-button" aria-label={tr("Oddal")} disabled={zoom <= minZoom} onClick={() => zoomTo(zoom - 0.1)}><ZoomOut size={16} /></button>
      <input type="range" aria-label={tr("Powiększenie zdjęcia")} min={minZoom} max={maxPhotoZoom} step={0.01} value={zoom} onChange={event => zoomTo(Number(event.target.value))} />
      <button type="button" className="icon-button" aria-label={tr("Przybliż")} disabled={zoom >= maxPhotoZoom} onClick={() => zoomTo(zoom + 0.1)}><ZoomIn size={16} /></button>
      <output>{Math.round(zoom * 100)}%</output>
      <button type="button" className="icon-button" aria-label={tr("Resetuj kadr")} title={tr("Resetuj kadr")} onClick={() => onChange({ ...defaultCrop })}><RotateCcw size={15} /></button>
    </div>
  </div>;
}
