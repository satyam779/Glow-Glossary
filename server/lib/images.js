import sharp from 'sharp';
import { HttpError } from './http.js';

// Normalise an uploaded photo: fix EXIF rotation, fit within 1600px, save as WebP.
// sharp also rejects anything that isn't really an image, whatever its file extension.
export async function processImage(buffer) {
  try {
    const { data, info } = await sharp(buffer, { failOn: 'error' })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { buffer: data, width: info.width, height: info.height, contentType: 'image/webp', ext: 'webp' };
  } catch {
    throw new HttpError(400, 'That file could not be read as an image.');
  }
}
