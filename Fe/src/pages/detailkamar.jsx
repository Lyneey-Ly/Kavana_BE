import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import API from '../api';

export default function DetailKamar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // State Utama Properti & Loading
  const [properti, setProperti] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State Tanggal Masuk & Transaksi
  const todayStr = new Date().toISOString().split('T')[0];
  const [tanggalMasuk, setTanggalMasuk] = useState(todayStr);
  const [activeImage, setActiveImage] = useState('');
  const [durasiSewa, setDurasiSewa] = useState(1);
  const [selectedKamar, setSelectedKamar] = useState(null);

  // State Filter, Lightbox, & Wishlist
  const [filterKamar, setFilterKamar] = useState('semua');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // State Review / Ulasan
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // 🌟 State Modal Dokumen Sewa & TTD Canvas
  const [showDokumenModal, setShowDokumenModal] = useState(false);
  const [bookingResponse, setBookingResponse] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Helper Toast Notification
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

  // Helper Konversi Angka & Format Rupiah
  const parsePriceNumber = (priceVal) => {
    if (typeof priceVal === 'number') return Math.round(priceVal);
    if (!priceVal) return 0;
    
    let str = String(priceVal).trim().replace(/\.00?$/, '');
    const cleanStr = str.replace(/[^0-9]/g, '');
    const num = Number(cleanStr) || 0;

    if (num > 0 && num <= 10000 && !String(priceVal).includes('000')) {
      return num * 1000;
    }
    return num;
  };

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(angka || 0);
  };

  // Format Gambar URL
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

  // Cek Status Kamar Terisi
  const checkIsTerisi = (kamar) => {
    if (!kamar) return false;
    if (kamar.is_available !== undefined && kamar.is_available !== null) {
      const avail = String(kamar.is_available).toLowerCase().trim();
      return avail === '0' || avail === 'false' || avail === 'no';
    }
    const status = kamar.status !== undefined ? kamar.status : (kamar.keterangan || '');
    if (!status) return false;
    if (typeof status === 'boolean') return !status;
    if (typeof status === 'number') return status === 0;

    const str = String(status).toLowerCase().trim();
    return ['terisi', 'occupied', 'booked', 'full', '1', 'true', 'tidak tersedia', 'dipesan', 'terpesan', 'unavailable', '0'].includes(str);
  };

  // Mapping Data Properti dari Backend
  const mapBackendProperti = (data) => {
    if (!data) return null;

    const mainImg = formatImage(data.main_image || data.image || data.gambar || data.foto || data.foto_utama);
    let rawGaleri = data.images || data.gallery_images || data.galeri || data.galleries || data.photos || data.foto_galeri;

    if (typeof rawGaleri === 'string') {
      try {
        rawGaleri = JSON.parse(rawGaleri);
      } catch (e) {
        rawGaleri = rawGaleri.includes(',') ? rawGaleri.split(',').map(s => s.trim()) : [rawGaleri];
      }
    }

    let galeriList = [];
    if (Array.isArray(rawGaleri) && rawGaleri.length > 0) {
      galeriList = rawGaleri.map(img => {
        if (!img) return null;
        if (typeof img === 'string') return formatImage(img);
        if (typeof img === 'object') {
          const path = img.url || img.path || img.image_path || img.file_path || img.image || img.foto;
          return path ? formatImage(path) : null;
        }
        return null;
      }).filter(Boolean);
    }

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
    const rawKamars = Array.isArray(data.kamars) ? data.kamars : Array.isArray(data.kamar) ? data.kamar : [];

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
      galeri: galeriList,
      deskripsi: data.description || 'Tidak ada deskripsi tersedia.',
      fasilitasKamar: rawFacilities.length > 0 ? rawFacilities : ['Kamar Mandi Dalam', 'Kasur & Lemari', 'Meja Belajar'],
      fasilitasBersama: parseList(data.public_facilities || data.fasilitas_bersama),
      aturanKos: parseList(data.rules || data.aturan || data.aturan_kos || 'Dilarang merusak fasilitas, Wajib menjaga kebersihan, Dilarang membuat kegaduhan'),
      pemilik: { nama: namaPemilik, noHp: hpPemilik, foto: fotoPemilik },
      kamars: rawKamars,
      totalKamarDirect: Number(data.total_kamar || 0),
      sisaKamarDirect: Number(data.sisa_kamar || 0)
    };
  };

  // Fetch Detail Properti
  useEffect(() => {
    const loadPropertiDetail = async () => {
      setLoading(true);
      if (id) {
        try {
          const res = await API.get(`/properties/${id}`);
          const formatted = mapBackendProperti(res.data?.data || res.data?.property || res.data);
          setProperti(formatted);
          setActiveImage(formatted.gambarUtama);
        } catch (err) {
          const stateRoom = location.state?.room || location.state?.properti;
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
      }
    };
    loadPropertiDetail();
  }, [id]);

  // Fetch Review
  const fetchReviews = async (propertyId) => {
    if (!propertyId) return;
    setLoadingReviews(true);
    try {
      const res = await API.get(`/properties/${propertyId}/reviews`);
      setReviews(res.data?.data || res.data?.reviews || (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (properti?.id) fetchReviews(properti.id);
  }, [properti?.id]);

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      Swal.fire({ icon: 'warning', title: 'Ulasan Kosong', text: 'Tulis ulasan terlebih dahulu!', confirmButtonColor: '#2D2321' });
      return;
    }
    setSubmittingReview(true);
    try {
      await API.post('/reviews', { properti_id: properti.id, rating: newRating, comment: newComment });
      Swal.fire({ icon: 'success', title: 'Ulasan Terkirim!', confirmButtonColor: '#B38E5D' });
      setNewComment('');
      setNewRating(5);
      fetchReviews(properti.id);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal Mengirim', text: err.response?.data?.message || 'Terjadi kesalahan.', confirmButtonColor: '#2D2321' });
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

  // Status Kamar
  const kamarsList = properti?.kamars || [];
  const hasKamarsArray = kamarsList.length > 0;
  const totalKamar = hasKamarsArray ? kamarsList.length : (properti?.totalKamarDirect || 0);
  const kamarTerisi = hasKamarsArray ? kamarsList.filter(k => checkIsTerisi(k)).length : Math.max(0, totalKamar - (properti?.sisaKamarDirect || 0));
  const kamarSisa = hasKamarsArray ? Math.max(0, totalKamar - kamarTerisi) : (properti?.sisaKamarDirect || 0);

  const infoKamar = { total: totalKamar, terisi: kamarTerisi, sisa: kamarSisa };

  const filteredKamarsList = kamarsList.filter(kamar => {
    const isOccupied = checkIsTerisi(kamar);
    if (filterKamar === 'tersedia') return !isOccupied;
    if (filterKamar === 'terisi') return isOccupied;
    return true;
  });

  // 🖊️ LOGIKA CANVAS TANDA TANGAN DIGITAL (TTD)
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2D2321';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  // 🚀 PROSES 1: KLIK SEWA -> BUAT BOOKING & MUNCULKAN DOKUMEN SEWA + TTD
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

    // Status Login
    const token = sessionStorage.getItem('token');
    if (!token) {
      const bookingData = {
        properti_id: properti.id,
        kamar_id: selectedKamar ? selectedKamar.id : null,
        check_in_date: tanggalMasuk,
        duration_months: durasiSewa,
        nomorKamar: selectedKamar ? (selectedKamar.nomor_kamar || selectedKamar.nama_kamar) : '-',
        namaProperti: properti.namaProperti,
        tipeKamar: properti.kategori,
        hargaSewa: `${formatRupiah(properti.hargaPerBulan)} / bln`,
        durasiSewaText: `${durasiSewa} Bulan`,
        tanggalMasukFormatted: new Date(tanggalMasuk).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        biayaLayanan: formatRupiah(properti.biayaLayanan),
        totalBayar: formatRupiah(totalPembayaran), 
        gambar: properti.gambarUtama
      };

      const result = await Swal.fire({
        title: 'Belum Login',
        text: 'Untuk melanjutkan ke pembuatan dokumen sewa, silakan masuk ke akun Anda.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#B38E5D',
        cancelButtonColor: '#2D2321',
        confirmButtonText: '📝 Buat Akun Baru',
        cancelButtonText: '🔑 Masuk (Login)'
      });

      if (result.isConfirmed) {
        navigate('/register', { state: { fromBooking: true, bookingData } });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        navigate('/login', { state: { fromBooking: true, bookingData } });
      }
      return;
    }

    try {
      Swal.showLoading();

      // Panggil API untuk membuat Pemesanan & Draft Dokumen Sewa
      const response = await API.post('/pemesanan/booking', {
        properti_id: properti.id,
        kamar_id: selectedKamar ? selectedKamar.id : null,
        check_in_date: tanggalMasuk,
        duration_months: durasiSewa,    
      });

      Swal.close();

      // Simpan data booking ke state dan buka modal Dokumen Sewa + TTD
      setBookingResponse(response.data?.data || response.data);
      setShowDokumenModal(true);
      setIsAgreed(false);
      setHasSigned(false);

    } catch (err) {
      console.error('❌ Gagal membuat pemesanan:', err);
      Swal.fire({
        icon: 'error',
        title: 'Pemesanan Gagal',
        text: err.response?.data?.message || 'Gagal memproses pesanan.',
        confirmButtonColor: '#2D2321',
      });
    }
  };

  const handleSelesaiTTDDanLanjutBayar = async () => {
  if (!isAgreed) {
    Swal.fire({ icon: 'warning', title: 'Persetujuan Diperlukan', text: 'Harap centang kotak persetujuan dokumen sewa terlebih dahulu.', confirmButtonColor: '#2D2321' });
    return;
  }

  if (!hasSigned) {
    Swal.fire({ icon: 'warning', title: 'Tanda Tangan Belum Ada', text: 'Silakan bubuhkan tanda tangan Anda pada area yang disediakan.', confirmButtonColor: '#2D2321' });
    return;
  }

  const signatureImage = canvasRef.current ? canvasRef.current.toDataURL() : null;

  try {
    Swal.showLoading();

    // 🌟 SIMPAN TTD PERMANEN KE DATABASE BACKEND
    await API.post(`/pemesanan/${bookingResponse?.id}/ttd`, {
      signature: signatureImage,
      is_agreed: true
    });

    Swal.close();

    const dataDikirim = {
      pemesanan_id: bookingResponse?.id, 
      property_id: properti.id,
      kamar_id: selectedKamar ? selectedKamar.id : null,
      nomorKamar: selectedKamar ? (selectedKamar.nomor_kamar || selectedKamar.nama_kamar) : '-',
      namaProperti: properti.namaProperti,
      tipeKamar: properti.kategori,
      hargaSewa: `${formatRupiah(properti.hargaPerBulan)} / bln`,
      durasiSewa: `${durasiSewa} Bulan`,
      tanggalMasuk: new Date(tanggalMasuk).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
      biayaLayanan: formatRupiah(properti.biayaLayanan),
      totalBayar: formatRupiah(totalPembayaran), 
      gambar: properti.gambarUtama,
      signatureImage: signatureImage
    };

    setShowDokumenModal(false);

    Swal.fire({
      icon: 'success',
      title: 'Tanda Tangan Tersimpan!',
      text: 'Meneruskan ke halaman pembayaran...',
      timer: 1200,
      showConfirmButton: false
    });

    setTimeout(() => {
      navigate('/pembayaran', { state: { itemTransaksi: dataDikirim } });
    }, 1000);

  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal Menyimpan TTD',
      text: err.response?.data?.message || 'Gagal menyimpan tanda tangan ke server.',
      confirmButtonColor: '#2D2321'
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
          <p className="text-xs font-bold uppercase tracking-widest text-[#2D2321]">Memuat Detail Properti...</p>
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
      
      {/* TOAST NOTIFICATION FLOATING */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all bg-[#2D2321] text-white border-[#B38E5D]">
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

      {/* 📜 POP-UP MODAL DOKUMEN SEWA & TTD DIGITAL */}
      {showDokumenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white border border-[#D7C4B0] max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative my-8">
            <button 
              onClick={() => setShowDokumenModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black text-xl font-bold p-2 cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="bg-[#B38E5D]/10 text-[#B38E5D] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-[#B38E5D]/20">
                Tahap 2: Dokumen Legal
              </span>
              <h2 className="text-xl font-serif font-bold text-[#2D2321] mt-2">
                Surat Perjanjian Sewa Hunian
              </h2>
              <p className="text-xs text-gray-500">
                Harap baca klausul perjanjian sewa dan bubuhkan tanda tangan Anda sebelum lanjut membayar.
              </p>
            </div>

            {/* Teks Perjanjian Sewa */}
            <div className="bg-[#FAF5EF] p-4 sm:p-5 rounded-2xl border border-[#D7C4B0] text-xs text-[#2D2321] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line shadow-inner">
              {bookingResponse?.dokumen_sewa?.lease_agreement || bookingResponse?.dokumenSewa?.lease_agreement || (
                `SURAT PERJANJIAN SEWA HUNIAN KAFANA\n\nPada hari ini, disepakati perjanjian sewa antara Management Kafana dengan Penyewa.\n\nRincian Sewa:\n- Properti: ${properti.namaProperti}\n- Unit Kamar: ${selectedKamar?.nomor_kamar || '-'}\n- Tanggal Check-In: ${tanggalMasuk}\n- Durasi: ${durasiSewa} Bulan\n- Total Biaya: ${formatRupiah(totalPembayaran)}\n\nDengan menandatangani dokumen ini, Penyewa menyatakan setuju dengan seluruh syarat dan ketentuan yang berlaku.`
              )}
            </div>

            {/* Checkbox Persetujuan */}
            <label className="flex items-start gap-3 cursor-pointer p-1">
              <input 
                type="checkbox" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-[#2D2321] cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#2D2321]">
                Saya telah membaca, memahami, dan menyetujui seluruh klausul Surat Perjanjian Sewa di atas.
              </span>
            </label>

            {/* Area Tanda Tangan Digital (Canvas) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#2D2321]">
                  Bubuhkan Tanda Tangan Digital Anda:
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  🗑️ Hapus TTD
                </button>
              </div>

              <div className="border-2 border-dashed border-[#D7C4B0] rounded-2xl bg-[#FAF5EF] overflow-hidden flex justify-center relative touch-none">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair w-full h-[150px]"
                />
                {!hasSigned && (
                  <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">
                    Goreskan Tanda Tangan Di Sini
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Eksekusi Modal */}
            <button
              onClick={handleSelesaiTTDDanLanjutBayar}
              className="w-full py-4 bg-[#2D2321] hover:bg-[#B38E5D] text-white font-bold rounded-2xl text-xs uppercase tracking-widest transition shadow-lg cursor-pointer"
            >
              Simpan TTD &amp; Lanjut ke Pembayaran →
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="bg-white/90 backdrop-blur-md border-b border-[#D7C4B0] sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-[#FAF5EF] hover:bg-[#2D2321] text-[#2D2321] hover:text-white px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition border border-[#D7C4B0] cursor-pointer"
          >
            ← Kembali
          </button>
          
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
            
            {/* GALERI FOTO */}
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
              
              {/* DENAH KAMAR INTERAKTIF */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-serif font-bold text-[#B38E5D] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span>🛏️</span> Pilih Unit Kamar Yang Tersedia
                  </h3>

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

                {properti.kamars && properti.kamars.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                    {filteredKamarsList.map((kamar, idx) => {
                      const occupied = checkIsTerisi(kamar);
                      const isSelected = selectedKamar?.id === kamar.id;
                      const nomorKamar = kamar.nomor_kamar || kamar.nama_kamar || kamar.room_number || `Kamar ${idx + 1}`;
                      
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
                      Data denah nomor kamar belum diisikan oleh pemilik kost.
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

            {/* ATURAN KOST */}
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

            {/* SECTION REVIEW */}
            <div className="bg-white border border-[#D7C4B0] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-serif font-bold text-[#2D2321] text-base flex items-center gap-2">
                  <span>⭐</span> Ulasan &amp; Rating Penyewa
                </h3>
                <span className="text-xs font-extrabold text-[#B38E5D] bg-[#FAF5EF] px-3 py-1 rounded-full border border-[#D7C4B0]">
                  {reviews.length} Ulasan
                </span>
              </div>

              <form onSubmit={handleSubmitReview} className="bg-[#FAF5EF] p-5 rounded-2xl border border-[#D7C4B0]/80 space-y-3.5 shadow-inner">
                <p className="text-xs font-bold text-[#2D2321]">Bagikan Pengalaman Kamu Tinggal Di Sini:</p>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs text-gray-600 font-semibold">Beri Rating:</label>
                  <select 
                    value={newRating} 
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="bg-white border border-[#D7C4B0] text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
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
                  className="w-full bg-white border border-[#D7C4B0] p-3.5 rounded-xl text-xs text-[#2D2321]"
                ></textarea>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-[#2D2321] hover:bg-[#B38E5D] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase cursor-pointer transition"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Ulasan Sekarang'}
                </button>
              </form>

              {loadingReviews ? (
                <div className="text-center py-6">
                  <div className="w-6 h-6 border-2 border-[#B38E5D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((rev, index) => (
                    <div key={rev.id || index} className="p-4 rounded-2xl bg-[#FAF5EF]/60 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#2D2321] flex items-center gap-1.5">
                          👤 {rev.user_name || rev.user?.name || 'Penyewa Anonim'}
                        </span>
                        <span className="text-xs text-amber-500 font-bold">
                          {'★'.repeat(rev.rating || 5)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 pl-6">{rev.comment || rev.ulasan}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs bg-[#FAF5EF]/30 rounded-2xl border border-dashed border-[#D7C4B0]">
                  Belum ada ulasan untuk properti ini.
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

              {/* TANGGAL MASUK */}
              <div className="space-y-2">
                <label className="text-xs text-[#2D2321] font-bold block">
                  Pilih Tanggal Masuk (Check-in):
                </label>
                <input 
                  type="date"
                  min={todayStr} 
                  value={tanggalMasuk}
                  onChange={(e) => setTanggalMasuk(e.target.value)}
                  className="w-full bg-[#FAF5EF] border border-[#D7C4B0] text-[#2D2321] text-xs font-bold p-3.5 rounded-2xl cursor-pointer"
                />
              </div>

              {/* KAMAR TERPILIH */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                selectedKamar ? 'bg-[#FAF5EF] border-[#B38E5D] ring-2 ring-[#B38E5D]/20' : 'bg-rose-50 border-rose-200'
              }`}>
                <span className="font-bold text-[#5C4A42]">Unit Pilihan Kamu:</span>
                {selectedKamar ? (
                  <span className="bg-[#B38E5D] text-white font-extrabold px-3 py-1 rounded-xl shadow-sm">
                    ✔ {selectedKamar.nomor_kamar || selectedKamar.nama_kamar}
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold animate-pulse flex items-center gap-1">
                    <span>⚠️</span> Belum dipilih di denah
                  </span>
                )}
              </div>

              {/* DURASI SEWA */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-[#2D2321] font-bold block">
                    Pilih Durasi Sewa:
                  </label>
                  {discountRate > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      🔥 Diskon {(discountRate * 100)}%!
                    </span>
                  )}
                </div>
                <select 
                  value={durasiSewa} 
                  onChange={(e) => setDurasiSewa(Number(e.target.value))}
                  className="w-full bg-[#FAF5EF] border border-[#D7C4B0] text-[#2D2321] text-xs font-bold p-3.5 rounded-2xl cursor-pointer"
                >
                  <option value={1}>1 Bulan (Bayar Bulanan)</option>
                  <option value={3}>3 Bulan (Per Kuartal)</option>
                  <option value={6}>6 Bulan (Diskon Spesial 5%)</option>
                  <option value={12}>12 Bulan / 1 Tahun (Diskon Maksimal 10%)</option>
                </select>
              </div>

              {/* RINCIAN BIAYA */}
              <div className="bg-[#FAF5EF] p-4 rounded-2xl border border-[#D7C4B0]/80 space-y-3 text-xs">
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
                  <span>Biaya Layanan System:</span>
                  <span className="font-semibold text-[#2D2321]">
                    {properti.biayaLayanan > 0 ? formatRupiah(properti.biayaLayanan) : <span className="text-emerald-600 font-bold">Gratis</span>}
                  </span>
                </div>

                <div className="flex justify-between pt-3 border-t border-[#D7C4B0] font-black text-sm text-[#2D2321]">
                  <span>Total Estimasi Bayar:</span>
                  <span className="text-[#B38E5D] text-lg">{formatRupiah(totalPembayaran)}</span>
                </div>
              </div>

              {/* TOMBOL SEWA & SETUJU DOKUMEN */}
              <button 
                onClick={handleLanjutPembayaran}
                className="w-full bg-[#2D2321] hover:bg-[#B38E5D] text-white font-bold py-4 rounded-2xl text-xs tracking-widest uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Sewa &amp; Tanda Tangan Dokumen</span>
                <span>→</span>
              </button>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-center text-gray-500 leading-tight flex items-center justify-center gap-2">
                <span>🔒</span>
                <span>Dokumen sewa legal diterbitkan secara otomatis sebelum proses pembayaran.</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}