export interface PhotoCrop { zoom: number; x: number; y: number }
export const defaultCrop: PhotoCrop = { zoom: 1, x: 50, y: 50 };
export type PhotoShapeType = 'circle' | 'rounded' | 'portrait-rounded' | 'portrait' | 'square';
export const photoRadius = (shape: PhotoShapeType | string, size: number) => {
  if (shape === 'circle') return size / 2;
  if (shape === 'rounded') return size * 0.14;
  if (shape === 'portrait-rounded') return size * 0.12;
  return 0;
};

export const maxPhotoZoom = 4;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Height-to-width ratio of the frame; portraits are 3:4-ish like the PDF frame. */
export const photoAspect = (shape: PhotoShapeType | string) => shape === 'portrait' || shape === 'portrait-rounded' ? 1.28 : 1;
/** Smallest zoom that still shows the whole picture inside the frame (≤ 1). */
export const minPhotoZoom = (width: number, height: number, aspect = 1) => Math.min(1, Math.min(width, height / aspect) / Math.max(width, height / aspect));

/**
 * The crop window in source pixels, shared by the editor and the exported image.
 * Zoom 1 covers the frame; below 1 the frame is larger than the photo and the
 * margins are filled. x/y are 0–100 % positions of the window in its free range.
 */
export function cropRectangle(width: number, height: number, crop: PhotoCrop, aspect = 1) {
  const zoom = clamp(crop.zoom, minPhotoZoom(width, height, aspect), maxPhotoZoom);
  const cropWidth = Math.min(width, height / aspect) / zoom;
  const cropHeight = cropWidth * aspect;
  return { width: cropWidth, height: cropHeight, x: (width - cropWidth) * clamp(crop.x, 0, 100) / 100, y: (height - cropHeight) * clamp(crop.y, 0, 100) / 100 };
}

/** Moves the crop by a pointer delta measured on a frame `frameWidth` pixels wide. */
export function panCrop(width: number, height: number, crop: PhotoCrop, aspect: number, frameWidth: number, dx: number, dy: number): PhotoCrop {
  const rect = cropRectangle(width, height, crop, aspect);
  const scale = rect.width / frameWidth;
  const axis = (position: number, delta: number, range: number, current: number) => Math.abs(range) < 0.5 ? current : clamp((position - delta * scale) / range * 100, 0, 100);
  return { ...crop, x: axis(rect.x, dx, width - rect.width, crop.x), y: axis(rect.y, dy, height - rect.height, crop.y) };
}

export async function loadLocalPhoto(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Wybierz zdjęcie JPG, PNG lub WEBP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Zdjęcie jest za duże. Maksymalny rozmiar to 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url, 'Nie można odczytać tego zdjęcia. Wybierz inny plik.');
    if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Zdjęcie ma zbyt dużą rozdzielczość. Wybierz obraz do 40 megapikseli.');
    return { image, url };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

const loadImage = (src: string, message: string) => new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(message)); image.src = src; });
/** Reopens the saved photo so its framing can be adjusted without a new upload. */
export const loadSavedPhoto = async (photo: string) => ({ image: await loadImage(photo, 'Nie można odczytać zapisanego zdjęcia.'), url: photo });

export function createPhotoData(image: HTMLImageElement, crop: PhotoCrop, aspect = 1): string {
  const rect = cropRectangle(image.naturalWidth, image.naturalHeight, crop, aspect);
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = Math.round(512 * aspect);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Przeglądarka nie obsługuje przetwarzania zdjęć.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
  // Map the whole image instead of passing an out-of-bounds source rectangle,
  // which browsers clip inconsistently when the photo is zoomed out.
  const scale = canvas.width / rect.width;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, -rect.x * scale, -rect.y * scale, image.naturalWidth * scale, image.naturalHeight * scale);
  return canvas.toDataURL('image/jpeg', 0.88);
}

/** Word embeds this masked PNG as a separate, editable picture. */
export async function photoForDocx(photo: string, shape: PhotoShapeType | string): Promise<Uint8Array> {
  const width = 512;
  const height = Math.round(512 * photoAspect(shape));
  const image = await loadImage(photo, 'Nie można przygotować zdjęcia do Worda.');
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Przeglądarka nie obsługuje przetwarzania zdjęć.');
  context.beginPath(); context.roundRect(0, 0, width, height, photoRadius(shape, width)); context.clip();
  // Cover the frame without stretching when the saved crop has another ratio.
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  context.drawImage(image, (width - image.naturalWidth * scale) / 2, (height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Nie można przygotować zdjęcia.')), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

/** WCAG luminance chooses a readable foreground for customizable banners. */
export function contrastColor(hex: string): string {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? '#182322' : '#ffffff';
}
