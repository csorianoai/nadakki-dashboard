import { TARGET_COMPRESSED_BYTES } from "@/lib/customer/upload/constants";

/**
 * Re-encode image via canvas to reduce size (MVP). PDFs pass through untouched.
 */
export async function compressImageIfNeeded(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= TARGET_COMPRESSED_BYTES) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const maxEdge = 1920;
  let { width, height } = bitmap;
  if (width > maxEdge || height > maxEdge) {
    const scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  while (blob && blob.size > TARGET_COMPRESSED_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
  }
  return blob ?? file;
}
