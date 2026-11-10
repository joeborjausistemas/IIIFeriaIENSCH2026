'use client';
import { useEffect, useRef, useState } from 'react';

const money = (p) => (p != null && p !== '' ? `$${Number(p).toLocaleString('es-CO')}` : null);

// Miniaturas que se amplían en un visor (galería y productos)
export default function Visor({ items, layout = 'grid' }) {
  const [i, setI] = useState(null);
  const ref = useRef(null);
  const pics = items.filter((x) => x.src);
  const cur = i !== null ? pics[i] : null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (i !== null && !d.open) d.showModal();
    if (i === null && d.open) d.close();
  }, [i]);

  const go = (n) => setI((i + n + pics.length) % pics.length);
  const onKey = (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };

  return (
    <>
      {layout === 'products' ? (
        <ul className="prods">
          {items.map((p, n) => (
            <li key={n}>
              {p.src
                ? <button type="button" className="thumb-btn" onClick={() => setI(pics.indexOf(p))} aria-label={`Ampliar foto de ${p.title}`}>
                    <img src={p.src} alt="" loading="lazy" /></button>
                : <div className="thumb-btn ph" aria-hidden>{p.title[0]}</div>}
              <div><b>{p.title}</b>{money(p.price) && <span className="price">{money(p.price)}</span>}{p.desc && <p>{p.desc}</p>}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="gal" style={{ marginTop: 14 }}>
          {pics.map((p, n) => (
            <button type="button" key={n} className="thumb-btn" onClick={() => setI(n)} aria-label={`Ampliar foto ${n + 1} de ${pics.length}`}>
              <img src={p.src} alt={p.alt || ''} loading="lazy" /></button>
          ))}
        </div>
      )}

      <dialog ref={ref} className="lb" onClose={() => setI(null)} onKeyDown={onKey}
        onClick={(e) => e.target === ref.current && setI(null)} aria-label="Visor de fotos">
        {cur && (
          <figure>
            <img src={cur.src} alt={cur.alt || cur.title || ''} />
            {(cur.title || cur.desc) && (
              <figcaption><b>{cur.title}</b>{money(cur.price) && <span className="price">{money(cur.price)}</span>}{cur.desc && <p>{cur.desc}</p>}</figcaption>
            )}
          </figure>
        )}
        <button type="button" className="lb-x" onClick={() => setI(null)} aria-label="Cerrar">×</button>
        {pics.length > 1 && <>
          <button type="button" className="lb-n prev" onClick={() => go(-1)} aria-label="Foto anterior">‹</button>
          <button type="button" className="lb-n next" onClick={() => go(1)} aria-label="Foto siguiente">›</button>
        </>}
      </dialog>
    </>
  );
}
