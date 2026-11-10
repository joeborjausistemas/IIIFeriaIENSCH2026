'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Sticker from '@/components/Sticker';

// Quita tildes y arma una consulta con prefijos: "panad caf" -> "panad:* & caf:*"
const toQuery = (t) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .split(/[^a-z0-9]+/).filter(Boolean).map((w) => `${w}:*`).join(' & ');

const PUBLIC = ['approved', 'featured'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(null);
  useEffect(() => { setDays(Math.ceil((new Date('2026-11-18T00:00:00-05:00') - Date.now()) / 864e5)); }, []);

  // Categorías y total, una sola vez
  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || []));
    supabase.from('businesses').select('id', { count: 'exact', head: true }).in('status', PUBLIC)
      .then(({ count }) => setTotal(count || 0));
  }, []);

  // Búsqueda en el servidor, con pausa de 300 ms mientras se escribe
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      let req = supabase.from('businesses').select('*, categories(name)').in('status', PUBLIC);
      const tq = toQuery(q);
      if (tq) req = req.textSearch('search', tq, { config: 'spanish' });
      if (cat) req = req.eq('category_id', cat);
      const { data, error } = await req
        .order('status', { ascending: false }).order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) setError('No pudimos cargar el catálogo. Intenta de nuevo en un momento.');
      setItems(data || []); setLoading(false);
    }, q ? 300 : 0);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [q, cat]);

  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>Cada idea cuenta, cada talento <mark>brilla</mark> <span className="sub">para renacer en comunidad</span></h1>
          <p className="lead">Conoce los emprendimientos de la III Feria del Emprendimiento y Expotecnología 2026. Mira su pitch en video, escríbeles por WhatsApp y apoya a los estudiantes y sus familias.</p>
          <ul className="facts">
            <li>Miércoles 18 de noviembre de 2026{days > 0 && ` · faltan ${days} ${days === 1 ? 'día' : 'días'}`}{days === 0 && ' · ¡es hoy!'}</li>
            <li>Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo, Valle del Cauca</li>
            <li>Participan estudiantes de transición a undécimo y sus familias</li>
            <li>{total} emprendimientos en el catálogo</li>
          </ul>
          <Link href="/mi-cuenta" className="btn">Registra tu emprendimiento</Link>
        </div>
        <img className="poster" src="/banner-feria.jpg" alt="Afiche de la III Feria del Emprendimiento y Expotecnología 2026: miércoles 18 de noviembre en la Institución Educativa Nuestra Señora de Chiquinquirá, Roldanillo" />
      </section>

      <ul className="pillars">
        {[['Emprendimiento familiar', '#6BB43F'], ['Creatividad', '#E0307F'], ['Innovación tecnológica', '#2563C9'], ['Integración comunitaria', '#F28A2E'], ['Reactivación económica', '#7A3FB4']]
          .map(([t, c]) => <li key={t}><i style={{ '--d': c }} />{t}</li>)}
      </ul>

      <div className="bar">
        <input className="search" type="search" placeholder="Busca por nombre, producto o barrio" value={q}
          onChange={(e) => setQ(e.target.value)} aria-label="Buscar emprendimientos" />
        <div className="pills">
          <button className="pill" aria-pressed={!cat} onClick={() => setCat(null)}>Todos</button>
          {cats.map((c) => (
            <button key={c.id} className="pill" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="grid">
        {error ? <div className="empty">{error}</div>
          : loading ? <div className="empty">Buscando en el muro…</div>
          : items.length ? items.map((b) => <Sticker key={b.id} b={b} />)
          : <div className="empty">No encontramos nada con ese filtro. Prueba otra palabra o <Link href="/registro"><b>registra el tuyo</b></Link>.</div>}
      </div>
    </main>
  );
}
