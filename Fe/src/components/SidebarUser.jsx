import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Heart,
  ClipboardList,
  Wallet,
  MessageSquare,
  FileText,
  AlertTriangle,
  Star,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Loader2,
  Sparkles,
  Building2,
  User,
  ExternalLink
} from 'lucide-react';
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
    }  {
      setLoadingDoc(false);
      setIsOpen(false);
    }
  };

  // 🟢 MENU NAVIGASI DENGAN LUCIDE VECTOR ICONS
  const menuItems = [
    { name: 'Beranda', path: '/home', icon: Home },
    { name: 'Cari hunian', path: '/carihunian', icon: Search },
    { name: 'Wishlist', path: '/whislist', icon: Heart },
    { name: 'Riwayat Booking', path: '/riwayattransaksi', icon: ClipboardList },
    { name: 'FinanceTracker', path: '/FinanceTracker', icon: Wallet },
    { name: 'RoomChat', path: '/roomchat', icon: MessageSquare },
    { name: 'Dokumen Sewa', path: '/dokumen-sewa', icon: FileText, isCustomAction: true },
    { name: 'Complain', path: '/komplain', icon: AlertTriangle },
    { name: 'Testimoni', path: '/testimoni', icon: Star },
    { name: 'Pusat bantuan', path: '/PusatBantuan', icon: HelpCircle },
  ];

  // Helper Foto Profil
  const avatarUrl = userProfile?.foto
    ? (userProfile.foto.startsWith('http') ? userProfile.foto : `http://localhost:8000/storage/${userProfile.foto}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.nama || userProfile?.name || 'User')}&background=B38E5D&color=fff&bold=true`;

  // 🔴 JIKA BELUM LOGIN: Header Modern Luxury untuk Tamu
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF5EF] text-[#261C19] flex flex-col">
        <header className="bg-[#261C19]/95 backdrop-blur-md text-[#FAF5EF] px-6 py-4 flex items-center justify-between sticky top-0 z-40 border-b border-[#B38E5D]/20 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B38E5D] to-[#8F6E45] flex items-center justify-center text-white shadow-md shadow-[#B38E5D]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-wider font-serif">
                Kafana<span className="text-[#B38E5D] font-light">Vista</span>
              </div>
              <p className="text-[9px] text-[#B38E5D] uppercase tracking-widest font-sans font-semibold">Luxury Residence</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              to="/landingpages"
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF5EF]/80 hover:text-[#B38E5D] transition-colors rounded-lg hover:bg-white/5 hidden sm:inline-block"
            >
              Pendaftar Properti
            </Link>
            <Link
              to="/PusatBantuan"
              className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF5EF]/80 hover:text-[#B38E5D] transition-colors rounded-lg hover:bg-white/5 hidden sm:inline-block"
            >
              Pusat Bantuan
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF5EF] hover:text-[#B38E5D] transition-colors rounded-lg border border-[#B38E5D]/40 hover:border-[#B38E5D] bg-white/5"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] hover:from-[#9E7C50] hover:to-[#7E603B] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md shadow-[#B38E5D]/20 active:scale-95"
            >
              Daftar
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAF5EF] overflow-hidden font-sans">
      {/* 🟢 SIDEBAR DESKTOP (COLLAPSIBLE & PREMIUM INTERACTION) */}
      <aside
        className={`hidden md:flex flex-col bg-[#261C19] text-[#FAF5EF] border-r border-[#B38E5D]/20 h-full flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-30 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#B38E5D]/20 flex justify-between items-center min-h-[72px] relative">
          {!isCollapsed && (
            <div className="truncate transition-opacity duration-300">
              <h1 className="text-xl font-bold font-serif tracking-wider text-white">
                Kafana<span className="text-[#B38E5D] font-light">Vista</span>
              </h1>
              <p className="text-[8px] text-[#B38E5D] uppercase tracking-widest font-semibold">Luxury Living Suite</p>
            </div>
          )}

          {/* Toggle Button Collapse */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-xl text-[#FAF5EF]/70 hover:text-white hover:bg-[#B38E5D]/20 hover:border-[#B38E5D]/40 border border-transparent transition-all duration-200 cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5 text-[#B38E5D]" /> : <ChevronLeft className="w-5 h-5 text-[#B38E5D]" />}
          </button>
        </div>

        {/* 👤 KARTU PROFIL USER (GLASSMORPHISM ESTETIK) */}
        <div className="p-3 border-b border-[#B38E5D]/20 bg-[#1C1412]/60 backdrop-blur-md">
          <Link
            to="/profile"
            className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#B38E5D]/10 hover:border-[#B38E5D]/30 border border-transparent transition-all group relative ${
              isCollapsed ? 'justify-center' : ''
            }`}
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
              {/* Online status indicator with subtle pulse */}
              <span className="absolute bottom-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#261C19]"></span>
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-white truncate group-hover:text-[#B38E5D] transition-colors">
                  {userProfile?.nama || userProfile?.name || 'Penghuni Kafana'}
                </h2>
                <p className="text-[10px] text-[#D7C4B0]/70 truncate">
                  {userProfile?.email || 'user@kafanavista.com'}
                </p>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#B38E5D]/15 border border-[#B38E5D]/30 text-[#B38E5D] text-[9px] font-semibold rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Penghuni VIP</span>
                </div>
              </div>
            )}

            {/* Floating Tooltip saat Collapse */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-[#1C1412] text-white border border-[#B38E5D]/30 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 pointer-events-none shadow-2xl z-50 flex flex-col">
                <span className="font-bold text-[#B38E5D]">{userProfile?.nama || userProfile?.name || 'Penghuni'}</span>
                <span className="text-[10px] text-gray-300">Lihat Profil Saya</span>
              </div>
            )}
          </Link>
        </div>

        {/* 🟢 NAVIGASI MENU UTAMA */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

            if (item.isCustomAction) {
              return (
                <div key={item.name} className="relative group">
                  <button
                    onClick={handleNavDokumenSewa}
                    disabled={loadingDoc}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 text-left cursor-pointer group hover:translate-x-1 ${
                      loadingDoc ? 'opacity-50 cursor-wait' : ''
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] text-white shadow-lg shadow-[#B38E5D]/25 border-l-4 border-white font-bold'
                        : 'text-[#FAF5EF]/70 hover:bg-[#FAF5EF]/10 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    {loadingDoc ? (
                      <Loader2 className="w-4 h-4 text-[#B38E5D] animate-spin flex-shrink-0" />
                    ) : (
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#B38E5D]'}`} />
                    )}
                    
                    {!isCollapsed && (
                      <span className="truncate">{loadingDoc ? 'Memuat...' : item.name}</span>
                    )}
                  </button>

                  {/* Floating Tooltip saat Sidebar Kolaps */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1412] text-white border border-[#B38E5D]/30 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 pointer-events-none shadow-xl z-50 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#B38E5D]" />
                      {item.name}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] text-white shadow-lg shadow-[#B38E5D]/25 border-l-4 border-amber-200 translate-x-1'
                      : 'text-[#FAF5EF]/70 hover:bg-[#FAF5EF]/10 hover:text-white hover:translate-x-1'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#B38E5D]'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>

                {/* Floating Tooltip saat Sidebar Kolaps */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1C1412] text-white border border-[#B38E5D]/30 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 pointer-events-none shadow-xl z-50 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B38E5D]" />
                    {item.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-[#B38E5D]/20">
          <div className="relative group">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2.5 px-3 py-2.5 bg-rose-950/30 hover:bg-rose-600 border border-rose-800/40 hover:border-rose-500 text-rose-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm ${
                isCollapsed ? 'px-0' : ''
              }`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Keluar</span>}
            </button>

            {isCollapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-rose-950 text-rose-200 border border-rose-800/50 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 pointer-events-none shadow-xl z-50">
                Keluar Sesi
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 📱 MOBILE BACKDROP & DRAWER */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-md transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-[#261C19] text-[#FAF5EF] z-50 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) md:hidden flex flex-col border-r border-[#B38E5D]/30 shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 border-b border-[#B38E5D]/20 flex justify-between items-center bg-[#1C1412]">
          <div>
            <h1 className="text-xl font-bold font-serif text-white">
              Kafana<span className="text-[#B38E5D]">Vista</span>
            </h1>
            <p className="text-[9px] text-[#B38E5D] uppercase tracking-widest font-semibold">Luxury Residence</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil Mobile */}
        <div className="p-4 border-b border-[#B38E5D]/20 bg-[#211715]/90">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="User"
              className="w-11 h-11 rounded-full object-cover border-2 border-[#B38E5D] shadow-md"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-white truncate">{userProfile?.nama || userProfile?.name || 'Penghuni Kafana'}</h2>
              <p className="text-[10px] text-[#D7C4B0]/70 truncate">{userProfile?.email || 'user@kafanavista.com'}</p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#B38E5D]/20 border border-[#B38E5D]/30 text-[#B38E5D] text-[9px] font-semibold rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Penghuni VIP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Mobile */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

            if (item.isCustomAction) {
              return (
                <button
                  key={item.name}
                  onClick={handleNavDokumenSewa}
                  disabled={loadingDoc}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] text-white shadow-md'
                      : 'text-[#FAF5EF]/80 hover:bg-[#B38E5D]/20 hover:text-white'
                  }`}
                >
                  {loadingDoc ? (
                    <Loader2 className="w-4 h-4 text-[#B38E5D] animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 text-[#B38E5D]" />
                  )}
                  <span>{loadingDoc ? 'Memuat...' : item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] text-white shadow-md border-l-4 border-amber-200'
                    : 'text-[#FAF5EF]/80 hover:bg-[#B38E5D]/20 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#B38E5D]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-[#B38E5D]/20 bg-[#1C1412]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Mobile Top Bar */}
        <header className="md:hidden bg-[#261C19]/95 backdrop-blur-md text-white px-4 py-3 flex justify-between items-center shadow-md border-b border-[#B38E5D]/20 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#B38E5D] flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="font-serif font-bold text-base tracking-wider">
              Kafana<span className="text-[#B38E5D]">Vista</span>
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-2 bg-[#B38E5D] hover:bg-[#967447] text-white rounded-lg text-xs font-bold cursor-pointer shadow flex items-center gap-2 transition active:scale-95"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAF5EF]">
          {children}
        </main>
      </div>
    </div>
  );
}