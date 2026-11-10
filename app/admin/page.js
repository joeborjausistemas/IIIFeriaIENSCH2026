'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { wa } from '@/lib/utils';
import Auth from '@/components/Auth';
import { siteUrl } from '@/lib/site';

const ST = { pending: 'Pendientes', approved: 'Aprobados', featured: 'Destacados', rejected: 'Rechazados' };
const ROLES = { admin: 'Administrador', moderator: 'Moderador', editor: 'Editor', entrepreneur: 'Emprendedor' };

function Panel({ user }) {
  const [role, setRole] = useState(null);
  const [view, setView] = useState('negocios');
  const [rows, setRows] = useState([]);
  const [people, setPeople] = useState([]);
  const [notes, setNotes] = useState({});
  const [tab, setTab] = useState('pending');
  const [open, setOpen] = useState(null);
  const [draft, setDraft] = useState('');
  const [find, setFind] = useState('');

  const load = async () => {
    const [b, n, p] = await Promise.all([
      supabase.from('businesses').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('admin_notes').select('*').order('created_at'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setRows(b.data || []); setPeople(p.data || []);
    const g = {}; (n.data || []).forEach((x) => (g[x.business_id] ||= []).push(x)); setNotes(g);
  };
  useEffect(() => {
    supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => setRole(data?.role));
    load();
  }, [user.id]);

  const setStatus = async (b, status) => {
    let reason = null;
    if (status === 'rejected') {
      reason = prompt('Motivo del rechazo. El emprendedor lo verá para poder corregir su ficha:');
      if (!reason?.trim()) return;
    }
    await supabase.from('businesses').update({ status, rejection_reason: reason }).eq('id', b.id);
    load();
  };
  const addNote = async (id) => {
    if (!draft.trim()) return;
    await supabase.from('admin_notes').insert({ business_id: id, note: draft.trim() });
    setDraft(''); load();
  };
  const setUserRole = async (id, r) => { await supabase.from('profiles').update({ role: r }).eq('id', id); load(); };
  const who = (id) => { const p = people.find((x) => x.id === id); return p?.full_name || p?.email || 'Equipo'; };

  const notify = (b) => {
    const base = siteUrl();
    const text = b.status === 'rejected'
      ? `Hola, equipo de ${b.name}. Revisamos su ficha para la III Feria del Emprendimiento y Expotecnología 2026 y necesita ajustes: ${b.rejection_reason}.\n\nPueden corregirla aquí y la revisamos de nuevo:\n${base}/mi-cuenta`
      : `¡Hola, equipo de ${b.name}! Su negocio ya está publicado en el catálogo de la III Feria del Emprendimiento y Expotecnología 2026. Pueden verlo y compartirlo aquí:\n\n${base}/emprendimiento/${b.slug}`;
    return wa(b.whatsapp || b.phone, b.name, text);
  };

  if (!role) return <p>Verificando permisos…</p>;
  if (role === 'entrepreneur') return <div className="msg err">Esta sección es solo para el equipo administrador.</div>;

  const list = rows.filter((r) => r.status === tab);
  const ppl = people.filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(find.toLowerCase()));

  return (
    <>
      <div className="tabs">
        <button className="pill" aria-pressed={view === 'negocios'} onClick={() => setView('negocios')}>Negocios</button>
        {role === 'admin' && <button className="pill" aria-pressed={view === 'equipo'} onClick={() => setView('equipo')}>Usuarios y roles</button>}
      </div>

      {view === 'negocios' && <>
        <div className="tabs">
          {Object.entries(ST).map(([k, l]) => (
            <button key={k} className="pill" aria-pressed={tab === k} onClick={() => setTab(k)}>{l} ({rows.filter((r) => r.status === k).length})</button>
          ))}
        </div>
        {list.length === 0 && <div className="empty" style={{ background: 'var(--white)' }}>No hay negocios en esta lista.</div>}
        {list.map((b) => (
          <div className="qwrap" key={b.id}>
            <div className="qrow">
              {b.logo_url ? <img className="logo" src={b.logo_url} alt="" /> : <div className="logo">{b.name[0]}</div>}
              <div>
                <b>{b.name}</b><span className="state">{ST[b.status]}</span>
                <small>{b.categories?.name} · {b.city} · {b.whatsapp || b.phone}</small>
                <small>{b.video_url ? 'Con video pitch' : 'Sin video pitch'}{b.status === 'rejected' && b.rejection_reason ? ` · Motivo: ${b.rejection_reason}` : ''}</small>
              </div>
              <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link className="btn sm alt" href={`/emprendimiento/${b.slug}`}>Ver</Link>
                {b.status !== 'approved' && <button className="btn sm" onClick={() => setStatus(b, 'approved')}>Aprobar</button>}
                {b.status !== 'featured' && <button className="btn sm cobalt" onClick={() => setStatus(b, 'featured')}>Destacar</button>}
                {b.status !== 'rejected' && <button className="btn sm alt" onClick={() => setStatus(b, 'rejected')}>Rechazar</button>}
                {b.status !== 'pending' && notify(b) && <a className="btn sm alt" href={notify(b)} target="_blank" rel="noopener">Avisar por WhatsApp</a>}
                <button className="btn sm alt" onClick={() => { setOpen(open === b.id ? null : b.id); setDraft(''); }}>Notas ({(notes[b.id] || []).length})</button>
              </div>
            </div>
            {open === b.id && (
              <div className="notes">
                {(notes[b.id] || []).map((n) => <p key={n.id}><b>{who(n.author_id)}</b> · {new Date(n.created_at).toLocaleDateString('es-CO')}<br />{n.note}</p>)}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ flex: 1 }} placeholder="Nota interna (solo la ve el equipo)" value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <button className="btn sm" onClick={() => addNote(b.id)}>Guardar nota</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </>}

      {view === 'equipo' && <>
        <input className="search" style={{ width: '100%', marginBottom: 18 }} placeholder="Busca por nombre o correo" value={find} onChange={(e) => setFind(e.target.value)} aria-label="Buscar usuarios" />
        {ppl.map((p) => (
          <div className="qrow" key={p.id} style={{ gridTemplateColumns: '1fr auto' }}>
            <div><b>{p.full_name || 'Sin nombre'}</b><small>{p.email}</small></div>
            <select value={p.role} disabled={p.id === user.id} onChange={(e) => setUserRole(p.id, e.target.value)} aria-label={`Rol de ${p.email}`}>
              {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        ))}
      </>}
    </>
  );
}

export default function Admin() {
  return (
    <main className="wrap page">
      <h1>Panel del equipo</h1>
      <Auth>{(user) => <Panel user={user} />}</Auth>
    </main>
  );
}
