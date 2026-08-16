import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  LayoutDashboard,
  User,
  Building2,
  Users,
  Receipt,
  TrendingUp,
  AlertTriangle,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function SidebarAdmin({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // State untuk Mobile Drawer & Desktop Collapse
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Profile Admin State (Session Storage Check)
  const [adminProfile, setAdminProfile] = useState(null);

  useEffect(() => {
    const savedAdmin = sessionStorage.getItem('admin') || sessionStorage.getItem('user');
    if (savedAdmin) {
      try {
        setAdminProfile(JSON.parse(savedAdmin));
      } catch (e) {
        console.error('Failed to parse admin session:', e);
      }
    }
  }, []);

  // Handle Logout menggunakan SweetAlert2
  const handleLogout = () => {
    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin mengakhiri sesi Admin di KafanaVista?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B38E5D',
      cancelButtonColor: '#261C19',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      background: '#261C19',
      color: '#FAF5EF',
      customClass: {
        popup: 'border border-[#B38E5D]/30 rounded-2xl shadow-2xl backdrop-blur-md'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('admin');
        sessionStorage.removeItem('user');
        navigate('/login');
      }
    });
  };

  // 🟢 DAFTAR MENU NAVIGASI DENGAN VECTOR ICONS (lucide-react)
  const menuItems = [
    { name: 'Dashboard', path: '/admindashboard', icon: LayoutDashboard },
    { name: 'Profil Admin', path: '/adminprofile', icon: User },
    { name: 'Kelola Properti', path: '/admin/properti', icon: Building2 },
    { name: 'Penyewa Aktif', path: '/adminpenyewa', icon: Users },
    { name: 'Tagihan & Order', path: '/adminTO', icon: Receipt },
    { name: 'Laporan Keuangan', path: '/adminlaporan', icon: TrendingUp },
    { name: 'Kelola Komplain', path: '/admin/Komplain', icon: AlertTriangle },
    { name: 'Dokumen Sewa', path: '/admin/dokumen-sewa', icon: FileText },
    { name: 'PusatBantuan', path: '/pusatbantuanadmin', icon: FileText },
  ];

  // Helper Foto Profil
  const avatarUrl = adminProfile?.foto
    ? (adminProfile.foto.startsWith('http') ? adminProfile.foto : `http://localhost:8000/storage/${adminProfile.foto}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(adminProfile?.nama || adminProfile?.name || 'Admin')}&background=B38E5D&color=fff&bold=true`;

  return (
    <div className="flex h-screen bg-[#FAF5EF] overflow-hidden font-sans">
      {/* 🟢 SIDEBAR DESKTOP (COLLAPSIBLE & LUXURY DESIGN) */}
      <aside
        className={`hidden md:flex flex-col bg-[#261C19] text-[#FAF5EF] border-r border-[#B38E5D]/20 h-full flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-30 shadow-2xl ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header & Collapse Toggle Button */}
        <div className="p-4 border-b border-[#B38E5D]/20 flex justify-between items-center min-h-[72px] relative">
          {!isCollapsed && (
            <div className="truncate transition-opacity duration-300">
              <h1 className="text-xl font-bold font-serif tracking-wider text-white">
                Kafana<span className="text-[#B38E5D] font-light">Vista</span>
              </h1>
              <p className="text-[8px] text-[#B38E5D] uppercase tracking-widest font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#B38E5D]" /> Admin Portal
              </p>
            </div>
          )}

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

        {/* 👤 KARTU PROFIL ADMIN (GLASSMORPHISM ESTETIK) */}
        <div className="p-3 border-b border-[#B38E5D]/20 bg-[#1C1412]/60 backdrop-blur-md">
          <Link
            to="/admin/profile"
            className={`flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#B38E5D]/10 hover:border-[#B38E5D]/30 border border-transparent transition-all group relative ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl}
                alt="Profile Admin"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#B38E5D] shadow-md group-hover:scale-105 transition duration-300"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminProfile?.nama || 'Admin')}&background=B38E5D&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#261C19]"></span>
              </span>
            </div>

            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="text-xs font-bold text-white truncate group-hover:text-[#B38E5D] transition-colors">
                  {adminProfile?.nama || adminProfile?.name || 'Administrator'}
                </h2>
                <p className="text-[10px] text-[#D7C4B0]/70 truncate">
                  {adminProfile?.email || 'admin@kafanavista.com'}
                </p>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#B38E5D]/15 border border-[#B38E5D]/30 text-[#B38E5D] text-[9px] font-semibold rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Super Admin</span>
                </div>
              </div>
            )}

            {/* Floating Tooltip saat Collapse */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-[#1C1412] text-white border border-[#B38E5D]/30 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 pointer-events-none shadow-2xl z-50 flex flex-col">
                <span className="font-bold text-[#B38E5D]">{adminProfile?.nama || 'Profil Admin'}</span>
                <span className="text-[10px] text-gray-300">Pengaturan Sesi Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* 🟢 NAVIGASI MENU UTAMA */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

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

        {/* FOOTER & LOGOUT BUTTON */}
        <div className="p-3 border-t border-[#B38E5D]/20 space-y-2">
         
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
                Keluar Sesi Admin
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 📱 MOBILE BACKDROP OVERLAY & DRAWER */}
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
            <p className="text-[9px] text-[#B38E5D] uppercase tracking-widest font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Admin Panel
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profil Admin Mobile */}
        <div className="p-4 border-b border-[#B38E5D]/20 bg-[#211715]/90">
          <div className="flex items-center gap-3">
            <img
              src={avatarUrl}
              alt="Admin"
              className="w-11 h-11 rounded-full object-cover border-2 border-[#B38E5D] shadow-md"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-bold text-white truncate">{adminProfile?.nama || adminProfile?.name || 'Administrator'}</h2>
              <p className="text-[10px] text-[#D7C4B0]/70 truncate">{adminProfile?.email || 'admin@kafanavista.com'}</p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-[#B38E5D]/20 border border-[#B38E5D]/30 text-[#B38E5D] text-[9px] font-semibold rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigasi Mobile */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();

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

        {/* Mobile Logout & Notification Bell */}
        <div className="p-4 border-t border-[#B38E5D]/20 bg-[#1C1412] space-y-3">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#261C19] border border-[#B38E5D]/20">
            <span className="text-xs font-semibold text-[#D7C4B0]">Pemberitahuan System</span>
            <NotificationBell />
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg transition active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA & HEADER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Top Bar (Persisi & Selaras dengan Tema Dark Charcoal) */}
        <header className="bg-[#261C19]/95 backdrop-blur-md text-white px-4 md:px-8 py-3.5 flex justify-between items-center shadow-md border-b border-[#B38E5D]/20 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden p-2 rounded-lg bg-[#B38E5D]/20 text-[#B38E5D] hover:text-white hover:bg-[#B38E5D] transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B38E5D] to-[#8F6E45] flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h1 className="font-serif font-bold text-base md:text-lg tracking-wider">
                Kafana<span className="text-[#B38E5D] font-light">Vista</span>
                <span className="hidden sm:inline-block text-[10px] text-[#B38E5D] font-sans ml-2 px-2 py-0.5 bg-[#B38E5D]/10 rounded border border-[#B38E5D]/20 font-semibold">
                  Admin Panel
                </span>
              </h1>
            </div>
          </div>

          {/* Akses Notifikasi & Profil Desktop Topbar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1412]/60 border border-[#B38E5D]/20 text-xs text-[#FAF5EF]">
              <NotificationBell />
            </div>

          </div>
        </header>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAF5EF]">
          {children}
        </main>
      </div>
    </div>
  );
}