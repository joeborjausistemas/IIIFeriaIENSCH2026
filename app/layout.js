import { Poppins, Figtree } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const display = Poppins({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--display' });
const body = Figtree({ subsets: ['latin'], variable: '--body' });

export const metadata = {
  title: 'III Feria del Emprendimiento y Expotecnología 2026 | Catálogo',
  description: 'Catálogo de emprendimientos de la III Feria del Emprendimiento y Expotecnología 2026, Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo, Valle del Cauca. 18 de noviembre de 2026.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable}`}>
        <header className="top">
          <Link href="/" className="brand">emprende<span>2026</span></Link>
          <nav>
            <Link href="/">Catálogo</Link>
            <Link href="/mi-cuenta" className="btn small">Sube tu negocio</Link>
            <Link href="/admin">Equipo</Link>
          </nav>
        </header>
        {children}
        <footer className="foot">
          <p><b>III Feria del Emprendimiento y Expotecnología 2026</b> · Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo, Valle del Cauca. Aprende, crea e innova.</p>
          <p style={{ marginTop: 6 }}>Al registrarte autorizas el tratamiento de tus datos (Ley 1581 de 2012).</p>
        </footer>
      </body>
    </html>
  );
}
