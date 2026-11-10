'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import { SEDES, GRADOS } from '@/lib/config';

const FIELDS = [
  ['name', 'Nombre del emprendimiento', 'text', true],
  ['slogan', 'Eslogan (máx. 100 caracteres)', 'text'],
  ['description', 'Descripción (máx. 300 caracteres)', 'textarea', false, true],
  ['value_proposition', '¿Qué problema resuelves?', 'textarea', false, true],
  ['target_audience', '¿Para quién es?', 'text'],
  ['team_names', 'Quién está detrás (nombres)', 'text'],
  ['video_url', 'Enlace del video pitch (YouTube o Vimeo)', 'url'],
  ['city', 'Ciudad', 'text'], ['neighborhood', 'Barrio o zona', 'text'],
  ['address', 'Dirección', 'text'], ['maps_url', 'Enlace de Google Maps', 'url'],
  ['whatsapp', 'WhatsApp (10 dígitos o con indicativo)', 'tel'], ['phone', 'Celular', 'tel'],
  ['email', 'Correo de contacto', 'email'], ['website', 'Sitio web o tienda online', 'url'],
  ['schedule', 'Horario de atención', 'text'], ['coverage', 'Cobertura de domicilios', 'text'],
  ['instagram', 'Instagram (enlace)', 'url'], ['facebook', 'Facebook (enlace)', 'url'],
  ['tiktok', 'TikTok (enlace)', 'url'], ['youtube', 'YouTube (enlace)', 'url'],
  ['tags', 'Etiquetas (separadas por coma)', 'text'],
  ['payment_methods', 'Medios de pago (separados por coma)', 'text'],
  ['founded_year', 'Año de fundación', 'number'],
];
const LISTS = ['tags', 'payment_methods', 'founded_year'];
const MAX_IMG = 6, MAX_PROD = 5, MAX_MB = 5;
const arr = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);

