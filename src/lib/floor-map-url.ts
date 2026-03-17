const normalizeEnvValue = (value: string | undefined) => (value ?? '').trim().replace(/^['"]|['"]$/g, '');

const toHttpSupabaseUrl = (value: string) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return null;
  }
};

const rawSupabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const rawProjectId = normalizeEnvValue(import.meta.env.VITE_SUPABASE_PROJECT_ID);
const SUPABASE_URL =
  toHttpSupabaseUrl(rawSupabaseUrl)
  ?? toHttpSupabaseUrl(rawProjectId ? `https://${rawProjectId}.supabase.co` : '')
  ?? '';

export function normalizeFloorMapUrl(urlOrPath: string | null | undefined) {
  if (!urlOrPath) return null;

  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('/storage/v1/object/public/')) {
      return trimmed;
    }

    if (trimmed.includes('/storage/v1/object/')) {
      return trimmed.replace('/storage/v1/object/', '/storage/v1/object/public/');
    }

    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('floor-maps/')) {
    return `/${trimmed}`;
  }

  if (!SUPABASE_URL) return null;

  const sanitizedPath = trimmed.replace(/^\/+/, '').replace(/^floor-maps\//, '');
  return `${SUPABASE_URL}/storage/v1/object/public/floor-maps/${sanitizedPath}`;
}

export function withFloorMapVersion(url: string | null, version: string | null | undefined) {
  if (!url) return null;
  if (!version) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}