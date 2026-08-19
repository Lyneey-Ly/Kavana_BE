import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import SidebarUser from '../components/SidebarUser';
import InteractiveMap from '../components/InteractiveMap';
import Footer from '../components/footer';


// HELPER FORMAT HARGA ANTI-CRASH
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
  if (!rawImage) return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
  if (rawImage.startsWith('http://') || rawImage.startsWith('https://') || rawImage.startsWith('data:')) {
    return rawImage;
  }
  if (rawImage.startsWith('/')) {
    return rawImage;
  }
  return `http://127.0.0.1:8000/storage/${rawImage}`;
};




export default function CariHunian() {
  const navigate = useNavigate();

  // State Data Backend & Loading
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // State UI Filter & Search
  const [showFilterMobile, setShowFilterMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCategory, setQuickCategory] = useState('Semua Properti');
  const [selectedKota, setSelectedKota] = useState('Semua');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedGender, setSelectedGender] = useState([]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('Semua');
  const [sortBy, setSortBy] = useState('Rekomendasi Utama');
  
  // MAP STATE - Default disembunyikan agar tampilan awal fokus ke foto properti
  const [showMap, setShowMap] = useState(false); 
  const [mapSelectedProperty, setMapSelectedProperty] = useState(null);

  // Modal Detail Properti
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Data Pilihan Area Berdasarkan Kota
  const areaKota = {
    Bandung: ['Bojongsoang', 'Buahbatu', 'Coblong', 'Lembang', 'Dago'],
    Sukabumi: ['Cikole', 'Limusnunggal', 'Nanggleng', 'Baros', 'Cisaat']
  };

  // Fallback Dummy Data jika backend mati / kosong
  const getFallbackData = () => [
    {
      id: 1,
      type: 'Kost',
      gender: 'mixed',
      title: 'Kost Kavana Vista Tipe A',
      location: 'Bojongsoang, Bandung',
      price: 'Rp 1.500.000',
      period: 'bulan',
      rating: '4.8',
      reviews: 24,
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
      tags: ['Wifi', 'AC', 'KM Dalam'],
      isAvailable: true,
      desc: 'Kost nyaman dan bersih siap huni di kawasan Bojongsoang dekat kampus.',
      lat: -6.9745,
      lng: 107.6338
    },
    {
      id: 2,
      type: 'Kontrakan',
      gender: 'mixed',
      title: 'Kontrakan Asri Pavilion 2 Kamar',
      location: 'Buahbatu, Bandung',
      price: 'Rp 24.000.000',
      period: 'tahun',
      rating: '4.9',
      reviews: 12,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80',
      tags: ['2 KT', 'Parkir Mobil', 'Dapur'],
      isAvailable: true,
      desc: 'Kontrakan sekeluarga atau mahasiswa dengan halaman luas dan lokasi strategis.',
      lat: -6.9372,
      lng: 107.6547
    },
    {
      id: 3,
      type: 'Kost',
      gender: 'female',
      title: 'Kost Eksklusif Heritage Suite',
      location: 'Coblong, Bandung',
      price: 'Rp 2.100.000',
      period: 'bulan',
      rating: '4.7',
      reviews: 30,
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      tags: ['Wi-Fi', 'Water Heater', 'AC'],
      isAvailable: false,
      desc: 'Kost khusus putri aman 24 jam dengan fasilitas mewah standar apartemen.',
      lat: -6.8915,
      lng: 107.6107
    },
    {
      id: 4,
      type: 'Kost',
      gender: 'male',
      title: 'ACA VISTA Premium Male',
      location: 'Nanggleng, Sukabumi',
      price: 'Rp 1.200.000',
      period: 'bulan',
      rating: '5.0',
      reviews: 18,
      image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
      tags: ['Wi-Fi', 'Kasur', 'Parkir Mobil'],
      isAvailable: true,
      desc: 'Kost sewa putra tenang, nyaman, dekat dengan fasilitas publik Sukabumi.',
      lat: -6.9342,
      lng: 106.9156
    }
  ];

  useEffect(() => {
    const fetchProperti = async () => {
      try {
        setLoading(true);
        const res = await API.get('/properties');
        const apiData = res.data?.data || res.data?.properties || (Array.isArray(res.data) ? res.data : []);

        if (apiData.length === 0) {
          setProperties(getFallbackData());
          return;
        }

        const formatted = apiData.map((item, idx) => {
          let rawFacilities = item?.facilities || item?.fasilitas || [];
          let tagsArray = [];
          if (typeof rawFacilities === 'string') {
            tagsArray = rawFacilities.split(',').map(f => f.trim()).filter(Boolean);
          } else if (Array.isArray(rawFacilities)) {
            tagsArray = rawFacilities;
          }
          if (tagsArray.length === 0) tagsArray = ['Wi-Fi', 'AC', 'Lengkap'];

          const priceVal = item?.price_per_month ?? item?.harga ?? item?.price ?? 0;
          const numPrice = Number(String(priceVal).replace(/[^0-9]/g, '')) || 0;

          const getLatLng = (location) => {
            const loc = location.toLowerCase();
            if (loc.includes('bojongsoang')) return { lat: -6.9745, lng: 107.6338 };
            if (loc.includes('buahbatu')) return { lat: -6.9372, lng: 107.6547 };
            if (loc.includes('coblong')) return { lat: -6.8915, lng: 107.6107 };
            if (loc.includes('lembang')) return { lat: -6.8214, lng: 107.6222 };
            if (loc.includes('dago')) return { lat: -6.8842, lng: 107.5981 };
            if (loc.includes('nanggleng')) return { lat: -6.9342, lng: 106.9156 };
            if (loc.includes('cikole')) return { lat: -6.9056, lng: 106.9289 };
            if (loc.includes('limusnunggal')) return { lat: -6.9212, lng: 106.9356 };
            if (loc.includes('baros')) return { lat: -6.9567, lng: 106.8923 };
            if (loc.includes('cisaat')) return { lat: -6.9834, lng: 106.8745 };
            return { lat: -6.9175 + (Math.random() - 0.5) * 0.1, lng: 107.6191 + (Math.random() - 0.5) * 0.1 };
          };

          const coords = item?.latitude && item?.longitude 
            ? { lat: Number(item.latitude), lng: Number(item.longitude) }
            : getLatLng(item?.address || item?.alamat || item?.lokasi || 'Bandung');

          return {
            id: item?.id || idx + 1,
            type: item?.type || item?.kategori || 'Kost',
            gender: item?.gender_type || item?.gender || 'Campur',
            title: item?.title || item?.nama_properti || item?.nama || 'Hunian Tanpa Nama',
            location: item?.address || item?.alamat || item?.lokasi || 'Lokasi tidak tersedia',
            rawPrice: numPrice,
            price: formatPrice(priceVal),
            period: item?.periode || item?.period || 'bulan',
            rating: item?.rating || (4.5 + (idx % 5) * 0.1).toFixed(1),
            reviews: item?.reviews || (10 + idx * 3),
            image: formatImage(item),
            tags: tagsArray,
            isAvailable: item?.is_available !== undefined ? Boolean(item.is_available) : (item?.status !== 'Penuh'),
            desc: item?.facilities || item?.deskripsi || 'Tidak ada deskripsi tambahan.',
            lat: coords.lat,
            lng: coords.lng
          };
        });

        setProperties(formatted);
      } catch (error) {
        setProperties(getFallbackData());
      } finally {
        setLoading(false);
      }
    };

    fetchProperti();
  }, []);

  // Handlers
  const handleAreaToggle = (area) => {
    setSelectedAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const handleGenderToggle = (gen) => {
    setSelectedGender(prev => 
      prev.includes(gen) ? prev.filter(g => g !== gen) : [...prev, gen]
    );
  };

  const handleFacilityToggle = (fac) => {
    setSelectedFacilities(prev => 
      prev.includes(fac) ? prev.filter(f => f !== fac) : [...prev, fac]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setQuickCategory('Semua Properti');
    setSelectedKota('Semua');
    setSelectedAreas([]);
    setSelectedGender([]);
    setSelectedFacilities([]);
    setSelectedPeriod('Semua');
    setSortBy('Rekomendasi Utama');
  };

  const handleBooking = (room) => {
    navigate(`/kamar/${room.id}`);
  };

  const handleMapPropertyClick = (property) => {
    setMapSelectedProperty(property);
    setSelectedRoom(property); // Langsung buka detail saat pin diklik
  };

  // FILTER & SORTING LOGIC
  const filteredProperties = useMemo(() => {
    return properties.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        item.title.toLowerCase().includes(q) || 
        item.location.toLowerCase().includes(q) || 
        item.type.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (quickCategory !== 'Semua Properti' && item.type.toLowerCase() !== quickCategory.toLowerCase()) {
        return false;
      }

      if (selectedKota !== 'Semua') {
        if (!item.location.toLowerCase().includes(selectedKota.toLowerCase())) {
          return false;
        }
      }

      if (selectedAreas.length > 0) {
        const hasArea = selectedAreas.some(area => item.location.toLowerCase().includes(area.toLowerCase()));
        if (!hasArea) return false;
      }

      if (selectedGender.length > 0) {
        const hasGender = selectedGender.some(g => item.gender.toLowerCase().includes(g.toLowerCase()));
        if (!hasGender) return false;
      }

      if (selectedFacilities.length > 0) {
        const itemTagsLower = item.tags.map(t => t.toLowerCase());
        const hasAllFacs = selectedFacilities.every(fac => 
          itemTagsLower.some(tag => tag.includes(fac.toLowerCase()))
        );
        if (!hasAllFacs) return false;
      }

      if (selectedPeriod !== 'Semua') {
        if (item.period.toLowerCase() !== selectedPeriod.toLowerCase()) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'Harga: Rendah ke Tinggi') return a.rawPrice - b.rawPrice;
      if (sortBy === 'Harga: Tinggi ke Rendah') return b.rawPrice - a.rawPrice;
      if (sortBy === 'Ulasan Tertinggi') return Number(b.rating) - Number(a.rating);
      return a.id - b.id;
    });
  }, [properties, searchQuery, quickCategory, selectedKota, selectedAreas, selectedGender, selectedFacilities, selectedPeriod, sortBy]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80';
  };

  const hasActiveFilters = searchQuery || quickCategory !== 'Semua Properti' || selectedKota !== 'Semua' || selectedAreas.length > 0 || selectedGender.length > 0 || selectedFacilities.length > 0;

  return (
    <SidebarUser>
      <div className="min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans selection:bg-[#C5A059] selection:text-white pb-16 relative">
        
        {/* AMBIENT BACKGROUND GLOW DEKORATIF */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* ========================================================================= */}
        {/* 🌟 LUXURY SEARCH CONSOLE HEADER (STATIC) */}
        {/* ========================================================================= */}
        <div className="bg-[#FAF6F0] border-b border-[#E5D7C5] py-5 px-4 md:px-8 shadow-xs transition-all">
          <div className="max-w-7xl mx-auto space-y-3">
            
            {/* MAIN SEARCH ROW */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* SEARCH INPUT BAR */}
              <div className="relative w-full md:flex-1 bg-white border border-[#E5D7C5] hover:border-[#C5A059] focus-within:border-[#C5A059] focus-within:ring-2 focus-within:ring-[#C5A059]/30 rounded-2xl shadow-sm transition-all duration-300 flex items-center px-4 py-2.5">
                <span className="text-[#C5A059] text-base mr-3 flex-shrink-0 animate-pulse">📍</span>
                <input 
                  type="text" 
                  placeholder="Cari lokasi, nama kost, atau daerah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent focus:outline-none text-sm font-medium text-[#261C19] placeholder-slate-400"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-rose-500 text-slate-400 hover:text-white text-xs font-bold transition flex items-center justify-center cursor-pointer ml-2 flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* QUICK CATEGORY PILLS */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar pb-1 md:pb-0">
                <div className="bg-white border border-[#E5D7C5] p-1.5 rounded-2xl flex items-center gap-1 shadow-xs flex-shrink-0">
                  {['Semua Properti', 'Kost', 'Kontrakan'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setQuickCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                        quickCategory === cat
                          ? 'bg-[#261C19] text-[#FAF5EF] shadow-md'
                          : 'text-slate-500 hover:bg-[#FAF6F0] hover:text-[#261C19]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setShowFilterMobile(!showFilterMobile)}
                  className="md:hidden bg-[#261C19] text-white px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider text-center shadow-md cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>⚙️</span>
                  <span>{showFilterMobile ? 'Tutup' : 'Filter'}</span>
                </button>
              </div>

            </div>

            {/* QUICK CITY SHORTCUTS & ACTIVE FILTER CHIPS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5D7C5]/50">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Fokus Kota:</span>
                {['Semua', 'Bandung', 'Sukabumi'].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedKota(city);
                      setSelectedAreas([]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedKota === city 
                        ? 'bg-[#C5A059] text-[#261C19] shadow-sm' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-[#E5D7C5]'
                    }`}
                  >
                    {city === 'Semua' ? '🌐 Semua Kota' : `📍 ${city}`}
                  </button>
                ))}
              </div>

              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400">Filter Aktif:</span>
                  {selectedAreas.map(area => (
                    <span key={area} className="bg-[#261C19] text-[#C5A059] text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      {area} <button onClick={() => handleAreaToggle(area)} className="cursor-pointer hover:text-white transition-colors">✕</button>
                    </span>
                  ))}
                  {selectedGender.map(gen => (
                    <span key={gen} className="bg-[#261C19] text-[#C5A059] text-[10px] font-bold px-3 py-1 rounded-full capitalize flex items-center gap-1.5 shadow-sm">
                      {gen} <button onClick={() => handleGenderToggle(gen)} className="cursor-pointer hover:text-white transition-colors">✕</button>
                    </span>
                  ))}
                  <button 
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-1 transition-colors"
                  >
                    Reset Filter ↺
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🏢 SECTION 2: MAIN CONTENT & SIDEBAR */}
        {/* ========================================================================= */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* SIDEBAR FILTER (3 Kolom) - DIPERBAIKI DENGAN SCROLL & MAX-HEIGHT */}
            <div className={`lg:block lg:col-span-3 bg-white border border-[#E5D7C5] rounded-3xl p-5 sticky top-24 h-fit max-h-[85vh] overflow-y-auto no-scrollbar shadow-xs transition-all duration-300 ${
              showFilterMobile ? 'block mb-6' : 'hidden'
            }`}>
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                <h3 className="font-extrabold text-[#261C19] text-base tracking-wide flex items-center gap-2">
                  <span>⚙️</span> Filter Detail
                </h3>
              </div>

              {/* KOTA & AREA DAERAH */}
              <div className="space-y-4 mb-6">
                <label className="block text-[10px] uppercase tracking-widest font-black text-[#C5A059]">Area &amp; Wilayah</label>
                
                <div className="space-y-3">
                  {/* Kota Bandung */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSelectedKota(selectedKota === 'Bandung' ? 'Semua' : 'Bandung');
                        setSelectedAreas([]);
                      }}
                      className={`w-full flex justify-between items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedKota === 'Bandung' ? 'bg-[#261C19] text-white border-[#261C19] shadow-sm' : 'bg-white text-[#261C19] border-[#E5D7C5] hover:bg-[#FAF6F0]'
                      }`}
                    >
                      <span>📍 Kota Bandung</span>
                      <span>{selectedKota === 'Bandung' ? '▲' : '▼'}</span>
                    </button>

                    {selectedKota === 'Bandung' && (
                      <div className="pl-4 space-y-2 border-l-2 border-[#C5A059] my-2 text-sm font-medium text-[#261C19]">
                        {areaKota.Bandung.map((area, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group py-1">
                            <input 
                              type="checkbox" 
                              checked={selectedAreas.includes(area)}
                              onChange={() => handleAreaToggle(area)}
                              className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded" 
                            />
                            <span className="group-hover:text-[#C5A059] transition-colors">{area}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Kota Sukabumi */}
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        setSelectedKota(selectedKota === 'Sukabumi' ? 'Semua' : 'Sukabumi');
                        setSelectedAreas([]);
                      }}
                      className={`w-full flex justify-between items-center px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                        selectedKota === 'Sukabumi' ? 'bg-[#261C19] text-white border-[#261C19] shadow-sm' : 'bg-white text-[#261C19] border-[#E5D7C5] hover:bg-[#FAF6F0]'
                      }`}
                    >
                      <span>📍 Kota Sukabumi</span>
                      <span>{selectedKota === 'Sukabumi' ? '▲' : '▼'}</span>
                    </button>

                    {selectedKota === 'Sukabumi' && (
                      <div className="pl-4 space-y-2 border-l-2 border-[#C5A059] my-2 text-sm font-medium text-[#261C19]">
                        {areaKota.Sukabumi.map((area, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group py-1">
                            <input 
                              type="checkbox" 
                              checked={selectedAreas.includes(area)}
                              onChange={() => handleAreaToggle(area)}
                              className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded" 
                            />
                            <span className="group-hover:text-[#C5A059] transition-colors">{area}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tipe Penghuni */}
              <div className="space-y-4 pt-4 border-t border-slate-100 mb-6">
                <label className="block text-[10px] uppercase tracking-widest font-black text-[#C5A059]">Tipe Penghuni</label>
                <div className="space-y-3 text-sm font-medium text-[#261C19]">
                  {['male', 'female', 'mixed'].map((g) => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedGender.includes(g)}
                        onChange={() => handleGenderToggle(g)}
                        className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded" 
                      /> 
                      <span className="group-hover:text-[#C5A059] transition-colors capitalize">Kost {g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Fasilitas */}
              <div className="space-y-4 pt-4 border-t border-slate-100 mb-6">
                <label className="block text-[10px] uppercase tracking-widest font-black text-[#C5A059]">Fasilitas Utama</label>
                <div className="space-y-3 text-sm font-medium text-[#261C19]">
                  {['Wifi', 'AC', 'KM Dalam', 'Parkir Mobil', 'Gayung Pribadi'].map((fac) => (
                    <label key={fac} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedFacilities.includes(fac)}
                        onChange={() => handleFacilityToggle(fac)}
                        className="w-4 h-4 accent-[#C5A059] cursor-pointer rounded" 
                      /> 
                      <span className="group-hover:text-[#C5A059] transition-colors">{fac}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sistem Sewa */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-[10px] uppercase tracking-widest font-black text-[#C5A059]">Sistem Sewa</label>
                <div className="space-y-3 text-sm font-medium text-[#261C19]">
                  {[
                    { label: 'Semua Periode', val: 'Semua' },
                    { label: 'Per Bulan', val: 'bulan' },
                    { label: 'Per Tahun', val: 'tahun' }
                  ].map((p) => (
                    <label key={p.val} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="durasi" 
                        checked={selectedPeriod === p.val}
                        onChange={() => setSelectedPeriod(p.val)}
                        className="w-4 h-4 accent-[#C5A059] cursor-pointer" 
                      /> 
                      <span className="group-hover:text-[#C5A059] transition-colors">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* CATALOG / LISTING HUNIAN (9 Kolom) */}
            <div className="lg:col-span-9 flex flex-col space-y-6">
              
              {/* Map Toggle & Controls Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#E5D7C5] rounded-3xl p-5 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-[#261C19]">Temukan Hunian Impianmu</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Menampilkan <span className="text-[#C5A059] font-extrabold">{filteredProperties.length} Properti</span>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2 w-full sm:w-auto bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E5D7C5]">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider px-2">Urutkan:</label>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border-0 bg-transparent text-sm font-extrabold text-[#261C19] focus:outline-none cursor-pointer hover:text-[#C5A059] transition-colors py-1"
                    >
                      <option value="Rekomendasi Utama">Rekomendasi</option>
                      <option value="Harga: Rendah ke Tinggi">Termurah</option>
                      <option value="Harga: Tinggi ke Rendah">Termahal</option>
                      <option value="Ulasan Tertinggi">Rating</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      showMap 
                        ? 'bg-[#261C19] text-white shadow-md' 
                        : 'bg-white text-slate-700 border border-[#E5D7C5] hover:bg-[#FAF6F0] hover:text-[#261C19]'
                    }`}
                  >
                    <span>{showMap ? '🗺️ Tutup Peta' : '🗺️ Lihat Peta'}</span>
                  </button>
                </div>
              </div>

              {/* 🗺️ MAP DIUBAH MENJADI BANNER FULL WIDTH DI ATAS KARTU */}
              {showMap && (
                <div className="w-full h-[400px] bg-white border border-[#E5D7C5] rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 z-0 relative">
                   <InteractiveMap
                      properties={filteredProperties}
                      selectedProperty={mapSelectedProperty}
                      onPropertyClick={handleMapPropertyClick}
                      center={{ lat: -6.9175, lng: 107.6191 }}
                      zoom={12}
                      height="100%"
                      showCluster={true}
                    />
                </div>
              )}
              
              {/* Cards Grid Listing - DIUBAH MENJADI 4 BARIS (4 KOLOM) DI LAYAR BESAR */}
              <div className="w-full">
                {loading ? (
                  <div className="p-20 text-center bg-white rounded-3xl border border-[#E5D7C5] space-y-4">
                    <div className="w-14 h-14 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Mencari Hunian Terbaik...</p>
                  </div>
                ) : filteredProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProperties.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white border border-[#E5D7C5] rounded-3xl shadow-sm hover:shadow-xl hover:border-[#C5A059]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                      >
                        <div className="relative overflow-hidden aspect-[4/3] bg-slate-100 cursor-pointer" onClick={() => setSelectedRoom(item)}>
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            onError={handleImageError}
                          />
                          
                          {/* Label Tipe Properti */}
                          <div className="absolute top-4 left-4 flex flex-col gap-2">
                            <span className="bg-[#261C19]/90 backdrop-blur-sm text-[#FAF5EF] text-[10px] tracking-widest font-black uppercase px-3 py-1.5 rounded-full shadow-sm w-fit">
                              {item.type}
                            </span>
                          </div>

                          {/* Ketersediaan */}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-[#261C19]/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                              <span className="bg-rose-600 text-white text-xs font-black tracking-widest uppercase px-5 py-2.5 rounded-full shadow-lg border-2 border-white/20">
                                SUDAH PENUH
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[#C5A059] truncate pr-2">📍 {item.location}</span>
                              <span className="font-extrabold text-[#261C19] flex-shrink-0 bg-[#FAF6F0] px-2 py-1 rounded-lg">
                                ★ {item.rating} <span className="text-slate-500 font-medium text-[10px]">({item.reviews})</span>
                              </span>
                            </div>

                            <h4 
                              onClick={() => setSelectedRoom(item)}
                              className="font-extrabold text-[#261C19] text-base leading-tight group-hover:text-[#C5A059] transition-colors line-clamp-2 cursor-pointer"
                            >
                              {item.title}
                            </h4>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {/* Label Gender diubah jadi tag */}
                              <span className="bg-slate-100 border border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md">
                                🚻 {item.gender}
                              </span>
                              {item.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="bg-[#FAF6F0] border border-[#E5D7C5]/60 text-[#C5A059] font-bold text-[10px] px-2.5 py-1 rounded-md">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="text-[10px] text-slate-400 font-bold self-center">+{item.tags.length - 2} lagi</span>
                              )}
                            </div>
                          </div>

                          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 mt-auto">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-1">Mulai dari</p>
                              <p className="text-lg font-black text-[#261C19]">{item.price} <span className="text-slate-500 font-normal text-[10px]">/{item.period}</span></p>
                            </div>

                            <div className="flex gap-2 w-full">
                              <button 
                                onClick={() => setSelectedRoom(item)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-[#E5D7C5]/30 text-[#261C19] text-xs font-bold rounded-xl transition cursor-pointer border border-transparent hover:border-[#E5D7C5]"
                              >
                                Detail
                              </button>

                              <button 
                                disabled={!item.isAvailable}
                                onClick={() => handleBooking(item)}
                                className={`flex-[2] py-2.5 rounded-xl text-[11px] tracking-widest font-extrabold uppercase transition-all duration-300 cursor-pointer ${
                                  item.isAvailable 
                                    ? 'bg-[#261C19] text-white hover:bg-[#C5A059] hover:text-[#261C19] shadow-md hover:shadow-lg' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Booking
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-16 text-center rounded-3xl border-2 border-dashed border-[#E5D7C5] space-y-4">
                    <div className="text-4xl">🔍</div>
                    <p className="text-base text-[#261C19] font-bold">Tidak ada hunian yang cocok dengan kriteria filter kamu.</p>
                    <p className="text-sm text-slate-500">Coba hapus beberapa filter atau cari di area lain.</p>
                    <button 
                      onClick={handleResetFilters}
                      className="mt-4 px-6 py-2.5 bg-[#FAF6F0] border border-[#C5A059] text-[#C5A059] font-bold rounded-xl hover:bg-[#C5A059] hover:text-white transition cursor-pointer"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* MODAL DETAIL HUNIAN - Ditingkatkan Estetikanya */}
        {selectedRoom && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              
              <div className="relative h-64 md:h-72 bg-slate-200 flex-shrink-0">
                <img 
                  src={selectedRoom.image} 
                  alt={selectedRoom.title} 
                  className="w-full h-full object-cover" 
                  onError={handleImageError}
                />
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center font-bold hover:bg-rose-600 transition cursor-pointer border border-white/20"
                >
                  ✕
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                    <div className="flex gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#261C19] bg-[#C5A059] px-3 py-1 rounded-full shadow-sm">
                            {selectedRoom.type}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-full">
                            Penghuni: {selectedRoom.gender}
                        </span>
                    </div>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-extrabold text-[#261C19]">{selectedRoom.title}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-1">📍 {selectedRoom.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5D7C5]/50">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Rating Properti</p>
                        <p className="text-sm font-black text-[#261C19]">⭐ {selectedRoom.rating} <span className="font-normal text-slate-500">({selectedRoom.reviews} ulasan)</span></p>
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Status Ketersediaan</p>
                        <p className={`text-sm font-black ${selectedRoom.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {selectedRoom.isAvailable ? 'Tersedia ✅' : 'Kamar Penuh ❌'}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-black uppercase text-[#C5A059] tracking-wider">Fasilitas Tersedia</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.tags.map((tag, idx) => (
                      <span key={idx} className="bg-white border border-[#E5D7C5] text-sm px-3 py-1.5 rounded-xl font-bold text-[#261C19] shadow-sm flex items-center gap-1.5">
                        <span className="text-[#C5A059]">✓</span> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-xs font-black uppercase text-[#C5A059] tracking-wider">Deskripsi Properti</p>
                   <p className="text-sm text-slate-600 leading-relaxed">
                     {selectedRoom.desc}
                   </p>
                </div>

              </div>

              {/* FOOTER MODAL (STICKY BOTTOM) */}
              <div className="p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Harga Sewa</p>
                    <p className="text-2xl font-black text-[#261C19]">{selectedRoom.price} <span className="text-sm font-medium text-slate-500">/{selectedRoom.period}</span></p>
                  </div>

                  <button
                    disabled={!selectedRoom.isAvailable}
                    onClick={() => {
                      const roomToBook = selectedRoom;
                      setSelectedRoom(null);
                      handleBooking(roomToBook);
                    }}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                      selectedRoom.isAvailable 
                        ? 'bg-[#261C19] hover:bg-[#C5A059] text-white hover:text-[#261C19] shadow-lg hover:shadow-xl hover:-translate-y-1' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {selectedRoom.isAvailable ? 'Lanjut Booking' : 'Unit Penuh'}
                  </button>
                </div>
            </div>
          </div>
        )}

      </div>
      <Footer/>
    </SidebarUser>
  );
}