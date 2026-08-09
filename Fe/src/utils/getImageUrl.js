export const getImageUrl = (path) => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
  }
  
  if (typeof path !== 'string') return '';
  
  // Jika sudah berupa URL utuh (http/https/data)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // Bersihkan slash ganda atau prefix storage yang menumpuk
  const cleanPath = path.replace(/^\/?storage\//, '');
  
  // Port Backend Laravel kamu (Sesuaikan jika beda port)
  return `http://127.0.0.1:8000/storage/${cleanPath}`;
};