import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { kafanaSuccess, kafanaError } from '../components/kafanaAlert';

function Login() {
  const [role, setRole] = useState('customer'); // 'customer', 'admin', atau 'superadmin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // =========================================================================
  // 🔌 CONFIG DYNAMIC ROLE (Endpoint, Route, Label & Color)
  // =========================================================================
  const roleConfig = {
    customer: {
      endpoint: '/customer/login',
      redirect: '/Home',
      title: 'CUSTOMER KAFANA',
      subtitle: 'Akses Layanan Penyewa & Finance',
      welcomeMessage: 'Sahabat hitam',
      btnColor: 'bg-[#261C19] hover:bg-[#3D2D29] shadow-[#261C19]/20',
      activeTab: 'bg-[#261C19] text-[#FAF5EF]',
      borderColor: 'border-[#261C19] text-[#261C19]',
    },
    admin: {
      endpoint: '/admin/login',
      redirect: '/admindashboard',
      title: 'ADMIN KAFANA',
      subtitle: 'Akses Dashboard Pengelola & Operasional',
      welcomeMessage: 'Admin Kafana',
      btnColor: 'bg-[#B38E5D] hover:bg-[#8F6E45] shadow-[#B38E5D]/20',
      activeTab: 'bg-[#B38E5D] text-white',
      borderColor: 'border-[#B38E5D] text-[#B38E5D]',
    },
    superadmin: {
      endpoint: '/superadmin/login',
      redirect: '/SuperAdminDashboard',
      title: 'SUPER ADMIN',
      subtitle: 'Akses Penuh Manajemen Sistem & Hak Akses',
      welcomeMessage: 'Super Admin Kafana',
      btnColor: 'bg-[#4C1D95] hover:bg-[#3B0764] shadow-[#4C1D95]/20',
      activeTab: 'bg-[#4C1D95] text-white',
      borderColor: 'border-[#4C1D95] text-[#4C1D95]',
    },
  };

  // =========================================================================
  // 🔌 FUNGSI SUBMIT LOGIN (Support Customer / Admin / Superadmin)
  // =========================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const currentConfig = roleConfig[role];

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      // Send data ke backend
      const response = await API.post(currentConfig.endpoint, formData);

      const token = response.data.token || response.data.access_token;
      const user = response.data.user;

      sessionStorage.setItem('token', token);
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }

      // Pop-up Alert Sukses
      await kafanaSuccess(
        'Login Berhasil! 🎉',
        `Selamat datang kembali, ${currentConfig.welcomeMessage}.`
      );

      // Redirect ke halaman tujuan sesuai role
      navigate(currentConfig.redirect);

    } catch (error) {
      console.error('Gagal Login:', error);
      const errorMessage = error.response?.data?.message || 'Email atau password salah!';
      kafanaError('Gagal Masuk System', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const activeConfig = roleConfig[role];

  return (
    <div className="flex min-h-screen bg-[#FAF5EF] w-full items-center justify-center p-4 font-sans selection:bg-[#B38E5D] selection:text-white">
      <div className="flex w-full max-w-[1100px] min-h-[680px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#D7C4B0]/60">
        
        {/* SISI KIRI: BANNER VISUAL */}
        <div className="hidden md:flex flex-1 bg-[#261C19] text-[#FAF5EF] p-12 flex-col justify-between items-center relative select-none">
          <div className="absolute inset-0 opacity-30 mix-blend-luminosity pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop" 
              alt="Building Architecture" 
              className="w-full h-full object-cover grayscale contrast-125 scale-105 transition-transform duration-1000 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#261C19] via-[#261C19]/40 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full flex justify-between items-center">
            <span className="text-xs font-mono tracking-widest text-[#B38E5D] uppercase">Kafana Vista System</span>
            <span className="px-3 py-1 bg-[#B38E5D]/20 border border-[#B38E5D]/40 rounded-full text-[10px] text-[#D7C4B0] font-semibold tracking-wider uppercase">
              v2.5
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center my-auto">
            <div className="mb-6 p-4 bg-[#261C19]/80 border border-[#B38E5D]/30 rounded-2xl backdrop-blur-md shadow-xl">
              <svg className="w-16 h-16 text-[#B38E5D]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
                <path d="M72 20L56 50L61 57L79 25H72Z" fill="currentColor" />
                <path d="M81 60L70 77L75 80L88 60H81Z" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-3xl font-light tracking-[0.25em] uppercase font-mono text-[#FAF5EF]">KAFANA VISTA</h1>
            <p className="text-xs text-[#D7C4B0] mt-3 tracking-widest uppercase font-sans max-w-xs">Elegance & Comfort in Property Management</p>
          </div>

          <div className="relative z-10 text-[11px] text-[#D7C4B0]/60 tracking-wider">
            Sistem Informasi Pengelolaan Hunian Modern
          </div>
        </div>

        {/* SISI KANAN: FORM LOGIN DENGAN TOGGLE 3 ROLE */}
        <div className="flex-1 bg-white p-6 sm:p-8 md:p-12 flex flex-col justify-between items-center text-[#261C19]">
          <div className="w-full max-w-[400px] mx-auto my-auto space-y-5">
            
            {/* Header Login */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">Selamat Datang</h2>
              <p className="text-xs text-gray-500 font-sans">Silakan pilih akses role Anda untuk melanjutkan</p>
            </div>

            {/* TOGGLE TAB CUSTOMER VS ADMIN VS SUPER ADMIN */}
            <div className="bg-[#FAF5EF] p-1 rounded-xl border border-[#D7C4B0]/50 flex gap-1 shadow-inner">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  role === 'customer' ? activeConfig.activeTab + ' shadow-md scale-[1.02]' : 'text-gray-500 hover:text-[#261C19]'
                }`}
              >
                👤 Customer
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  role === 'admin' ? activeConfig.activeTab + ' shadow-md scale-[1.02]' : 'text-gray-500 hover:text-[#261C19]'
                }`}
              >
                🔑 Admin
              </button>
              <button
                type="button"
                onClick={() => setRole('superadmin')}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                  role === 'superadmin' ? activeConfig.activeTab + ' shadow-md scale-[1.02]' : 'text-gray-500 hover:text-[#261C19]'
                }`}
              >
                👑 Super Admin
              </button>
            </div>

            {/* Visual Karakter Sesuai Role */}
            <div className="flex flex-col items-center text-center space-y-2 py-1">
              <div className={`w-14 h-14 bg-white border-2 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${activeConfig.borderColor}`}>
                {role === 'superadmin' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 1 12 2.714Z" />
                  </svg>
                ) : role === 'admin' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wide">
                  {activeConfig.title}
                </h3>
                <p className="text-[10px] text-gray-500 font-medium">
                  {activeConfig.subtitle}
                </p>
              </div>
            </div>

            {/* FORM LOGIN */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">Email</label>
                <input 
                  type="email" 
                  placeholder="contoh@email.com" 
                  className="w-full px-4 py-2 bg-[#FAF5EF]/40 border border-[#D7C4B0] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#B38E5D] focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full px-4 py-2 bg-[#FAF5EF]/40 border border-[#D7C4B0] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#B38E5D] focus:border-transparent transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {/* Tombol Submit Utama */}
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full text-white py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md duration-300 disabled:opacity-50 mt-2 cursor-pointer ${activeConfig.btnColor}`}
              >
                {loading ? 'MEMPROSES...' : `MASUK SEBAGAI ${role.toUpperCase()}`}
              </button>

            </form>

            <div className="text-center text-xs font-medium text-gray-600 pt-1">
              <span>Belum bergabung? </span>
              <Link to="/register" className="underline font-bold text-[#261C19] hover:text-[#B38E5D] transition">
                Daftar Akun Baru
              </Link>
            </div>
          </div>
          
          <div className="text-center text-[10px] font-semibold text-gray-400 uppercase mt-4 tracking-wider">
            © 2026 KAFANA VISTA. Hak Cipta Dilindungi.
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;