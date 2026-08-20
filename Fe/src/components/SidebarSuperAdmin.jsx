import { useNavigate, useLocation } from 'react-router-dom';

const SUPERADMIN_ROUTES = ['overview', 'approval', 'administrators', 'users', 'revenue', 'revenue-analytics', 'bank-accounts', 'finance-tracker', 'transactions', 'settings'];

export default function SidebarSuperAdmin({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: 'overview', label: 'Dashboard Utama', icon: '📊', path: '/superadmin/overview' },
    { key: 'administrators', label: 'Kelola Pengelola', icon: '👥', path: '/superadmin/administrators' },
    { key: 'users', label: 'Monitoring User', icon: '👤', path: '/superadmin/users' },
    { key: 'revenue', label: 'Pendapatan Admin', icon: '💰', path: '/superadmin/revenue' },
    { key: 'revenue-analytics', label: 'Analitik Pendapatan', icon: '📈', path: '/superadmin/revenue-analytics' },
    { key: 'finance-tracker', label: 'Finance Tracker', icon: '💳', path: '/superadmin/finance-tracker' },
    { key: 'bank-accounts', label: 'Rekening Bank', icon: '🏦', path: '/superadmin/bank-accounts' },
    { key: 'transactions', label: 'Semua Transaksi', icon: '🧾', path: '/superadmin/transactions' },
    { key: 'settings', label: 'Pengaturan Website', icon: '⚙️', path: '/superadmin/settings' },
    { key: 'verifikasi', label: 'Verifikasi Properti', icon: '✅', path: '/VerifikasiPropertiSuperAdmin' },
    { key: 'iklan', label: 'Kelola Iklan Banner', icon: '📢', path: '/KelolaIklanSuperAdmin' },
    { key: 'profile-requests', label: 'Verifikasi Profil Admin', icon: '🛂', path: '/SuperAdminProfileRequests' },
  ];

  const getActiveTab = () => {
    const path = location.pathname;

    if (path === '/KelolaIklanSuperAdmin') return 'iklan';
    if (path === '/SuperAdminProfileRequests') return 'profile-requests';
    if (path === '/VerifikasiPropertiSuperAdmin') return 'verifikasi';

    // Halaman berbasis route: /superadmin/{key}
    const match = path.match(/^\/superadmin\/([^/]+)/);
    if (match && SUPERADMIN_ROUTES.includes(match[1])) {
      return match[1];
    }

    return 'overview';
  };

  const activeTab = getActiveTab();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="flex min-h-screen bg-[#FAF5EF]">
      {/* SIDEBAR */}
      <aside className="fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-64 h-screen bg-[#261C19] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out">
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
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
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

      {/* KONTEN HALAMAN UTAMA */}
      <main className="flex-1 w-full relative min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}