async function upload(user, file, folder) {
  const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name.replace(/[^\w.-]+/g, '_')}`;
  const { error } = await supabase.storage.from('media').upload(path, file);
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}
const rm = (url) => url?.includes('/media/') &&
  supabase.storage.from('media').remove([decodeURIComponent(url.split('/media/')[1])]);

export default function BusinessForm({ user, business, onDone, onCancel }) {
  const edit = !!business;
  const [cats, setCats] = useState([]);
  const [v, setV] = useState(() => business
    ? { ...business, tags: (business.tags || []).join(', '), payment_methods: (business.payment_methods || []).join(', ') }
    : { has_delivery: false });
  const [consent, setConsent] = useState(edit);
  const [logo, setLogo] = useState(null);
  const [imgs, setImgs] = useState([]);
  const [newImgs, setNewImgs] = useState([]);
  const [prods, setProds] = useState([]);
  const [gone, setGone] = useState({ imgs: [], prods: [] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCats(data || []));
    if (edit) {
      supabase.from('business_images').select('*').eq('business_id', business.id).order('position').then(({ data }) => setImgs(data || []));
      supabase.from('business_products').select('*').eq('business_id', business.id).order('position').then(({ data }) => setProds(data || []));
    }
  }, []);

  const addImgs = (e) => {
    const room = MAX_IMG - imgs.length - newImgs.length;
    const all = [...e.target.files];
    const ok = all.filter((f) => f.size <= MAX_MB * 1048576).slice(0, room);
    if (ok.length < all.length) setMsg({ ok: false, t: `Máximo ${MAX_IMG} fotos, de ${MAX_MB} MB cada una.` });
    setNewImgs([...newImgs, ...ok]); e.target.value = '';
  };
  const addProd = () => prods.length < MAX_PROD &&
    setProds([...prods, { id: crypto.randomUUID(), name: '', description: '', reference_price: '' }]);
  const setProd = (i, k, val) => setProds(prods.map((p, j) => (j === i ? { ...p, [k]: val } : p)));

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const row = {};
      FIELDS.filter(([k]) => !LISTS.includes(k)).forEach(([k]) => { row[k] = (v[k] ?? '').toString().trim() || null; });
      row.stage = v.stage || null;
      row.student_name = (v.student_name || '').trim() || null;
      row.student_grade = v.student_grade || null;
      row.campus = v.campus || null;
      row.category_id = v.category_id ? Number(v.category_id) : null;
      row.founded_year = v.founded_year ? Number(v.founded_year) : null;
      row.has_delivery = !!v.has_delivery;
      row.tags = arr(v.tags); row.payment_methods = arr(v.payment_methods);
      row.logo_url = logo ? await upload(user, logo, 'logo') : (business?.logo_url || null);
      if (logo && business?.logo_url) rm(business.logo_url);

      let id = business?.id;
      if (edit) {
        const { error } = await supabase.from('businesses').update(row).eq('id', id);
        if (error) throw error;
      } else {
        id = crypto.randomUUID();
        const { error } = await supabase.from('businesses').insert({
          ...row, id, owner_id: user.id, status: 'pending', data_consent: true,
          slug: `${slugify(row.name)}-${Math.random().toString(36).slice(2, 6)}`,
        });
        if (error) throw error;
      }

      if (gone.imgs.length) {
        await supabase.from('business_images').delete().in('id', gone.imgs.map((i) => i.id));
        gone.imgs.forEach((i) => rm(i.image_url));
      }
      if (newImgs.length) {
        const rows = [];
        for (const [n, f] of newImgs.entries())
          rows.push({ business_id: id, image_url: await upload(user, f, 'gallery'), position: imgs.length + n });
        const { error } = await supabase.from('business_images').insert(rows);
        if (error) throw error;
      }
      if (gone.prods.length) await supabase.from('business_products').delete().in('id', gone.prods);
      const rows = [];
      for (const [n, p] of prods.entries()) {
        if (!p.name?.trim()) continue;
        rows.push({
          id: p.id, business_id: id, name: p.name.trim(), description: p.description || null, position: n,
          reference_price: p.reference_price === '' || p.reference_price == null ? null : Number(p.reference_price),
          image_url: p.file ? await upload(user, p.file, 'products') : (p.image_url || null),
        });
      }
      if (rows.length) {
        const { error } = await supabase.from('business_products').upsert(rows);
        if (error) throw error;
      }
      onDone(edit ? 'Cambios guardados.' : 'Listo. Tu negocio quedó en revisión; aquí verás cuando esté publicado.');
    } catch (err) { setMsg({ ok: false, t: err.message }); setBusy(false); }
  };

  return (
    <form className="form" onSubmit={save}>
      <h2 className="full" style={{ fontSize: '2rem' }}>{edit ? `Editar ${business.name}` : 'Datos de tu negocio'}</h2>

      <fieldset className="fs">
        <legend>Identidad</legend>
        <label>Logo (PNG o JPG){business?.logo_url && <img className="logo" src={business.logo_url} alt="Logo actual" />}
          <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} /></label>
        <label>Categoría<select required value={v.category_id || ''} onChange={set('category_id')}>
          <option value="">Elige una</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Etapa<select value={v.stage || ''} onChange={set('stage')}>
          <option value="">Sin indicar</option><option value="idea">Idea</option><option value="nuevo">Nuevo</option>
          <option value="crecimiento">En crecimiento</option><option value="consolidado">Consolidado</option></select></label>
      </fieldset>

      <fieldset className="fs">
        <legend>Estudiante que representa el emprendimiento</legend>
        <label>Nombre completo del estudiante<input required maxLength={120} value={v.student_name || ''} onChange={set('student_name')} /></label>
        <label>Grado<select required value={v.student_grade || ''} onChange={set('student_grade')}>
          <option value="">Elige el grado</option>{GRADOS.map((g) => <option key={g}>{g}</option>)}</select></label>
        <label>Sede<select required value={v.campus || ''} onChange={set('campus')}>
          <option value="">Elige la sede</option>{SEDES.map((s) => <option key={s}>{s}</option>)}</select></label>
      </fieldset>

      {FIELDS.map(([k, label, type, req, full]) => (
        <label key={k} className={full ? 'full' : ''}>{label}
          {type === 'textarea'
            ? <textarea rows={3} maxLength={k === 'description' ? 300 : 600} required={req} value={v[k] || ''} onChange={set(k)} />
            : <input type={type} required={req} maxLength={type === 'text' || type === 'url' ? (k === 'slogan' ? 100 : 300) : undefined}
                min={type === 'number' ? 1900 : undefined} max={type === 'number' ? 2100 : undefined} value={v[k] ?? ''} onChange={set(k)} />}
        </label>
      ))}
      <label className="check full"><input type="checkbox" checked={!!v.has_delivery} onChange={set('has_delivery')} /> Hacemos domicilios o envíos</label>

      <fieldset className="fs">
        <legend>Galería ({imgs.length + newImgs.length}/{MAX_IMG} fotos)</legend>
        <div className="thumbs">
          {imgs.map((i) => (
            <div className="thumb" key={i.id}><img src={i.image_url} alt="Foto de la galería" />
              <button type="button" aria-label="Quitar foto" onClick={() => { setGone({ ...gone, imgs: [...gone.imgs, i] }); setImgs(imgs.filter((x) => x.id !== i.id)); }}>×</button></div>
          ))}
          {newImgs.map((f, n) => (
            <div className="thumb" key={n}><img src={URL.createObjectURL(f)} alt="Foto nueva" />
              <button type="button" aria-label="Quitar foto" onClick={() => setNewImgs(newImgs.filter((_, j) => j !== n))}>×</button></div>
          ))}
        </div>
        {imgs.length + newImgs.length < MAX_IMG && <input type="file" accept="image/*" multiple onChange={addImgs} />}
      </fieldset>

      <fieldset className="fs">
        <legend>Productos o servicios destacados ({prods.length}/{MAX_PROD})</legend>
        {prods.map((p, i) => (
          <div className="prod" key={p.id}>
            <input placeholder="Nombre" value={p.name} onChange={(e) => setProd(i, 'name', e.target.value)} aria-label="Nombre del producto" />
            <input placeholder="Descripción corta" value={p.description || ''} onChange={(e) => setProd(i, 'description', e.target.value)} aria-label="Descripción" />
            <input type="number" min="0" placeholder="Precio" value={p.reference_price ?? ''} onChange={(e) => setProd(i, 'reference_price', e.target.value)} aria-label="Precio de referencia" />
            <input type="file" accept="image/*" onChange={(e) => setProd(i, 'file', e.target.files[0])} aria-label="Foto del producto" />
            <button type="button" className="pill" onClick={() => { setGone({ ...gone, prods: [...gone.prods, p.id] }); setProds(prods.filter((_, j) => j !== i)); }}>Quitar</button>
          </div>
        ))}
        {prods.length < MAX_PROD && <button type="button" className="btn sm alt" onClick={addProd}>Agregar producto</button>}
      </fieldset>

      {!edit && <label className="check full"><input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Autorizo, como acudiente o representante legal del estudiante (o como estudiante mayor de edad), el tratamiento de los datos del estudiante y del negocio, y el uso del logo e imágenes en el catálogo (Ley 1581 de 2012).</label>}
      <div className="full" style={{ display: 'flex', gap: 12 }}>
        <button className="btn" disabled={busy}>{busy ? 'Guardando…' : edit ? 'Guardar cambios' : 'Enviar mi negocio'}</button>
        <button type="button" className="btn alt" onClick={onCancel} disabled={busy}>Cancelar</button>
      </div>
      {msg && <div className={`msg full ${msg.ok ? '' : 'err'}`}>{msg.t}</div>}
    </form>
  );
}
