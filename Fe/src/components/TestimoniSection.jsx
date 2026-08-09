import { useState, useEffect } from 'react';
import API from '../api';

// 🟢 Sub-komponen Avatar dengan Fallback Gambar Rusak
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

export default function TestimonialSection() {
  const [testimonis, setTestimonis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Helper Pemproses URL Foto Profil
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath || typeof avatarPath !== 'string') return null;
    
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
      return avatarPath;
    }
    
    const cleanPath = avatarPath.replace(/^\/?storage\//, '').replace(/^\/+/, '');
    return `http://127.0.0.1:8000/storage/${cleanPath}`;
  };

  // Fetch Data Testimoni
  useEffect(() => {
    const fetchTestimonis = async () => {
      try {
        setLoading(true);
        const res = await API.get('/testimonis');
        setTestimonis(res.data?.data || (Array.isArray(res.data) ? res.data : []));
      } catch (err) {
        console.error('Gagal memuat testimoni di home:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonis();
  }, []);

  // Timer Auto-Slide (Setiap 3 Detik jika data > 3)
  useEffect(() => {
    if (testimonis.length <= 3 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonis.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [testimonis.length, isPaused]);

  // Handler Navigasi Manual
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonis.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonis.length);
  };

  const renderStars = (score) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-sm ${i < score ? 'text-[#C5A059]' : 'text-white/20'}`}>
        ★
      </span>
    ));
  };

  if (loading || testimonis.length === 0) return null;

  // Mengambil 3 item berurutan dari index aktif
  const getVisibleTestimonis = () => {
    if (testimonis.length <= 3) return testimonis;
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(testimonis[(currentIndex + i) % testimonis.length]);
    }
    return visible;
  };

  const visibleTestimonis = getVisibleTestimonis();

  return (
    <section className="py-16 bg-[#261C19] text-[#FAF5EF] rounded-3xl relative overflow-hidden my-12 shadow-2xl border border-[#C5A059]/30 font-sans">
      
      {/* AMBIENT GLOW DEKORATIF */}
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-8">
        
        {/* HEADER SECTION */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/10 px-3.5 py-1.5 rounded-full border border-[#C5A059]/30 inline-block">
            Ulasan & Impresi
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-serif text-white">
            Apa Kata Penghuni Kafana Vista?
          </h2>
          <p className="text-xs text-[#E5D7C5]/70 leading-relaxed font-sans">
            Pengalaman nyata dari tenant dan pengguna platform dalam menikmati hunian dan layanan kami.
          </p>
        </div>

        {/* CONTAINER GRID 3 CARD */}
        <div 
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleTestimonis.map((item, idx) => {
              const userName = item.user?.name || item.name || 'Pengguna Kafana Vista';
              const initial = userName.charAt(0).toUpperCase();

              // Deteksi Foto Profil User
              const avatarRaw = item.user?.foto || item.user?.avatar || item.user?.photo || item.user?.profile_photo_path || item.foto;
              const avatarUrl = getAvatarUrl(avatarRaw);

              return (
                <div
                  key={`${item.id || idx}-${currentIndex}`}
                  className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-[#C5A059]/20 hover:border-[#C5A059]/50 transition-all duration-300 space-y-4 flex flex-col justify-between hover:-translate-y-1 shadow-xl animate-in fade-in zoom-in-95 duration-500"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">{renderStars(item.rating || 5)}</div>
                      <span className="text-[10px] font-bold text-[#C5A059] bg-[#C5A059]/10 px-2.5 py-0.5 rounded-full border border-[#C5A059]/20">
                        Verified User
                      </span>
                    </div>

                    <p className="text-xs text-[#E5D7C5]/90 italic font-serif leading-relaxed line-clamp-4">
                      "{item.review || item.ulasan || item.comment || 'Ulasan tidak tersedia.'}"
                    </p>
                  </div>

                  {/* USER PROFILE FOOTER */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] text-[#261C19] font-extrabold flex items-center justify-center text-sm shadow-md overflow-hidden flex-shrink-0 border border-[#C5A059]/30">
                      <UserAvatar avatarUrl={avatarUrl} userName={userName} initial={initial} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{userName}</h4>
                      <span className="text-[10px] text-[#E5D7C5]/60 block">Penghuni Kafana Vista</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TOMBOL NAVIGASI PREV & NEXT */}
          {testimonis.length > 3 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute -left-4 md:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#261C19] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#261C19] transition flex items-center justify-center text-sm shadow-xl cursor-pointer z-20"
                title="Sebelumnya"
              >
                ❮
              </button>
              <button
                onClick={handleNext}
                className="absolute -right-4 md:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#261C19] border border-[#C5A059]/40 text-[#C5A059] hover:bg-[#C5A059] hover:text-[#261C19] transition flex items-center justify-center text-sm shadow-xl cursor-pointer z-20"
                title="Selanjutnya"
              >
                ❯
              </button>
            </>
          )}
        </div>

        {/* DOTS INDIKATOR */}
        {testimonis.length > 3 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            {testimonis.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 h-2.5 bg-[#C5A059] rounded-full'
                    : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/50 rounded-full'
                }`}
                title={`Ke slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}