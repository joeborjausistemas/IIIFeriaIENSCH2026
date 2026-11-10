import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { wa, embed, social } from '@/lib/utils';
import Visor from '@/components/Visor';

export const revalidate = 60;

async function load(slug) {
  const { data } = await supabase.from('businesses').select('*, categories(name)')
    .eq('slug', slug).in('status', ['approved', 'featured']).maybeSingle();
  if (!data) return {};
  const [imgs, prods] = await Promise.all([
    supabase.from('business_images').select('*').eq('business_id', data.id).order('position'),
    supabase.from('business_products').select('*').eq('business_id', data.id).order('position'),
  ]);
  return { b: data, imgs: imgs.data || [], prods: prods.data || [] };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { b } = await load(slug);
  return b ? { title: `${b.name} | Hecho aquí`, description: b.slogan || b.description } : {};
}

export default async function Ficha({ params }) {
  const { slug } = await params;
  const { b, imgs, prods } = await load(slug);
  if (!b) notFound();
  const v = embed(b.video_url), link = wa(b.whatsapp || b.phone, b.name);

  return (
    <main className="wrap ficha">
      <div className="stack">
        <div className="panel c" style={{ '--c': 'var(--lemon)' }}>
          {b.logo_url && <img className="logo" src={b.logo_url} alt={`Logo de ${b.name}`} />}
          <h1>{b.name}</h1>
          {b.slogan && <p style={{ fontSize: '1.25rem', marginTop: 10 }}>{b.slogan}</p>}
          {b.description && <p style={{ marginTop: 12 }}>{b.description}</p>}
        </div>
        {v ? <iframe className="video" src={v} title={`Pitch de ${b.name}`} allowFullScreen loading="lazy" />
          : b.video_url && <a className="btn cobalt" href={b.video_url} target="_blank" rel="noopener">Ver video pitch</a>}
        {(b.value_proposition || b.target_audience) && (
          <div className="panel">
            {b.value_proposition && <><h3>Qué problema resuelve</h3><p>{b.value_proposition}</p></>}
            {b.target_audience && <><h3 style={{ marginTop: 14 }}>Para quién es</h3><p>{b.target_audience}</p></>}
          </div>
        )}
        {prods.length > 0 && (
          <div className="panel"><h3>Productos y servicios</h3>
            <Visor layout="products" items={prods.map((p) => ({ src: p.image_url, title: p.name, desc: p.description, price: p.reference_price }))} />
          </div>
        )}
        {imgs.length > 0 && (
          <div className="panel"><h3>Galería</h3>
            <Visor items={imgs.map((i) => ({ src: i.image_url, alt: `Foto de ${b.name}`, title: b.name }))} />
          </div>
        )}
      </div>

      <aside className="panel c" style={{ '--c': 'var(--mint)', position: 'sticky', top: 90 }}>
        <h3>Contáctalos</h3>
        <ul className="list" style={{ margin: '16px 0' }}>
          {b.address && <li><b>Dónde están</b>{b.address}{b.neighborhood ? `, ${b.neighborhood}` : ''}{b.city ? `, ${b.city}` : ''}</li>}
          {b.schedule && <li><b>Horario</b>{b.schedule}</li>}
          {b.phone && <li><b>Celular</b>{b.phone}</li>}
          {b.email && <li><b>Correo</b><a href={`mailto:${b.email}`}>{b.email}</a></li>}
          {b.has_delivery && <li><b>Domicilios</b>{b.coverage || 'Sí, consulta cobertura'}</li>}
          {b.payment_methods?.length > 0 && <li><b>Medios de pago</b>{b.payment_methods.join(', ')}</li>}
        </ul>
        <div className="chips" style={{ marginBottom: 16 }}>
          {link && <a href={link} target="_blank" rel="noopener" style={{ background: 'var(--lemon)' }}>Escribir por WhatsApp</a>}
          {b.maps_url && <a href={b.maps_url} target="_blank" rel="noopener">Cómo llegar</a>}
          {b.website && <a href={b.website} target="_blank" rel="noopener">Sitio web</a>}
        </div>
        <div className="chips">{social(b).map(([n, u]) => <a key={n} href={u} target="_blank" rel="noopener">{n}</a>)}</div>
      </aside>
    </main>
  );
}
