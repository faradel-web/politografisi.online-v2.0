'use server';

import { writeFile } from 'fs/promises';
import { join, basename } from 'path';
import { mkdir } from 'fs/promises';

// 🔐 SECURITY: Allowed file extensions (whitelist)
const ALLOWED_EXTENSIONS = new Set([
  '.xlsx', '.xls', '.csv', '.json',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg',
  '.mp3', '.wav', '.ogg', '.webm',
  '.pdf'
]);

// 🔐 SECURITY: Max file size (10 MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Upload a file to the server.
 * 
 * 🔐 SECURITY:
 * - Validates file extension against whitelist
 * - Enforces file size limit
 * - Sanitizes filename (strips path separators)
 * 
 * NOTE: Auth check should be performed on the CLIENT before calling this action
 * (only admin/editor roles should invoke this). Server-side auth verification
 * requires Firebase Admin SDK (TODO).
 */
export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;

  if (!file) {
    throw new Error('No file uploaded');
  }

  // 🔐 SECURITY: Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  }

  // 🔐 SECURITY: Validate file extension
  const originalName = file.name || 'unnamed';
  const extMatch = originalName.match(/\.[a-zA-Z0-9]+$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';

  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File type not allowed: ${ext || 'unknown'}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`);
  }

  // Отримуємо байти файлу
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 🔐 SECURITY: Sanitize filename — remove path separators and dangerous chars
  const safeName = basename(originalName)
    .replace(/\s+/g, '-')           // Replace spaces
    .replace(/[^a-zA-Z0-9._-]/g, '') // Keep only safe chars
    .replace(/\.{2,}/g, '.');        // No double dots (path traversal)

  // Генеруємо унікальне ім'я
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}-${safeName}`;

  // Шлях до папки (переконайтеся, що public/uploads існує)
  const uploadDir = join(process.cwd(), 'public', 'uploads');

  // На всяк випадок перевіряємо, чи існує папка, якщо ні - створюємо
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Error creating upload dir:', e);
  }

  const path = join(uploadDir, filename);

  // 🔐 SECURITY: Final check — ensure path is within uploadDir
  if (!path.startsWith(uploadDir)) {
    throw new Error('Invalid file path detected');
  }

  // Записуємо файл
  await writeFile(path, buffer);

  // Повертаємо публічне посилання
  return `/uploads/${filename}`;
}