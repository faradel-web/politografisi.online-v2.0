import { ImageResponse } from 'next/og';

// Ρυθμίσεις зображення
export const runtime = 'edge'; // Використовуємо швидкий Edge runtime
export const alt = 'Politografisi.gr - Προετοιμασία για Εξετάσεις Πολιτογράφησης';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Функція генерації
export default async function Image() {
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

        {/* Логотип "P" як на лендінгу */}
         <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100px',
            height: '100px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '24px',
            marginBottom: '32px',
            border: '4px solid rgba(255,255,255,0.2)',
            fontSize: '64px',
            fontWeight: '900',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }}
        >
          P
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
          Politografisi.gr
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

         {/* Футер банера */}
        <div style={{ position: 'absolute', bottom: 40, display: 'flex', gap: '20px', opacity: 0.7, fontSize: 20, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
           <span>Tests</span> • <span>Video & Audio</span> • <span>AI Tutor</span>
        </div>
      </div>
    ),
    // Опції
    {
      ...size,
    }
  );
}