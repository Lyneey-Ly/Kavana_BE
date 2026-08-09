import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2'; // 🌟 Ditambahkan: SweetAlert2 untuk Alert Interaktif
import API from '../api';

export default function DetailKamar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // State Utama Properti & Loading
  const [properti, setProperti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 🌟 State untuk Tanggal Masuk (Mulai Sewa)
  const todayStr = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
  const [tanggalMasuk, setTanggalMasuk] = useState(todayStr);

  // State Tampilan & Transaksi
  const [activeImage, setActiveImage] = useState('');
  const [durasiSewa, setDurasiSewa] = useState(1);
  const [selectedKamar, setSelectedKamar] = useState(null);

  // 🌟 Filter Kamar, Lightbox Foto, Wishlist, & Toast Notifikasi
  const [filterKamar, setFilterKamar] = useState('semua'); // 'semua' | 'tersedia' | 'terisi'
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // State Review / Ulasan
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Helper Notifikasi Toast Bawaan (Tetap Dipertahankan)
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3500);
  };

  // 🌟 SweetAlert Toast Notification Helper
  const showSwalToast = (icon, title) => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon,
      title: title,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: '#2D2321',
      color: '#FAF5EF',
    });
  };

  // Helper konversi angka yang tahan terhadap desimal database (.00)
  const parsePriceNumber = (priceVal) => {
    if (typeof priceVal === 'number') return Math.round(priceVal);
    if (!priceVal) return 0;
    
    let str = String(priceVal).trim();
    str = str.replace(/\.00?$/, '');
    
    const cleanStr = str.replace(/[^0-9]/g, '');
    const num = Number(cleanStr) || 0;

    if (num > 0 && num <= 10000 && !String(priceVal).includes('000')) {
      return num * 1000;
    }
    return num;
  };

  // Helper Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(angka || 0);
  };

  // 🌟 PERBAIKAN FORMAT GAMBAR: Menangani foto lokal, server Laravel, dan fallback
  const formatImage = (imgSrc) => {
    if (!imgSrc) return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
    if (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:')) {
      return imgSrc;
    }
    if (imgSrc.startsWith('/')) {
      return imgSrc;
    }
    return `http://127.0.0.1:8000/storage/${imgSrc}`;
  };

  // Pengecekan status kamar yang akurat dengan backend Laravel
  const checkIsTerisi = (kamar) => {
    if (!kamar) return false;
    
    if (kamar.is_available !== undefined && kamar.is_available !== null) {
      const avail = String(kamar.is_available).toLowerCase().trim();
      return avail === '0' || avail === 'false' || avail === 'no';
    }

    const status = kamar.status !== undefined ? kamar.status : (kamar.keterangan || '');
    if (status === undefined || status === null || status === '') return false;
    if (typeof status === 'boolean') return !status;
    if (typeof status === 'number') return status === 0;

    const str = String(status).toLowerCase().trim();
    return (
      str === 'terisi' || 
      str === 'occupied' || 
      str === 'booked' || 
      str === 'full' || 
      str === '1' || 
      str === 'true' || 
      str === 'tidak tersedia' || 
      str === 'dipesan' ||
      str === 'terpesan' ||
      str === 'unavailable' ||
      str === '0'
    );
  };
