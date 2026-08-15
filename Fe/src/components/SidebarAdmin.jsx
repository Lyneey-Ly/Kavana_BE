import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import NotificationBell from './NotificationBell'; // 👈 1. Import Komponen Notifikasi Kamu

export default function SidebarAdmin({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Cek Status Login
  const token = sessionStorage.getItem('token');

  // Handle Logout dengan SweetAlert2
  const handleLogout = () => {
    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar dari sesi Admin?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#B38E5D',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Ya, Keluar!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        Swal.fire({
          icon: 'success',
          title: 'Berhasil Keluar',
          text: 'Anda telah keluar dari sistem.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };

  // 🔴 JIKA BELUM LOGIN: Render Topbar Mini untuk Tamu
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAF5EF]">
        <header className="bg-[#261C19] text-[#FAF5EF] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-[#B38E5D]/30">
          <div className="text-xl font-bold tracking-wider font-serif">
            Kafana<span className="text-[#B38E5D] font-light">Vista</span>
          </div>
          <div className="flex gap-3 items-center">
            <Link 
              to="/PusatBantuan" 
              className="px-4 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:scale-105"
            >
              Pusat Bantuan
            </Link>
            <Link 
              to="/login" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF5EF] hover:text-[#B38E5D] transition-colors"
            >
              Masuk
            </Link>
            <Link 
              to="/register" 
              className="px-4 py-2 bg-[#B38E5D] hover:bg-[#8F6E45] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md hover:scale-105"
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

  // 🟢 JIKA SUDAH LOGIN: Daftar Menu Sidebar (Sudah Dihapus Menu Notip-nya)
  const menuItems = [
    { name: 'Dashboard', path: '/admindashboard', icon: '📊' },
    { name: 'Profil Admin', path: '/AdminProfile', icon: '👤' },
    { name: 'Kelola Properti', path: '/admin/properti', icon: '🏢' },
    { name: 'Penyewa Aktif', path: '/adminpenyewa', icon: '👥' },
    { name: 'Tagihan & Order', path: '/adminTO', icon: '🧾' },
    { name: 'Laporan Keuangan', path: '/adminlaporan', icon: '📈' },
    { name: 'Kelola Komplain', path: '/admin/komplain', icon: '⚠️' },
    { name: 'Dokumen Sewa', path: '/admin/dokumen-sewa', icon: '📜' },
  ];

  return (
    <div className="flex h-screen bg-[#FAF5EF] overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#261C19] text-[#FAF5EF] border-r border-[#B38E5D]/20 h-full flex-shrink-0 shadow-2xl relative z-30">
        <div className="p-6 border-b border-[#B38E5D]/20 flex flex-col items-start justify-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif tracking-wider text-white">
              Kafana<span className="text-[#B38E5D] font-light">Vista</span>
            </h1>
            <span className="text-[9px] font-black uppercase bg-[#B38E5D]/30 text-[#B38E5D] px-2 py-0.5 rounded border border-[#B38E5D]/40">
              Admin
            </span>
          </div>
          <p className="text-[10px] text-[#D7C4B0]/70 uppercase tracking-widest mt-1">Management Console</p>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B38E5D] to-[#8F6E45] text-white shadow-lg shadow-[#B38E5D]/30 translate-x-1'
                    : 'text-[#FAF5EF]/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                )}
                <span className="text-lg transition-transform duration-300 group-hover:scale-125 group-hover:rotate-6">
                  {item.icon}
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#B38E5D]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 border border-rose-900/40 hover:shadow-lg hover:shadow-rose-900/30 group cursor-pointer"
          >
            <span className="text-sm transition-transform group-hover:-translate-x-1">🚪</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)} 
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-[#261C19] text-[#FAF5EF] z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-[#B38E5D]/20 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold font-serif text-white">
              Kafana<span className="text-[#B38E5D]">Vista</span>
            </h1>
            <span className="text-[9px] font-bold text-[#B38E5D] uppercase tracking-widest">Admin Mobile</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-slate-300 hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-[#B38E5D] text-white shadow-md'
                    : 'text-[#FAF5EF]/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#B38E5D]/20">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition shadow-md cursor-pointer"
          >
            🚪 Keluar
          </button>
        </div>
      </aside>

      {/* CONTAINER KONTEN UTAMA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* 2. TOPBAR HEADER (Tempat Lonceng Notifikasi & Profile) */}
        <header className="bg-[#261C19] border-b border-slate-200/80 px-4 md:px-8 py-3 flex items-center justify-between shadow-xs z-20 shrink-0">
          
          {/* Sisi Kiri Header */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsOpen(true)} 
              className="md:hidden p-2 text-[#261C19] hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <span className="text-xl">☰</span>
            </button>
            <h1 className="md:hidden font-serif font-bold text-base text-[#261C19]">
              Kafana<span className="text-[#B38E5D]">Vista</span>
            </h1>
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sistem Manajemen</span>
            </div>
          </div>

          {/* Sisi Kanan Header: Notifikasi & Profil */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* 👈 DIPASANG DI SINI */}
            <NotificationBell />

            <div className="h-6 w-[1px] bg-[#B38E5D] hidden sm:block" />

           
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}