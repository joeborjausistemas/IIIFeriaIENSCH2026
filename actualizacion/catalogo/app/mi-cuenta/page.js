'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Auth from '@/components/Auth';
import { siteUrl } from '@/lib/site';
import BusinessForm from '@/components/BusinessForm';

const LABEL = { pending: 'En revisión', approved: 'Publicado', featured: 'Publicado y destacado', rejected: 'No aprobado' };

function Mine({ user }) {
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState('');

  const load = () => supabase.from('businesses').select('*').eq('owner_id', user.id)
    .order('created_at', { ascending: false }).then(({ data }) => setRows(data || []));
  useEffect(() => { load(); }, [user.id]);

  if (editing) return (
    <BusinessForm user={user} business={editing === 'new' ? null : editing}
      onCancel={() => setEditing(null)} onDone={(m) => { setNote(m); setEditing(null); load(); }} />
  );
  if (!rows) return <p>Cargando tus negocios…</p>;

  const copy = (url, id) => { navigator.clipboard.writeText(url); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  return (
    <>
      {note && <div className="msg">{note}</div>}
      <div style={{ margin: '22px 0' }}><button className="btn" onClick={() => { setNote(''); setEditing('new'); }}>Registrar un negocio</button></div>
      {rows.length === 0 && <div className="empty" style={{ background: 'var(--white)' }}>Aún no has registrado ningún negocio. Empieza con el botón de arriba.</div>}
      {rows.map((b) => {
        const url = `${siteUrl()}/emprendimiento/${b.slug}`;
        const live = b.status === 'approved' || b.status === 'featured';
        return (
          <div className="mine" key={b.id}>
            {b.logo_url ? <img className="logo" src={b.logo_url} alt="" /> : <div className="logo">{b.name[0]}</div>}
            <div>
              <h3>{b.name}<span className={`state ${live ? 'ok' : b.status === 'rejected' ? 'no' : ''}`}>{LABEL[b.status]}</span></h3>
              {b.status === 'pending' && <p>Nuestro equipo lo está revisando. Puedes seguir editándolo mientras tanto.</p>}
              {live && <p>Tu enlace público: <a href={url}><b>{url}</b></a> <button className="pill" onClick={() => copy(url, b.id)}>{copied === b.id ? 'Copiado' : 'Copiar enlace'}</button></p>}
              {b.status === 'rejected' && <p className="why"><b>Motivo:</b> {b.rejection_reason || 'El equipo no dejó un motivo.'} Corrige tu ficha y se enviará de nuevo a revisión.</p>}
            </div>
            <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {live && <Link className="btn sm alt" href={`/emprendimiento/${b.slug}`}>Ver ficha</Link>}
              <button className="btn sm" onClick={() => { setNote(''); setEditing(b); }}>{b.status === 'rejected' ? 'Corregir y reenviar' : 'Editar'}</button>
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function MiCuenta() {
  return (
    <main className="wrap page">
      <h1>Tu negocio en el muro</h1>
      <p style={{ maxWidth: '55ch', marginTop: 12 }}>Registra tu ficha, edítala cuando quieras y mira aquí si fue aprobada. Nuestro equipo revisa cada negocio antes de publicarlo.</p>
      <Auth>{(user) => <Mine user={user} />}</Auth>
    </main>
  );
}
