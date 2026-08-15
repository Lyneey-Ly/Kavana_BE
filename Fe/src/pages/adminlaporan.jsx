import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api'; // Sesuaikan path Axios instance kamu
import SidebarAdmin from '../components/SidebarAdmin';
import Swal from 'sweetalert2'; // Import SweetAlert2

export default function AdminLaporanKeuangan() {
  // 1. STATE DATA TRANSAKSI & LOADING/ERROR
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. STATE FILTER & SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // 3. FETCH DATA LAPORAN KEUANGAN
  const fetchLaporanKeuangan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/admin/finance/laporan');
      const dataBackend = response.data?.ringkasan_transaksi || [];

      // Mapping data Laravel ke struktur UI
      const mappedData = dataBackend.map((item) => ({
        id: `TRX-${item.id}`,
        date: item.created_at ? item.created_at.split('T')[0] : '-',
        rawDate: item.created_at ? new Date(item.created_at) : new Date(),
        description: `Sewa ${item.properti?.nama_properti || 'Properti'} (${item.customer?.name || 'Pelanggan'})`,
        category: 'Sewa Kamar',
        type: 'income', // Semua pemesanan terkonfirmasi adalah Pemasukan
        amount: Number(item.total_price || 0),
      }));

      setTransactions(mappedData);
    } catch (err) {
      console.error('Gagal memuat laporan keuangan:', err);
      const errMsg = 'Gagal mengambil data laporan keuangan dari server. Silakan coba lagi.';
      setError(errMsg);

      // SweetAlert Error Notification
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: errMsg,
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaporanKeuangan();
  }, [fetchLaporanKeuangan]);

  // 4. FORMATTER UTILITY
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka || 0);
  };

  const formatDateIndo = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const event = new Date(dateStr);
    return event.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // 5. EXTRACT OPSI BULAN SECARA DINAMIS
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    transactions.forEach((trx) => {
      if (trx.date && trx.date.length >= 7) {
        monthsSet.add(trx.date.substring(0, 7)); // Ambil format YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [transactions]);

  // 6. FILTER & KALKULASI DATA
  const filteredData = useMemo(() => {
    return transactions.filter((trx) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        trx.id.toLowerCase().includes(searchLower) ||
        trx.description.toLowerCase().includes(searchLower) ||
        trx.category.toLowerCase().includes(searchLower);

      const matchMonth = filterMonth === 'all' ? true : trx.date.startsWith(filterMonth);
      const matchType = filterType === 'all' ? true : trx.type === filterType;

      return matchSearch && matchMonth && matchType;
    });
  }, [transactions, searchTerm, filterMonth, filterType]);

  const totalIncome = useMemo(() => {
    return filteredData
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredData]);

  const totalExpense = useMemo(() => {
    return filteredData
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredData]);

  const netBalance = totalIncome - totalExpense;

  // 7. FUNGSI RESET FILTER
  const handleResetFilter = () => {
    setSearchTerm('');
    setFilterMonth('all');
    setFilterType('all');

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });

    Toast.fire({
      icon: 'info',
      title: 'Filter telah di-reset',
    });
  };

  // 8. FUNGSI EXPORT DATA KE CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Data Kosong',
        text: 'Tidak ada data transaksi yang dapat diexport.',
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    const headers = ['ID Transaksi', 'Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Nominal (IDR)'];
    const rows = filteredData.map((t) => [
      t.id,
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      t.amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Keuangan_KafanaVista_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Berhasil!',
      text: 'File Laporan Keuangan CSV berhasil diunduh.',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF5EF] text-[#261C19] font-sans p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D7C4B0]/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
                  Keuangan Properti
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#B38E5D]"></span>
                <span className="text-xs text-slate-500 font-medium">Kafana Vista Admin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#261C19] mt-1 tracking-tight">
                Laporan Arus Kas
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pantau seluruh rekapitulasi pemasukan dan pengeluaran secara terstruktur.
              </p>
            </div>

            {/* AKSI GLOBAL */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={fetchLaporanKeuangan}
                disabled={loading}
                title="Muat Ulang Data"
                className="p-2.5 bg-white border border-[#D7C4B0] text-[#261C19] hover:bg-[#FAF5EF] active:scale-95 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <svg
                  className={`w-4 h-4 ${loading ? 'animate-spin text-[#B38E5D]' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={loading || filteredData.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-md shadow-[#B38E5D]/20 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* NOTIFIKASI ERROR */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={fetchLaporanKeuangan}
                className="underline hover:text-rose-900 font-bold shrink-0 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* SUMMARY CARDS SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Pemasukan */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Pemasukan
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0 group-hover:scale-105 transition duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
                ) : (
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-black text-[#261C19] tracking-tight truncate"
                    title={formatRupiah(totalIncome)}
                  >
                    {formatRupiah(totalIncome)}
                  </h3>
                )}
                <p className="text-[10px] sm:text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <span>●</span> Transaksi terkonfirmasi
                </p>
              </div>
            </div>

            {/* Card 2: Total Pengeluaran */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Pengeluaran
                </span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shrink-0 group-hover:scale-105 transition duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-32 bg-slate-200 animate-pulse rounded-lg"></div>
                ) : (
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-black text-[#261C19] tracking-tight truncate"
                    title={formatRupiah(totalExpense)}
                  >
                    {formatRupiah(totalExpense)}
                  </h3>
                )}
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1">
                  Operasional & Perawatan
                </p>
              </div>
            </div>

            {/* Card 3: Saldo Bersih */}
            <div className="bg-gradient-to-br from-[#261C19] to-[#3D2D29] p-4 sm:p-5 rounded-2xl border border-[#3D2D29] shadow-md flex flex-col justify-between text-white relative overflow-hidden group">
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span className="text-[10px] sm:text-[11px] font-bold text-[#D7C4B0] uppercase tracking-wider truncate">
                  Saldo Bersih
                </span>
                <div className="p-2 bg-[#B38E5D]/20 text-[#B38E5D] rounded-xl border border-[#B38E5D]/30 shrink-0 group-hover:scale-105 transition duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3 relative z-10">
                {loading ? (
                  <div className="h-7 w-32 bg-[#3D2D29] animate-pulse rounded-lg"></div>
                ) : (
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-black text-[#FAF5EF] tracking-tight truncate"
                    title={formatRupiah(netBalance)}
                  >
                    {formatRupiah(netBalance)}
                  </h3>
                )}
                <p className="text-[10px] sm:text-[11px] text-[#D7C4B0]/80 font-medium mt-1">
                  Est. Profit Bersih
                </p>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#B38E5D]/10 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* Card 4: Total Volume Transaksi */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#D7C4B0] shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Total Transaksi
                </span>
                <div className="p-2 bg-[#FAF5EF] text-[#B38E5D] rounded-xl border border-[#D7C4B0] shrink-0 group-hover:scale-105 transition duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-20 bg-slate-200 animate-pulse rounded-lg"></div>
                ) : (
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-[#261C19] tracking-tight">
                    {filteredData.length} <span className="text-xs font-normal text-slate-400">Data</span>
                  </h3>
                )}
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1">
                  Sesuai filter aktif
                </p>
              </div>
            </div>

          </div>

          {/* TABLE CONTAINER & FILTER CONTROLS */}
          <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
            
            {/* BARIS FILTER & CARI */}
            <div className="p-4 sm:p-5 border-b border-[#D7C4B0]/60 bg-[#FAF5EF]/50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm sm:text-base font-bold text-[#261C19] flex items-center gap-2">
                  <span>Rincian Transaksi</span>
                  <span className="text-xs bg-[#B38E5D]/15 text-[#B38E5D] px-2.5 py-0.5 rounded-full font-bold">
                    {filteredData.length}
                  </span>
                </h2>

                {(searchTerm || filterMonth !== 'all' || filterType !== 'all') && (
                  <button
                    onClick={handleResetFilter}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Search Input */}
                <div className="relative">
                  <svg
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari ID, keterangan, penyewa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-[#D7C4B0] text-[#261C19] text-xs font-medium rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition shadow-sm"
                  />
                </div>

                {/* Filter Bulan */}
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-white border border-[#D7C4B0] text-[#261C19] text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition shadow-sm cursor-pointer"
                >
                  <option value="all">📅 Semua Bulan</option>
                  {availableMonths.map((m) => {
                    const dateObj = new Date(`${m}-01`);
                    const monthLabel = dateObj.toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    });
                    return (
                      <option key={m} value={m}>
                        {monthLabel}
                      </option>
                    );
                  })}
                </select>

                {/* Filter Tipe Transaksi */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-white border border-[#D7C4B0] text-[#261C19] text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition shadow-sm cursor-pointer"
                >
                  <option value="all">🏷️ Semua Tipe</option>
                  <option value="income">🟢 Pemasukan Saja</option>
                  <option value="expense">🔴 Pengeluaran Saja</option>
                </select>

              </div>
            </div>

            {/* TABEL DATA */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#FAF5EF] text-[#261C19] font-bold uppercase tracking-wider border-b border-[#D7C4B0]">
                  <tr>
                    <th className="px-5 py-3.5">ID Transaksi</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5">Keterangan / Deskripsi</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5 text-center">Tipe</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-5 py-3.5"><div className="h-4 w-16 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-3.5"><div className="h-4 w-24 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-3.5"><div className="h-4 w-48 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-3.5"><div className="h-4 w-20 bg-slate-200 rounded"></div></td>
                        <td className="px-5 py-3.5 text-center"><div className="h-5 w-16 bg-slate-200 rounded-full mx-auto"></div></td>
                        <td className="px-5 py-3.5 text-right"><div className="h-4 w-24 bg-slate-200 rounded ml-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredData.length > 0 ? (
                    filteredData.map((trx) => {
                      const isIncome = trx.type === 'income';
                      return (
                        <tr
                          key={trx.id}
                          className="hover:bg-[#FAF5EF]/60 transition duration-150"
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-[#B38E5D]">
                            {trx.id}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {formatDateIndo(trx.date)}
                          </td>
                          <td className="px-5 py-3.5 text-[#261C19] font-semibold max-w-xs truncate" title={trx.description}>
                            {trx.description}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500">
                            <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-600 border border-slate-200">
                              {trx.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              <span>{isIncome ? '▲' : '▼'}</span>
                              <span>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
                            </span>
                          </td>
                          <td
                            className={`px-5 py-3.5 font-black text-right text-xs sm:text-sm ${
                              isIncome ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+ ' : '- '}
                            {formatRupiah(trx.amount)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <div className="w-10 h-10 rounded-full bg-[#FAF5EF] text-[#B38E5D] flex items-center justify-center mx-auto border border-[#D7C4B0]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                          </div>
                          <p className="text-sm font-bold text-[#261C19]">
                            Tidak Ada Transaksi Ditemukan
                          </p>
                          <p className="text-xs text-slate-400">
                            Tidak ada pencatatan keuangan yang cocok dengan kriteria pencarian atau filter Anda.
                          </p>
                          {(searchTerm || filterMonth !== 'all' || filterType !== 'all') && (
                            <button
                              onClick={handleResetFilter}
                              className="inline-block px-3.5 py-1.5 bg-[#B38E5D] text-white text-xs font-bold rounded-xl hover:bg-[#8F6E45] transition shadow-sm cursor-pointer"
                            >
                              Reset Semua Filter
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER SUMMARY INFO */}
            <div className="p-3.5 border-t border-[#D7C4B0]/60 bg-[#FAF5EF]/30 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <div>
                Menampilkan <strong className="text-[#261C19]">{filteredData.length}</strong> dari{' '}
                <strong className="text-[#261C19]">{transactions.length}</strong> total transaksi.
              </div>
              <div className="text-[11px] text-slate-400">
                Data diperbarui secara real-time dari Server Laravel
              </div>
            </div>

          </div>

        </div>
      </div>
    </SidebarAdmin>
  );
}