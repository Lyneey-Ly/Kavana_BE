import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

export default function Home() {
  const navigate = useNavigate();
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  // Ambil beberapa data kamar untuk ditampilkan di landing page
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await API.get('/properti'); // Sesuaikan endpoint API publik properti Anda
        const data = res.data?.data || res.data || [];
        setFeaturedRooms(data.slice(0, 3)); // Ambil 3 properti unggulan
      } catch (err) {
        console.error("Gagal memuat properti unggulan:", err);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  const formatRupiah = (angka) => {
    if (!angka || isNaN(angka)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#261C19] font-sans selection:bg-[#B38E5D] selection:text-white">
      
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#D7C4B0]/40 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/Home')}>
          <div className="p-2 rounded-xl bg-[#261C19] text-[#B38E5D]">
            <svg className="w-6 h-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-[0.2em] uppercase text-[#261C19]">
            KAFANA <span className="text-[#B38E5D]">VISTA</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-gray-600">
          <a href="#beranda" className="hover:text-[#B38E5D] transition">Beranda</a>
          <a href="#fitur" className="hover:text-[#B38E5D] transition">Keunggulan</a>
          <a href="#katalog" className="hover:text-[#B38E5D] transition">Katalog Kamar</a>
          <a href="#tentang" className="hover:text-[#B38E5D] transition">Tentang Kami</a>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/login" 
            className="px-4 py-2 text-xs font-black uppercase tracking-wider text-[#261C19] hover:text-[#B38E5D] transition"
          >
            Masuk
          </Link>
          <Link 
            to="/register" 
            className="px-5 py-2.5 bg-[#B38E5D] hover:bg-[#916F42] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-[#B38E5D]/20 transition active:scale-95"
          >
            Daftar
          </Link>
        </div>
      </nav>

      {/* ================= HERO SECTION ================= */}
      <section id="beranda" className="relative px-6 md:px-12 py-20 md:py-28 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#B38E5D]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex-1 space-y-6 text-center md:text-left relative z-10">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#B38E5D]/15 text-[#B38E5D] text-[10px] font-black uppercase tracking-[0.25em] border border-[#B38E5D]/30">
            Eksklusif &amp; Nyaman
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#261C19] leading-tight">
            Temukan Hunian Impian Anda Bersama <span className="text-[#B38E5D]">Kafana Vista</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-medium max-w-xl leading-relaxed">
            Platform manajemen dan pemesanan hunian eksklusif dengan fasilitas premium, sistem sewa transparan, dan kenyamanan maksimal di lokasi strategis.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 pt-4">
            <a 
              href="#katalog" 
              className="w-full sm:w-auto px-7 py-3.5 bg-[#261C19] hover:bg-[#3D2D29] text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition text-center"
            >
              Jelajahi Kamar
            </a>
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-gray-50 text-[#261C19] border border-[#D7C4B0] text-xs font-black uppercase tracking-widest rounded-xl transition text-center"
            >
              Buat Akun Cepat
            </Link>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-lg md:max-w-none">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3] group">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop" 
              alt="Luxury Building" 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#261C19]/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 text-white p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <p className="text-xs font-black uppercase tracking-widest text-[#FAF5EF]">✨ Hunian Pilihan Terverifikasi</p>
              <p className="text-[11px] text-gray-200 mt-0.5">Dilengkapi keamanan 24 jam dan fasilitas lengkap siap huni.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KEUNGGULAN / FITUR ================= */}
      <section id="fitur" className="bg-white py-20 px-6 md:px-12 border-y border-[#D7C4B0]/40">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B38E5D]">Mengapa Memilih Kami</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#261C19]">Kenyamanan Tanpa Kompromi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF5EF]/50 p-8 rounded-3xl border border-[#D7C4B0]/60 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-[#B38E5D]/15 text-[#B38E5D] flex items-center justify-center font-bold text-xl">
                📍
              </div>
              <h3 className="font-extrabold text-base text-[#261C19]">Lokasi Strategis</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Berada di pusat kota dekat area perkantoran, kampus, dan pusat perbelanjaan dengan akses transportasi mudah.
              </p>
            </div>

            <div className="bg-[#FAF5EF]/50 p-8 rounded-3xl border border-[#D7C4B0]/60 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-[#B38E5D]/15 text-[#B38E5D] flex items-center justify-center font-bold text-xl">
                🛡️
              </div>
              <h3 className="font-extrabold text-base text-[#261C19]">Keamanan 24 Jam</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Dilengkapi dengan sistem pengamanan CCTV, akses kartu pintar, dan penjaga profesional demi ketenangan Anda.
              </p>
            </div>

            <div className="bg-[#FAF5EF]/50 p-8 rounded-3xl border border-[#D7C4B0]/60 space-y-4 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-[#B38E5D]/15 text-[#B38E5D] flex items-center justify-center font-bold text-xl">
                ⚡
              </div>
              <h3 className="font-extrabold text-base text-[#261C19]">Fasilitas Premium</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                Wi-Fi berkecepatan tinggi, AC, perabotan lengkap berkualitas tinggi, dan area komunal yang nyaman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= KATALOG PROPERTI UNGGULAN ================= */}
      <section id="katalog" className="py-20 px-6 md:px-12 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B38E5D]">Eksklusif Portfolio</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#261C19]">Kamar &amp; Unit Tersedia</h2>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="text-xs font-black uppercase tracking-widest text-[#261C19] hover:text-[#B38E5D] underline transition cursor-pointer"
          >
            Lihat Semua Unit →
          </button>
        </div>

        {loadingRooms ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-widest">Memuat Unit Kamar...</p>
          </div>
        ) : featuredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-3xl border border-[#D7C4B0]/60 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img 
                      src={room.main_image ? (room.main_image.startsWith('http') ? room.main_image : `http://localhost:8000/storage/${room.main_image}`) : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80"} 
                      alt={room.title || room.nama_kamar} 
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 right-3 bg-[#261C19]/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      {room.status || 'Tersedia'}
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="font-extrabold text-base text-[#261C19] truncate">{room.title || room.nama_kamar}</h3>
                    <p className="text-xs text-gray-500 font-medium truncate">📍 {room.address || room.lokasi || 'Kafana Vista Complex'}</p>
                    <p className="text-sm font-black text-[#B38E5D] pt-2">
                      {formatRupiah(room.price_per_month)} <span className="text-[10px] text-gray-400 font-normal">/bulan</span>
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <button 
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 bg-[#FAF5EF] hover:bg-[#261C19] text-[#261C19] hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition border border-[#D7C4B0]"
                  >
                    Pesan / Lihat Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white rounded-3xl border border-[#D7C4B0]/60 text-center space-y-2">
            <span className="text-3xl">🏠</span>
            <p className="text-sm font-bold text-gray-700">Belum ada unit kamar yang ditampilkan.</p>
          </div>
        )}
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#261C19] text-[#FAF5EF] py-12 px-6 md:px-12 border-t border-[#B38E5D]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="p-1.5 rounded-lg bg-[#B38E5D] text-[#261C19]">
                <svg className="w-4 h-4" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-[0.2em] uppercase text-white">
                KAFANA <span className="text-[#B38E5D]">VISTA</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 max-w-xs font-light">
              Platform manajemen dan pemesanan hunian eksklusif dengan kenyamanan maksimal.
            </p>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            &copy; 2026 KAFANA VISTA. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

    </div>
  );
}