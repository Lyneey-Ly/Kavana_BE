import { useState, useEffect, useCallback } from 'react';
import API from '../api'; // Sesuaikan dengan instance Axios kamu
import SidebarAdmin from '../components/SidebarAdmin';

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
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Fetch Data dari DashboardAdminController@index
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/dashboard'); // Sesuaikan endpoint rute backend kamu
      setStats(res.data.data.cards);
      setRecentTransactions(res.data.data.transaksi_terbaru);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchDashboardData();
    };
    load();
  }, [fetchDashboardData]);

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  

  return (
    <SidebarAdmin>
    <div className="flex h-screen bg-[#FAF5EF] font-sans text-slate-800 overflow-hidden">
      
   

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
       

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
              <p className="text-slate-500 mt-1">Overview operasional manajemen kost dan kontrakan</p>
            </div>
            <select className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-4 py-2.5 outline-none shadow-sm cursor-pointer hover:border-[#B38E5D]">
              <option>Minggu Ini</option>
              <option>Bulan Ini</option>
              <option>Tahun Ini</option>
            </select>
          </div>

          {/* 4 SUMMARY CARDS (Connected to Backend) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            {/* Card 1: Total Unit Properti */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#F0E6D8] flex items-center justify-center text-[#B38E5D] shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Unit Properti</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {loading ? '...' : `${stats.total_properti} Unit`}
                  </h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
                  Terisi: {stats.properti_terisi} | Kosong: {stats.properti_kosong}
                </span>
              </div>
            </div>

            {/* Card 2: Penyewa Aktif (Total Customer) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Customer Unik</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {loading ? '...' : `${stats.total_customer} Orang`}
                  </h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Aktif Menyewa</span>
              </div>
            </div>

            {/* Card 3: Komplain Pending */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Komplain Pending</p>
                  <h3 className="text-2xl font-black text-slate-900">
                    {loading ? '...' : `${stats.komplain_pending} Keluhan`}
                  </h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded">Perlu Ditanggapi</span>
              </div>
            </div>

            {/* Card 4: Total Pendapatan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Total Pendapatan</p>
                  <h3 className="text-xl font-black text-slate-900 truncate max-w-[150px]">
                    {loading ? '...' : formatRupiah(stats.total_pendapatan)}
                  </h3>
                </div>
              </div>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Status: Dikonfirmasi</span>
              </div>
            </div>

          </div>

          {/* TABLE SECTION (Connected to Backend Transactions) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row justify-between items-center border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Transaksi Pembayaran Terbaru</h2>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-50 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                  <span>Filter</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-medium text-sm rounded-lg transition shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  <span>Export</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#FAF5EF] text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ID Order</th>
                    <th className="px-6 py-4">Nama Penyewa</th>
                    <th className="px-6 py-4">Properti / Lokasi</th>
                    <th className="px-6 py-4">Total Harga</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tanggal Transaksi</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Memuat data transaksi...</td>
                    </tr>
                  ) : recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Belum ada data transaksi terbaru.</td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => {
                      // Tentukan warna badge status dinamis
                      let statusBadge = "bg-amber-100 text-amber-700";
                      if (tx.status === 'Dikonfirmasi' || tx.status === 'Lunas') {
                        statusBadge = "bg-emerald-100 text-emerald-700";
                      } else if (tx.status === 'Dibatalkan') {
                        statusBadge = "bg-rose-100 text-rose-700";
                      }

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-semibold text-[#B38E5D]">#INV-{tx.id}</td>
                          <td className="px-6 py-4 font-medium text-slate-800">{tx.customer?.name || 'Tanpa Nama'}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <span className="text-slate-600">{tx.properti?.title || 'Lokasi Tidak Diketahui'}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">{formatRupiah(tx.total_price)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${statusBadge}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <div className="font-medium">{new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            <div className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="p-1.5 text-slate-400 hover:text-[#B38E5D] hover:bg-slate-100 rounded transition">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
              <div>Menampilkan 5 transaksi terbaru dari database</div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100">&lt;</button>
                <button className="w-8 h-8 flex items-center justify-center rounded bg-[#B38E5D] text-white font-bold">1</button>
                <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100">&gt;</button>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
    </SidebarAdmin>
  );
}