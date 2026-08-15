import { useState, useEffect, useCallback } from 'react';
import API from '../api';
import Swal from 'sweetalert2';

export default function SuperAdminDashboard() {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | administrators | users | revenue | transactions
  const [loading, setLoading] = useState(true);

  // Stats & Main Data
  const [stats, setStats] = useState({ total_users: 0, total_pemilik: 0, total_superadmin: 0 });
  const [platformStats, setPlatformStats] = useState(null);
  const [administrators, setAdministrators] = useState([]);
  const [adminRoleFilter, setAdminRoleFilter] = useState('');
  const [users, setUsers] = useState([]);

  // Revenue State
  const [revenueData, setRevenueData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [adminList, setAdminList] = useState([]);
  const [txFilters, setTxFilters] = useState({
    search: '',
    status: 'semua',
    year: new Date().getFullYear(),
    month: '',
    admin_id: '',
    page: 1,
  });

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin',
    foto: null,
  });

  // --- FETCHERS ---
  const fetchOverviewStats = useCallback(async () => {
    try {
      const resStats = await API.get('/superadmin/stats');
      setStats(resStats.data.data);
    } catch (err) {
      console.error('Gagal memuat statistik umum', err);
    }
  }, []);

  const fetchPlatformStats = useCallback(async () => {
    try {
      const res = await API.get(`/superadmin/platform-stats?year=${selectedYear}`);
      setPlatformStats(res.data.data);
    } catch (err) {
      console.error('Gagal memuat statistik platform', err);
    }
  }, [selectedYear]);

  const fetchAdministrators = useCallback(async () => {
    try {
      const url = adminRoleFilter
        ? `/superadmin/administrators?role=${adminRoleFilter}`
        : '/superadmin/administrators';
      const res = await API.get(url);
      setAdministrators(res.data.data);
    } catch (err) {
      console.error('Gagal memuat data administrator', err);
    }
  }, [adminRoleFilter]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await API.get('/superadmin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Gagal memuat data user', err);
    }
  }, []);

  const fetchRevenueData = useCallback(async () => {
    try {
      const res = await API.get(`/superadmin/admin-revenue?year=${selectedYear}`);
      setRevenueData(res.data.data);
    } catch (err) {
      console.error('Gagal memuat pendapatan admin', err);
    }
  }, [selectedYear]);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: txFilters.page,
        year: txFilters.year,
        ...(txFilters.status !== 'semua' && { status: txFilters.status }),
        ...(txFilters.month && { month: txFilters.month }),
        ...(txFilters.admin_id && { admin_id: txFilters.admin_id }),
        ...(txFilters.search && { search: txFilters.search }),
      });
      const res = await API.get(`/superadmin/transactions?${params.toString()}`);
      setTransactions(res.data.data.transactions);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Gagal memuat transaksi', err);
    }
  }, [txFilters]);

  const fetchAdminList = useCallback(async () => {
    try {
      const res = await API.get('/superadmin/admin-list');
      setAdminList(res.data.data);
    } catch (err) {
      console.error('Gagal memuat daftar admin', err);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchOverviewStats(),
      fetchPlatformStats(),
      fetchAdministrators(),
      fetchUsers(),
      fetchRevenueData(),
      fetchTransactions(),
      fetchAdminList(),
    ]).finally(() => setLoading(false));
  }, [fetchOverviewStats, fetchPlatformStats, fetchAdministrators, fetchUsers, fetchRevenueData, fetchTransactions, fetchAdminList]);

  // Refetch on Filter Changes
  useEffect(() => { fetchAdministrators(); }, [fetchAdministrators]);
  useEffect(() => { fetchPlatformStats(); fetchRevenueData(); }, [fetchPlatformStats, fetchRevenueData, selectedYear]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions, txFilters]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'foto') {
      setFormData((prev) => ({ ...prev, foto: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAdministrator = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('role', formData.role);
      if (formData.foto) data.append('foto', formData.foto);

      const res = await API.post('/superadmin/administrators', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Akun pengelola berhasil ditambahkan.',
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({ name: '', email: '', phone: '', password: '', role: 'admin', foto: null });
      setShowModal(false);
      fetchAdministrators();
      fetchOverviewStats();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambah Akun',
        text: error.response?.data?.message || 'Gagal menyimpan data baru!',
        confirmButtonColor: '#B38E5D',
      });
    }
  };

  const handleDeleteAdministrator = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus Akun Pengelola?',
      text: `Apakah Anda yakin ingin menghapus akun ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/superadmin/administrators/${id}`);
        Swal.fire('Terhapus!', 'Akun berhasil dihapus.', 'success');
        fetchAdministrators();
        fetchOverviewStats();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
      }
    }
  };

  const handleDeleteUser = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus User Platform?',
      text: `Menghapus ${name} akan menghentikan akses akun ini dari aplikasi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Ya, Hapus User!',
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/superadmin/users/${id}`);
        Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success');
        fetchUsers();
        fetchOverviewStats();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
      }
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="p-6 lg:p-8 w-full text-[#261C19] font-sans min-h-screen bg-[#FAF5EF]">
      {/* HEADER SECTION */}
      <header className="mb-8 bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest block mb-1">
            Control Panel
          </span>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-[#261C19]">
            Dashboard Superadmin
          </h1>
          <p className="text-[#5C4A42] text-sm mt-1">
            Monitoring seluruh pengguna, statistik platform, omzet pemilik kost, dan transaksi.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <span>➕</span> Tambah Pengelola Baru
        </button>
      </header>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pencari Kost</p>
            <h3 className="text-2xl font-black text-[#261C19]">{stats.total_users}</h3>
          </div>
          <div className="w-10 h-10 bg-[#FAF5EF] rounded-xl flex items-center justify-center text-xl border border-[#D7C4B0]/50">👥</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemilik Kost</p>
            <h3 className="text-2xl font-black text-[#261C19]">{stats.total_pemilik}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-200">🏢</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Okupansi Kamar</p>
            <h3 className="text-2xl font-black text-[#261C19]">
              {platformStats?.property_stats?.occupancy_rate || 0}%
            </h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-200">🛏️</div>
        </div>

        <div className="bg-[#261C19] text-white p-5 rounded-2xl border border-[#3D2D29] shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Superadmin</p>
            <h3 className="text-2xl font-black text-[#FAF5EF]">{stats.total_superadmin}</h3>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/20">🛡️</div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex overflow-x-auto border-b border-[#D7C4B0] mb-6 gap-2">
        {[
          { id: 'analytics', label: '📊 Analitik Platform' },
          { id: 'administrators', label: `📋 Pengelola (${administrators.length})` },
          { id: 'users', label: `📱 User (${users.length})` },
          { id: 'revenue', label: '💰 Pendapatan Pemilik' },
          { id: 'transactions', label: '🧾 Semua Transaksi' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#B38E5D] text-[#B38E5D]'
                : 'border-transparent text-slate-500 hover:text-[#261C19]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- TAB 1: ANALITIK PLATFORM --- */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#D7C4B0]">
            <h2 className="font-bold text-[#261C19]">Performa Platform</h2>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span>Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-[#D7C4B0] p-1.5 rounded-lg bg-[#FAF5EF]"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 Admins */}
            <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0]">
              <h3 className="font-bold text-sm mb-4">🏆 Top 5 Pemilik Kost (Omzet)</h3>
              <div className="space-y-3">
                {platformStats?.top_admins?.map((item, idx) => (
                  <div key={item.admin_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold mr-2 text-[#B38E5D]">#{idx + 1}</span>
                      <span className="font-bold">{item.admin_name}</span>
                      <p className="text-slate-400 text-[10px]">{item.bookings} Booking</p>
                    </div>
                    <span className="font-black text-[#261C19]">{formatRupiah(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Properties */}
            <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0]">
              <h3 className="font-bold text-sm mb-4">⭐ Top 5 Properti Kost Terlaris</h3>
              <div className="space-y-3">
                {platformStats?.top_properties?.map((item, idx) => (
                  <div key={item.property_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold mr-2 text-[#B38E5D]">#{idx + 1}</span>
                      <span className="font-bold">{item.property_name}</span>
                      <p className="text-slate-400 text-[10px]">{item.bookings} Pemesanan</p>
                    </div>
                    <span className="font-black text-[#261C19]">{formatRupiah(item.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: DAFTAR PENGELOLA --- */}
      {activeTab === 'administrators' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
            <h2 className="font-bold text-[#261C19] text-base">Akun Administrator & Pemilik Kost</h2>
            <select
              value={adminRoleFilter}
              onChange={(e) => setAdminRoleFilter(e.target.value)}
              className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
            >
              <option value="">Semua Role</option>
              <option value="admin">Pemilik Kost (Admin)</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Pengelola</th>
                  <th className="px-6 py-3.5">Kontak</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Terdaftar</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {administrators.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {item.foto ? (
                        <img src={`/storage/${item.foto}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">
                          {item.name[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-[#261C19]">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.role === 'superadmin' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.role === 'superadmin' ? 'Superadmin' : 'Pemilik Kost'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteAdministrator(item.id, item.name)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: USER TERDAFTAR --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
            <h2 className="font-bold text-[#261C19] text-base">Daftar Pengguna Website</h2>
            <span className="text-xs text-slate-500 font-bold uppercase">Total: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Tanggal Bergabung</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">#{user.id}</td>
                    <td className="px-6 py-4 font-bold text-[#261C19]">{user.name}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200"
                      >
                        🗑️ Hapus User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 4: PENDAPATAN PEMILIK --- */}
      {activeTab === 'revenue' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-[#261C19]">Ringkasan Pendapatan Pemilik Kost ({selectedYear})</h2>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Pendapatan Platform:</span>
              <span className="text-xl font-black text-[#B38E5D]">
                {formatRupiah(revenueData?.summary?.total_platform_revenue)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {revenueData?.admins?.map((admin) => (
              <div key={admin.admin_id} className="border border-[#D7C4B0] p-4 rounded-xl bg-[#FAF5EF]/30">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bold text-[#261C19]">{admin.admin_name}</h3>
                    <p className="text-xs text-slate-500">{admin.admin_email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 block">{admin.yearly_bookings} Booking</span>
                    <span className="font-extrabold text-[#261C19]">{formatRupiah(admin.yearly_total)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                  {admin.monthly_revenue.map((m) => (
                    <div key={m.month} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                      <span className="block text-slate-400 font-bold">{m.month_name}</span>
                      <span className="font-bold text-slate-700 block">{formatRupiah(m.revenue)}</span>
                      <span className="text-[10px] text-slate-400">{m.bookings} transaksi</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 5: SEMUA TRANSAKSI --- */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-[#FAF5EF]/50 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Cari Customer / Properti..."
              value={txFilters.search}
              onChange={(e) => setTxFilters({ ...txFilters, search: e.target.value, page: 1 })}
              className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
            />

            <select
              value={txFilters.status}
              onChange={(e) => setTxFilters({ ...txFilters, status: e.target.value, page: 1 })}
              className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
              <option value="Dikonfirmasi">Dikonfirmasi</option>
              <option value="Dibatalkan">Dibatalkan</option>
            </select>

            <select
              value={txFilters.admin_id}
              onChange={(e) => setTxFilters({ ...txFilters, admin_id: e.target.value, page: 1 })}
              className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
            >
              <option value="">Semua Pemilik Kost</option>
              {adminList.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>

            <select
              value={txFilters.month}
              onChange={(e) => setTxFilters({ ...txFilters, month: e.target.value, page: 1 })}
              className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
            >
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Bulan {i + 1}
                </option>
              ))}
            </select>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">ID / Tanggal</th>
                  <th className="px-6 py-3.5">Penyewa</th>
                  <th className="px-6 py-3.5">Properti & Kamar</th>
                  <th className="px-6 py-3.5">Pemilik Kost</th>
                  <th className="px-6 py-3.5">Total Harga</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition text-xs">
                    <td className="px-6 py-4">
                      <div className="font-bold">#{tx.id}</div>
                      <div className="text-slate-400">{tx.booking_date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{tx.customer?.name || '-'}</div>
                      <div className="text-slate-400">{tx.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#261C19]">{tx.properti?.title || '-'}</div>
                      <div className="text-slate-400">Kamar: {tx.kamar?.nomor_kamar || '-'}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">{tx.properti?.pemilik?.name || '-'}</td>
                    <td className="px-6 py-4 font-black text-[#261C19]">{formatRupiah(tx.total_price)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.status === 'Dikonfirmasi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span>
              Menampilkan {transactions.length} dari {pagination.total || 0} transaksi
            </span>
            <div className="flex gap-2">
              <button
                disabled={txFilters.page === 1}
                onClick={() => setTxFilters({ ...txFilters, page: txFilters.page - 1 })}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={txFilters.page >= pagination.last_page}
                onClick={() => setTxFilters({ ...txFilters, page: txFilters.page + 1 })}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PENGELOLA (WITH FOTO UPLOAD) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden">
            <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
              <h3 className="font-bold text-base font-serif tracking-wide">Pendaftaran Pengelola Baru</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAdministrator} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm bg-white">
                  <option value="admin">Pemilik Kost (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Lengkap</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">No. Telepon / WA</label>
                <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
                <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Foto Profil (Opsional)</label>
                <input type="file" name="foto" accept="image/*" onChange={handleInputChange} className="w-full text-xs text-slate-500" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs uppercase text-slate-600">
                  Batal
                </button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-[#B38E5D] text-white font-bold text-xs uppercase shadow-md">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}