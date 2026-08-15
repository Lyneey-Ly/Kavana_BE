import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import SidebarUser from '../components/SidebarUser';
import HeroBanner from '../components/HeroBanner';
import Footer from '../components/footer';

import SEOInfoSection from '../components/SEOInfoSection';
import TestimonialSection from '../components/TestimoniSection';

// HELPER FORMAT HARGA ANTI-CRASH & ANTI-NOL TAMBAHAN
const formatPrice = (val) => {
  if (!val && val !== 0) return 'Rp 0';

  if (typeof val === 'string' && val.trim().startsWith('Rp')) return val.trim();

  let cleanStr = String(val).trim();

  if (cleanStr.includes('.') || cleanStr.includes(',')) {
    cleanStr = cleanStr.split('.')[0].split(',')[0];
  }

  cleanStr = cleanStr.replace(/[^0-9]/g, '');

  if (!cleanStr) return 'Rp 0';

  const num = Number(cleanStr);
  return isNaN(num) || num === 0 
    ? 'Rp 0' 
    : `Rp ${num.toLocaleString('id-ID')}`;
};

// Helper Format URL Gambar
const formatImage = (item) => {
  const rawImage = item?.main_image || item?.foto || item?.gambar || item?.image || item?.image_url;
  if (!rawImage) return '/KOST ANDARA VISTA.png';
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:')) {
    return rawImage;
  }
  if (rawImage.startsWith('/')) {
    return rawImage;
  }
  return `http://127.0.0.1:8000/storage/${rawImage}`;
};

