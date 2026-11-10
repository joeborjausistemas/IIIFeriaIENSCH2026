import Link from 'next/link';
import { wa } from '@/lib/utils';

export default function Sticker({ b }) {
  const link = wa(b.whatsapp || b.phone, b.name);
  return (
    <article className={`sticker c${(b.category_id || 0) % 6}`}>
      {b.status === 'featured' && <span className="star">Destacado</span>}
      {b.logo_url
        ? <img className="logo" src={b.logo_url} alt={`Logo de ${b.name}`} />
        : <div className="logo" aria-hidden>{b.name[0]}</div>}
      <h3>{b.name}</h3>
      {b.categories?.name && <span className="cat">{b.categories.name}{b.city ? ` en ${b.city}` : ''}</span>}
      <p>{b.slogan || b.description}</p>
      {b.student_name && <p className="stu"><b>{b.student_name}</b><br />{[b.student_grade, b.campus].filter(Boolean).join(' · ')}</p>}
      <div className="row">
        <Link className="btn sm alt" href={`/emprendimiento/${b.slug}`}>Ver ficha y video</Link>
        {link && <a className="btn sm" href={link} target="_blank" rel="noopener">WhatsApp</a>}
      </div>
    </article>
  );
}
