import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SidebarSuperAdmin() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'overview', label: 'Dashboard Utama', icon: '📊', path: '/SuperAdminDashboard' },
    { key: 'administrators', label: 'Kelola Pengelola', icon: '👥', path: '/SuperAdminDashboard?tab=administrators' },
    { key: 'users', label: 'Monitoring User', icon: '👤', path: '/SuperAdminDashboard?tab=users' },
    { key: 'revenue', label: 'Pendapatan Admin', icon: '💰', path: '/SuperAdminDashboard?tab=revenue' },
    { key: 'platform-stats', label: 'Statistik Platform', icon: '📈', path: '/SuperAdminDashboard?tab=platform-stats' },
    { key: 'transactions', label: 'Semua Transaksi', icon: '🧾', path: '/SuperAdminDashboard?tab=transactions' },
  ];

  const getActiveTab = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'overview';
  };

  const activeTab = getActiveTab();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <aside className="fixed lg:static inset-y-0 left-0 z-40 w-64 lg:w-64 bg-[#261C19] text-white transform transition-transform duration-300 ease-in-out flex flex-col">
      {/* Brand Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#B38E5D] rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
              <path d="M72 20L56 50L61 57L79 25H72Z" fill="currentColor" />
              <path d="M81 60L70 77L75 80L88 60H81Z" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">KAFANA VISTA</h1>
            <p className="text-[10px] text-[#D7C4B0] uppercase tracking-wider">Superadmin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[#B38E5D] text-white shadow-lg shadow-[#B38E5D]/30'
                  : 'text-[#D7C4B0]/80 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 bg-white/5 rounded-xl">
          <div className="w-9 h-9 bg-[#B38E5D] rounded-full flex items-center justify-center text-sm font-bold">
            🛡️
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Super Administrator</p>
            <p className="text-[10px] text-[#D7C4B0] truncate">Full Access Control</p>
          </div>
        </div>
      </div>
    </aside>
  );
}