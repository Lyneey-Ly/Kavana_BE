import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api'; // Sesuaikan path Axios instance kamu
import SidebarAdmin from '../components/SidebarAdmin';

export default function AdminLaporanKeuangan() {

  // 1. STATE UNTUK DATA TRANSAKSI & LOADING/ERROR
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. STATE UNTUK FILTER
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // 3. FETCH FUNCTION - DEFINED BEFORE USEEFFECT
  const fetchLaporanKeuangan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/admin/finance/laporan');
      
      // 1. Ambil array ringkasan_transaksi dari response backend
      const dataBackend = response.data.ringkasan_transaksi || [];

      // 2. Mapping data Pemesanan dari Laravel ke struktur UI
      const mappedData = dataBackend.map((item) => ({
        id: `TRX-${item.id}`,
        // Mengambil tanggal dari created_at
        date: item.created_at ? item.created_at.split('T')[0] : '-',
        // Menggabungkan info properti & customer
        description: `Sewa ${item.properti?.nama_properti || 'Properti'} (${item.customer?.name || 'Pelanggan'})`,
        category: 'Sewa Kamar',
        type: 'income', // Semua pemesanan terkonfirmasi adalah Pemasukan
        amount: Number(item.total_price || 0),
      }));

      setTransactions(mappedData);
    } catch (err) {
      console.error('Gagal memuat laporan keuangan:', err);
      setError('Gagal mengambil data laporan keuangan dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data dari Backend Laravel saat komponen dimuat
  useEffect(() => {
    fetchLaporanKeuangan();
  }, [fetchLaporanKeuangan]);

  // 3. FUNGSI FORMAT RUPIAH
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // 4. FUNGSI FILTER & KALKULASI DATA
  const filteredData = useMemo(() => {
    return transactions.filter(trx => {
      const matchMonth = filterMonth === "all" ? true : trx.date.startsWith(filterMonth);
      const matchType = filterType === "all" ? true : trx.type === filterType;
      return matchMonth && matchType;
    });
  }, [transactions, filterMonth, filterType]);

  const totalIncome = filteredData.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = filteredData.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // 5. FUNGSI EXPORT (Bisa dihubungkan ke endpoint backend export jika tersedia)
  const handleExport = () => {
    alert("Berhasil mengunduh Laporan Keuangan dalam format PDF/Excel.");
  };

  

  return (
    <SidebarAdmin>
    <div className="flex h-screen bg-[#FAF5EF] font-sans text-slate-800 overflow-hidden relative">
      
     

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
       
        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#261C19] tracking-tight">Arus Kas</h1>
              <p className="text-slate-500 mt-1">Pantau pemasukan dan pengeluaran properti Anda secara real-time dari backend.</p>
            </div>
            
            {/* FILTER KONTROL */}
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white border border-[#D7C4B0] text-[#261C19] text-sm font-medium rounded-lg px-4 py-2.5 outline-none shadow-sm focus:ring-1 focus:ring-[#B38E5D]"
              >
                <option value="all">Semua Waktu</option>
                <option value="2026-07">Juli 2026</option>
                <option value="2026-06">Juni 2026</option>
              </select>

              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-[#D7C4B0] text-[#261C19] text-sm font-medium rounded-lg px-4 py-2.5 outline-none shadow-sm focus:ring-1 focus:ring-[#B38E5D]"
              >
                <option value="all">Semua Tipe</option>
                <option value="income">Pemasukan Saja</option>
                <option value="expense">Pengeluaran Saja</option>
              </select>

              <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-lg transition shadow-md shadow-[#B38E5D]/30 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                <span>Export Laporan</span>
              </button>
            </div>
          </div>

          {/* ERROR NOTIFICATION */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card Pemasukan */}
            <div className="bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pemasukan</p>
              </div>
              <h3 className="text-3xl font-black text-[#261C19] mt-2">{formatRupiah(totalIncome)}</h3>
            </div>

            {/* Card Pengeluaran */}
            <div className="bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path></svg>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Pengeluaran</p>
              </div>
              <h3 className="text-3xl font-black text-[#261C19] mt-2">{formatRupiah(totalExpense)}</h3>
            </div>

            {/* Card Saldo Bersih */}
            <div className="bg-[#261C19] p-6 rounded-2xl border border-[#3D2D29] shadow-md flex flex-col justify-between text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#B38E5D]/20 rounded-lg text-[#B38E5D]">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                  <p className="text-sm font-bold text-[#D7C4B0] uppercase tracking-wider">Saldo Bersih</p>
                </div>
                <h3 className="text-3xl font-black text-[#FAF5EF] mt-2">{formatRupiah(netBalance)}</h3>
              </div>
              <svg className="absolute bottom-0 right-0 w-32 h-32 text-[#3D2D29] opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
          </div>

          {/* TABEL TRANSAKSI */}
          <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#D7C4B0] bg-[#FAF5EF]">
              <h2 className="text-lg font-bold text-[#261C19]">Rincian Transaksi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">ID / Referensi</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-medium">
                        <div className="inline-block w-6 h-6 border-3 border-[#B38E5D] border-t-transparent rounded-full animate-spin mr-2 align-middle"></div>
                        Memuat data laporan keuangan...
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 text-slate-600 font-medium">{trx.date}</td>
                        <td className="px-6 py-4 text-xs font-bold text-[#B38E5D] tracking-wider">{trx.id}</td>
                        <td className="px-6 py-4 text-[#261C19] font-medium">{trx.description}</td>
                        <td className="px-6 py-4 text-slate-500">{trx.category}</td>
                        <td className={`px-6 py-4 font-bold text-right ${trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {trx.type === 'income' ? '+' : '-'} {formatRupiah(trx.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                        Tidak ada data transaksi yang ditemukan untuk filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

    </div>
    </SidebarAdmin>
  );
}