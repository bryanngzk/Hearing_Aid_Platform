import heic2any from 'heic2any';

// Checks if a file is a HEIC/HEIF photo, by its type or file extension
export function isHeic(file) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name || '')
  );
}

// Tries to decode a HEIC photo using the browser's own built-in codec, if it has one
async function tryNativeDecode(file) {
  if (!('createImageBitmap' in window)) return null;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  } catch {
    return null;
  }
}

// Converts a HEIC photo to JPEG (native codec first, heic2any as backup); passes other files through unchanged
export async function ensureDecodable(file) {
  if (!isHeic(file)) return file;

  const native = await tryNativeDecode(file);
  if (native) return native;

  try {
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
    return Array.isArray(converted) ? converted[0] : converted;
  } catch (err) {
    console.error('heic2any conversion failed for', file.name, err);
    throw new Error(
      `Could not convert ${file.name || 'this HEIC photo'} to a supported format. ` +
      'Try sharing/saving it as JPEG from your phone first (or switch Camera > Formats to "Most Compatible"), then upload again.'
    );
  }
}

// Shrinks and re-compresses a photo to a small JPEG data URL, ready to store in Firestore
export async function compressImage(file, maxWidth = 800, quality = 0.7) {
  const source = await ensureDecodable(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };

    img.src = objectUrl;
  });
}