export default function Home() {
  const navigate = useNavigate();

  // State Data & Loading
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Filter, Search, Wishlist, Modal
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🌟 FAVORITES DISIMPAN SEBAGAI SET/ARRAY ID DARI BACKEND
  const [favorites, setFavorites] = useState([]);
  const [loadingFavId, setLoadingFavId] = useState(null); // Feedback visual saat diklik
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🛠️ Memulai Fetching ke Backend...");
        
        // 1. Fetch Properti & Fetch Wishlist User secara bersamaan
        const [resProperties, resWishlist] = await Promise.allSettled([
          API.get('/properties'),
          API.get('/wishlist')
        ]);

        // Handing Data Wishlist dari Backend
        if (resWishlist.status === 'fulfilled' && resWishlist.value?.data?.data) {
          const userWishlists = resWishlist.value.data.data;
          // Ambil daftar properti_id yang disukai user
          const favIds = userWishlists.map(w => Number(w.properti_id));
          setFavorites(favIds);
        }

        // Handling Data Properti
        if (resProperties.status === 'fulfilled') {
          const res = resProperties.value;
          const apiData = res.data?.data || res.data?.properties || (Array.isArray(res.data) ? res.data : []);
          
          if (apiData.length === 0) {
            console.warn("⚠️ Data backend kosong.");
            setRooms([]);
            return;
          }

          const formattedRooms = apiData.map((item, idx) => ({
            id: Number(item?.id) || idx + 1,
            name: item?.title || item?.nama_properti || item?.nama || item?.name || 'Hunian Tanpa Nama',
            category: item?.type || item?.kategori || item?.category || 'Kost',
            gender: item?.gender_type || item?.gender || item?.tipe_sewa || 'Campur',
            price: formatPrice(item?.price_per_month ?? item?.harga ?? item?.price),
            period: item?.periode || item?.period || 'bulan',
            location: item?.address || item?.alamat || item?.lokasi || 'Lokasi tidak tersedia',
            image: formatImage(item),
            rating: item?.rating || '4.8',
            badge: item?.badge || item?.status || 'Terpopuler',
            desc: item?.facilities || item?.deskripsi || item?.desc || 'Tidak ada deskripsi tersedia.'
          }));

          setRooms(formattedRooms);
        }
      } catch (error) {
        console.error('❌ Gagal memuat data dari API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🌟 TOGGLE WISHLIST REAL-TIME DENGAN API BACKEND
  const toggleFavorite = async (e, propertiId) => {
    e.stopPropagation(); // Biar gak kebuka halaman detail saat tombol diklik
    
    // Tampilkan animasi/indikator loading mini di tombol
    setLoadingFavId(propertiId);

    try {
      // Panggil API Toggle yang sudah dibuat di backend Laravel
      const res = await API.post('/wishlist/toggle', { properti_id: propertiId });
      const { is_wishlist } = res.data;

      if (is_wishlist) {
        setFavorites(prev => [...prev, propertiId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== propertiId));
      }
    } catch (error) {
      console.error('Gagal memperbarui wishlist:', error);
      if (error.response?.status === 401) {
        alert('Silakan login terlebih dahulu untuk menyimpan ke favorit!');
      } else {
        alert('Gagal memperbarui wishlist. Coba beberapa saat lagi.');
      }
    } finally {
      setLoadingFavId(null);
    }
  };

  // Navigasi Langsung ke Halaman Detail Properti
  const handleGoToDetail = (room) => {
    navigate(`/kamar/${room.id}`, { state: { room } });
  };

  // Navigasi Langsung ke Pembayaran
  const handleBooking = (room) => {
    const itemTransaksi = {
      namaProperti: room.name,
      tipeKamar: `${room.category} (${room.gender})`,
      hargaSewa: `${room.price} / ${room.period}`,
      durasiSewa: `1 ${room.period === 'tahun' ? 'Tahun' : 'Bulan'}`,
      tanggalMasuk: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      biayaLayanan: "Rp 10.000",
      deposit: "Rp 100.000",
      totalBayar: room.price,
      gambar: room.image
    };
    navigate('/pembayaran', { state: { itemTransaksi } });
  };

  // Logika Filter
  const filteredRooms = rooms.filter(room => {
    const name = (room?.name || '').toLowerCase();
    const location = (room?.location || '').toLowerCase();
    const category = (room?.category || '').toLowerCase();
    const gender = (room?.gender || '').toLowerCase();
    const desc = (room?.desc || '').toLowerCase();
    const query = (searchQuery || '').trim().toLowerCase();

    const matchSearch = !query || 
      name.includes(query) || 
      location.includes(query) || 
      category.includes(query) || 
      desc.includes(query);

    if (!matchSearch) return false;

    if (selectedCategory === 'Semua') return true;

    const catLower = selectedCategory.toLowerCase();
    return category.includes(catLower) || gender.includes(catLower);
  });

  // Handle Gambar Rusak / 404
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <SidebarUser>
      <div className="bg-[#FAF5EF] text-[#2D2321] font-sans antialiased pb-16">
        
        {/* HERO BANNER */}
        <HeroBanner autoSlideInterval={4000} />

        {/* CARD BANNER PROMO */}
        <div className="space-y-6 mb-16">
          <div className="bg-gradient-to-r from-[#FAF5EF] via-white to-[#FAF5EF] rounded-2xl border border-[#D7C4B0]/60 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="space-y-3 max-w-xl z-10">
              <h3 className="text-xl md:text-2xl font-extrabold text-[#261C19]">
                Ada Keluhan?
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Berbagai fitur dan layanan manajemen sewa terpadu untuk meningkatkan okupansi bisnis kost &amp; kontrakan Anda.
              </p>
              <a
                href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
                target="_blank"
                rel="noreferrer"
                className="w-fit justify-center bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <span>💬 Chat Customer Service</span>
              </a>
            </div>
            
            <div className="w-full md:w-64 h-36 rounded-xl overflow-hidden shadow-md flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80" 
                alt="Mitra Kafana Vista"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#D7C4B0]/60 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B38E5D] bg-[#FAF5EF] px-2.5 py-1 rounded">
                  Gratis &amp; Aman
                </span>
                <h4 className="text-lg font-bold text-[#261C19]">Survei Hunian Idaman Sekarang!</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Cari, pilih, survei, hingga sewa kost idaman dijamin aman dan 100% didampingi tim terverifikasi.
                </p>
              </div>
              <button 
                onClick={() => navigate('/carihunian')}
                className="text-xs font-bold text-[#B38E5D] hover:underline self-start flex items-center gap-1 cursor-pointer"
              >
                Baca selengkapnya ➔
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-[#D7C4B0]/60 p-6 shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition">
              <div className="space-y-2 max-w-xs">
                <h4 className="text-lg font-bold text-[#261C19]">Hunian Terjamin Nyaman</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Disurvei langsung oleh tim Kafana Vista. Lokasi terverifikasi &amp; bangunan lolos kualifikasi.
                </p>
              </div>
              <div className="flex flex-col gap-2 items-center justify-center p-3 bg-[#FAF5EF] rounded-xl border border-[#D7C4B0]/30 font-serif font-bold text-[#B38E5D] text-sm">
                <span>VISTA</span>
                <span className="text-[9px] tracking-widest text-gray-400 font-sans">VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* INFO BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white p-5 rounded-xl border border-[#D7C4B0]/60 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#B38E5D]/10 rounded-lg text-2xl">⚡</div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B38E5D]">Respon Cepat</h4>
              <p className="text-xs text-gray-500 font-medium">Layanan CS Online 09:00 - 21:00 WIB</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D7C4B0]/60 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#B38E5D]/10 rounded-lg text-2xl">📍</div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B38E5D]">Lokasi Strategis</h4>
              <p className="text-xs text-gray-500 font-medium">Fokus Area Bandung &amp; Sukabumi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#D7C4B0]/60 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#B38E5D]/10 rounded-lg text-2xl">🛡️</div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#B38E5D]">100% Tervalidasi</h4>
              <p className="text-xs text-gray-500 font-medium">Foto &amp; Fasilitas Akurat di Lapangan</p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-[#D7C4B0]/60 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto -mt-5 relative z-12 mb-10">
          <div className="flex-1 flex items-center px-2 gap-3">
            <span className="text-[#B38E5D] text-lg">🔍</span>
            <input 
              type="text" 
              placeholder="Cari nama kost atau lokasi (Bandung, Sukabumi)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 bg-transparent placeholder-gray-400 text-[#2D2321] focus:outline-none text-xs font-semibold"
            />
          </div>
          <button 
            onClick={() => setSearchQuery('')}
            className="bg-[#261C19] hover:bg-[#B38E5D] text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-300 shadow-md cursor-pointer"
          >
            {searchQuery ? 'Reset Filter' : 'Cari Hunian'}
          </button>
        </div>

        {/* KATALOG KAMAR */}
        <section className="space-y-8 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D7C4B0]/60 pb-6">
            <div>
              <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest block mb-1">Koleksi Pilihan</span>
              <h2 className="text-2xl font-extrabold text-[#261C19]">Daftar Unit Terpopuler</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Semua', 'Kost', 'Kontrakan', 'Putra', 'Putri'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-[#261C19] text-white shadow-md scale-105' 
                      : 'bg-white text-gray-600 border border-[#D7C4B0]/60 hover:bg-[#FAF5EF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                Mengambil data dari server...
              </div>
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isFav = favorites.includes(room.id);
                const isBtnLoading = loadingFavId === room.id;

                return (
                  <div 
                    key={room.id} 
                    className="group bg-white rounded-xl border border-[#D7C4B0]/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img 
                        src={room.image} 
                        alt={room.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        onError={handleImageError}
                      />
                      
                      <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest bg-[#261C19]/90 text-white px-2.5 py-1 rounded shadow">
                        {room.category} • {room.gender}
                      </span>

                      {/* 🌟 TOMBOL FAVORIT TERHUBUNG KELAS BACKEND API */}
                      <button
                        onClick={(e) => toggleFavorite(e, room.id)}
                        disabled={isBtnLoading}
                        className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-md cursor-pointer ${
                          isFav 
                            ? 'bg-rose-500 text-white scale-105' 
                            : 'bg-white/80 text-gray-500 hover:text-rose-500 hover:bg-white'
                        }`}
                        title={isFav ? "Hapus dari wishlist" : "Simpan ke wishlist"}
                      >
                        {isBtnLoading ? (
                          <span className="animate-spin text-xs block">⏳</span>
                        ) : (
                          <span className="text-sm leading-none">{isFav ? '❤️' : '🤍'}</span>
                        )}
                      </button>

                      <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-[#B38E5D] text-white px-2.5 py-0.5 rounded-full shadow">
                        {room.badge}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#B38E5D] mb-1">
                          <span className="line-clamp-1">📍 {room.location}</span>
                          <span>★ {room.rating}</span>
                        </div>

                        <h3 className="text-base font-bold text-[#261C19] group-hover:text-[#B38E5D] transition line-clamp-1">
                          {room.name}
                        </h3>

                        <p className="text-xs text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                          {room.desc}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase block">Mulai Dari</span>
                          <span className="text-sm font-extrabold text-[#261C19]">
                            {room.price} <span className="text-[10px] font-normal text-gray-500">/{room.period}</span>
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleGoToDetail(room)}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#261C19] text-xs font-bold rounded-lg transition cursor-pointer"
                            title="Detail Properti"
                          >
                            👁️
                          </button>
                          
                          <button 
                            onClick={() => handleGoToDetail(room)}
                            className="px-3.5 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md shadow-[#B38E5D]/20 cursor-pointer"
                          >
                            Book
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white p-12 text-center rounded-xl border border-dashed border-[#D7C4B0]">
                <p className="text-gray-400 font-medium text-sm">Tidak ada hunian yang cocok dengan pencarian "{searchQuery}".</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Semua'); }}
                  className="mt-3 text-xs font-bold text-[#B38E5D] underline uppercase tracking-wider cursor-pointer"
                >
                  Tampilkan Semua Properti
                </button>
              </div>
            )}
          </div>
        </section>

        {/* STORY SECTION */}
        <section className="bg-[#2D2321] text-[#FAF5EF] rounded-2xl p-8 lg:p-12 mb-16 relative overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img 
                  src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" 
                  alt="Interior Details" 
                  className="w-full object-cover aspect-[3/4] rounded-xl border border-[#B38E5D]/30 shadow-lg" 
                  onError={handleImageError}
                />
                <div className="bg-[#B38E5D] p-5 rounded-xl text-[#FAF5EF] text-center space-y-1">
                  <p className="text-3xl font-black">100%</p>
                  <p className="text-[10px] uppercase font-bold tracking-widest">Verified Properties</p>
                </div>
              </div>
              <div className="space-y-4 pt-6">
                <div className="bg-[#FAF5EF] text-[#2D2321] p-5 rounded-xl text-center space-y-1 border border-[#B38E5D]/20">
                  <p className="text-2xl font-black text-[#B38E5D]">Instant</p>
                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-gray-600">Booking Confirmation</p>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80" 
                  alt="Room Lifestyle" 
                  className="w-full object-cover aspect-[3/4] rounded-xl border border-[#B38E5D]/30 shadow-lg" 
                  onError={handleImageError}
                />
              </div>
            </div>

            <div className="space-y-6">
              <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest block">The Luxury Living Experience</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                Hunian Sewa Sempurna <br />Yang Selalu <span className="italic font-light text-[#B38E5D]">Kamu Ingat</span>
              </h2>
              <div className="h-1 w-16 bg-[#B38E5D] rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#FAF5EF]/80 leading-relaxed font-sans">
                Mencari hunian di sekitar kota bukan lagi perkara melelahkan. Kafana Vista menghapus kerumitan tersebut dengan validitas data survei lapangan, transparansi administrasi transaksi, dan integrasi penuh untuk keamanan dan kenyamanan tinggal Anda.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/carihunian')}
                  className="text-xs font-bold uppercase tracking-widest bg-[#FAF5EF] hover:bg-[#B38E5D] text-[#2D2321] hover:text-white px-6 py-3.5 rounded-lg transition duration-300 shadow-md cursor-pointer"
                >
                  Eksplorasi Semua Kost &amp; Kontrakan
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* TESTIMONI */}
        <TestimonialSection />

        {/* MODAL DETAIL */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#D7C4B0] animate-in fade-in zoom-in duration-200">
              <div className="relative h-56 bg-gray-200">
                <img 
                  src={selectedRoom.image} 
                  alt={selectedRoom.name} 
                  className="w-full h-full object-cover" 
                  onError={handleImageError}
                />
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center font-bold hover:bg-black transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B38E5D] bg-[#FAF5EF] px-2.5 py-1 rounded">
                    {selectedRoom.category} • {selectedRoom.gender}
                  </span>
                  <h3 className="text-xl font-bold text-[#261C19] mt-2">{selectedRoom.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">📍 {selectedRoom.location}</p>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-[#FAF5EF] p-3 rounded-lg border border-[#D7C4B0]/40">
                  {selectedRoom.desc}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Harga Sewa</p>
                    <p className="text-lg font-extrabold text-[#261C19]">{selectedRoom.price} /{selectedRoom.period}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const roomToDetail = selectedRoom;
                        setSelectedRoom(null);
                        handleGoToDetail(roomToDetail);
                      }}
                      className="border border-[#261C19] text-[#261C19] hover:bg-[#261C19] hover:text-white px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Detail Full ➔
                    </button>

                    <button
                      onClick={() => {
                        const roomToBook = selectedRoom;
                        setSelectedRoom(null);
                        handleBooking(roomToBook);
                      }}
                      className="bg-[#261C19] hover:bg-[#B38E5D] text-[#FAF5EF] px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Lanjut Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <SEOInfoSection />


      </div>
      <Footer />

    </SidebarUser>
    

    
  );
}