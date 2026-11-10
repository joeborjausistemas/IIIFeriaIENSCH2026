// URL pública del sitio. En producción define NEXT_PUBLIC_SITE_URL (https://...).
// WhatsApp solo convierte en enlace las direcciones https reales, no localhost.
export const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || (typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '');
