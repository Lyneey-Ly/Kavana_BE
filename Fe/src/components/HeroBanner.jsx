import { useState, useEffect } from 'react';

const bannerData = [
  {
    id: 1,
    tag: "✨ Exclusive Residential Collection",
    title: "Temukan Hunian Impian Tanpa Ribet",
    subtitle: "Pilihan sewa kamar kost eksklusif & kontrakan premium dengan lokasi paling strategis.",
    bgImage: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1920&q=80",
    buttonText: "Eksplorasi Sekarang",
    link: "/carihunian"
  },
  {
    id: 2,
    tag: "🔥 Promo Khusus Penghuni Baru",
    title: "Diskon Sewa Hingga 20% Bulan Ini",
    subtitle: "Dapatkan cashback dan potongan harga khusus untuk pemesanan kost durasi 6 bulan ke atas.",
    bgImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1920&q=80",
    buttonText: "Cek Promo",
    link: "/carihunian"
  },
  {
    id: 3,
    tag: "🛡️ 100% Surveyed & Verified",
    title: "Foto & Fasilitas Dijamin Akurat",
    subtitle: "Seluruh properti Kafana Vista telah tervalidasi langsung di lapangan. Tanpa tipu-tipu!",
    bgImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1920&q=80",
    buttonText: "Lihat Katalog",
    link: "/carihunian"
  }
];

export default function HeroBanner({ autoSlideInterval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-Slide Logic
  useEffect(() => {
    if (isHovered) return; // Pause saat kursor diatas banner

    const slideTimer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerData.length);
    }, autoSlideInterval);

    return () => clearInterval(slideTimer);
  }, [currentIndex, isHovered, autoSlideInterval]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? bannerData.length - 1 : prevIndex - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerData.length);
  };

  return (
    <div 
      className="relative rounded-2xl overflow-hidden mb-12 shadow-2xl border border-[#D7C4B0]/40 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* BANNER SLIDES WRAPPER */}
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {bannerData.map((banner) => (
          <div 
            key={banner.id}
            className="w-full flex-shrink-0 min-h-[420px] lg:min-h-[480px] bg-cover bg-center flex items-center justify-center relative p-8 md:p-12"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgba(38, 28, 25, 0.88), rgba(38, 28, 25, 0.65)), url('${banner.bgImage}')` 
            }}
          >
            <div className="max-w-3xl mx-auto text-center text-[#FAF5EF] space-y-6 relative z-10 animate-in fade-in duration-500">
              <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-widest bg-[#B38E5D] text-white shadow-md">
                {banner.tag}
              </span>
              
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                {banner.title} <br />
                <span className="font-light text-[#D7C4B0] italic">Kafana Vista System</span>
              </h1>
              
              <p className="text-xs sm:text-sm text-[#FAF5EF]/90 max-w-xl mx-auto leading-relaxed">
                {banner.subtitle}
              </p>

              <div className="pt-2">
                <a 
                  href={banner.link}
                  className="inline-block bg-[#FAF5EF] hover:bg-[#B38E5D] text-[#261C19] hover:text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-300 shadow-xl transform hover:-translate-y-0.5"
                >
                  {banner.buttonText}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TOMBOL PREV & NEXT (Muncul Pas Hover) */}
      <button 
        onClick={prevSlide}
        className="absolute top-1/2 left-4 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-[#B38E5D] text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-300 z-20"
      >
        ❮
      </button>

      <button 
        onClick={nextSlide}
        className="absolute top-1/2 right-4 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-[#B38E5D] text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition duration-300 z-20"
      >
        ❯
      </button>

      {/* INDIKATOR DOTS (Titik Bawah) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {bannerData.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              currentIndex === index 
                ? 'w-8 bg-[#B38E5D]' 
                : 'w-2.5 bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}