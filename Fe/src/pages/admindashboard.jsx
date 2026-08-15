import React, { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../api'; // Sesuaikan dengan instance Axios kamu
import SidebarAdmin from '../components/SidebarAdmin';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // ✅ Fixed Import

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // State Data Backend
  const [stats, setStats] = useState({
    total_pendapatan: 0,
    total_properti: 0,
    properti_terisi: 0,
    properti_kosong: 0,
    total_customer: 0,
    komplain_pending: 0,
    dokumen_perlu_ttd: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('ALL');

  // Fetch Data dari DashboardAdminController@index
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/dashboard');
      const dataBackend = res.data?.data || res.data || {};

      setStats(dataBackend.cards || {
        total_pendapatan: 0,
        total_properti: 0,
        properti_terisi: 0,
        properti_kosong: 0,
        total_customer: 0,
        komplain_pending: 0,
        dokumen_perlu_ttd: 0,
      });
      setRecentTransactions(dataBackend.transaksi_terbaru || []);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Format Rupiah
  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  // 🔍 LOGIKA FILTER TRANSAKSI
  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((tx) => {
      // 1. Filter Pencarian
      const searchLower = searchTerm.toLowerCase();
      const customerName = (tx.customer?.name || '').toLowerCase();
      const propTitle = (tx.properti?.title || tx.properti?.nama || '').toLowerCase();
      const invId = `inv-${tx.id}`.toLowerCase();

      const matchesSearch =
        customerName.includes(searchLower) ||
        propTitle.includes(searchLower) ||
        invId.includes(searchLower);

      // 2. Filter Status
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        const txStatus = (tx.status || '').toLowerCase();
        if (statusFilter === 'LUNAS') {
          matchesStatus = txStatus === 'dikonfirmasi' || txStatus === 'lunas' || txStatus === 'selesai';
        } else if (statusFilter === 'PENDING') {
          matchesStatus = txStatus === 'tertunda' || txStatus === 'pending' || txStatus === 'menunggu';
        } else if (statusFilter === 'BATAL') {
          matchesStatus = txStatus === 'dibatalkan' || txStatus === 'ditolak' || txStatus === 'expired';
        }
      }

      // 3. Filter Periode / Tanggal
      let matchesPeriod = true;
      if (periodFilter !== 'ALL' && tx.created_at) {
        const txDate = new Date(tx.created_at);
        const now = new Date();

        if (periodFilter === 'WEEK') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          matchesPeriod = txDate >= oneWeekAgo;
        } else if (periodFilter === 'MONTH') {
          matchesPeriod =
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear();
        } else if (periodFilter === 'YEAR') {
          matchesPeriod = txDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [recentTransactions, searchTerm, statusFilter, periodFilter]);

  // 📄 FUNGSI EKSPOR PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');

    // Header / Judul Laporan
    doc.setFontSize(18);
    doc.setTextColor(45, 35, 33);
    doc.text('LAPORAN TRANSAKSI PEMBAYARAN', 40, 50);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 40, 68);
    doc.text(`Filter Status: ${statusFilter} | Filter Periode: ${periodFilter}`, 40, 82);

    // Garis Pembatas
    doc.setLineWidth(1);
    doc.setDrawColor(215, 196, 176);
    doc.line(40, 95, 555, 95);

    // Ringkasan Pendapatan Laporan
    const totalFilteredIncome = filteredTransactions.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    doc.setFontSize(11);
    doc.setTextColor(45, 35, 33);
    doc.text(`Total Transaksi Ditampilkan: ${filteredTransactions.length} Data`, 40, 115);
    doc.text(`Total Nilai Transaksi: ${formatRupiah(totalFilteredIncome)}`, 40, 130);

    // Format Data untuk Tabel PDF
    const tableRows = filteredTransactions.map((tx) => [
      `#INV-${tx.id}`,
      tx.customer?.name || 'Tanpa Nama',
      tx.properti?.title || tx.properti?.nama || 'N/A',
      formatRupiah(tx.total_price),
      (tx.status || 'Tertunda').toUpperCase(),
      tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID') : '-',
    ]);

    // ✅ Render Tabel jsPDF AutoTable (Fungsi Mandiri)
    autoTable(doc, {
      startY: 145,
      head: [['ID Order', 'Penyewa', 'Properti / Unit', 'Total Harga', 'Status', 'Tanggal']],
      body: tableRows,
      headStyles: {
        fillColor: [179, 142, 93],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [250, 245, 239],
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      margin: { left: 40, right: 40 },
    });

    // Save File PDF
    doc.save(`Laporan_Transaksi_Admin_${Date.now()}.pdf`);
  };

  // Reset Filter
  const handleResetFilter = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setPeriodFilter('ALL');
  };

  return (
    <SidebarAdmin>
      <div className="p-6 md:p-8 bg-[#FAF5EF] min-h-screen text-[#2D2321] font-sans space-y-8">
        
        {/* HEADER & FILTER PERIODE CEPAT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#D7C4B0]/50 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">Panel Kontrol Admin</span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D2321] tracking-tight mt-0.5">
              Dashboard Operasional
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Ringkasan aktivitas properti, status penyewa, dan transaksi pembayaran
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Periode:</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-white border border-[#D7C4B0] text-[#2D2321] text-xs font-bold rounded-xl px-4 py-2.5 outline-none shadow-sm cursor-pointer hover:border-[#B38E5D] transition-all"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="WEEK">Minggu Ini</option>
              <option value="MONTH">Bulan Ini</option>
              <option value="YEAR">Tahun Ini</option>
            </select>
          </div>
        </div>

        {/* 5 SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          
          {/* Card 1: Total Unit */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FAF5EF] border border-[#D7C4B0]/60 flex items-center justify-center text-[#B38E5D] shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Unit</p>
                <h3 className="text-xl font-black text-[#2D2321] truncate">
                  {loading ? '...' : `${stats.total_properti || 0} Unit`}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/60 truncate max-w-full">
                Terisi: {stats.properti_terisi || 0} | Kosong: {stats.properti_kosong || 0}
              </span>
            </div>
          </div>

          {/* Card 2: Customer */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Penyewa</p>
                <h3 className="text-xl font-black text-[#2D2321] truncate">
                  {loading ? '...' : `${stats.total_customer || 0} Orang`}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/60">
                ● Aktif Menyewa
              </span>
            </div>
          </div>

          {/* Card 3: Komplain */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Komplain</p>
                <h3 className="text-xl font-black text-[#2D2321] truncate">
                  {loading ? '...' : `${stats.komplain_pending || 0} Keluhan`}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md inline-block border border-rose-200/60">
                ⚠️ Perlu Ditanggapi
              </span>
            </div>
          </div>

          {/* Card 4: Dokumen TTD */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Perlu TTD</p>
                <h3 className="text-xl font-black text-[#2D2321] truncate">
                  {loading ? '...' : `${stats.dokumen_perlu_ttd || 0} Berkas`}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md inline-block border border-blue-200/60 truncate max-w-full">
                Menunggu TTD Penyewa
              </span>
            </div>
          </div>

          {/* Card 5: Pendapatan */}
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600 shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pendapatan</p>
                <h3 className="text-base font-black text-[#2D2321] truncate" title={formatRupiah(stats.total_pendapatan)}>
                  {loading ? '...' : formatRupiah(stats.total_pendapatan)}
                </h3>
              </div>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-100">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md inline-block border border-emerald-200/60">
                ✓ Lunas / Terkonfirmasi
              </span>
            </div>
          </div>

        </div>

        {/* SECTION TABEL DENGAN PANEL FILTER & EXPORT */}
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          
          {/* HEADER TABEL & CONTROL PANEL */}
          <div className="p-5 md:p-6 border-b border-[#D7C4B0]/60 space-y-4">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FAF5EF] border border-[#D7C4B0] rounded-xl text-[#B38E5D]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#2D2321]">Daftar Transaksi Pembayaran</h2>
                  <p className="text-xs text-slate-500">Kelola dan pantau seluruh riwayat transaksi masuk</p>
                </div>
              </div>

              {/* TOMBOL EKSPOR PDF */}
              <button
                onClick={handleExportPDF}
                disabled={filteredTransactions.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                <span>Export PDF</span>
              </button>
            </div>

            {/* PANEL INPUT FILTER & SEARCH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              
              {/* Input Search */}
              <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama, properti, invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF5EF]/50 border border-[#D7C4B0] text-xs font-medium text-[#2D2321] rounded-xl pl-10 pr-4 py-2.5 outline-none focus:bg-white focus:border-[#B38E5D] transition"
                />
              </div>

              {/* Filter Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#FAF5EF]/50 border border-[#D7C4B0] text-xs font-bold text-[#2D2321] rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#B38E5D] transition cursor-pointer"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="LUNAS">Dikonfirmasi / Lunas</option>
                  <option value="PENDING">Pending / Tertunda</option>
                  <option value="BATAL">Dibatalkan / Kadaluarsa</option>
                </select>
              </div>

              {/* Filter Waktu / Periode */}
              <div>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full bg-[#FAF5EF]/50 border border-[#D7C4B0] text-xs font-bold text-[#2D2321] rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-[#B38E5D] transition cursor-pointer"
                >
                  <option value="ALL">Semua Tanggal</option>
                  <option value="WEEK">7 Hari Terakhir</option>
                  <option value="MONTH">Bulan Ini</option>
                  <option value="YEAR">Tahun Ini</option>
                </select>
              </div>

              {/* Tombol Reset Filter */}
              <div>
                <button
                  onClick={handleResetFilter}
                  className="w-full border border-slate-300 hover:border-rose-400 text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 text-xs font-bold rounded-xl py-2.5 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reset Filter</span>
                </button>
              </div>

            </div>

          </div>

          {/* TABEL DATA */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#FAF5EF] text-[#2D2321] font-bold uppercase tracking-wider border-b border-[#D7C4B0]">
                <tr>
                  <th className="px-6 py-4">ID Invoice</th>
                  <th className="px-6 py-4">Nama Penyewa</th>
                  <th className="px-6 py-4">Properti / Lokasi</th>
                  <th className="px-6 py-4">Total Harga</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tanggal Transaksi</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-xs">Memuat data transaksi...</p>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600">Tidak ada data transaksi yang cocok.</p>
                      <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau sesuaikan filter status.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusLower = (tx.status || '').toLowerCase();
                    let statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
                    let statusIcon = "⏳";

                    if (statusLower === 'dikonfirmasi' || statusLower === 'lunas' || statusLower === 'selesai') {
                      statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      statusIcon = "✓";
                    } else if (statusLower === 'dibatalkan' || statusLower === 'ditolak' || statusLower === 'expired') {
                      statusBadge = "bg-rose-50 text-rose-700 border-rose-200";
                      statusIcon = "✕";
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-[#FAF5EF]/60 transition">
                        <td className="px-6 py-4 font-mono font-bold text-[#B38E5D]">#INV-{tx.id}</td>
                        <td className="px-6 py-4 font-bold text-[#2D2321]">{tx.customer?.name || 'Tanpa Nama'}</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#B38E5D] shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                          <span className="text-slate-700 font-semibold">{tx.properti?.title || tx.properti?.nama || 'Lokasi N/A'}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#2D2321]">{formatRupiah(tx.total_price)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusBadge}`}>
                            {statusIcon} {tx.status || 'Tertunda'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="font-semibold">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</div>
                          <div className="text-[10px] text-slate-400">{tx.created_at ? new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button title="Detail Transaksi" className="p-2 text-slate-400 hover:text-[#B38E5D] hover:bg-[#FAF5EF] rounded-lg border border-transparent hover:border-[#D7C4B0] transition cursor-pointer">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER TABEL / PAGINATION INFO */}
          <div className="p-4 border-t border-[#D7C4B0]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-[#FAF5EF]/30">
            <div>
              Menampilkan <strong className="text-[#2D2321]">{filteredTransactions.length}</strong> dari <strong className="text-[#2D2321]">{recentTransactions.length}</strong> total transaksi
            </div>
            <div className="flex items-center gap-1.5">
              <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D7C4B0] text-slate-400 bg-white cursor-not-allowed">&lt;</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#B38E5D] text-white font-bold shadow-sm">1</button>
              <button disabled className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D7C4B0] text-slate-400 bg-white cursor-not-allowed">&gt;</button>
            </div>
          </div>

        </div>

      </div>
    </SidebarAdmin>
  );
}