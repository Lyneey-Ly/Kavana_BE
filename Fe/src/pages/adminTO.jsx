import { useState, useEffect, useCallback, useMemo } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';
import API from '../api';
import Swal from 'sweetalert2';
import {
  Receipt,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Download,
  DollarSign,
  RefreshCw,
  X,
  ShieldCheck,
  Building2,
  XCircle,
  Check,
  Send
} from 'lucide-react';

export default function AdminTagihanOrder() {
  // 1. STATE DATA UTAMA & LOADING
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. STATE UNTUK FILTER & PENCARIAN
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  // 3. STATE MODAL VERIFIKASI / DETAIL & LIGHTBOX
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // 4. STATE MODAL PENOLAKAN DENGAN ALASAN WAJIB
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetRejectInvoice, setTargetRejectInvoice] = useState(null);
  const [selectedReasonChip, setSelectedReasonChip] = useState("");
  const [customReasonText, setCustomReasonText] = useState("");

  const quickReasons = [
    "Kamar sudah terisi (Booked Offline/Direct)",
    "Bukti pembayaran/transfer tidak valid",
    "Data identitas pemesan kurang lengkap",
    "Lainnya (Tuliskan alasan spesifik)"
  ];

  // Helper: Format Rupiah
  const formatRupiah = (angka) => {
    if (!angka || isNaN(angka)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  // Helper: Status Final
  const isStatusFinal = (statusStr) => {
    const s = (statusStr || "").toUpperCase();
    return ['DIKONFIRMASI', 'DITOLAK', 'LUNAS', 'SELESAI', 'EXPIRED', 'CANCEL', 'APPROVED', 'BATAL'].includes(s);
  };

  // =========================================================================
  // 🔌 FETCH DATA DARI BACKEND LARAVEL
  // =========================================================================
  const fetchTagihanOrder = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/tagihan-order');
      const dataBackend = response.data.data || response.data || [];
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
  // 🔴 HANDLER PENOLAKAN BOOKING (MODAL ALASAN WAJIB)
  // =========================================================================
  const openRejectModal = (inv) => {
    if (isStatusFinal(inv.status)) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Dapat Diubah!',
        text: `Status pesanan ini sudah "${inv.status}" dan tidak dapat diubah lagi.`,
        confirmButtonColor: '#261C19'
      });
      return;
    }
    setTargetRejectInvoice(inv);
    setSelectedReasonChip(quickReasons[0]);
    setCustomReasonText(quickReasons[0]);
    setIsRejectModalOpen(true);
  };

  const handleSelectReasonChip = (reason) => {
    setSelectedReasonChip(reason);
    if (reason !== "Lainnya (Tuliskan alasan spesifik)") {
      setCustomReasonText(reason);
    } else {
      setCustomReasonText("");
    }
  };

  const handleConfirmReject = async () => {
    if (!targetRejectInvoice) return;

    if (!customReasonText.trim() || customReasonText.trim().length < 10) {
      Swal.fire({
        icon: 'error',
        title: 'Alasan Tidak Valid',
        text: 'Wajib memberikan alasan penolakan minimal 10 karakter.',
        confirmButtonColor: '#261C19'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.post(`/admin/pemesanan/${targetRejectInvoice.id}/tolak`, {
        alasan_penolakan: customReasonText.trim()
      });

      setIsRejectModalOpen(false);
      setIsModalOpen(false);
      setTargetRejectInvoice(null);
      setSelectedInvoice(null);
      setCustomReasonText("");
      fetchTagihanOrder();

      Swal.fire({
        icon: 'success',
        title: 'Booking Ditolak',
        text: response.data.message || 'Pemesanan berhasil ditolak.',
        confirmButtonColor: '#261C19',
        timer: 2000,
        timerProgressBar: true
      });
    } catch (err) {
      console.error("Gagal menolak booking:", err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menolak',
        text: err.response?.data?.message || 'Terjadi kesalahan sistem saat menolak booking.',
        confirmButtonColor: '#261C19'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================================
  // ⚡ HANDLER VERIFIKASI (TERIMA) DENGAN SWEETALERT2
  // =========================================================================
  const handleKonfirmasiStatus = async (statusTarget) => {
    if (!selectedInvoice) return;

    if (statusTarget === 'Ditolak') {
      openRejectModal(selectedInvoice);
      return;
    }

    if (isStatusFinal(selectedInvoice.status)) {
      Swal.fire({
        icon: 'warning',
        title: 'Tidak Dapat Diubah!',
        text: `Status pesanan ini sudah "${selectedInvoice.status}" dan tidak dapat diubah lagi.`,
        confirmButtonColor: '#261C19'
      });
      return;
    }

    const confirmResult = await Swal.fire({
      title: 'Konfirmasi Perubahan Status',
      text: `Apakah Anda yakin ingin memverifikasi pemesanan ini menjadi "${statusTarget}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#261C19',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) return;

    setSubmitting(true);
    try {
      const response = await API.post(`/admin/pemesanan/${selectedInvoice.id}/status`, {
        status: statusTarget
      });

      setIsModalOpen(false);
      setSelectedInvoice(null);
      fetchTagihanOrder();

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

  // =========================================================================
  // ⏱️ KALKULASI SISA HARI / JATUH TEMPO
  // =========================================================================
  const calculateDueStatus = (checkInDateStr, durationMonths = 1) => {
    if (!checkInDateStr) return { text: "Tanggal T/A", color: "bg-gray-100 text-gray-600 border-gray-200" };

    const startDate = new Date(checkInDateStr);
    if (isNaN(startDate.getTime())) return { text: "Format Salah", color: "bg-gray-100 text-gray-600 border-gray-200" };

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + parseInt(durationMonths || 1));

    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        text: `Terlewat ${Math.abs(diffDays)} Hari`,
        color: "bg-rose-100 text-rose-800 border-rose-300 font-bold"
      };
    } else if (diffDays === 0) {
      return {
        text: "Jatuh Tempo Hari Ini",
        color: "bg-amber-100 text-amber-800 border-amber-300 font-extrabold animate-pulse"
      };
    } else if (diffDays <= 7) {
      return {
        text: `Sisa ${diffDays} Hari Lagi`,
        color: "bg-amber-50 text-amber-700 border-amber-200 font-bold"
      };
    } else {
      return {
        text: `Sisa ${diffDays} Hari`,
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
      };
    }
  };

  // =========================================================================
  // 💬 GENERATOR PESAN WHATSAPP OTOMATIS
  // =========================================================================
  const sendWhatsAppReminder = (inv) => {
    const rawPhone = inv.customer?.phone || inv.customer?.no_hp || inv.user?.phone || inv.phone || "";
    if (!rawPhone) {
      Swal.fire({
        icon: 'warning',
        title: 'Nomor WA Tidak Ada',
        text: 'Pelanggan ini tidak mencantumkan nomor WhatsApp yang valid.',
        confirmButtonColor: '#261C19'
      });
      return;
    }

    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const customerName = inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "Pelanggan";
    const roomName = inv.properti?.title || inv.properti?.nama_properti || "Kafana Vista";
    const amount = formatRupiah(inv.total_harga || inv.total_bayar || inv.properti?.price_per_month);
    const invoiceCode = inv.kode_pemesanan || inv.nomor_invoice || `INV-${inv.id}`;

    const message = `Halo Kak *${customerName}*,\n\nSalam dari *Kafana Vista Residence* 🏢.\nKami ingin menginformasikan terkait tagihan sewa unit *${roomName}* dengan rincian berikut:\n\n` +
      `• *ID Invoice:* ${invoiceCode}\n` +
      `• *Total Tagihan:* ${amount}\n` +
      `• *Status saat ini:* ${(inv.status || 'BELUM BAYAR').toUpperCase()}\n\n` +
      `Mohon dapat segera melakukan konfirmasi atau pelunasan pembayaran melalui aplikasi/portal Kafana Vista.\n\n` +
      `Jika ada pertanyaan, silakan hubungi tim manajemen kami. Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // =========================================================================
  // 🖨️ KUITANSI / INVOICE PRINT HANDLER
  // =========================================================================
  const handlePrintInvoice = (inv) => {
    const invoiceCode = inv.kode_pemesanan || inv.nomor_invoice || `INV-${inv.id}`;
    const customerName = inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "Penyewa";
    const roomName = inv.properti?.title || inv.properti?.nama_properti || "Properti";
    const amount = formatRupiah(inv.total_harga || inv.total_bayar || inv.properti?.price_per_month);
    const dateStr = inv.created_at ? new Date(inv.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Kwitansi ${invoiceCode} - Kafana Vista</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #261C19; padding: 40px; margin: 0; }
            .invoice-box { max-width: 700px; margin: auto; border: 2px solid #C5A059; padding: 30px; border-radius: 16px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #FAF6F0; padding-bottom: 20px; }
            .brand { font-size: 24px; font-weight: bold; color: #261C19; letter-spacing: 2px; }
            .brand span { color: #C5A059; }
            .title { font-size: 14px; text-transform: uppercase; color: #777; letter-spacing: 1px; }
            .details { margin: 30px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { font-weight: bold; color: #555; }
            .value { font-weight: bold; color: #261C19; }
            .total-box { background: #FAF6F0; padding: 20px; border-radius: 12px; border: 1px solid #E5D7C5; margin-top: 20px; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="brand">KAFANA <span>VISTA</span></div>
              <div class="title">Official Kwitansi</div>
            </div>
            <div class="details">
              <div class="row"><span class="label">No. Invoice:</span><span class="value">${invoiceCode}</span></div>
              <div class="row"><span class="label">Tanggal:</span><span class="value">${dateStr}</span></div>
              <div class="row"><span class="label">Nama Penyewa:</span><span class="value">${customerName}</span></div>
              <div class="row"><span class="label">Properti/Unit:</span><span class="value">${roomName}</span></div>
              <div class="row"><span class="label">Status Pembayaran:</span><span class="value">${(inv.status || 'PENDING').toUpperCase()}</span></div>
            </div>
            <div class="total-box">
              <div class="row" style="margin: 0; font-size: 18px;">
                <span class="label" style="color: #261C19;">Total Diterima:</span>
                <span class="value" style="color: #C5A059; font-size: 20px;">${amount}</span>
              </div>
            </div>
            <div class="footer">
              Terima Kasih Atas Kepercayaan Anda Berhunian di Kafana Vista<br>
              © 2026 KAFANA VISTA • All Rights Reserved
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // =========================================================================
  // 📊 MAPPING METRIK & FILTER DATA
  // =========================================================================
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      let matchStatus = false;
      const status = (inv.status || "").toUpperCase();

      if (filterStatus === "Semua") {
        matchStatus = true;
      } else if (filterStatus === "Pending") {
        matchStatus = ["PENDING", "DIVERIFIKASI", "MENUNGGU VERIFIKASI", "WAITING", "TERTUNDA"].includes(status);
      } else if (filterStatus === "Lunas") {
        matchStatus = ["LUNAS", "SELESAI", "DIKONFIRMASI", "APPROVED", "SUCCESS"].includes(status);
      } else if (filterStatus === "Jatuh Tempo") {
        matchStatus = ["JATUH TEMPO", "EXPIRED", "DITOLAK", "CANCEL", "BATAL"].includes(status);
      } else {
        matchStatus = status === filterStatus.toUpperCase();
      }

      const customerName = (inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "").toLowerCase();
      const roomName = (inv.properti?.title || inv.properti?.nama_properti || "").toLowerCase();
      const code = (inv.kode_pemesanan || inv.nomor_invoice || `inv-${inv.id}`).toLowerCase();

      const q = searchQuery.toLowerCase();
      const matchQuery = customerName.includes(q) || roomName.includes(q) || code.includes(q);

      return matchStatus && matchQuery;
    });
  }, [invoices, filterStatus, searchQuery]);

  // Perhitungan KPI
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(i => ["LUNAS", "SELESAI", "DIKONFIRMASI", "APPROVED", "SUCCESS"].includes((i.status || "").toUpperCase()))
      .reduce((acc, curr) => acc + Number(curr.total_harga || curr.total_bayar || curr.properti?.price_per_month || 0), 0);
  }, [invoices]);

  const totalPendingCount = useMemo(() => {
    return invoices.filter(i => ["DIVERIFIKASI", "PENDING", "MENUNGGU VERIFIKASI", "WAITING", "TERTUNDA"].includes((i.status || "").toUpperCase())).length;
  }, [invoices]);

  const totalLunasCount = useMemo(() => {
    return invoices.filter(i => ["SELESAI", "LUNAS", "DIKONFIRMASI", "APPROVED", "SUCCESS"].includes((i.status || "").toUpperCase())).length;
  }, [invoices]);

  const totalDueCount = useMemo(() => {
    return invoices.filter(i => ["JATUH TEMPO", "EXPIRED", "DITOLAK", "CANCEL", "BATAL"].includes((i.status || "").toUpperCase())).length;
  }, [invoices]);

  const renderBadge = (statusStr) => {
    const s = (statusStr || "").toUpperCase();

    if (['SELESAI', 'LUNAS', 'DIKONFIRMASI', 'APPROVED', 'SUCCESS'].includes(s)) {
      return (
        <span className="bg-emerald-100/90 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Lunas
        </span>
      );
    }
    if (['DIVERIFIKASI', 'PENDING', 'MENUNGGU VERIFIKASI', 'WAITING', 'TERTUNDA'].includes(s)) {
      return (
        <span className="bg-amber-100/90 text-amber-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300 inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Menunggu Verifikasi
        </span>
      );
    }
    if (['JATUH TEMPO', 'EXPIRED', 'DITOLAK', 'CANCEL', 'BATAL'].includes(s)) {
      return (
        <span className="bg-rose-100/90 text-rose-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-300 inline-flex items-center gap-1.5 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          {s}
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-slate-300">
        {s}
      </span>
    );
  };

  const proofPath = selectedInvoice?.pembayaran?.payment_proof || selectedInvoice?.payment_proof;

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans selection:bg-[#C5A059] selection:text-white">
        
        {/* Background Decorative Ambient Blur */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
                Kafana Vista Finance Management
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19] tracking-tight flex items-center gap-3">
                <Receipt className="w-7 h-7 text-[#C5A059]" /> Tagihan & Order Sewa
              </h1>
              <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                Pantau seluruh siklus pembayaran sewa, verifikasi transaksi masuk, dan sisa durasi sewa penghuni secara presisi.
              </p>
            </div>
            
            <button 
              onClick={fetchTagihanOrder} 
              className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex justify-between items-center shadow-sm">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</span>
              <button onClick={fetchTagihanOrder} className="underline hover:text-rose-900 cursor-pointer">Coba Lagi</button>
            </div>
          )}

          {/* ================= SECTION 1: SUMMARY CARDS / KPI ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Pendapatan */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5D7C5] shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pendapatan</span>
                <div className="p-2.5 bg-[#FAF6F0] rounded-2xl text-[#C5A059] border border-[#E5D7C5]/60">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#261C19]">{formatRupiah(totalRevenue)}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Total pembayaran dikonfirmasi</p>
              </div>
            </div>

            {/* KPI 2: Tagihan Lunas */}
            <div 
              onClick={() => setFilterStatus("Lunas")}
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'Lunas' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-[#E5D7C5]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tagihan Lunas</span>
                <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-emerald-600">{totalLunasCount}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Transaksi sukses & diverifikasi</p>
              </div>
            </div>

            {/* KPI 3: Menunggu Verifikasi */}
            <div 
              onClick={() => setFilterStatus("Pending")}
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'Pending' ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-[#E5D7C5]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Perlu Konfirmasi</span>
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-500 border border-amber-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-amber-500">{totalPendingCount}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Bukti transfer masuk</p>
              </div>
            </div>

            {/* KPI 4: Menunggak / Expired */}
            <div 
              onClick={() => setFilterStatus("Jatuh Tempo")}
              className={`bg-white p-5 rounded-3xl border shadow-xs flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:shadow-md ${filterStatus === 'Jatuh Tempo' ? 'border-rose-400 ring-2 ring-rose-400/20' : 'border-[#E5D7C5]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Menunggak / Ditolak</span>
                <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-500 border border-rose-100">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-rose-500">{totalDueCount}</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Tagihan bermasalah / lewati batas</p>
              </div>
            </div>

          </div>

          {/* ================= SECTION 2 & 3: BAR PENCARIAN & TABEL DINAMIS ================= */}
          <div className="bg-white rounded-3xl border border-[#E5D7C5] shadow-xs overflow-hidden">
            
            {/* BAR PENCARIAN & FILTER */}
            <div className="px-6 py-5 border-b border-[#E5D7C5] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FAF6F0]/40">
              <h2 className="text-base font-extrabold text-[#261C19] flex items-center gap-2 whitespace-nowrap">
                <Filter className="w-4 h-4 text-[#C5A059]" />
                Daftar Tagihan & Periode Sewa
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari nama, kamar, ID invoice..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium border border-[#E5D7C5] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] bg-white transition-all shadow-xs placeholder-slate-400 text-[#261C19]"
                  />
                  <Search className="w-4 h-4 text-[#C5A059] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="flex gap-1.5 overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto pb-1 sm:pb-0">
                  {['Semua', 'Pending', 'Lunas', 'Jatuh Tempo'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilterStatus(tab)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border ${
                        filterStatus === tab
                          ? 'bg-[#261C19] text-white border-[#261C19] shadow-sm'
                          : 'bg-white text-slate-500 border-[#E5D7C5] hover:bg-slate-50 hover:text-[#261C19]'
                      }`}
                    >
                      {tab === 'Lunas' ? 'Lunas' : tab === 'Pending' ? 'Verifikasi' : tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABEL DATA UTAMA */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#FAF6F0] text-slate-500 font-black uppercase tracking-widest border-b border-[#E5D7C5]">
                  <tr>
                    <th className="px-6 py-4">ID Invoice</th>
                    <th className="px-6 py-4">Penghuni & Kontak</th>
                    <th className="px-6 py-4">Properti / Unit</th>
                    <th className="px-6 py-4">Periode & Sisa Waktu</th>
                    <th className="px-6 py-4">Total Tagihan</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-3 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Tagihan...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv, index) => {
                      const invoiceId = inv.kode_pemesanan || inv.nomor_invoice || `INV-${inv.id}`;
                      const customerName = inv.customer?.nama || inv.customer?.name || inv.user?.name || inv.nama_pemesan || "Penyewa";
                      const customerPhone = inv.customer?.phone || inv.customer?.no_hp || inv.user?.phone || inv.phone || "";
                      const roomName = inv.properti?.title || inv.properti?.nama_properti || "Properti Kosong";
                      const roomNumber = inv.nomor_kamar || inv.kamar?.nomor_kamar || "Unit 01";
                      const amount = inv.total_harga || inv.total_bayar || inv.properti?.price_per_month || 0;
                      const status = inv.status || "PENDING";
                      const checkIn = inv.check_in_date || inv.tanggal_masuk || inv.created_at;
                      const duration = inv.duration_months || inv.durasi_sewa || 1;
                      
                      const dueStatus = calculateDueStatus(checkIn, duration);

                      return (
                        <tr key={inv.id || index} className="hover:bg-[#FAF6F0]/50 transition-colors duration-150">
                          
                          {/* ID Invoice */}
                          <td className="px-6 py-4 font-black text-[#C5A059] tracking-wider">{invoiceId}</td>

                          {/* Info Penghuni */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#E5D7C5] flex items-center justify-center text-[#261C19] font-bold text-xs shrink-0">
                                {customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-[#261C19] block">{customerName}</span>
                                {customerPhone ? (
                                  <button 
                                    onClick={() => sendWhatsAppReminder(inv)}
                                    className="text-[10px] text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" /> {customerPhone}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">Tanpa Kontak</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Properti & Kamar */}
                          <td className="px-6 py-4">
                            <span className="font-bold text-[#261C19] block truncate max-w-xs">{roomName}</span>
                            <span className="text-[10px] text-slate-500 font-medium block mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#C5A059]" /> {roomNumber}
                            </span>
                          </td>

                          {/* Periode Sewa & Indikator Jatuh Tempo */}
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold text-slate-700 block flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {checkIn ? new Date(checkIn).toLocaleDateString('id-ID') : '-'} ({duration} Bulan)
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full border inline-block ${dueStatus.color}`}>
                                {dueStatus.text}
                              </span>
                            </div>
                          </td>

                          {/* Total Tagihan */}
                          <td className="px-6 py-4 font-black text-[#261C19] text-sm">
                            {formatRupiah(amount)}
                          </td>

                          {/* Badge Status */}
                          <td className="px-6 py-4">
                            {renderBadge(status)}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Detail / Bukti */}
                              <button
                                title="Lihat Detail & Bukti"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-[#261C19] bg-white border border-[#E5D7C5] hover:bg-[#261C19] hover:text-white rounded-xl transition cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Tolak Cepat */}
                              {!isStatusFinal(inv.status) && (
                                <button
                                  title="Tolak Booking ini"
                                  onClick={() => openRejectModal(inv)}
                                  className="p-2 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-xl transition cursor-pointer shadow-xs"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Kirim WA Pengingat */}
                              <button
                                title="Kirim Pengingat WhatsApp"
                                onClick={() => sendWhatsAppReminder(inv)}
                                className="p-2 text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-xl transition cursor-pointer shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {/* Cetak Kwitansi */}
                              <button
                                title="Cetak / Export Kwitansi"
                                onClick={() => handlePrintInvoice(inv)}
                                className="p-2 text-[#C5A059] bg-[#FAF6F0] border border-[#E5D7C5] hover:bg-[#C5A059] hover:text-white rounded-xl transition cursor-pointer shadow-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center bg-slate-50/50">
                        <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-600">Tidak Ada Data Tagihan</p>
                        <p className="text-xs text-slate-400 mt-1">Silakan sesuaikan pencarian atau status filter Anda.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-[#E5D7C5] flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white">
              <div>Total Data: {filteredInvoices.length} Entri Tagihan</div>
            </div>
          </div>

        </div>
      </div>

      {/* ================= LIGHTBOX MODAL (PREVIEW FOTO ZOOM) ================= */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img src={previewImage} alt="Bukti Transfer Large" className="w-full h-full object-contain max-h-[85vh]" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-black/60 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: MODAL DETAIL INVOICE & VERIFIKASI ================= */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-[#E5D7C5]">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-[#E5D7C5] flex justify-between items-center bg-[#FAF6F0]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-0.5">
                  Invoice & Verifikasi Pembayaran
                </span>
                <h3 className="font-extrabold text-lg text-[#261C19]">
                  {selectedInvoice.kode_pemesanan || `INV-${selectedInvoice.id}`}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-rose-500 hover:text-white transition cursor-pointer text-slate-500 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Rincian Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[#FAF6F0]/50 p-5 rounded-2xl border border-[#E5D7C5]">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Penghuni</p>
                  <p className="font-bold text-[#261C19] text-sm">
                    {selectedInvoice.customer?.nama || selectedInvoice.customer?.name || selectedInvoice.user?.name || "Penyewa"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Status Transaksi</p>
                  <div>{renderBadge(selectedInvoice.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Properti & Kamar</p>
                  <p className="font-bold text-[#261C19] text-xs">
                    {selectedInvoice.properti?.title || selectedInvoice.properti?.nama_properti || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Nominal</p>
                  <p className="font-black text-[#C5A059] text-base">
                    {formatRupiah(selectedInvoice.total_harga || selectedInvoice.total_bayar || selectedInvoice.properti?.price_per_month)}
                  </p>
                </div>
              </div>

              {/* Bukti Transfer */}
              <div className="space-y-2">
                <p className="text-[11px] text-[#261C19] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  Lampiran Bukti Transfer / Pembayaran
                </p>
                
                {proofPath ? (
                  <div 
                    onClick={() => setPreviewImage(`http://localhost:8000/storage/${proofPath}`)}
                    className="relative border border-[#E5D7C5] rounded-2xl overflow-hidden bg-slate-100 h-52 flex justify-center items-center group cursor-zoom-in shadow-inner"
                  >
                    <img 
                      src={`http://localhost:8000/storage/${proofPath}`} 
                      alt="Bukti Transfer" 
                      className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-[#261C19]/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="bg-white text-[#261C19] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                        <Eye className="w-4 h-4" /> Perbesar Foto
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Belum ada lampiran bukti transfer yang diunggah.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal / Keputusan Admin */}
            <div className="p-6 border-t border-[#E5D7C5] bg-white">
              {isStatusFinal(selectedInvoice.status) ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                  <div className="w-full sm:flex-1 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Status pesanan ini sudah <strong>{selectedInvoice.status}</strong> (Final).</span>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto px-5 py-3 text-slate-600 bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full">
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
                    className="w-full sm:w-1/2 px-5 py-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 cursor-pointer flex justify-center items-center gap-2"
                  > 
                    <XCircle className="w-4 h-4" />
                    {submitting ? 'Memproses...' : 'Tolak Pembayaran'}
                  </button>

                  <button
                    onClick={() => handleKonfirmasiStatus('Dikonfirmasi')}
                    disabled={submitting}
                    className="w-full sm:w-1/2 px-5 py-3 bg-[#261C19] hover:bg-[#C5A059] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{submitting ? 'Memproses...' : 'Terima & Verifikasi'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛑 MODAL POPUP PENOLAKAN BOOKING DENGAN ALASAN WAJIB */}
      {/* ========================================================================= */}
      {isRejectModalOpen && targetRejectInvoice && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-6 bg-rose-50/80 border-b border-rose-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-md">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block">
                    Konfirmasi Penolakan
                  </span>
                  <h3 className="font-extrabold text-base text-[#261C19]">
                    Tolak Booking Unit {targetRejectInvoice.properti?.title || targetRejectInvoice.properti?.nama_properti || "Kafana Vista"}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5">
              
              {/* Ringkasan Pemesan */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#E5D7C5] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Nama Pemesan:</span>
                  <span className="font-bold text-[#261C19]">{targetRejectInvoice.customer?.nama || targetRejectInvoice.customer?.name || targetRejectInvoice.user?.name || targetRejectInvoice.nama_pemesan || "Penyewa"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">ID Transaksi:</span>
                  <span className="font-mono font-bold text-[#C5A059]">{targetRejectInvoice.kode_pemesanan || targetRejectInvoice.nomor_invoice || `INV-${targetRejectInvoice.id}`}</span>
                </div>
              </div>

              {/* Radio Chips Alasan Cepat */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#261C19] block">
                  Pilih Alasan Utama Penolakan:
                </label>
                <div className="space-y-2">
                  {quickReasons.map((reason, idx) => (
                    <label 
                      key={idx}
                      onClick={() => handleSelectReasonChip(reason)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        selectedReasonChip === reason 
                          ? 'bg-rose-50/60 border-rose-400 text-rose-900 ring-1 ring-rose-300' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="quick_reason" 
                        checked={selectedReasonChip === reason}
                        onChange={() => {}}
                        className="accent-rose-600"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Textarea Input Alasan Spesifik */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-[#261C19]">
                    Detail / Tulis Alasan Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold ${customReasonText.length < 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {customReasonText.length} / Min 10 Karakter
                  </span>
                </div>
                <textarea
                  rows="3"
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara spesifik agar dapat dipahami oleh calon penghuni..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white placeholder-slate-400 text-[#261C19]"
                />
              </div>

            </div>

            {/* Footer Modal Action */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={submitting}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submitting || customReasonText.length < 10}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{submitting ? 'Memproses...' : 'Konfirmasi Penolakan'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </SidebarAdmin>
  );
}