import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import API from '../api';
import SidebarAdmin from '../components/SidebarAdmin';


export default function AdminLaporanKeuangan() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // States Ringkasan
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });

  // Filter States
  const [filters, setFilters] = useState({
    propertiId: '',
    month: '',
    year: '',
    type: 'all', // 'all', 'income', 'expense'
  });

  // Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    properti_id: '',
    category: 'Perawatan Properti',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Perawatan Properti',
    'Listrik & Air',
    'Kebersihan',
    'Gaji Staf',
    'Internet & Telepon',
    'Lainnya',
  ];

  // Fetch Daftar Properti
  const fetchProperties = async () => {
    try {
      const res = await API.get('/admin/properties');
      const data = res.data.data || res.data || [];
      setProperties(data);
    } catch (err) {
      console.error('Gagal mengambil daftar properti:', err);
    }
  };

  // Fetch Laporan Keuangan dari FinanceController@laporanGlobal
  const fetchLaporanKeuangan = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.propertiId) params.properti_id = filters.propertiId;
      if (filters.month) params.bulan = filters.month;
      if (filters.year) params.tahun = filters.year;

      const res = await API.get('/admin/finance/laporan', { params });
      const data = res.data;

      if (data.status === 'success') {
        setSummary({
          totalIncome: Number(data.total_pemasukan || 0),
          totalExpense: Number(data.total_pengeluaran || 0),
          netBalance: Number(data.saldo_bersih || 0),
        });

        // Map Transaksi Pemasukan (Sewa Dikonfirmasi)
        const mappedIncomes = (data.ringkasan_transaksi || []).map((item) => ({
          id: `INC-${item.id}`,
          originalId: item.id,
          date: item.created_at ? item.created_at.split('T')[0] : '-',
          description: `Pemesanan - ${item.customer?.name || 'Customer'} (${item.properti?.title || 'Properti'})`,
          category: 'Pemasukan Sewa',
          type: 'income',
          amount: Number(item.total_price || 0),
        }));

        // Map Transaksi Pengeluaran
        const mappedExpenses = (data.ringkasan_pengeluaran || []).map((item) => ({
          id: `EXP-${item.id}`,
          originalId: item.id,
          date: item.date,
          description: `${item.description} (${item.properti?.title || 'Umum'})`,
          category: item.category,
          type: 'expense',
          amount: Number(item.amount || 0),
        }));

        // Gabungkan & Urutkan berdasarkan Tanggal Terbaru
        const merged = [...mappedIncomes, ...mappedExpenses].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setTransactions(merged);
      }
    } catch (err) {
      console.error('Gagal mengambil data laporan keuangan:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat laporan keuangan!',
        confirmButtonColor: '#261C19',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchLaporanKeuangan();
  }, [filters.propertiId, filters.month, filters.year]);

  // Filter Tipe Transaksi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (filters.type === 'income') return item.type === 'income';
      if (filters.type === 'expense') return item.type === 'expense';
      return true;
    });
  }, [transactions, filters.type]);

  // Handle Form Change
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Catat Pengeluaran
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.description || !expenseForm.amount || !expenseForm.date) {
      Swal.fire({
        icon: 'warning',
        title: 'Lengkapi Form',
        text: 'Mohon isi semua bidang yang wajib (*)',
        confirmButtonColor: '#261C19',
      });
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/admin/finance/pengeluaran', expenseForm);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan',
        text: 'Catatan pengeluaran operasional berhasil ditambahkan!',
        confirmButtonColor: '#261C19',
      });

      setShowExpenseModal(false);
      setExpenseForm({
        properti_id: '',
        category: 'Perawatan Properti',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
      });

      fetchLaporanKeuangan();
    } catch (err) {
      console.error('Gagal menyimpan pengeluaran:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.',
        confirmButtonColor: '#261C19',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Hapus Catatan Pengeluaran
  const handleDeleteExpense = async (originalId) => {
    const confirm = await Swal.fire({
      title: 'Hapus Pengeluaran?',
      text: 'Catatan ini akan dihapus permanen!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await API.delete(`/admin/finance/pengeluaran/${originalId}`);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Catatan pengeluaran berhasil dihapus.',
        confirmButtonColor: '#261C19',
      });
      fetchLaporanKeuangan();
    } catch (err) {
      console.error('Gagal menghapus pengeluaran:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menghapus catatan pengeluaran.',
        confirmButtonColor: '#261C19',
      });
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Data Kosong',
        text: 'Tidak ada transaksi untuk diexport.',
        confirmButtonColor: '#261C19',
      });
      return;
    }

    const headers = ['ID,Tanggal,Kategori,Tipe,Keterangan,Nominal (Rp)'];
    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.category}"`,
      `"${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SidebarAdmin>
    <div className="p-6 md:p-8 space-y-6 bg-[#FAF6F0] min-h-screen font-sans text-[#261C19]">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
            Keuangan & Operasional
          </span>
          <h1 className="text-2xl font-black tracking-tight">Laporan Keuangan Properti</h1>
          <p className="text-xs text-slate-500">
            Kelola arus kas masuk sewa dan pengeluaran operasional secara terpusat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>💸</span> + Catat Pengeluaran
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span> Export CSV
          </button>
        </div>
      </div>

      {/* SUMMARY STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
            📈 Total Pemasukan
          </span>
          <p className="text-2xl font-black text-emerald-700">
            Rp {summary.totalIncome.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Hasil Pemesanan Sewa Dikonfirmasi</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
            📉 Total Pengeluaran
          </span>
          <p className="text-2xl font-black text-rose-700">
            Rp {summary.totalExpense.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Biaya Operasional & Perawatan Kos</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C5A059] block">
            💰 Saldo Bersih
          </span>
          <p className={`text-2xl font-black ${summary.netBalance >= 0 ? 'text-[#261C19]' : 'text-rose-600'}`}>
            Rp {summary.netBalance.toLocaleString('id-ID')}
          </p>
          <p className="text-[10px] text-slate-400">Estimasi Keuntungan Bersih (Net)</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dropdown Properti */}
          <select
            value={filters.propertiId}
            onChange={(e) => setFilters((prev) => ({ ...prev, propertiId: e.target.value }))}
            className="text-xs p-2.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] font-semibold text-[#261C19] focus:outline-none"
          >
            <option value="">🏢 Semua Properti</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.nama_properti}
              </option>
            ))}
          </select>

          {/* Select Bulan */}
          <select
            value={filters.month}
            onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
            className="text-xs p-2.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] font-semibold text-[#261C19] focus:outline-none"
          >
            <option value="">📅 Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Bulan {m}
              </option>
            ))}
          </select>

          {/* Reset Filter */}
          {(filters.propertiId || filters.month) && (
            <button
              onClick={() => setFilters({ propertiId: '', month: '', year: '', type: 'all' })}
              className="text-xs font-bold text-rose-600 hover:underline px-2"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Tab Filter Tipe Transaksi */}
        <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 rounded-xl border border-[#E5D7C5]">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'all' ? 'bg-[#261C19] text-white' : 'text-slate-600'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'income' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'income' ? 'bg-emerald-700 text-white' : 'text-slate-600'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, type: 'expense' }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filters.type === 'expense' ? 'bg-rose-700 text-white' : 'text-slate-600'
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-3xl border border-[#E5D7C5] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider space-y-2">
            <div className="w-8 h-8 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p>Memuat Laporan Keuangan...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <span className="text-4xl block">📊</span>
            <p className="text-sm font-bold text-[#261C19]">Belum ada riwayat transaksi</p>
            <p className="text-xs text-slate-400">
              Ubah filter atau tambahkan pengeluaran operasional baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] border-b border-[#E5D7C5] text-[#261C19] font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4">Tipe</th>
                  <th className="p-4 text-right">Nominal</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-600 whitespace-nowrap">{item.date}</td>
                    <td className="p-4 font-bold text-[#261C19]">{item.category}</td>
                    <td className="p-4 text-slate-600">{item.description}</td>
                    <td className="p-4 whitespace-nowrap">
                      {item.type === 'income' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                          + Pemasukan
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase">
                          - Pengeluaran
                        </span>
                      )}
                    </td>
                    <td className={`p-4 text-right font-extrabold whitespace-nowrap ${
                      item.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {item.type === 'income' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      {item.type === 'expense' ? (
                        <button
                          onClick={() => handleDeleteExpense(item.originalId)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-[11px] bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition"
                          title="Hapus Pengeluaran"
                        >
                          🗑️ Hapus
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px] italic">Auto (Sewa)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FORM TAMBAH PENGELUARAN */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#E5D7C5] shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">
                  Pencatatan Operasional
                </span>
                <h3 className="text-base font-extrabold text-[#261C19]">Catat Pengeluaran Baru</h3>
              </div>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              {/* Properti */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Properti (Opsional)
                </label>
                <select
                  name="properti_id"
                  value={expenseForm.properti_id}
                  onChange={handleExpenseChange}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-none font-medium"
                >
                  <option value="">-- Semua / Pengeluaran Umum --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.nama_properti}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Kategori <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  value={expenseForm.category}
                  onChange={handleExpenseChange}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-none font-bold"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={expenseForm.date}
                  onChange={handleExpenseChange}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-none font-medium"
                />
              </div>

              {/* Nominal */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  min="0"
                  required
                  placeholder="Contoh: 250000"
                  value={expenseForm.amount}
                  onChange={handleExpenseChange}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-none font-bold text-[#261C19]"
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#261C19]">
                  Keterangan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Contoh: Servis AC Kamar 102 & Pembayaran Tagihan Air"
                  value={expenseForm.description}
                  onChange={handleExpenseChange}
                  className="w-full text-xs p-3 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-none font-medium"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#261C19] hover:bg-[#3D2D29] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {submitting ? 'Storing...' : '💾 Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
        </SidebarAdmin>

  );
}