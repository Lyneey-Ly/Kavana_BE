import { useState, useEffect, useMemo } from 'react';
import API from '../api';

export default function VendorBanner({ placement = 'home_hero', autoSlideInterval = 5000 }) {
  const [rawAds, setRawAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  // 1. Ambil data iklan dinamis dari API backend berdasarkan placement
  useEffect(() => {
    setLoading(true);
    API.get(`/vendor-ads/active?placement=${placement}`)
      .then((res) => {
        const adsData = res.data?.data || res.data || [];
        setRawAds(Array.isArray(adsData) ? adsData : []);
      })
      .catch((err) => console.error('Gagal memuat iklan vendor', err))
      .finally(() => setLoading(false));
  }, [placement]);

  // 2. Ekstrak & Ratakan Semua Gambar dari Seluruh Iklan Aktif
  const slides = useMemo(() => {
    const list = [];
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

    rawAds.forEach((ad) => {
      let images = [];
      try {
        const parsed = JSON.parse(ad.banner_image);
        images = Array.isArray(parsed) ? parsed : [ad.banner_image];
      } catch {
        images = ad.banner_image ? [ad.banner_image] : [];
      }

      images.forEach((img, idx) => {
        const fullUrl = img.startsWith('http') ? img : `${baseUrl}/storage/${img}`;
        list.push({
          slideKey: `${ad.id}-${idx}`,
          vendorName: ad.vendor_name,
          description: ad.description,
          linkUrl: ad.link_url,
          imageUrl: fullUrl
        });
      });
    });

    return list;
  }, [rawAds]);

  // 3. Auto-Slide Logic
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;

    const slideTimer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, autoSlideInterval);

    return () => clearInterval(slideTimer);
  }, [slides.length, isHovered, autoSlideInterval]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? slides.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handleImageError = (key) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  if (loading) {
    return (
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-md border border-[#D7C4B0]/40 min-h-[300px] md:min-h-[400px] bg-slate-200 animate-pulse flex items-center justify-center">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          Memuat Banner Iklan...
        </span>
      </div>
    );
  }

  if (slides.length === 0) return null;

  return (
    <div 
      className="relative rounded-2xl overflow-hidden mb-8 shadow-xl border border-[#D7C4B0]/40 group bg-slate-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge Sponsor di Pojok Kanan Atas */}
      <div className="absolute top-4 right-4 z-30 bg-black/50 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] shadow-md pointer-events-none">
        SPONSOR / IKLAN
      </div>

      {/* BANNER SLIDES WRAPPER */}
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => {
          const hasError = imageErrors[slide.slideKey];

          return (
            <div 
              key={slide.slideKey}
              className="w-full flex-shrink-0 relative min-h-[320px] sm:min-h-[400px] md:min-h-[460px] flex items-end justify-start overflow-hidden"
            >
              {/* GAMBAR UTAMA BANNER */}
              {!hasError ? (
                <img 
                  src={slide.imageUrl} 
                  alt={slide.vendorName} 
                  onError={() => handleImageError(slide.slideKey)} 
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" 
                />
              ) : (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                  Gambar Tidak Tersedia
                </div>
              )}

              {/* OVERLAY GRADIENT BAWAH (Agar teks terbaca tanpa menutupi seluruh foto) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

              {/* KONTEN TEKS & TOMBOL DI BAGIAN BAWAH */}
              <div className="relative z-10 p-6 sm:p-8 md:p-10 w-full max-w-3xl text-left text-[#FAF5EF] space-y-2 animate-in fade-in duration-500">
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#B38E5D] text-white shadow-md">
                  ✨ Partner: {slide.vendorName || 'Kafana Partner'}
                </span>
                
                {/* Deskripsi Iklan Dinamis dari SuperAdmin */}
                {slide.description && (
                  <p className="text-sm sm:text-base text-slate-100 font-medium line-clamp-2 max-w-2xl drop-shadow-md leading-relaxed">
                    {slide.description}
                  </p>
                )}

                {/* Tombol Kunjungi Website */}
                {slide.linkUrl && (
                  <div className="pt-2">
                    <a 
                      href={slide.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-[#FAF5EF] hover:bg-[#B38E5D] text-[#261C19] hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition duration-300 shadow-lg transform hover:-translate-y-0.5"
                    >
                      Kunjungi Website Partner ➔
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TOMBOL NAVIGASI PREV & NEXT */}
      {slides.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-[#B38E5D] text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-300 z-20 shadow-lg"
            aria-label="Previous Slide"
          >
            ❮
          </button>

          <button 
            onClick={nextSlide}
            className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-[#B38E5D] text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-300 z-20 shadow-lg"
            aria-label="Next Slide"
          >
            ❯
          </button>

          {/* INDIKATOR DOTS */}
          <div className="absolute bottom-4 right-6 flex gap-1.5 z-25">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 shadow-sm ${
                  currentIndex === index 
                    ? 'w-6 bg-[#B38E5D]' 
                    : 'w-2 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}