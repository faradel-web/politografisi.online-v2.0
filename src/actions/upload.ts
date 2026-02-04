'use server';

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file uploaded');
  }

  // Отримуємо байти файлу
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Генеруємо унікальне ім'я
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`; // Прибираємо пробіли

  // Шлях до папки (переконайтеся, що public/uploads існує)
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  
  // На всяк випадок перевіряємо, чи існує папка, якщо ні - створюємо
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (e) {
    console.error('Error creating upload dir:', e);
  }

  const path = join(uploadDir, filename);

  // Записуємо файл
  await writeFile(path, buffer);

  // Повертаємо публічне посилання
  return `/uploads/${filename}`;
}