const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const env = {
  siteUrl: (import.meta.env.VITE_SITE_URL ?? window.location.origin).replace(/\/$/, ''),
  basePath: import.meta.env.VITE_BASE_PATH ?? '/',
  supabase: {
    url,
    anonKey: anon,
    configured: /^https:\/\/.+\.supabase\.co$/i.test(url) && anon.length > 40,
  },
}

export const CONFIG_HINT =
  'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local (veja .env.example).'
