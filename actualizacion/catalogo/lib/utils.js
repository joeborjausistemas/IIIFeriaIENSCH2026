export const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// WhatsApp con mensaje prellenado (asume Colombia +57 si son 10 dígitos)
export const wa = (num, name, text) => {
  if (!num) return null;
  let d = num.replace(/\D/g, '');
  if (d.length === 10) d = '57' + d;
  const msg = encodeURIComponent(text ?? `Hola ${name}, los vi en el catálogo y quiero saber más.`);
  return `https://wa.me/${d}?text=${msg}`;
};

// Convierte enlaces de YouTube/Vimeo en URL embebible
export const embed = (url) => {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
};

export const social = (b) => [
  ['Instagram', b.instagram], ['Facebook', b.facebook], ['TikTok', b.tiktok],
  ['YouTube', b.youtube], ['LinkedIn', b.linkedin], ['X', b.x_url],
].filter(([, v]) => v);
