import { useState, useEffect, useCallback } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';
import API from '../api';
import Swal from 'sweetalert2';

export default function AdminTagihanOrder() {
  // 1. STATE DATA UTAMA & LOADING
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. STATE UNTUK FILTER & PENCARIAN
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchName, setSearchName] = useState(""); // 🌟 State untuk input pencarian nama

  // 3. STATE MODAL VERIFIKASI / DETAIL & LIGHTBOX
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // State untuk zoom foto bukti

  // =========================================================================
  // 🔌 FETCH DATA DARI BACKEND LARAVEL
  // =========================================================================
  const fetchTagihanOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/tagihan-order');
      const dataBackend = response.data.data || [];
      setInvoices(dataBackend);
      setError(null);
    } catch (err) {
      console.error("Gagal mengambil data tagihan & order:", err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTagihanOrder();
  }, [fetchTagihanOrder]);

  // =========================================================================
  // ⚡ HANDLER VERIFIKASI DENGAN SWEETALERT2
  // =========================================================================
  const handleKonfirmasiStatus = async (statusTarget) => {
    if (!selectedInvoice) return;

    // Konfirmasi sebelum eksekusi
    const confirmResult = await Swal.fire({
      title: 'Konfirmasi Perubahan Status',
      text: `Apakah Anda yakin ingin mengubah status pemesanan ini menjadi "${statusTarget}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: statusTarget === 'Dikonfirmasi' ? '#261C19' : '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    setSubmitting(true);
    try {
      const response = await API.post(`/admin/pemesanan/${selectedInvoice.id}/status`, {
        status: statusTarget // 'Dikonfirmasi' atau 'Ditolak'
      });

      setIsModalOpen(false);
      setSelectedInvoice(null);
      fetchTagihanOrder();

      // Notifikasi Sukses
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: response.data.message || `Status pesanan berhasil diubah menjadi ${statusTarget}.`,
        confirmButtonColor: '#261C19',
        timer: 2000,
        timerProgressBar: true
      });

    } catch (err) {
      console.error("Gagal verifikasi booking:", err);
      
      // Notifikasi Error
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memproses!',
        text: err.response?.data?.message || "Terjadi kesalahan saat memproses verifikasi status.",
        confirmButtonColor: '#261C19'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 🌟 Filter Data: Berdasarkan Status DAN Pencarian Nama
  const filteredInvoices = invoices.filter(inv => {
    // 1. Cek Filter Status
    let matchStatus = false;
    const status = (inv.status || "").toUpperCase();
    
    if (filterStatus === "Semua") {
      matchStatus = true;
    } else if (filterStatus === "Pending") {
      matchStatus = status === "PENDING" || status === "DIVERIFIKASI" || status === "MENUNGGU VERIFIKASI";
    } else if (filterStatus === "Lunas") {
      matchStatus = status === "LUNAS" || status === "SELESAI" || status === "DIKONFIRMASI";
    } else if (filterStatus === "Jatuh Tempo") {
      matchStatus = status === "JATUH TEMPO" || status === "EXPIRED" || status === "DITOLAK";
    } else {
      matchStatus = status === filterStatus.toUpperCase();
    }

    // 2. Cek Filter Pencarian Nama
    const customerName = (inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "Penyewa").toLowerCase();
    const matchName = customerName.includes(searchName.toLowerCase());

    return matchStatus && matchName;
  });

  // Summary Cards Count
  const totalPending = invoices.filter(i => {
    const s = (i.status || "").toUpperCase();
    return s === "DIVERIFIKASI" || s === "PENDING" || s === "MENUNGGU VERIFIKASI";
  }).length;

  const totalLunas = invoices.filter(i => {
    const s = (i.status || "").toUpperCase();
    return s === "SELESAI" || s === "LUNAS" || s === "DIKONFIRMASI";
  }).length;

  const totalJatuhTempo = invoices.filter(i => {
    const s = (i.status || "").toUpperCase();
    return s === "JATUH TEMPO" || s === "EXPIRED" || s === "DITOLAK";
  }).length;

  // Format Rupiah
  const formatRupiah = (angka) => {
    if (!angka || isNaN(angka)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Badge Style dengan Animasi Dots
  const renderBadge = (statusStr) => {
    const s = (statusStr || "").toUpperCase();
    
    if (['SELESAI', 'LUNAS', 'DIKONFIRMASI', 'APPROVED', 'SUCCESS'].includes(s)) {
      return (
        <span className="bg-emerald-100/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-300 flex items-center justify-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {s}
        </span>
      );
    }
    if (['DIVERIFIKASI', 'PENDING', 'MENUNGGU VERIFIKASI', 'WAITING'].includes(s)) {
      return (
        <span className="bg-amber-100/80 text-amber-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-300 flex items-center justify-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          PENDING
        </span>
      );
    }
    if (['JATUH TEMPO', 'EXPIRED', 'DITOLAK', 'CANCEL'].includes(s)) {
      return (
        <span className="bg-rose-100/80 text-rose-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-rose-300 flex items-center justify-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {s}
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-slate-300 w-fit">
        {s}
      </span>
    );
  };

  // Helper untuk path foto bukti transfer
  const proofPath = selectedInvoice?.pembayaran?.payment_proof || selectedInvoice?.payment_proof;

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans">
        
        {/* AMBIENT GLOW DEKORATIF */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
                Kafana Vista Finance
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19] tracking-tight">Tagihan & Order</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                Kelola invoice penyewa, verifikasi bukti pembayaran, dan tinjau status booking hunian.
              </p>
            </div>
            
            <button 
              onClick={fetchTagihanOrder} 
              className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>Refresh Data</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm animate-in fade-in zoom-in">
              <span className="flex items-center gap-2"><span>⚠️</span> {error}</span>
              <button onClick={fetchTagihanOrder} className="underline hover:text-rose-900 cursor-pointer">Coba Lagi</button>
            </div>
          )}

          {/* ================= SUMMARY CARDS ================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Card Total */}
            <div 
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filterStatus === 'Semua' ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20' : 'border-[#E5D7C5]'}`} 
              onClick={() => setFilterStatus("Semua")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Semua Tagihan</span>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-[#261C19]">{invoices.length}</h3>
                <span className="text-2xl grayscale opacity-40">📑</span>
              </div>
            </div>

            {/* Card Pending */}
            <div 
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filterStatus === 'Pending' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-[#E5D7C5]'}`} 
              onClick={() => setFilterStatus("Pending")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Menunggu Verifikasi</span>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-amber-500">{totalPending}</h3>
                <span className="text-2xl">⏳</span>
              </div>
            </div>

            {/* Card Lunas */}
            <div 
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filterStatus === 'Lunas' ? 'border-emerald-400 ring-2 ring-emerald-400/20' : 'border-[#E5D7C5]'}`} 
              onClick={() => setFilterStatus("Lunas")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Dikonfirmasi / Lunas</span>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-emerald-500">{totalLunas}</h3>
                <span className="text-2xl">✅</span>
              </div>
            </div>

            {/* Card Jatuh Tempo */}
            <div 
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${filterStatus === 'Jatuh Tempo' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-[#E5D7C5]'}`} 
              onClick={() => setFilterStatus("Jatuh Tempo")}
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Ditolak / Expired</span>
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-rose-500">{totalJatuhTempo}</h3>
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>

          {/* ================= TABEL DATA ================= */}
          <div className="bg-white rounded-3xl border border-[#E5D7C5] shadow-xs overflow-hidden">
            
            {/* TABS FILTER & SEARCH SECTION */}
            <div className="px-6 py-5 border-b border-[#E5D7C5] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FAF6F0]/40">
              <h2 className="text-base font-extrabold text-[#261C19] flex items-center gap-2 whitespace-nowrap">
                <svg className="w-5 h-5 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                Daftar Invoice
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                {/* 🌟 INPUT SEARCH NAME */}
                <div className="relative w-full sm:w-56 md:w-64">
                  <input
                    type="text"
                    placeholder="Cari nama penyewa..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium border border-[#E5D7C5] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] bg-white transition-all shadow-sm placeholder-slate-400 text-[#261C19]"
                  />
                  <svg className="w-4 h-4 text-[#C5A059] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>

                {/* TABS BUTTONS */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto pb-1 sm:pb-0">
                  {['Semua', 'Pending', 'Lunas', 'Jatuh Tempo'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterStatus(tab)}
                      className={`px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        filterStatus === tab
                          ? 'bg-[#261C19] text-white border-[#261C19] shadow-md'
                          : 'bg-white text-slate-500 border-[#E5D7C5] hover:bg-slate-50 hover:text-[#261C19]'
                      }`}
                    >
                      {tab === 'Lunas' ? 'Lunas / Selesai' : tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#FAF6F0] text-slate-500 font-black uppercase tracking-widest border-b border-[#E5D7C5]">
                  <tr>
                    <th className="px-6 py-4">ID Invoice</th>
                    <th className="px-6 py-4">Pelanggan</th>
                    <th className="px-6 py-4">Properti</th>
                    <th className="px-6 py-4">Nominal</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv, index) => {
                      const invoiceId = inv.kode_pemesanan || inv.nomor_invoice || `INV-${inv.id}`;
                      const customerName = inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "Penyewa";
                      const roomName = inv.properti?.title || inv.properti?.nama_properti || "Properti Kosong";
                      const amount = inv.total_harga || inv.total_bayar || inv.properti?.price_per_month || 0;
                      const status = inv.status || "PENDING";

                      return (
                        <tr 
                          key={inv.id || index} 
                          className="hover:bg-[#FAF6F0]/50 transition-colors duration-200 animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
                        >
                          <td className="px-6 py-4 font-black text-[#C5A059] tracking-wider">{invoiceId}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-[#261C19] block">{customerName}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{inv.created_at?.split('T')[0] || "-"}</span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-600 truncate max-wxs">{roomName}</td>
                          <td className="px-6 py-4 font-black text-[#261C19]">{formatRupiah(amount)}</td>
                          <td className="px-6 py-4">
                            {renderBadge(status)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsModalOpen(true);
                              }}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#261C19] bg-white border border-[#E5D7C5] hover:bg-[#261C19] hover:text-white hover:border-[#261C19] rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 mx-auto"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center bg-slate-50/50">
                        <span className="text-4xl block mb-3 opacity-50">📭</span>
                        <p className="text-sm font-bold text-slate-600">Tidak Ada Tagihan Ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Coba ubah filter atau pencarian.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-[#E5D7C5] flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">
              <div>Total Data: {filteredInvoices.length} Entri</div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔍 LIGHTBOX MODAL (PREVIEW FOTO ZOOM) */}
      {/* ========================================================================= */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border border-white/10">
            <img src={previewImage} alt="Bukti Transfer Diperbesar" className="w-full h-full object-contain max-h-[85vh]" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-rose-600 text-white rounded-full flex items-center justify-center font-bold transition"
            >
              ✕
            </button>
          </div>
          <p className="absolute bottom-10 text-white/50 text-[10px] font-black tracking-widest uppercase">Klik dimana saja untuk menutup</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL POPUP VERIFIKASI & DETAIL BOOKING */}
      {/* ========================================================================= */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] border border-[#E5D7C5] animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#FAF6F0]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">Verifikasi & Detail</span>
                <h3 className="font-extrabold text-lg text-[#261C19]">Invoice {selectedInvoice.kode_pemesanan || `INV-${selectedInvoice.id}`}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF6F0]/50 p-5 rounded-2xl border border-[#E5D7C5]">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Pemesan</p>
                  <p className="font-bold text-[#261C19] text-sm">{selectedInvoice.customer?.nama || selectedInvoice.customer?.name || selectedInvoice.user?.name || "Penyewa"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Status Saat Ini</p>
                  <div className="mt-1">{renderBadge(selectedInvoice.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Properti</p>
                  <p className="font-bold text-[#261C19] text-sm">{selectedInvoice.properti?.title || selectedInvoice.properti?.nama_properti || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Tagihan</p>
                  <p className="font-black text-[#C5A059] text-base">{formatRupiah(selectedInvoice.total_harga || selectedInvoice.total_bayar || selectedInvoice.properti?.price_per_month)}</p>
                </div>
              </div>

              {/* Foto Bukti Transfer */}
              <div className="space-y-2">
                <p className="text-[11px] text-[#261C19] font-black uppercase tracking-widest flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#C5A059]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Bukti Pembayaran / Transfer
                </p>
                
                {proofPath ? (
                  <div 
                    onClick={() => setPreviewImage(`http://localhost:8000/storage/${proofPath}`)}
                    className="relative border border-[#E5D7C5] rounded-2xl overflow-hidden bg-slate-100 h-48 flex justify-center items-center group cursor-zoom-in shadow-inner"
                  >
                    <img 
                      src={`http://localhost:8000/storage/${proofPath}`} 
                      alt="Bukti Transfer" 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-[#261C19]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-[#261C19] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                        🔍 Perbesar Foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center space-y-2">
                    <span className="text-3xl grayscale opacity-50 block">📄</span>
                    <p className="text-xs font-bold text-slate-500">Belum ada bukti pembayaran yang diunggah.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal / Tombol Aksi */}
            <div className="p-6 border-t border-slate-100 bg-white flex flex-wrap sm:flex-nowrap gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={() => handleKonfirmasiStatus('Ditolak')}
                disabled={submitting}
                className="w-full sm:w-1/2 px-5 py-3 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200 hover:border-rose-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2"
              > 
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                {submitting ? 'Memproses...' : 'Tolak'}
              </button>

              <button
                onClick={() => handleKonfirmasiStatus('Dikonfirmasi')}
                disabled={submitting}
                className="w-full sm:w-1/2 px-5 py-3 bg-[#261C19] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span>{submitting ? 'Memproses...' : 'Terima & Verifikasi'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </SidebarAdmin>
  );
}