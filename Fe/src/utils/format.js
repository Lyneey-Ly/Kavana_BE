export const formatRupiah = (val) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

export const formatAvatar = (imgSrc) => {
  if (!imgSrc) return null;
  if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:')) {
    return imgSrc;
  }
  const cleanPath = imgSrc.startsWith('/') ? imgSrc : `/${imgSrc}`;
  if (cleanPath.startsWith('/storage/')) {
    return `http://127.0.0.1:8000${cleanPath}`;
  }
  return `http://127.0.0.1:8000/storage${cleanPath}`;
};