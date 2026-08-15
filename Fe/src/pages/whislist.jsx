import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import SidebarUser from '../components/SidebarUser';

// HELPER FORMAT HARGA
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
  return isNaN(num) || num === 0 ? 'Rp 0' : `Rp ${num.toLocaleString('id-ID')}`;
};

// HELPER FORMAT GAMBAR
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

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // FETCH DATA WISHLIST DARI BACKEND
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await API.get('/wishlist');
      const rawData = res.data?.data || (Array.isArray(res.data) ? res.data : []);

      // Ekstraksi data properti dari respon backend
      const formatted = rawData.map((item) => {
        // Mengakomodasi jika backend mengembalikan nested object (misal: item.properti)
        const p = item.properti || item.property || item;
        return {
          wishlist_id: item.id,
          id: p.id || item.properti_id,
          name: p.title || p.nama_properti || p.nama || p.name || 'Hunian Tanpa Nama',
          category: p.type || p.kategori || p.category || 'Kost',
          gender: p.gender_type || p.gender || p.tipe_sewa || 'Campur',
          price: formatPrice(p.price_per_month ?? p.harga ?? p.price),
          period: p.periode || p.period || 'bulan',
          location: p.address || p.alamat || p.lokasi || 'Lokasi tidak tersedia',
          image: formatImage(p),
          rating: p.rating || '4.8',
          badge: p.badge || p.status || 'Favorit',
          desc: p.facilities || p.deskripsi || p.desc || 'Tidak ada deskripsi.'
        };
      });

      setWishlistItems(formatted);
    } catch (error) {
      console.error("Gagal mengambil wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // HAPUS DARI WISHLIST (TOGGLE VIA BACKEND)
  const handleRemoveWishlist = async (propertiId) => {
    setRemovingId(propertiId);
    try {
      await API.post('/wishlist/toggle', { properti_id: propertiId });
      // Hapus langsung dari tampilan secara lokal
      setWishlistItems(prev => prev.filter(item => item.id !== propertiId));
    } catch (error) {
      console.error("Gagal menghapus wishlist:", error);
      alert("Gagal menghapus dari wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  const handleGoToDetail = (room) => {
    navigate(`/kamar/${room.id}`, { state: { room } });
  };

  return (
    <SidebarUser>
      <div className="bg-[#FAF5EF] text-[#2D2321] min-h-screen p-6 md:p-10 font-sans antialiased">
        
        {/* HEADER PAGE */}
        <div className="mb-8 border-b border-[#D7C4B0]/60 pb-5">
          <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest block mb-1">
            Simpanan Saya
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19]">
            Wishlist Hunian Impian ❤️
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Daftar kost &amp; kontrakan yang sudah kamu simpan untuk dipertimbangkan.
          </p>
        </div>

        {/* KATALOG WISHLIST */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Memuat daftar wishlist...
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((room) => (
              <div 
                key={room.id} 
                className="group bg-white rounded-xl border border-[#D7C4B0]/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img 
                    src={room.image} 
                    alt={room.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  
                  <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest bg-[#261C19]/90 text-white px-2.5 py-1 rounded shadow">
                    {room.category} • {room.gender}
                  </span>

                  {/* Tombol Hapus Wishlist */}
                  <button
                    onClick={() => handleRemoveWishlist(room.id)}
                    disabled={removingId === room.id}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition cursor-pointer"
                    title="Hapus dari wishlist"
                  >
                    {removingId === room.id ? (
                      <span className="animate-spin text-xs block">⏳</span>
                    ) : (
                      <span className="text-sm leading-none">❤️</span>
                    )}
                  </button>
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

                    <button
                      onClick={() => handleGoToDetail(room)}
                      className="px-3.5 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md cursor-pointer"
                    >
                      Lihat Unit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-[#D7C4B0] max-w-lg mx-auto my-12 space-y-4 shadow-sm">
            <div className="text-5xl">❤️</div>
            <h3 className="text-lg font-bold text-[#261C19]">Wishlist Masih Kosong</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Kamu belum menyimpan hunian favorit. Jelajahi pilihan kost dan kontrakan terbaik sekarang!
            </p>
            <button 
              onClick={() => navigate('/')}
              className="inline-block bg-[#261C19] hover:bg-[#B38E5D] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cari Hunian Sekarang
            </button>
          </div>
        )}
      </div>
    </SidebarUser>
  );
}