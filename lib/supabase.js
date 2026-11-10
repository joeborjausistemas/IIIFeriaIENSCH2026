import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !/^https?:\/\//.test(url) || !key) {
  throw new Error(
    `Variables de Supabase mal configuradas. ` +
    `URL recibida: ${url === undefined ? 'NO EXISTE' : JSON.stringify(url.slice(0, 14))} ` +
    `(largo ${url?.length ?? 0}). Clave recibida: ${key ? 'sí, largo ' + key.length : 'NO EXISTE'}.`
  );
}

export const supabase = createClient(url, key);