const mapBackendProperti = (data) => {
    if (!data) return null;

    const mainImg = formatImage(data.main_image || data.image || data.gambar || data.foto || data.foto_utama);
    
    // 🌟 1. Tangkap semua kemungkinan nama key galeri dari response Laravel Backend
    let rawGaleri = 
      data.images || 
      data.gallery_images || // 👈 Tambahkan ini agar cocok dengan form Admin
      data.galeri || 
      data.galleries || 
      data.gallery || 
      data.photos || 
      data.property_images || 
      data.foto_galeri;

    // 🌟 2. Jika database menyimpan galeri dalam bentuk string JSON (contoh: '["img1.jpg", "img2.jpg"]')
    if (typeof rawGaleri === 'string') {
      try {
        rawGaleri = JSON.parse(rawGaleri);
      } catch (e) {
        if (rawGaleri.includes(',')) {
          rawGaleri = rawGaleri.split(',').map(s => s.trim());
        } else {
          rawGaleri = [rawGaleri];
        }
      }
    }

    // 🌟 3. Ekstrak path/URL foto galeri baik yang berbentuk Array String maupun Array Objek Relasi
    let galeriList = [];
    if (Array.isArray(rawGaleri) && rawGaleri.length > 0) {
      galeriList = rawGaleri.map(img => {
        if (!img) return null;
        
        // Jika item langsung berupa string path ("uploads/kamar1.jpg")
        if (typeof img === 'string') return formatImage(img);
        
        // Jika item berupa Objek dari Database (contoh: { id: 1, image_path: "..." })
        if (typeof img === 'object') {
          const path = img.url || img.path || img.image_path || img.file_path || img.image || img.foto || img.src || img.file;
          return path ? formatImage(path) : null;
        }
        return null;
      }).filter(Boolean); // Menghapus nilai null / undefined
    }

    // 🌟 4. Gabungkan foto utama ke dalam galeri jika belum ada
    if (galeriList.length === 0) {
      galeriList = [mainImg];
    } else if (!galeriList.includes(mainImg)) {
      galeriList.unshift(mainImg);
    }

    const parseList = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim());
      return [];
    };

    const pemilikObj = data.pemilik || data.user || data.owner || {};
    const namaPemilik = pemilikObj.name || pemilikObj.nama || data.nama_pemilik || 'Pemilik Kost Kafana';
    const hpPemilik = pemilikObj.phone || pemilikObj.no_hp || pemilikObj.whatsapp || data.no_hp_pemilik || null;
    const fotoPemilik = (pemilikObj.avatar || pemilikObj.foto)
      ? formatImage(pemilikObj.avatar || pemilikObj.foto) 
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(namaPemilik)}&background=2D2321&color=FAF5EF`;

    const rawFacilities = parseList(data.facilities || data.room_facilities || data.fasilitas);

    const rawKamars = Array.isArray(data.kamars) ? data.kamars 
      : Array.isArray(data.kamar) ? data.kamar 
      : Array.isArray(data.rooms) ? data.rooms 
      : Array.isArray(data.room_list) ? data.room_list 
      : [];

    const totalKamarDirect = Number(data.total_kamar || data.jumlah_kamar || data.total_rooms || 0);
    const sisaKamarDirect = Number(data.sisa_kamar || data.kamar_tersedia || data.available_rooms || 0);

    const hargaAsli = parsePriceNumber(data.price_per_month ?? data.harga ?? data.price);
    const depositAsli = data.deposit !== undefined && data.deposit !== null ? parsePriceNumber(data.deposit) : hargaAsli;
    const biayaLayananAsli = data.biaya_layanan !== undefined && data.biaya_layanan !== null ? parsePriceNumber(data.biaya_layanan) : 0;

    return {
      id: data.id || id,
      namaProperti: data.title || data.nama_properti || data.nama || 'Detail Properti',
      kategori: `${data.type || 'Kost'} ${data.gender_type || ''}`.trim(),
      alamat: data.address || data.alamat || 'Lokasi tidak tersedia',
      hargaPerBulan: hargaAsli,
      biayaLayanan: biayaLayananAsli,
      deposit: depositAsli,
      gambarUtama: mainImg,
      galeri: galeriList, // 🌟 Galeri yang sudah berhasil diekstrak
      deskripsi: data.description || 'Tidak ada deskripsi tersedia.',
      fasilitasKamar: rawFacilities.length > 0 ? rawFacilities : ['Kamar Mandi Dalam', 'Kasur & Lemari', 'Meja Belajar'],
      fasilitasBersama: parseList(data.public_facilities || data.fasilitas_bersama),
      aturanKos: parseList(data.rules || data.aturan || data.aturan_kos || 'Dilarang membawa orang hitam, Dilarang membakar kamar, Dilarang mematuhi peraturan'),
      pemilik: {
        nama: namaPemilik,
        noHp: hpPemilik,
        foto: fotoPemilik
      },
      kamars: rawKamars,
      totalKamarDirect,
      sisaKamarDirect
    };
  };

  // 1. Fetch Detail Properti
  useEffect(() => {
    const loadPropertiDetail = async () => {
      setLoading(true);
      setErrorMsg('');

      if (id) {
        try {
          const res = await API.get(`/properties/${id}`);
          const rawData = res.data?.data || res.data?.property || res.data;
          const formatted = mapBackendProperti(rawData);
          
          setProperti(formatted);
          setActiveImage(formatted.gambarUtama);
        } catch (err) {
          console.error('❌ Gagal memuat detail dari API:', err);
          const stateRoom = location.state?.room || location.state?.properti || location.state?.item;
          if (stateRoom) {
            const formatted = mapBackendProperti(stateRoom);
            setProperti(formatted);
            setActiveImage(formatted.gambarUtama);
          } else {
            setErrorMsg('Gagal memuat detail properti dari server.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        setErrorMsg('ID Properti tidak valid.');
        setLoading(false);
      }
    };

    loadPropertiDetail();
  }, [id]);

  // 2. Fetch Review
  const fetchReviews = async (propertyId) => {
    if (!propertyId) return;
    setLoadingReviews(true);
    try {
      const res = await API.get(`/properties/${propertyId}/reviews`);
      const apiReviews = res.data?.data || res.data?.reviews || (Array.isArray(res.data) ? res.data : []);
      setReviews(apiReviews);
    } catch (err) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (properti?.id) {
      fetchReviews(properti.id);
    }
  }, [properti?.id]);

  // 3. Submit Review dengan SweetAlert
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Ulasan Kosong',
        text: 'Silakan tulis ulasan kamu terlebih dahulu!',
        confirmButtonColor: '#2D2321',
      });
      return;
    }

    setSubmittingReview(true);
    try {
      await API.post('/reviews', {
        properti_id: properti.id, 
        rating: newRating,
        comment: newComment
      });

      Swal.fire({
        icon: 'success',
        title: 'Ulasan Terkirim!',
        text: 'Terima kasih telah memberikan ulasan.',
        confirmButtonColor: '#B38E5D',
      });

      setNewComment('');
      setNewRating(5);
      fetchReviews(properti.id);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.response?.data?.message || 'Gagal mengirim ulasan.',
        confirmButtonColor: '#2D2321',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Kalkulasi Diskon & Total
  const calculateDiscount = (months) => {
    if (months >= 12) return 0.10;
    if (months >= 6) return 0.05;
    return 0;
  };

  const discountRate = calculateDiscount(durasiSewa);
  const rawSubtotal = (properti?.hargaPerBulan || 0) * durasiSewa;
  const discountAmount = rawSubtotal * discountRate;
  const subtotalSewa = rawSubtotal - discountAmount;
  const totalPembayaran = subtotalSewa + (properti?.biayaLayanan || 0);

  // Kalkulasi Informasi Kamar
  const kamarsList = properti?.kamars || [];
  const hasKamarsArray = kamarsList.length > 0;

  const totalKamar = hasKamarsArray ? kamarsList.length : (properti?.totalKamarDirect || 0);
  const kamarTerisi = hasKamarsArray 
    ? kamarsList.filter(k => checkIsTerisi(k)).length 
    : Math.max(0, totalKamar - (properti?.sisaKamarDirect || 0));
  const kamarSisa = hasKamarsArray 
    ? Math.max(0, totalKamar - kamarTerisi)
    : (properti?.sisaKamarDirect || 0);

  const infoKamar = {
    total: totalKamar,
    terisi: kamarTerisi,
    sisa: kamarSisa,
  };

  // Filter List Kamar
  const filteredKamarsList = kamarsList.filter(kamar => {
    const isOccupied = checkIsTerisi(kamar);
    if (filterKamar === 'tersedia') return !isOccupied;
    if (filterKamar === 'terisi') return isOccupied;
    return true;
  });

  // 🌟 Modifikasi Pembayaran dengan SweetAlert2 Modal & Toast
  const handleLanjutPembayaran = async () => {
    if (!properti) return;

    if (hasKamarsArray && !selectedKamar) {
      Swal.fire({
        icon: 'info',
        title: 'Pilih Kamar',
        text: 'Silakan klik dan pilih nomor unit kamar yang tersedia pada denah kamar!',
        confirmButtonColor: '#B38E5D',
      });
      return;
    }
    
    if (!tanggalMasuk) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanggal Belum Dipilih',
        text: 'Harap pilih tanggal masuk terlebih dahulu!',
        confirmButtonColor: '#2D2321',
      });
      return;
    }

    // Konfirmasi dengan SweetAlert2 sebelum memproses pemesanan
    const result = await Swal.fire({
      title: 'Konfirmasi Pemesanan',
      html: `
        <div style="text-align: left; font-size: 13px; font-family: sans-serif;">
          <p><strong>Kost:</strong> ${properti.namaProperti}</p>
          <p><strong>Kamar:</strong> ${selectedKamar ? (selectedKamar.nomor_kamar || selectedKamar.nama_kamar || selectedKamar.room_number) : 'Sesuai Ketersediaan'}</p>
          <p><strong>Mulai Check-in:</strong> ${new Date(tanggalMasuk).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          <p><strong>Total Estimasi:</strong> ${formatRupiah(totalPembayaran)}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2D2321',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Lanjutkan Bayar',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    try {
      Swal.showLoading();

      const response = await API.post('/pemesanan/booking', {
        properti_id: properti.id,
        kamar_id: selectedKamar ? selectedKamar.id : null,
        check_in_date: tanggalMasuk,
        duration_months: durasiSewa,    
      });

      const pemesananId = response.data?.data?.id || response.data?.id || response.data?.pemesanan_id;

      const dataDikirim = {
        pemesanan_id: pemesananId, 
        property_id: properti.id,
        kamar_id: selectedKamar ? selectedKamar.id : null,
        nomorKamar: selectedKamar ? (selectedKamar.nomor_kamar || selectedKamar.nama_kamar || selectedKamar.room_number) : '-',
        namaProperti: properti.namaProperti,
        tipeKamar: properti.kategori,
        hargaSewa: `${formatRupiah(properti.hargaPerBulan)} / bln`,
        durasiSewa: `${durasiSewa} Bulan`,
        tanggalMasuk: new Date(tanggalMasuk).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        biayaLayanan: formatRupiah(properti.biayaLayanan),
        totalBayar: formatRupiah(totalPembayaran), 
        gambar: properti.gambarUtama
      };

      Swal.fire({
        icon: 'success',
        title: 'Pemesanan Berhasil!',
        text: 'Meneruskan ke halaman pembayaran...',
        timer: 1500,
        showConfirmButton: false
      });

      setTimeout(() => {
        navigate('/pembayaran', { state: { itemTransaksi: dataDikirim } });
      }, 1200);

    } catch (err) {
      console.error('❌ Gagal membuat pemesanan:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Gagal membuat pesanan. Cek kembali pilihan kamar atau tanggal masuk.';
      
      Swal.fire({
        icon: 'error',
        title: 'Pemesanan Gagal',
        text: errorMessage,
        confirmButtonColor: '#2D2321',
      });
    }
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF5EF] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#2D2321]">Memuat Detail Properti dari Server...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !properti) {
    return (
      <div className="min-h-screen bg-[#FAF5EF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D7C4B0] p-8 rounded-3xl text-center max-w-md w-full space-y-4 shadow-sm">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold text-[#2D2321]">Properti Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">{errorMsg || 'Data tidak tersedia di database.'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-[#2D2321] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#B38E5D] transition cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#2D2321] font-sans antialiased pb-20 selection:bg-[#B38E5D] selection:text-white relative">
      
      {/* TOAST NOTIFICATION FLOATING BAWAAN */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all duration-300 animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          toast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          'bg-[#2D2321] text-white border-[#B38E5D]'
        }`}>
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* LIGHTBOX FOTO MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setIsLightboxOpen(false)}>
          <button className="absolute top-6 right-6 text-white text-3xl font-bold bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer">✕</button>
          <img src={activeImage} alt="Fullscreen View" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#D7C4B0] sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-[#FAF5EF] hover:bg-[#2D2321] text-[#2D2321] hover:text-white px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border border-[#D7C4B0] cursor-pointer"
          >
            ← Kembali
          </button>
          
          {/* ACTION BAR: SHARE & SIMPAN */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showSwalToast('success', '🔗 Tautan kost berhasil disalin!');
              }}
              className="p-2 bg-[#FAF5EF] hover:bg-slate-200 rounded-full border border-[#D7C4B0] text-sm transition cursor-pointer"
              title="Bagikan Kost"
            >
              🔗
            </button>
            <button 
              onClick={() => {
                const nextState = !isFavorited;
                setIsFavorited(nextState);
                showSwalToast(nextState ? 'success' : 'info', nextState ? '❤️ Kost disimpan ke Wishlist!' : '💔 Kost dihapus dari Wishlist');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold transition cursor-pointer ${
                isFavorited ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[#FAF5EF] border-[#D7C4B0] text-[#2D2321] hover:bg-slate-200'
              }`}
            >
              <span>{isFavorited ? '❤️' : '🤍'}</span>
              <span className="hidden sm:inline">{isFavorited ? 'Tersimpan' : 'Simpan'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* HEADER PROPERTI */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#B38E5D] text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-sm">
                {properti.kategori}
              </span>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
                ✔ Terverifikasi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2321] tracking-tight">
              {properti.namaProperti}
            </h1>
            <p className="text-xs text-[#5C4A42] mt-1.5 flex items-center gap-1 font-medium">
              📍 {properti.alamat}
            </p>
          </div>
        </div>

        {/* GRID LAYOUT UTAMA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* KOLOM KIRI */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 🌟 GALERI FOTO (DENGAN TAMPILAN PRESISI GAMBAR ADMIN) */}
            <div className="bg-white p-3 rounded-3xl border border-[#D7C4B0] shadow-sm space-y-3">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 group cursor-zoom-in"
              >
                <img 
                  src={activeImage} 
                  alt={properti.namaProperti} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                  onError={handleImageError}
                />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  🔍 Klik untuk Perbesar
                </div>
              </div>

              {properti.galeri && properti.galeri.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {properti.galeri.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImage === img ? 'border-[#B38E5D] ring-2 ring-[#B38E5D]/30 opacity-100 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`Galeri ${index + 1}`} 
                        className="w-full h-full object-cover" 
                        onError={handleImageError} 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DESKRIPSI */}
            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="font-serif font-bold text-[#2D2321] text-base border-b border-slate-100 pb-3 flex items-center gap-2">
                <span>📝</span> Deskripsi Properti
              </h3>
              <p className="text-xs text-[#5C4A42] leading-relaxed font-normal whitespace-pre-line">
                {properti.deskripsi}
              </p>
            </div>

            {/* INFORMASI PEMILIK KOST */}
            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img 
                  src={properti.pemilik?.foto} 
                  alt={properti.pemilik?.nama} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#B38E5D] p-0.5 shadow-sm"
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=Host&background=B38E5D&color=fff'; }}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B38E5D] bg-[#FAF5EF] px-2 py-0.5 rounded border border-[#D7C4B0]">
                      Pemilik Kost (Host)
                    </span>
                    <span className="text-emerald-600 text-xs font-bold">✔ Terverifikasi</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#2D2321] mt-1">
                    {properti.pemilik?.nama}
                  </h3>
                  <p className="text-[11px] text-[#5C4A42]">
                    Mitra resmi terdaftar di sistem Kafana
                  </p>
                </div>
              </div>

              {properti.pemilik?.noHp && (
                <a 
                  href={`https://wa.me/${String(properti.pemilik.noHp).replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(properti.pemilik.nama)},%20saya%20tertarik%20dengan%20kost%20${encodeURIComponent(properti.namaProperti)}%20di%20Kafana.`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <span>💬</span> Hubungi via WA
                </a>
              )}
            </div>

            {/* FASILITAS & PILIHAN KAMAR */}
            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 shadow-sm space-y-6">
              
              {/* STATUS & DENAH KAMAR INTERAKTIF */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-serif font-bold text-[#B38E5D] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛏️</span> Pilih Unit Kamar Yang Tersedia
                  </h3>

                  {/* FILTER KAMAR BUTTONS */}
                  <div className="flex bg-[#FAF5EF] p-1 rounded-xl border border-[#D7C4B0] text-[10px] font-bold">
                    <button 
                      onClick={() => setFilterKamar('semua')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterKamar === 'semua' ? 'bg-[#2D2321] text-white' : 'text-gray-600 hover:bg-black/5'}`}
                    >
                      Semua ({infoKamar.total})
                    </button>
                    <button 
                      onClick={() => setFilterKamar('tersedia')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterKamar === 'tersedia' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-black/5'}`}
                    >
                      Tersedia ({infoKamar.sisa})
                    </button>
                    <button 
                      onClick={() => setFilterKamar('terisi')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterKamar === 'terisi' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:bg-black/5'}`}
                    >
                      Terisi ({infoKamar.terisi})
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-3 my-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-xs border border-emerald-300">
                      ✨ Sisa {infoKamar.sisa} Kamar Lagi!
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#B38E5D] animate-pulse">
                    👈 Klik kotak hijau untuk memilih kamar
                  </p>
                </div>

                {/* GRID PILIHAN KAMAR */}
                {properti.kamars && properti.kamars.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                    {filteredKamarsList.map((kamar, idx) => {
                      const occupied = checkIsTerisi(kamar);
                      const isSelected = selectedKamar?.id === kamar.id;
                      const nomorKamar = kamar.nomor_kamar || kamar.nama_kamar || kamar.room_number || kamar.nomor || `Kamar ${idx + 1}`;
                      
                      return (
                        <div
                          key={kamar.id || idx}
                          onClick={() => {
                            if (!occupied) {
                              setSelectedKamar(kamar);
                              showSwalToast('success', `🛏️ Memilih ${nomorKamar}`);
                            } else {
                              showSwalToast('error', `⚠️ ${nomorKamar} sudah terisi`);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all duration-300 relative overflow-hidden ${
                            occupied
                              ? 'bg-rose-50/60 border-rose-200 text-rose-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'bg-[#B38E5D] border-[#2D2321] text-white shadow-lg scale-105 ring-4 ring-[#B38E5D]/30 cursor-pointer'
                              : 'bg-emerald-50/70 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:scale-[1.03] cursor-pointer shadow-sm'
                          }`}
                        >
                          <p className="text-sm font-black">{nomorKamar}</p>
                          <span className={`text-[10px] font-semibold block mt-1 px-2 py-0.5 rounded-full ${
                            occupied ? 'bg-rose-100 text-rose-600' :
                            isSelected ? 'bg-white/20 text-white font-extrabold' : 'bg-emerald-200/60 text-emerald-800'
                          }`}>
                            {occupied ? '❌ Terisi' : isSelected ? '✔ Terpilih' : '✔ Tersedia'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#FAF5EF] p-6 rounded-2xl border border-dashed border-[#D7C4B0] text-center mt-2">
                    <p className="text-xs text-gray-500 font-medium">
                      {infoKamar.total > 0 
                        ? `Total ${infoKamar.total} kamar terdaftar (${infoKamar.sisa} tersedia), namun rincian denah belum dimasukkan oleh host.`
                        : 'Data denah nomor kamar belum diisikan oleh pemilik kost.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-[#B38E5D] text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    Fasilitas Dalam Kamar
                  </h3>
                  {properti.fasilitasKamar.length > 0 ? (
                    <ul className="space-y-2 text-xs text-[#2D2321] font-medium">
                      {properti.fasilitasKamar.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-[#FAF5EF]/50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[#B38E5D] font-bold">✔</span> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Informasi fasilitas kamar belum tersedia</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-serif font-bold text-[#B38E5D] text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
                    Fasilitas Bersama
                  </h3>
                  {properti.fasilitasBersama.length > 0 ? (
                    <ul className="space-y-2 text-xs text-[#2D2321] font-medium">
                      {properti.fasilitasBersama.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-[#FAF5EF]/50 p-2 rounded-xl border border-slate-100">
                          <span className="text-[#B38E5D] font-bold">🏢</span> {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Dapur Bersama, Area Parkir, Wi-Fi</p>
                  )}
                </div>
              </div>

            </div>

            {/* ATURAN HUNIAN */}
            {properti.aturanKos.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="font-serif font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span>⚠️</span> Aturan &amp; Ketentuan Hunian Kost
                </h3>
                <ul className="space-y-2 text-xs text-amber-800 font-medium">
                  {properti.aturanKos.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION REVIEW & ULASAN */}
            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif font-bold text-[#2D2321] text-base flex items-center gap-2">
                  <span>⭐</span> Ulasan &amp; Rating Penyewa
                </h3>
                <span className="text-xs font-extrabold text-[#B38E5D] bg-[#FAF5EF] px-3 py-1 rounded-full border border-[#D7C4B0]">
                  {reviews.length} Ulasan
                </span>
              </div>

              {/* FORM TAMBAH REVIEW */}
              <form onSubmit={handleSubmitReview} className="bg-[#FAF5EF] p-5 rounded-2xl border border-[#D7C4B0]/80 space-y-3.5 shadow-inner">
                <p className="text-xs font-bold text-[#2D2321]">Bagikan Pengalaman Kamu Tinggal Di Sini:</p>
                
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-gray-600 font-semibold">Beri Rating:</label>
                  <select 
                    value={newRating} 
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="bg-white border border-[#D7C4B0] text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B38E5D] shadow-sm cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Sangat Bagus)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Bagus)</option>
                    <option value={3}>⭐⭐⭐ (3 - Cukup)</option>
                    <option value={2}>⭐⭐ (2 - Kurang)</option>
                    <option value={1}>⭐ (1 - Buruk)</option>
                  </select>
                </div>

                <textarea
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ceritakan kebersihan, kenyamanan, atau kelebihan kost ini..."
                  className="w-full bg-white border border-[#D7C4B0] p-3.5 rounded-xl text-xs text-[#2D2321] focus:outline-none focus:ring-2 focus:ring-[#B38E5D] shadow-sm"
                ></textarea>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#2D2321] hover:bg-[#B38E5D] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Ulasan Sekarang'}
                </button>
              </form>

              {/* DAFTAR REVIEW */}
              {loadingReviews ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-6 h-6 border-2 border-[#B38E5D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-400">Memuat ulasan dari penghuni...</p>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev, index) => (
                    <div key={rev.id || index} className="p-4 rounded-2xl bg-[#FAF5EF]/60 border border-slate-200 space-y-1.5 transition hover:border-[#D7C4B0]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#2D2321] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-[10px]">👤</span>
                          {rev.user_name || rev.user?.name || rev.nama_user || 'Penyewa Anonim'}
                        </span>
                        <span className="text-xs text-amber-500 font-bold tracking-wider">
                          {'★'.repeat(rev.rating || 5)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pl-6">
                        {rev.comment || rev.ulasan || rev.keterangan}
                      </p>
                      <span className="text-[10px] text-gray-400 pl-6 block pt-1">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Baru saja'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs bg-[#FAF5EF]/30 rounded-2xl border border-dashed border-[#D7C4B0]">
                  Belum ada ulasan untuk properti ini. Jadilah penghuni pertama yang memberikan ulasan!
                </div>
              )}
            </div>

          </div>

          {/* KOLOM KANAN: CARD PEMESANAN */}
          <div className="lg:col-span-5">

            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 sticky top-24 shadow-xl space-y-6">
              
              <div className="border-b border-slate-100 pb-4 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#5C4A42] tracking-wider block">
                    Harga Sewa Standar
                  </span>
                  <span className="text-3xl font-black text-[#2D2321] tracking-tight">
                    {formatRupiah(properti.hargaPerBulan)}
                  </span>
                  <span className="text-xs text-[#5C4A42] font-semibold"> / bulan</span>
                </div>
              </div>

              {/* TANGGAL MASUK (CHECK-IN) */}
              <div className="space-y-2">
                <label className="text-xs text-[#2D2321] font-bold block">
                  Pilih Tanggal Masuk (Check-in):
                </label>
                <input 
                  type="date"
                  min={todayStr} 
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full bg-[#FAF5EF] border border-[#D7C4B0] text-[#2D2321] text-xs font-bold p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B38E5D] cursor-pointer shadow-sm"
                />
                <p className="text-[10px] text-gray-500 font-medium">Pilih kapan kamu mau mulai tempati kost ini.</p>
              </div>

              {/* INFO KAMAR TERPILIH PADA CARD */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all duration-300 ${
                selectedKamar ? 'bg-[#FAF5EF] border-[#B38E5D] ring-2 ring-[#B38E5D]/20' : 'bg-rose-50 border-rose-200'
              }`}>
                <span className="font-bold text-[#5C4A42]">Unit Pilihan Kamu:</span>
                {selectedKamar ? (
                  <span className="bg-[#B38E5D] text-white font-extrabold px-3 py-1 rounded-xl shadow-sm animate-fadeIn">
                    ✔ {selectedKamar.nomor_kamar || selectedKamar.nama_kamar || `Kamar ID ${selectedKamar.id}`}
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold animate-pulse flex items-center gap-1">
                    <span>⚠️</span> Belum dipilih di denah
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-[#2D2321] font-bold block">
                    Pilih Durasi Sewa:
                  </label>
                  {discountRate > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                      🔥 Hemat Diskon {(discountRate * 100)}%!
                    </span>
                  )}
                </div>
                <select 
                  value={durasiSewa} 
                  onChange={(e) => setDurasiSewa(Number(e.target.value))}
                  className="w-full bg-[#FAF5EF] border border-[#D7C4B0] text-[#2D2321] text-xs font-bold p-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B38E5D] cursor-pointer shadow-sm"
                >
                  <option value={1}>1 Bulan (Bayar Bulanan)</option>
                  <option value={3}>3 Bulan (Per Kuartal)</option>
                  <option value={6}>6 Bulan (Diskon Spesial 5%)</option>
                  <option value={12}>12 Bulan / 1 Tahun (Diskon Maksimal 10%)</option>
                </select>
              </div>

              {/* RINCIAN BIAYA */}
              <div className="bg-[#FAF5EF] p-4 rounded-2xl border border-[#D7C4B0]/80 space-y-3 text-xs shadow-inner">
                <div className="flex justify-between text-[#5C4A42]">
                  <span>Sewa Kamar ({durasiSewa} bulan):</span>
                  <span className="font-semibold text-[#2D2321]">{formatRupiah(rawSubtotal)}</span>
                </div>

                {discountRate > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <span>Diskon Sewa ({(discountRate * 100)}%):</span>
                    <span>- {formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#5C4A42]">
                  <span className="flex items-center gap-1">
                    Biaya Layanan System: 
                    <span title="Gratis atau menyesuaikan ketentuan sistem" className="cursor-help text-gray-400">ℹ️</span>
                  </span>
                  <span className="font-semibold text-[#2D2321]">
                    {properti.biayaLayanan > 0 ? formatRupiah(properti.biayaLayanan) : <span className="text-emerald-600 font-bold">Gratis</span>}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-[#D7C4B0] font-black text-sm text-[#2D2321]">
                  <span>Total Estimasi Bayar:</span>
                  <span className="text-[#B38E5D] text-lg">{formatRupiah(totalPembayaran)}</span>
                </div>
              </div>

              <button 
                onClick={handleLanjutPembayaran}
                className="w-full bg-[#2D2321] hover:bg-[#B38E5D] text-white font-bold py-4 rounded-2xl text-xs tracking-widest uppercase transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Pembayaran</span>
                <span>→</span>
              </button>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-center text-gray-500 leading-tight flex items-center justify-center gap-2">
                <span>🔒</span>
                <span>Pembayaran kamu 100% aman. Kamu belum akan ditagih sebelum memilih metode bayar di halaman berikutnya.</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}