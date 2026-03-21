const normalizePath = (value: string | undefined) => {
  const raw = (value ?? '').trim().replace(/^['"]|['"]$/g, '');
  if (!raw) return null;
  return raw.startsWith('/') ? raw : `/${raw}`;
};

export const ADMIN_LOGIN_PATH =
  normalizePath(import.meta.env.VITE_ADMIN_LOGIN_PATH)
  ?? '/admin/login';

export const ADMIN_PANEL_PATH =
  normalizePath(import.meta.env.VITE_ADMIN_PANEL_PATH)
  ?? '/admin';
