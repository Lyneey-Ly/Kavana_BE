import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

import { kafanaWarning, kafanaConfirm } from '../components/kafanaAlert';

export default function SidebarUser({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk Mobile Drawer & Desktop Collapse
  const [isOpen, setIsOpen] = useState(false); // Mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Hide/Collapse
  
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Cek Status Login
  const token = sessionStorage.getItem('token');

  // 👤 AMBIL DATA PROFIL USER DARI SESSION STORAGE / BACKEND
  useEffect(() => {
    if (token) {
      const savedUser = sessionStorage.getItem('user');
      if (savedUser) {
        try {
          setUserProfile(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user session:', e);
        }
      }

      API.get('/profile')
        .then((res) => {
          if (res.data?.data) {
            setUserProfile(res.data.data);
            sessionStorage.setItem('user', JSON.stringify(res.data.data));
          }
        })
        .catch(() => {
          // Silent catch
        });
    }
  }, [token]);

  // Handle Logout dengan SweetAlert Konfirmasi
  const handleLogout = async () => {
    const isConfirmed = await kafanaConfirm(
      'Konfirmasi Keluar',
      'Apakah kamu yakin ingin mengakhiri sesi di KafanaVista?',
      'Ya, Keluar'
    );

    if (isConfirmed) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      navigate('/login');
    }
  };

  // 🌟 LOGIKA NAVIGASI DOKUMEN SEWA (DENGAN KAFANA ALERT)
  const handleNavDokumenSewa = async (e) => {
    e.preventDefault();
    setLoadingDoc(true);

    try {
      const res = await API.get('/pemesanan/riwayat');
      const riwayat = res.data?.data || [];

      const itemAktif = riwayat.find(
        (p) => p.dokumen_sewa || p.dokumenSewa || p.status === 'Dikonfirmasi'
      );

      const docId =
        itemAktif?.dokumen_sewa?.id ||
        itemAktif?.dokumenSewa?.id ||
        itemAktif?.id;

      if (docId) {
        navigate(`/dokumen-sewa/${docId}`);
      } else {
        await kafanaWarning(
          'Dokumen Belum Tersedia',
          'Kamu belum memiliki Dokumen Sewa aktif. Silakan selesaikan pemesanan terlebih dahulu.'
        );
        navigate('/riwayattransaksi');
      }
    } catch (err) {
      console.error('Gagal membuka dokumen sewa:', err);
      navigate('/riwayattransaksi');
    } finally {
      setLoadingDoc(false);
      setIsOpen(false);
    }
  };

  // 🔴 JIKA BELUM LOGIN: Render Navbar Sederhana untuk Tamu
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF5EF]">
        <header className="bg-[#261C19] text-[#FAF5EF] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
          <div className="text-xl font-bold tracking-wider font-serif">
            Kafana<span className="text-[#B38E5D] font-light">Vista</span>
          </div>
          <div className="flex gap-3">
            <Link 
              to="/landingpages" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF5EF] hover:text-[#B38E5D] transition"
            >
              Pendaftar Properti
            </Link>
            <Link 
              to="/PusatBantuan" 
              className="px-4 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md"
            >
              Pusat Bantuan
            </Link>
            <Link 
              to="/login" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF5EF] hover:text-[#B38E5D] transition"
            >
              Masuk
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md"
            >
              Daftar
            </Link>
          </div>
        </header>
        
        <main className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    );
  }

  // 🟢 MENU NAVIGASI
  const menuItems = [
    { name: 'Beranda', path: '/home', icon: '🏠' },
    { name: 'Cari hunian', path: '/carihunian', icon: '🔍' },
    { name: 'Wishlist', path: '/whislist', icon: '❤️' },
    { name: 'Riwayat Booking', path: '/riwayattransaksi', icon: '📋' },
    { name: 'FinanceTracker', path: '/FinanceTracker', icon: '💰' },
    { name: 'RoomChat', path: '/roomchat', icon: '💬' },
    { name: 'Dokumen Sewa', path: '/dokumen-sewa', icon: '📜', isCustomAction: true },
    { name: 'Complain', path: '/komplain', icon: '⚠️' },
    { name: 'Testimoni', path: '/testimoni', icon: '⭐' },
    { name: 'Pusat bantuan', path: '/PusatBantuan', icon: '❓' },
  ];

  // Helper Foto Profil
  const avatarUrl = userProfile?.foto 
    ? (userProfile.foto.startsWith('http') ? userProfile.foto : `http://localhost:8000/storage/${userProfile.foto}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.nama || userProfile?.name || 'User')}&background=B38E5D&color=fff&bold=true`;

  return (
    <div className="flex h-screen bg-[#FAF5EF] overflow-hidden">
      
      {/* 🟢 SIDEBAR DESKTOP (RESPONSIF & BISA COLLAPSE/SEMBUNYI) */}
      <aside 
        className={`hidden md:flex flex-col bg-[#261C19] text-[#FAF5EF] border-r border-[#B38E5D]/20 h-full flex-shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        
        {/* Brand Header & Toggle Button */}
        <div className="p-4 border-b border-[#B38E5D]/20 flex justify-between items-center min-h-[70px]">
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="text-xl font-bold font-serif tracking-wider">
                Kafana<span className="text-[#B38E5D] font-light">Vista</span>
              </h1>
              <p className="text-[8px] text-[#D7C4B0] uppercase tracking-widest mt-0.5">Luxury Living</p>
            </div>
          )}

          {/* Tombol Toggle Sembunyikan/Buka Sidebar Desktop */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl text-[#FAF5EF]/70 hover:text-white hover:bg-[#FAF5EF]/10 transition cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? "Sembunyikan / Perluas Sidebar" : "Kecilkan Sidebar"}
          >
            {isCollapsed ? '⏩' : '⏪'}
          </button>
        </div>

        {/* KARTU PROFIL USER */}
        <div className="p-3 border-b border-[#B38E5D]/20 bg-[#211715]/60">
          <Link 
            to="/profile" 
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF5EF]/5 transition-all group ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? userProfile?.nama || 'Profil' : ''}
          >
            <div className="relative flex-shrink-0">
              <img 
                src={avatarUrl} 
                alt="Profile User" 
                className="w-10 h-10 rounded-full object-cover border-2 border-[#B38E5D] shadow-md group-hover:scale-105 transition duration-300"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.nama || 'User')}&background=B38E5D&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#261C19] rounded-full"></span>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-white truncate group-hover:text-[#B38E5D] transition">
                  {userProfile?.nama || userProfile?.name || 'Penghuni Kafana'}
                </h2>
                <p className="text-[10px] text-[#D7C4B0]/70 truncate">
                  {userProfile?.email || 'user@kafanavista.com'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#B38E5D]/20 text-[#B38E5D] border border-[#B38E5D]/30 text-[9px] font-semibold rounded-full">
                  ✨ Penghuni
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

            if (item.isCustomAction) {
              return (
                <button
                  key={item.name}
                  onClick={handleNavDokumenSewa}
                  disabled={loadingDoc}
                  title={isCollapsed ? item.name : ''}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-[#FAF5EF]/70 hover:bg-[#FAF5EF]/10 hover:text-white text-left cursor-pointer ${
                    loadingDoc ? 'opacity-50 cursor-wait' : ''
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{loadingDoc ? 'Memuat...' : item.name}</span>}
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-[#B38E5D] text-white shadow-lg shadow-[#B38E5D]/20 scale-[1.01]'
                    : 'text-[#FAF5EF]/70 hover:bg-[#FAF5EF]/10 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-[#B38E5D]/20">
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar' : ''}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-900/20 hover:bg-rose-600 border border-rose-800/40 hover:border-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition duration-300 cursor-pointer shadow-sm ${
              isCollapsed ? 'px-0' : ''
            }`}
          >
            <span className="text-base">🚪</span> 
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* 📱 MOBILE OVERLAY & DRAWER */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-[#261C19] text-[#FAF5EF] z-50 transform transition-transform duration-300 md:hidden flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-5 border-b border-[#B38E5D]/20 flex justify-between items-center">
          <h1 className="text-xl font-bold font-serif">
            Kafana<span className="text-[#B38E5D]">Vista</span>
          </h1>
          <button onClick={() => setIsOpen(false)} className="text-xl p-1 text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Profil Mobile */}
        <div className="p-4 border-b border-[#B38E5D]/20 bg-[#211715]">
          <div className="flex items-center gap-3">
            <img 
              src={avatarUrl} 
              alt="User" 
              className="w-10 h-10 rounded-full object-cover border border-[#B38E5D]"
            />
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white truncate">{userProfile?.nama || userProfile?.name || 'User'}</h2>
              <p className="text-[10px] text-[#D7C4B0]/70 truncate">{userProfile?.email || ''}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (item.isCustomAction) {
              return (
                <button
                  key={item.name}
                  onClick={handleNavDokumenSewa}
                  disabled={loadingDoc}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#FAF5EF]/80 hover:bg-[#B38E5D] hover:text-white transition text-left cursor-pointer"
                >
                  <span>{item.icon}</span>
                  <span>{loadingDoc ? 'Memuat...' : item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#FAF5EF]/80 hover:bg-[#B38E5D] hover:text-white transition"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#B38E5D]/20">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Mobile Top */}
        <header className="md:hidden bg-[#261C19] text-white p-4 flex justify-between items-center shadow-md">
          <h1 className="font-serif font-bold text-lg">Kafana<span className="text-[#B38E5D]">Vista</span></h1>
          <button onClick={() => setIsOpen(true)} className="px-3 py-1.5 bg-[#B38E5D] rounded-lg text-xs font-bold cursor-pointer shadow">
            ☰ Menu
          </button>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}