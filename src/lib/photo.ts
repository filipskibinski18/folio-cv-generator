export interface PhotoCrop { zoom: number; x: number; y: number }
export const defaultCrop: PhotoCrop = { zoom: 1, x: 50, y: 50 };
export type PhotoShapeType = 'circle' | 'rounded' | 'portrait-rounded' | 'portrait' | 'square';
export const photoRadius = (shape: PhotoShapeType | string, size: number) => {
  if (shape === 'circle') return size / 2;
  if (shape === 'rounded') return size * 0.14;
  if (shape === 'portrait-rounded') return size * 0.12;
  return 0;
};

/** A square crop in source pixels, shared by the editor and exported image. */
export function cropRectangle(width: number, height: number, crop: PhotoCrop) {
  const size = Math.min(width, height) / Math.max(1, Math.min(3, crop.zoom));
  return { size, x: (width - size) * Math.max(0, Math.min(100, crop.x)) / 100, y: (height - size) * Math.max(0, Math.min(100, crop.y)) / 100 };
}

export async function loadLocalPhoto(file: File): Promise<{ image: HTMLImageElement; url: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Wybierz zdjęcie JPG, PNG lub WEBP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Zdjęcie jest za duże. Maksymalny rozmiar to 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Nie można odczytać tego zdjęcia. Wybierz inny plik.')); image.src = url; });
    if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error('Zdjęcie ma zbyt dużą rozdzielczość. Wybierz obraz do 40 megapikseli.');
    return { image, url };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
}

export function createPhotoData(image: HTMLImageElement, crop: PhotoCrop): string {
  const rect = cropRectangle(image.naturalWidth, image.naturalHeight, crop);
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Przeglądarka nie obsługuje przetwarzania zdjęć.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, 512, 512);
  context.drawImage(image, rect.x, rect.y, rect.size, rect.size, 0, 0, 512, 512);
  return canvas.toDataURL('image/jpeg', 0.86);
}

/** Word embeds this masked PNG as a separate, editable picture. */
export async function photoForDocx(photo: string, shape: PhotoShapeType | string): Promise<Uint8Array> {
  const isPortrait = shape === 'portrait' || shape === 'portrait-rounded';
  const width = 512;
  const height = isPortrait ? Math.round(512 * 1.3) : 512;
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Nie można przygotować zdjęcia do Worda.')); image.src = photo; });
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Przeglądarka nie obsługuje przetwarzania zdjęć.');
  context.beginPath(); context.roundRect(0, 0, width, height, photoRadius(shape, width)); context.clip();
  context.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Nie można przygotować zdjęcia.')), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

/** WCAG luminance chooses a readable foreground for customizable banners. */
export function contrastColor(hex: string): string {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return luminance > 0.179 ? '#182322' : '#ffffff';
}
