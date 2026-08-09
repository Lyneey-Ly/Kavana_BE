import { useState, useEffect } from 'react';
import API from '../api';
import SidebarUser from '../components/SidebarUser';
import Swal from 'sweetalert2';

// 🟢 Sub-komponen Khusus Avatar agar Fallback Gambar Rusak Berjalan Sempurna
function UserAvatar({ avatarUrl, userName, initial }) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={userName}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return <span>{initial}</span>;
}

export default function Testimoni() {
  const [testimonis, setTestimonis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  // Helper untuk Memproses URL Foto Profil User
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath || typeof avatarPath !== 'string') return null;
    
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
      return avatarPath;
    }
    
    const cleanPath = avatarPath.replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `http://127.0.0.1:8000/storage/${cleanPath}`;
  };

  // Fetch Semua Testimoni Website
  const fetchTestimonis = async () => {
    try {
      setLoading(true);
      const res = await API.get('/testimonis');
      setTestimonis(res.data?.data || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      console.error('Gagal mengambil data testimoni:', err);
      Swal.fire({
        icon: 'error',
        title: 'Koneksi Gagal',
        text: 'Gagal mengambil data testimoni dari server.',
        confirmButtonColor: '#261C19'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonis();
  }, []);

  // Submit Form Testimoni Baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = { review, rating };
      const res = await API.post('/testimonis', payload);

      Swal.fire({
        title: 'Berhasil!',
        text: res.data?.message || 'Terima kasih atas ulasan Anda!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      // Reset Form & Tutup Modal
      setReview('');
      setRating(5);
      setShowModal(false);

      // Refresh Data
      fetchTestimonis();
    } catch (err) {
      console.error('Gagal mengirim testimoni:', err);
      Swal.fire({
        title: 'Gagal Mengirim',
        text: err.response?.data?.message || 'Gagal mengirim ulasan, silakan coba lagi.',
        icon: 'error',
        confirmButtonColor: '#261C19'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Hitung Rata-rata Rating Website
  const avgRating = testimonis.length > 0
    ? (testimonis.reduce((acc, curr) => acc + Number(curr.rating || 0), 0) / testimonis.length).toFixed(1)
    : '5.0';

  // Render Star Helper
  const renderStars = (score) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < score ? 'text-[#C5A059]' : 'text-slate-300'}`}>
        ★
      </span>
    ));
  };

  return (
    <SidebarUser>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans">
        
        {/* AMBIENT GLOW */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          
          {/* HEADER HERO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">
                Ulasan Platform
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19]">
                Pengalaman Layanan Kafana Vista
              </h1>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Bagikan pengalaman dan kesanmu selama menggunakan platform web serta layanan manajemen hunian di Kafana Vista.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              <span>✍️</span> Tulis Testimoni
            </button>
          </div>

          {/* RATING SUMMARY BANNER */}
          <div className="bg-[#261C19] text-[#FAF5EF] p-6 md:p-8 rounded-3xl border border-[#C5A059]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] font-bold text-[#E5D7C5]/70 uppercase tracking-widest block">
                Kepuasan Pengguna Platform
              </span>
              <div className="flex items-baseline justify-center sm:justify-start gap-3">
                <span className="text-4xl md:text-5xl font-black text-white">{avgRating}</span>
                <span className="text-base font-bold text-[#C5A059]">/ 5.0 Rating Keseluruhan</span>
              </div>
              <div className="flex gap-1 justify-center sm:justify-start">
                {renderStars(Math.round(Number(avgRating)))}
              </div>
            </div>

            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8 space-y-1">
              <span className="text-3xl font-black text-white block">{testimonis.length}</span>
              <span className="text-xs font-medium text-[#E5D7C5]/80 block">Testimoni Pengguna</span>
              <span className="text-[10px] text-[#C5A059] italic block">Akan ditampilkan di Halaman Utama (Home)</span>
            </div>
          </div>

          {/* LIST TESTIMONI GRID */}
          {loading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-[#E5D7C5] shadow-xs space-y-3">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Ulasan Pengguna...</p>
            </div>
          ) : testimonis.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5D7C5] text-center space-y-3">
              <span className="text-4xl block">💬</span>
              <h3 className="text-base font-extrabold text-[#261C19]">Belum Ada Testimoni</h3>
              <p className="text-xs text-slate-500">Jadilah orang pertama yang membagikan kesan pengalamanmu memakai platform ini!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {testimonis.map((item) => {
                const userName = item.user?.name || item.name || 'Pengguna Kafana Vista';
                const initial = userName.charAt(0).toUpperCase();
                
                const avatarRaw = item.user?.foto || item.user?.avatar || item.user?.photo || item.user?.profile_photo_path || item.foto;
                const avatarUrl = getAvatarUrl(avatarRaw);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* CARD HEADER USER INFO */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          
                          {/* FOTO PROFIL / FALLBACK VIA SUB-KOMPONEN */}
                          <div className="w-10 h-10 rounded-full bg-[#261C19] text-[#C5A059] font-extrabold flex items-center justify-center text-sm shadow-xs overflow-hidden flex-shrink-0 border border-[#C5A059]/30">
                            <UserAvatar avatarUrl={avatarUrl} userName={userName} initial={initial} />
                          </div>

                          <div>
                            <h4 className="text-xs font-extrabold text-[#261C19]">{userName}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">Verified User</span>
                          </div>
                        </div>
                        <div className="flex gap-0.5">{renderStars(item.rating)}</div>
                      </div>

                      {/* REVIEW TEXT */}
                      <p className="text-xs text-slate-700 leading-relaxed italic font-serif bg-[#FAF6F0]/40 p-4 rounded-2xl border border-[#E5D7C5]/40">
                        "{item.review || item.ulasan || item.comment || 'Ulasan tidak tersedia.'}"
                      </p>
                    </div>

                    {/* CARD FOOTER */}
                    <div className="text-[10px] text-slate-400 font-medium flex justify-between items-center pt-2">
                      <span className="text-[#C5A059] font-bold">Kafana Vista User</span>
                      <span>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Baru saja'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* MODAL FORM TULIS TESTIMONI */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 border border-[#E5D7C5] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">Beri Penilaian Platform</span>
                <h3 className="text-lg font-extrabold text-[#261C19]">Tulis Ulasan & Kesan</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* RATING INTERAKTIF (Bintang) */}
              <div className="space-y-2 text-center py-3 bg-[#FAF6F0] rounded-2xl border border-[#E5D7C5]/60">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#C5A059]">
                  Berapa Rating Layanan/Website Kami?
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                    >
                      <span className={star <= (hoverRating || rating) ? 'text-[#C5A059]' : 'text-slate-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500 block">
                  {rating === 5 && '😍 Website & Layanan Sangat Bagus!'}
                  {rating === 4 && '😊 Bagus & Sangat Membantu'}
                  {rating === 3 && '😐 Cukup Baik'}
                  {rating === 2 && '🙁 Perlu Banyak Perbaikan'}
                  {rating === 1 && '😡 Kurang Memuaskan'}
                </span>
              </div>

              {/* TEXTAREA REVIEW */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Ulasan & Testimoni Anda <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ceritakan pengalamanmu menggunakan website Kafana Vista (kemudahan booking, tampilan, pelayanan admin, dll)..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0]/50 focus:outline-hidden focus:border-[#C5A059] text-[#261C19] font-medium"
                ></textarea>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-[#261C19] hover:bg-[#3D2D29] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    '🚀 Kirim Testimoni'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </SidebarUser>
  );
}