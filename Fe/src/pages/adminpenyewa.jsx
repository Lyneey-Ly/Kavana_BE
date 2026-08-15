import { useState, useEffect } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';
import API from '../api';

export default function AdminPenyewa() {
  // 1. STATE UNTUK DATA API & LOADING
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. STATE UNTUK PENCARIAN & FILTER
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // 3. STATE UNTUK MODAL DETAIL PENYEWA
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Helper Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(number || 0);
  };

  // Helper Format Tanggal Indonesia
  const formatDateIndo = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // =========================================================================
  // 🔌 FETCH DATA PENYEWA AKTIF DARI BACKEND
  // =========================================================================
  const fetchPenyewaAktif = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/penyewa-aktif');
      const rawData = response.data.data || response.data || [];

      // Mapping data sesuai schema migration pemesanans
      const formattedData = rawData.map((item) => {
        // Ambil Data Customer / User
        const customerName = item.customer?.nama || item.customer?.name || item.user?.name || "Penyewa Tanpa Nama";
        const roomName = item.properti?.title || item.properti?.nama_properti || "Properti Kosong";
        const phone = item.customer?.no_hp || item.customer?.phone || item.customer?.telepon || item.user?.no_hp || "-";
        const email = item.customer?.email || item.user?.email || "-";

        // Ambil data tanggal berdasarkan skema migration: check_in_date & duration_months
        const entryDateRaw = item.check_in_date || item.tanggal_masuk || item.created_at?.split('T')[0];
        const duration = parseInt(item.duration_months || 1);

        // Kalkulasi Batas Kontrak (check_in_date + duration_months)
        let computedEndDate = "-";
        if (entryDateRaw) {
          const startDateObj = new Date(entryDateRaw);
          if (!isNaN(startDateObj.getTime())) {
            // Tambahkan durasi bulan
            startDateObj.setMonth(startDateObj.getMonth() + duration);
            computedEndDate = startDateObj.toISOString().split('T')[0];
          }
        }

        // Logic penentuan status visual
        let computedStatus = "Aktif";
        if (computedEndDate !== "-") {
          const today = new Date();
          const end = new Date(computedEndDate);
          const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

          if (diffDays <= 30 && diffDays >= 0) {
            computedStatus = "Akan Habis";
          }
        }

        // Cek jika transaksi masuk dalam 7 hari terakhir
        if (item.created_at) {
          const createdDate = new Date(item.created_at);
          const today = new Date();
          const diffDaysCreated = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24));
          if (diffDaysCreated <= 7 && diffDaysCreated >= 0) {
            computedStatus = "Baru";
          }
        }

        return {
          id: item.id,
          name: customerName,
          email: email,
          room: roomName,
          phone: phone,
          entryDate: entryDateRaw ? entryDateRaw.split('T')[0] : "-",
          endDate: computedEndDate,
          duration: duration,
          totalPrice: item.total_price || 0,
          bookingDate: item.booking_date || item.created_at,
          paymentStatus: item.status || 'Tertunda',
          status: computedStatus,
          rawItem: item
        };
      });

      setTenants(formattedData);
      setError(null);
    } catch (err) {
      console.error("Gagal mengambil data penyewa:", err);
      setError("Gagal memuat data penyewa dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenyewaAktif();
  }, []);

  // Format link WhatsApp dengan pesan otomatis
  const handleContactWA = (tenant, customMsg = false) => {
    const phone = tenant.phone;
    if (!phone || phone === "-") {
      alert("Nomor telepon tidak tersedia.");
      return;
    }
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }

    let defaultMsg = `Halo Kak ${tenant.name}, kami dari pengelola ${tenant.room}. Ada hal yang ingin kami informasikan mengenai sewa hunian Anda.`;
    if (customMsg) {
      defaultMsg = `Halo Kak ${tenant.name}, pengingat bahwa masa sewa hunian ${tenant.room} akan berakhir pada ${formatDateIndo(tenant.endDate)}. Mohon konfirmasi untuk perpanjangan sewa ya! Terima kasih.`;
    }

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultMsg)}`, '_blank');
  };

  // Logika Filter & Search
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tenant.room.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm);

    const matchesStatus = filterStatus === "Semua" ? true : tenant.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Kalkulasi Summary Card
  const totalAktif = tenants.filter(t => t.status === "Aktif" || t.status === "Baru").length;
  const totalAkanHabis = tenants.filter(t => t.status === "Akan Habis").length;
  const totalBaru = tenants.filter(t => t.status === "Baru").length;

  return (
    <SidebarAdmin>
      <div className="flex h-screen bg-[#FAF5EF] font-sans text-slate-800 overflow-hidden relative">
        
        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 animate-fadeIn">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#261C19] tracking-tight flex items-center gap-2">
                  <span>Data Penyewa Aktif</span>
                  <span className="text-xs bg-[#B38E5D]/15 text-[#B38E5D] border border-[#B38E5D]/30 px-3 py-1 rounded-full font-semibold">
                    Realtime System
                  </span>
                </h1>
                <p className="text-slate-500 mt-1 text-sm">Kelola data penghuni, durasi sewa, dan batas masa aktif kontrak kost/kontrakan.</p>
              </div>
              
              <button 
                onClick={fetchPenyewaAktif}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#B38E5D]/20 cursor-pointer"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                <span>Refresh Data</span>
              </button>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="mb-6 p-4 bg-rose-100 border border-rose-300 text-rose-700 rounded-2xl text-sm font-medium flex justify-between items-center shadow-sm animate-bounce">
                <span className="flex items-center gap-2">⚠️ {error}</span>
                <button onClick={fetchPenyewaAktif} className="underline font-bold hover:text-rose-900 cursor-pointer">Coba Lagi</button>
              </div>
            )}

            {/* SUMMARY CARDS WITH INTERACTIVE HOVER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Card 1 */}
              <div 
                onClick={() => setFilterStatus("Semua")}
                className={`bg-white p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-1 ${
                  filterStatus === "Semua" ? "border-[#B38E5D] ring-2 ring-[#B38E5D]/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full">Aktif</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Penghuni</p>
                <h3 className="text-3xl font-black text-[#261C19] mt-1">{loading ? "..." : `${totalAktif} Orang`}</h3>
              </div>
              
              {/* Card 2 (Akan Habis - Diubah jadi Merah/Rose) */}
              <div 
                onClick={() => setFilterStatus("Akan Habis")}
                className={`bg-white p-6 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer hover:-translate-y-1 ${
                  filterStatus === "Akan Habis" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full">&lt; 30 Hari</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Kontrak Segera Habis</p>
                <h3 className="text-3xl font-black text-[#261C19] mt-1">{loading ? "..." : `${totalAkanHabis} Penghuni`}</h3>
              </div>
              
              {/* Card 3 */}
              <div 
                onClick={() => setFilterStatus("Baru")}
                className={`bg-[#261C19] p-6 rounded-2xl border transition-all duration-300 shadow-lg hover:-translate-y-1 relative overflow-hidden cursor-pointer ${
                  filterStatus === "Baru" ? "ring-2 ring-[#B38E5D]" : ""
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-[#B38E5D]/20 text-[#B38E5D] rounded-xl">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-[#B38E5D]/30 text-[#FAF5EF] rounded-full">Baru</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#D7C4B0]">Penghuni Baru (7 Hari)</p>
                  <h3 className="text-3xl font-black text-[#FAF5EF] mt-1">{loading ? "..." : `${totalBaru} Orang`}</h3>
                </div>
                <svg className="absolute bottom-0 right-0 w-32 h-24 text-[#3D2D29] opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100"><path fill="currentColor" d="M0,100 C20,80 40,90 60,60 C80,30 90,40 100,20 L100,100 Z" /></svg>
              </div>
            </div>

            {/* TABEL DATA PENYEWA */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#FAF5EF]/40">
                
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#261C19]">Daftar Penyewa</h2>
                  <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                    {filteredTenants.length}
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* Search Bar Input */}
                  <div className="relative w-full sm:w-72">
                    <input 
                      type="text"
                      placeholder="Cari nama, kamar, no hp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-xl pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-[#B38E5D]/40 transition"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
                    )}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2 outline-none shadow-sm focus:ring-2 focus:ring-[#B38E5D]/40 cursor-pointer"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Baru">Baru Masuk</option>
                      <option value="Akan Habis">Akan Habis</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TABLE BODY */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nama Penghuni</th>
                      <th className="px-6 py-4">Properti / Unit</th>
                      <th className="px-6 py-4">Tanggal Masuk</th>
                      <th className="px-6 py-4">Durasi</th>
                      <th className="px-6 py-4">Batas Kontrak</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center text-slate-500 font-medium">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-3 border-[#B38E5D] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-400 font-medium text-xs">Memuat data penyewa aktif...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredTenants.length > 0 ? (
                      filteredTenants.map((tenant, index) => (
                        <tr 
                          key={tenant.id || index} 
                          className="hover:bg-[#FAF5EF]/60 transition-all duration-200 group cursor-pointer"
                          onClick={() => setSelectedTenant(tenant)}
                        >
                          {/* Nama */}
                          <td className="px-6 py-4 font-bold text-[#261C19]">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#FAF5EF] text-[#B38E5D] border border-[#D7C4B0] flex items-center justify-center font-bold text-xs uppercase shadow-xs group-hover:bg-[#B38E5D] group-hover:text-white transition-colors">
                                {tenant.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-[#261C19] group-hover:text-[#B38E5D] transition-colors">{tenant.name}</p>
                                <p className="text-xs text-slate-400 font-normal">{tenant.phone}</p>
                              </div>
                            </div>
                          </td>

                          {/* Kamar */}
                          <td className="px-6 py-4 text-slate-700 font-semibold">{tenant.room}</td>

                          {/* Tanggal Masuk */}
                          <td className="px-6 py-4 text-slate-500 font-medium">{formatDateIndo(tenant.entryDate)}</td>

                          {/* Durasi */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                              {tenant.duration} Bulan
                            </span>
                          </td>

                          {/* Batas Kontrak */}
                          <td className="px-6 py-4 font-bold text-[#B38E5D]">
                            {formatDateIndo(tenant.endDate)}
                          </td>

                          {/* Status Badge (Akan Habis diubah jadi merah/rose) */}
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              tenant.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800' :
                              tenant.status === 'Baru' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                tenant.status === 'Aktif' ? 'bg-emerald-500' :
                                tenant.status === 'Baru' ? 'bg-blue-500' : 'bg-rose-500'
                              }`}></span>
                              {tenant.status}
                            </span>
                          </td>

                          {/* Aksi Button */}
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleContactWA(tenant)}
                                className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition border border-emerald-200/80 flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer" 
                                title="Chat WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                                <span>WA</span>
                              </button>

                              <button 
                                onClick={() => setSelectedTenant(tenant)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-[#261C19] hover:text-white rounded-xl transition border border-slate-200 active:scale-95 cursor-pointer"
                              >
                                Detail
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                          Tidak ada data penyewa yang cocok dengan kriteria pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Footer info */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <div>Menampilkan <b>{filteredTenants.length}</b> dari <b>{tenants.length}</b> penyewa aktif</div>
              </div>
              
            </div>
          </div>
        </main>

        {/* ================= MODAL DETAIL PENYEWA (INTERAKTIF) ================= */}
        {selectedTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100 transition-all transform scale-100">
              
              {/* Modal Header */}
              <div className="bg-[#261C19] p-6 text-white flex justify-between items-start relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B38E5D] bg-[#B38E5D]/20 px-3 py-1 rounded-full border border-[#B38E5D]/30">
                    Rincian Penyewa
                  </span>
                  <h3 className="text-2xl font-black mt-2 text-[#FAF5EF]">{selectedTenant.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">{selectedTenant.room}</p>
                </div>
                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm transition cursor-pointer relative z-10"
                >
                  ✕
                </button>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#B38E5D]/10 rounded-full blur-2xl"></div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-[#FAF5EF] p-4 rounded-2xl border border-[#D7C4B0]/40">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon / WA</p>
                    <p className="font-bold text-[#261C19] text-sm mt-0.5">{selectedTenant.phone}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                    <p className="font-bold text-[#261C19] text-sm mt-0.5 truncate">{selectedTenant.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Tanggal Check-In</span>
                    <span className="font-bold text-slate-800">{formatDateIndo(selectedTenant.entryDate)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Durasi Sewa</span>
                    <span className="font-bold text-slate-800">{selectedTenant.duration} Bulan</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Batas Akhir Kontrak</span>
                    <span className="font-extrabold text-[#B38E5D]">{formatDateIndo(selectedTenant.endDate)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Total Biaya Sewa</span>
                    <span className="font-black text-emerald-700 text-base">{formatRupiah(selectedTenant.totalPrice)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Status Pembayaran</span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
                      {selectedTenant.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Reminder Alert if contract near end (Diubah jadi merah/rose) */}
                {selectedTenant.status === 'Akan Habis' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between">
                    <span>⚠️ Masa sewa akan berakhir kurang dari 30 hari lagi!</span>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => handleContactWA(selectedTenant, selectedTenant.status === 'Akan Habis')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  <span>Kirim WhatsApp</span>
                </button>

                <button 
                  onClick={() => setSelectedTenant(null)}
                  className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </SidebarAdmin>
  );
}