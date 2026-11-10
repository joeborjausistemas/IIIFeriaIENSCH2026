'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Muestra login/registro y, si hay sesión, renderiza children(user)
export default function Auth({ children }) {
  const [user, setUser] = useState(undefined);
  const [mode, setMode] = useState('in');
  const [f, setF] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: s } = supabase.auth.onAuthStateChange((_e, ses) => setUser(ses?.user || null));
    return () => s.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <p>Cargando…</p>;
  if (user) return <>
    <p style={{ margin: '8px 0' }}>Sesión: <b>{user.email}</b> · <button className="pill" onClick={() => supabase.auth.signOut()}>Salir</button></p>
    {children(user)}
  </>;

  const go = async (e) => {
    e.preventDefault(); setMsg('');
    const r = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      : await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } });
    if (r.error) setMsg(r.error.message);
    else if (mode === 'up' && !r.data.session) setMsg('Te enviamos un correo para confirmar tu cuenta. Después, inicia sesión.');
  };

  return (
    <form className="panel" onSubmit={go} style={{ maxWidth: 460, display: 'grid', gap: 14, marginTop: 24 }}>
      <h3>{mode === 'in' ? 'Entra a tu cuenta' : 'Crea tu cuenta'}</h3>
      {mode === 'up' && <label>Tu nombre<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>}
      <label>Correo<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label>Contraseña<input type="password" minLength={6} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
      <button className="btn" type="submit">{mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
      <button type="button" className="pill" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
      </button>
      {msg && <div className="msg err">{msg}</div>}
    </form>
  );
}
