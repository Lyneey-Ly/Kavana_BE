import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages Import
import LandingPage from './pages/landingpages';
import Home from './pages/home';
import Beranda from './pages/beranda';
import UserProfile from './pages/profil';
import CariHunian from './pages/carihunian';
import Login from './pages/login';
import Register from './pages/register';
import Pembayaran from './pages/pembayaran';
import FinanceTracker from './pages/FinanceTracker';
import ChatRoom from './pages/roomchat';
import KatalogProperti from './pages/katalogproperti';
import PusatBantuan from './pages/PusatBantuan';
import PusatBantuanuser from './pages/pusatbantuanuser';
import Riwayat from './pages/riwayattransaksi';
import Dokumen from './pages/DokumenSewa';
import KomplainUser from './pages/KomplainUser';
import DetailKamar from './pages/detailkamar';
import Testimoni from './pages/Testimoni';
import Wishlist from './pages/whislist';

// Admin Pages Import
import AdminDashboard from './pages/admindashboard';
import AdminDataProperti from './pages/admindataproperti';
import AdminLaporanKeuangan from './pages/adminlaporan';
import AdminTagihanOrder from './pages/adminTO';
import AdminPenyewa from './pages/adminpenyewa';
import AdminPengaturan from './pages/adminpengaturan';
import AdminKomplain from './pages/AdminKomplain';
import AdminProfile from './pages/AdminProfile'; 
import AdminDokumenSewa from './pages/AdminDokumenSewa';
import PusatBantuanAdmin from './pages/pusatbantuanadmin';
import AdminRoomChat from './pages/AdminRoomChat';
import AdminPaymentSettings from './pages/AdminPaymenSettings';
import PembayaranAdmin from './pages/PembayaranAdmin';
import RiwayatPembayaranAdmin from './pages/RiwayatPembayaranAdmin';
import KelolaIklanSuperAdmin from './pages/KelolaIklanSuperAdmin';
import SuperAdminProfileRequests from './pages/SuperAdminProfileRequests';

// Super Admin Pages Import
import SuperAdminLayout from './layouts/SuperAdminLayout';
import OverviewPage from './pages/superadmin/OverviewPage';
import ApprovalPage from './pages/superadmin/ApprovalPage';
import AdministratorsPage from './pages/superadmin/AdministratorsPage';
import UsersPage from './pages/superadmin/UsersPage';
import RevenuePage from './pages/superadmin/RevenuePage';
import TransactionsPage from './pages/superadmin/TransactionsPage';
import RevenueAnalyticsPage from './pages/superadmin/RevenueAnalyticsPage';
import BankAccountsPage from './pages/superadmin/BankAccountsPage';
import FinanceTrackerPage from './pages/superadmin/FinanceTrackerPage';
import SettingsPage from './pages/superadmin/SettingsPage';
import VerifikasiPropertiSuperAdmin from './pages/VerifikasiPropertiSuperAdmin'; 

// Components Import
import NotificationBell from './components/NotificationBell';
import Footer from './components/footer';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "PASTE_GOOGLE_CLIENT_ID_DI_SINI";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
          <Routes>
            {/* Main Landing & Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/beranda" element={<Beranda />} />
            <Route path="/landingpages" element={<LandingPage />} />
            <Route path="/katalogproperti" element={<KatalogProperti />} />
            
            {/* User Profile & Auth */}
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* User Features */}
            <Route path="/FinanceTracker" element={<FinanceTracker />} />
            <Route path="/carihunian" element={<CariHunian />} />
            <Route path="/pembayaran" element={<Pembayaran />} />
            <Route path="/kamar/:id" element={<DetailKamar />} />
            <Route path="/riwayattransaksi" element={<Riwayat />} />
            <Route path="/roomchat" element={<ChatRoom />} />
            <Route path="/komplain" element={<KomplainUser />} />
            <Route path="/testimoni" element={<Testimoni />} /> 
            <Route path="/whislist" element={<Wishlist />} /> 
            <Route path="/footer" element={<Footer />} /> 
            <Route path="/PusatBantuan" element={<PusatBantuan />} />
            <Route path="/pusatbantuanuser" element={<PusatBantuanuser />} /> 
            <Route path="/dokumen-sewa/:id" element={<Dokumen />} />

            {/* Admin Routes */}
            <Route path="/adminprofile" element={<AdminProfile />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/admin/properti" element={<AdminDataProperti />} />
            <Route path="/adminlaporan" element={<AdminLaporanKeuangan />} />
            <Route path="/adminTO" element={<AdminTagihanOrder />} />
            <Route path="/adminpenyewa" element={<AdminPenyewa />} />
            <Route path="/adminpengaturan" element={<AdminPengaturan />} />
            <Route path="/admin/komplain" element={<AdminKomplain />} />
            <Route path="/admin/dokumen-sewa" element={<AdminDokumenSewa />} />
            <Route path="/admin/dokumen-sewa/:id" element={<AdminDokumenSewa />} />
            <Route path="/AdminRoomChat" element={<AdminRoomChat/>} /> 
            <Route path="/AdminPaymentSettings" element={<AdminPaymentSettings/>} /> 
            <Route path="/pusatbantuanadmin" element={<PusatBantuanAdmin />} /> 
            <Route path="/NotificationBell" element={<NotificationBell />} />

            {/* Route Pembayaran Properti (Admin) */}
            <Route path="/PembayaranAdmin/:id" element={<PembayaranAdmin />} /> 
            <Route path="/admin/pembayaran/:id" element={<PembayaranAdmin />} /> 
            <Route path="/admin/riwayat-pembayaran" element={<RiwayatPembayaranAdmin />} />

            {/* Super Admin Routes */}
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="/superadmin/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="approval" element={<ApprovalPage />} />
              <Route path="administrators" element={<AdministratorsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="revenue" element={<RevenuePage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
              <Route path="bank-accounts" element={<BankAccountsPage />} />
              <Route path="finance-tracker" element={<FinanceTrackerPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            {/* Redirect dari URL lama berbasis query param (?tab=...) */}
            <Route path="/SuperAdminDashboard" element={<Navigate to="/superadmin/overview" replace />} />
            <Route path="/VerifikasiPropertiSuperAdmin" element={<VerifikasiPropertiSuperAdmin />} />
            <Route path="/KelolaIklanSuperAdmin" element={<KelolaIklanSuperAdmin />} />
            <Route path="/SuperAdminProfileRequests" element={<SuperAdminProfileRequests />} />

          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}