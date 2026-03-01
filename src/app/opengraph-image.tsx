import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Ρυθμίσεις зображення
export const alt = 'Politografisi.online - Προετοιμασία για Εξετάσεις Πολιτογράφησης';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Функція генерації
export default async function Image() {
  const logoPath = join(process.cwd(), 'public', 'logo-circle.jpg');
  const logoBuffer = readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      // CSS-in-JS дизайн банера
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Градієнт у стилі бренду (blue-900 to cyan-600)
          background: 'linear-gradient(to bottom right, #1e3a8a, #0891b2)',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '40px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Декоративний фон (кола) */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        {/* Логотип як на лендінгу */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            backgroundColor: 'white',
            borderRadius: '50%',
            marginBottom: '32px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}
        >
          <img
            src={logoBase64}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            alt="Logo"
          />
        </div>

        {/* Головний заголовок */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            marginBottom: 16,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          Politografisi.online
        </div>

        {/* Підзаголовок / Слоган */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.9,
            maxWidth: '80%',
            lineHeight: 1.4,
          }}
        >
          Έξυπνη προετοιμασία, σίγουρη επιτυχία στις Εξετάσεις Πολιτογράφησης (ΠΕΓΠ).
        </div>

      </div>
    ),
    // Опції
    {
      ...size,
    }
  );
}