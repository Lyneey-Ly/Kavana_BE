import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import API from '../api';
import SidebarUser from '../components/SidebarUser';
import Footer from '../components/footer';

export default function KomplainUser() {
  const [complaints, setComplaints] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]); // Array untuk menampung banyak sewa aktif
  const [selectedRentalId, setSelectedRentalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filter State
  const [activeTab, setActiveTab] = useState('semua');

  // Lightbox Modal Foto State
  const [previewImage, setPreviewImage] = useState(null);

  // Form State
  const [propertiId, setPropertiId] = useState('');
  const [kamarId, setKamarId] = useState('');
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${storageBaseUrl}/${path.replace(/^\//, '')}`;
  };

  // Fetch Daftar Komplain milik User
  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await API.get('/my-complaints');
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar komplain:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Semua Data Sewa Aktif User (Bisa > 1)
  const fetchActiveRentals = async () => {
    try {
      const res = await API.get('/my-active-rental');
      const rawData = res.data.data || res.data;
      
      // Pastikan data selalu berupa Array
      const rentalsList = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      setActiveRentals(rentalsList);

      // Default pilih unit pertama jika ada
      if (rentalsList.length > 0) {
        selectRentalUnit(rentalsList[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil data sewa aktif:', err);
    }
  };

  // Helper untuk set propertiId dan kamarId berdasarkan unit yang dipilih
  const selectRentalUnit = (rental) => {
    if (!rental) return;
    setSelectedRentalId(rental.id || '');
    setPropertiId(rental.properti_id || rental.properti?.id || '');
    setKamarId(rental.kamar_id || rental.kamar?.id || '');
  };

  // Handler saat user memilih item di Dropdown Properti
  const handleRentalChange = (e) => {
    const targetId = e.target.value;
    const foundRental = activeRentals.find((r) => r.id.toString() === targetId.toString());
    if (foundRental) {
      selectRentalUnit(foundRental);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchMyComplaints();
      await fetchActiveRentals();
    };
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    };
  }, [fotoPreview]);

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'Ukuran File Terlalu Besar',
          text: 'Ukuran foto maksimal adalah 2MB!',
          confirmButtonColor: '#261C19',
        });
        return;
      }
      if (fotoPreview) URL.revokeObjectURL(fotoPreview);
      setFoto(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const clearFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
  };

  const handleCloseModal = () => {
    setJudul('');
    setDeskripsi('');
    clearFoto();
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!propertiId) {
      Swal.fire({
        icon: 'error',
        title: 'Properti Belum Dipilih',
        text: 'Silakan pilih properti/kamar yang ingin kamu laporkan!',
        confirmButtonColor: '#261C19',
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Kirim Komplain?',
      text: 'Pastikan rincian kendala dan unit yang dipilih sudah sesuai.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#261C19',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Kirim Laporan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('properti_id', propertiId);
      if (kamarId) formData.append('kamar_id', kamarId);
      formData.append('judul', judul);
      formData.append('deskripsi', deskripsi);
      if (foto) formData.append('foto', foto);

      await API.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await Swal.fire({
        icon: 'success',
        title: 'Komplain Berhasil Dikirim!',
        text: 'Tim manajemen kami akan segera memeriksa dan memproses keluhan kamu.',
        confirmButtonColor: '#261C19',
      });
      
      handleCloseModal();
      fetchMyComplaints();
    } catch (err) {
      console.error('Gagal mengirim komplain:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengirim komplain. Silakan coba lagi.',
        confirmButtonColor: '#261C19',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="bg-amber-100/80 text-amber-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300/80 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            ⏳ Pending
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-blue-100/80 text-blue-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-300/80 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            ⚙️ Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className="bg-emerald-100/80 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-300/80 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ✅ Selesai
          </span>
        );
      default:
        return null;
    }
  };

  const filteredComplaints = complaints.filter((item) => {
    if (activeTab === 'semua') return true;
    return item.status === activeTab;
  });

  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const diprosesCount = complaints.filter((c) => c.status === 'Diproses').length;
  const selesaiCount = complaints.filter((c) => c.status === 'Selesai').length;

  return (
    <SidebarUser>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          
          {/* HEADER DASHBOARD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm relative overflow-hidden">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">
                Kafana Help Desk
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19] tracking-tight">
                Layanan Komplain & Keluhan
              </h1>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                Ada kendala pada fasilitas, kamar, atau lingkungan hunian kosmu? Laporkan di sini, tim management kami siap membantu!
              </p>
            </div>

            <button
              onClick={() => {
                if (activeRentals.length === 0) {
                  Swal.fire({
                    icon: 'info',
                    title: 'Tidak Ada Sewa Aktif',
                    text: 'Kamu belum memiliki sewa kamar/unit yang aktif untuk mengajukan komplain!',
                    confirmButtonColor: '#261C19',
                  });
                  return;
                }
                setShowModal(true);
              }}
              className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-6 py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span>✨</span> Buat Komplain Baru
            </button>
          </div>

          {/* STATS METRIC SUMMARY CARD */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Keluhan</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#261C19]">{totalCount}</span>
                <span className="text-lg">📑</span>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Menunggu</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
                <span className="text-lg">⏳</span>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Diproses</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-600">{diprosesCount}</span>
                <span className="text-lg">⚙️</span>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Selesai</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">{selesaiCount}</span>
                <span className="text-lg">✅</span>
              </div>
            </div>
          </div>

          {/* FILTER TAB BAR */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'semua', label: 'Semua Status', count: totalCount },
              { id: 'Pending', label: '⏳ Pending', count: pendingCount },
              { id: 'Diproses', label: '⚙️ Diproses', count: diprosesCount },
              { id: 'Selesai', label: '✅ Selesai', count: selesaiCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  activeTab === tab.id
                    ? 'bg-[#261C19] text-white border-[#261C19] shadow-md'
                    : 'bg-white/80 text-slate-600 border-[#E5D7C5] hover:bg-white hover:text-[#261C19]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === tab.id ? 'bg-[#C5A059] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* DAFTAR KELUHAN */}
          {loading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-[#E5D7C5] shadow-sm space-y-3">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Riwayat Komplain...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#E5D7C5] text-center space-y-3 shadow-sm">
              <span className="text-5xl block">🎉</span>
              <h3 className="text-base font-extrabold text-[#261C19]">Tidak Ada Keluhan Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {activeTab === 'semua' 
                  ? 'Semua aman tenteram! Kamu belum pernah mengirimkan komplain.' 
                  : `Tidak ada komplain dengan status "${activeTab}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-6 md:p-7 rounded-3xl border border-[#E5D7C5] shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D7C5]/60 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#C5A059]/20 text-[#9C7A3C] px-2.5 py-0.5 rounded-full uppercase">
                          COMPLAINT #{item.id.toString().padStart(4, '0')}
                        </span>
                        {item.created_at && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-[#261C19]">{item.judul}</h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-[#C5A059]">
                        {item.properti && (
                          <span>
                            📍 {item.properti.nama_properti || item.properti.title || item.properti.nama}
                          </span>
                        )}
                        {item.kamar && (
                          <span>
                            🚪 Kamar {item.kamar.nomor_kamar || item.kamar.nama_kamar || item.kamar.nama}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Rincian Kendala:
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-[#FAF6F0]/40 p-4 rounded-2xl border border-[#E5D7C5]/40 font-serif">
                      {item.deskripsi}
                    </p>
                  </div>

                  {item.foto && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Foto Bukti (Klik untuk memperbesar):
                      </span>
                      <div 
                        onClick={() => setPreviewImage(getImageUrl(item.foto))}
                        className="inline-block relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <img
                          src={getImageUrl(item.foto)}
                          alt="Bukti Komplain"
                          className="h-28 w-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <span>🔍</span> Zoom
                        </div>
                      </div>
                    </div>
                  )}

                  {item.tanggapan_admin ? (
                    <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#C5A059]/30 space-y-2 relative overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#9C7A3C]">
                          Tanggapan Management Kafana
                        </span>
                      </div>
                      <p className="text-xs text-[#261C19] italic leading-relaxed pl-4 border-l-2 border-[#C5A059]">
                        "{item.tanggapan_admin}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                      <span>⏳</span>
                      <span>Tim management sedang mempelajari laporan ini dan akan merespon sesegera mungkin.</span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* LIGHTBOX MODAL PREVIEW FOTO */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/20 shadow-2xl">
            <img src={previewImage} alt="Enlarged Proof" className="w-full h-full object-contain max-h-[85vh]" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center hover:bg-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL FORM BUAT KOMPLAIN */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 border border-[#E5D7C5] shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">Formulir Laporan</span>
                <h3 className="text-lg font-extrabold text-[#261C19]">Tulis Keluhan / Komplain</h3>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* DROPDOWN PILIH PROPERTI & KAMAR */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Pilih Unit / Kamar Disewa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedRentalId}
                  onChange={handleRentalChange}
                  className="w-full text-xs p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] text-[#261C19] font-bold focus:outline-none focus:border-[#C5A059] cursor-pointer"
                >
                  {activeRentals.map((rental) => {
                    const propName = rental.properti?.nama_properti || rental.properti?.title || rental.properti?.nama || 'Properti';
                    const kamNum = rental.kamar?.nomor_kamar || rental.kamar?.nama_kamar || rental.kamar?.nama;
                    const kamarLabel = kamNum ? ` (Kamar ${kamNum})` : '';
                    
                    return (
                      <option key={rental.id} value={rental.id}>
                        📍 {propName} {kamarLabel}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  *Pilih unit sewa yang bermasalah jika kamu memiliki lebih dari 1 sewa aktif.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  No.Kamar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="1
                  2
                  3
                  4
                  5
                  6
                  7"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0]/50 focus:outline-none focus:border-[#C5A059] text-[#261C19] font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Deskripsi Detail <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Jelaskan secara rinci kendala yang kamu alami agar teknisi dapat langsung bertindak..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0]/50 focus:outline-none focus:border-[#C5A059] text-[#261C19] font-medium"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">Foto Bukti Lapangan (Maks 2MB)</label>
                
                {!fotoPreview ? (
                  <div className="relative border-2 border-dashed border-[#C5A059]/50 hover:bg-[#FAF6F0]/50 p-5 rounded-2xl text-center cursor-pointer transition space-y-1">
                    <span className="text-2xl block">📷</span>
                    <span className="text-xs font-bold text-[#261C19] block">Upload Gambar / Foto Bukti</span>
                    <span className="text-[10px] text-slate-400 block">Format: JPG, PNG (Max 2MB)</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={fotoPreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover" />
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{foto?.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={clearFoto}
                      className="text-xs text-rose-600 font-bold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                    '🚀 Kirim Komplain'
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