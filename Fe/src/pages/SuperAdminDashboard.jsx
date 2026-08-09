import { useState, useEffect, useCallback } from 'react';
import API from '../api'; // Helper Axios yang sudah disetting BaseURL & Bearer Token
import Swal from 'sweetalert2';

export default function SuperAdminDashboard() {
  // 1. STATE MANAGEMENT
  const [stats, setStats] = useState({
    total_users: 0,
    total_pemilik: 0,
    total_superadmin: 0
  });
  const [administrators, setAdministrators] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'admins' | 'users'

  // State Modal Tambah Pengelola
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'pemilik' // Default 'pemilik' atau 'admin'
  });

  // =========================================================================
  // 🔌 2. FETCH DATA FROM BACKEND API
  // =========================================================================
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Ambil data secara paralel menggunakan Promise.all
      const [resStats, resAdmins, resUsers] = await Promise.all([
        API.get('/superadmin/stats'),
        API.get('/superadmin/administrators'),
        API.get('/superadmin/users')
      ]);

      setStats(resStats.data.data);
      setAdministrators(resAdmins.data.data);
      setUsers(resUsers.data.data);
    } catch (error) {
      console.error('Gagal mengambil data dashboard:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: error.response?.data?.message || 'Gagal terhubung ke server Backend!',
        confirmButtonColor: '#B38E5D'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // =========================================================================
  // ✍️ 3. HANDLER FORM TAMBAH AKUN PENGELOLA
  // =========================================================================
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAdministrator = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/superadmin/administrators', formData);

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Akun pengelola berhasil ditambahkan.',
        timer: 2000,
        showConfirmButton: false
      });

      // Reset form & modal
      setFormData({ name: '', email: '', phone: '', password: '', role: 'pemilik' });
      setShowModal(false);

      // Refresh Data
      fetchDashboardData();
    } catch (error) {
      console.error('Gagal menambah pengelola:', error);
      const errMsg = error.response?.data?.message || 'Gagal menyimpan data baru!';
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambah Akun',
        text: errMsg,
        confirmButtonColor: '#B38E5D'
      });
    }
  };

  // =========================================================================
  // 🗑️ 4. HANDLER HAPUS AKUN PENGELOLA
  // =========================================================================
  const handleDeleteAdministrator = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus Akun Pengelola?',
      text: `Apakah Anda yakin ingin menghapus akun ${name}? Tindakan ini tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/superadmin/administrators/${id}`);

        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: 'Akun berhasil dihapus dari sistem.',
          timer: 1500,
          showConfirmButton: false
        });

        fetchDashboardData();
      } catch (error) {
        console.error('Gagal menghapus akun:', error);
        Swal.fire({
          icon: 'error',
          title: 'Gagal!',
          text: error.response?.data?.message || 'Terjadi kesalahan saat menghapus data.',
          confirmButtonColor: '#B38E5D'
        });
      }
    }
  };

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
            Monitoring seluruh pengguna, statistik platform, dan kelola akses pengelola.
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Total Users */}
        <div className="bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Users (Pencari Kost)</p>
            <h3 className="text-3xl font-black text-[#261C19]">{stats.total_users}</h3>
          </div>
          <div className="w-12 h-12 bg-[#FAF5EF] rounded-xl flex items-center justify-center text-2xl border border-[#D7C4B0]/50">
            👥
          </div>
        </div>

        {/* Total Pemilik Kost */}
        <div className="bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pemilik Kost</p>
            <h3 className="text-3xl font-black text-[#261C19]">{stats.total_pemilik}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl border border-emerald-200">
            🏢
          </div>
        </div>

        {/* Total Superadmin */}
        <div className="bg-[#261C19] text-white p-6 rounded-2xl border border-[#3D2D29] shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Total Superadmin</p>
            <h3 className="text-3xl font-black text-[#FAF5EF]">{stats.total_superadmin}</h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20">
            🛡️
          </div>
        </div>

      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-[#D7C4B0] mb-6 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#B38E5D] text-[#B38E5D]'
              : 'border-transparent text-slate-500 hover:text-[#261C19]'
          }`}
        >
          📋 Daftar Pengelola ({administrators.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === 'users'
              ? 'border-[#B38E5D] text-[#B38E5D]'
              : 'border-transparent text-slate-500 hover:text-[#261C19]'
          }`}
        >
          📱 User Terdaftar ({users.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KELOLA PENGELOLA (ADMIN & PEMILIK) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
            <h2 className="font-bold text-[#261C19] text-base">Akun Administrator & Pemilik Kost</h2>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total: {administrators.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Pengelola</th>
                  <th className="px-6 py-3.5">Kontak</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Terdaftar</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Memuat data pengelola...</td>
                  </tr>
                ) : administrators.length > 0 ? (
                  administrators.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#261C19]">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.phone}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.role === 'admin'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.role === 'admin' ? 'Superadmin' : 'Pemilik Kost'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteAdministrator(item.id, item.name)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition border border-rose-200 cursor-pointer"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Belum ada data pengelola terdaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MONITORING USER PENCARI KOST */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
            <h2 className="font-bold text-[#261C19] text-base">Daftar Pengguna Website</h2>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Nama Lengkap</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Tanggal Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">Memuat data user...</td>
                  </tr>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">#{user.id}</td>
                      <td className="px-6 py-4 font-bold text-[#261C19]">{user.name}</td>
                      <td className="px-6 py-4 text-slate-600">{user.email}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">Belum ada user yang mendaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH AKUN PENGELOLA BARU */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
              <h3 className="font-bold text-base font-serif tracking-wide">Pendaftaran Pengelola Baru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddAdministrator} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Role Pengelola
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#D7C4B0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#B38E5D]"
                >
                  <option value="pemilik">Pemilik Kost</option>
                  <option value="admin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Cth: Budi Santoso"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#D7C4B0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#B38E5D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Cth: budi@kafana.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#D7C4B0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#B38E5D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nomor Telepon / WA
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Cth: 081234567890"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#D7C4B0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#B38E5D]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password Minimal 8 Karakter
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#D7C4B0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#B38E5D]"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#B38E5D] hover:bg-[#8F6E45] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}