export const storageBaseUrl = () =>
  import.meta.env.VITE_STORAGE_BASE_URL || import.meta.env.VITE_API_URL || '';

export const getMediaUrl = (path) => {
  if (!path) return null;
  if (/^(https?:|data:)/.test(path)) return path;

  let clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith('/storage/')) {
    clean = clean.replace(/^\/+/, '/');
  }

  const base = storageBaseUrl();
  return base ? `${base.replace(/\/+$/, '')}${clean}` : clean;
};