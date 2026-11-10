import { Poppins, Figtree } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const display = Poppins({ subsets: ['latin'], weight: ['700', '800'], style: ['normal', 'italic'], variable: '--display' });
const body = Figtree({ subsets: ['latin'], variable: '--body' });

export const metadata = {
  title: 'III Feria del Emprendimiento y Expotecnología 2026 | Catálogo',
  description: 'Catálogo de emprendimientos de la III Feria del Emprendimiento y Expotecnología 2026, Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo, Valle del Cauca. 18 de noviembre de 2026.',
};

const ESCUDO = 'Escudo de la Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${display.variable} ${body.variable}`}>
        <header className="top">
          <Link href="/" className="brand">
            <img src="/escudo.png" alt={ESCUDO} width="44" height="54" />
            <span>III Feria del Emprendimiento y Expotecnología <b>2026</b></span>
          </Link>
          <nav>
            <Link href="/" className="hide-sm">Catálogo</Link>
            <Link href="/mi-cuenta" className="btn small">Sube tu negocio</Link>
            <Link href="/admin">Equipo</Link>
          </nav>
        </header>
        {children}
        <footer className="foot">
          <img src="/escudo.png" alt={ESCUDO} width="46" height="56" />
          <div>
            <p><b>III Feria del Emprendimiento y Expotecnología 2026</b> · Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo, Valle del Cauca. Aprende, crea e innova.</p>
            <p style={{ marginTop: 6 }}>Al registrarte autorizas el tratamiento de tus datos (Ley 1581 de 2012).</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
