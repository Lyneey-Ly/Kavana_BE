import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Pages Import
import LandingPage from './pages/landingpages';
import Home from './pages/home';
import UserProfile from './pages/profil';
import AdminDashboard from './pages/admindashboard';
import AdminDataProperti from './pages/admindataproperti';
import CariHunian from './pages/carihunian';
import Login from './pages/login';
import Register from './pages/register';
import AdminLaporanKeuangan from './pages/adminlaporan';
import AdminTagihanOrder from './pages/adminTO';
import AdminPenyewa from './pages/adminpenyewa';
import AdminPengaturan from './pages/adminpengaturan';
import Pembayaran from './pages/pembayaran';
import FinanceTracker from './pages/FinanceTracker';
import ChatRoom from './pages/roomchat';
import KatalogProperti from './pages/katalogproperti';
import PusatBantuan from './pages/PusatBantuan';
import Riwayat from './pages/riwayattransaksi';
import Dokumen from './pages/DokumenSewa';
import KomplainUser from './pages/KomplainUser';
import AdminKomplain from './pages/AdminKomplain';
import DetailKamar from './pages/detailkamar';
import AdminProfile from './pages/AdminProfile'; 
import AdminDokumenSewa from './pages/AdminDokumenSewa';
import Testimoni from './pages/Testimoni';
import NotificationBell from './components/NotificationBell';
import Wishlist from './pages/whislist';
import Footer from './components/footer';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import PusatBantuanuser from './pages/pusatbantuanuser';
import PusatBantuanAdmin from './pages/pusatbantuanadmin';
import AdminRoomChat from './pages/AdminRoomChat';
import AdminPaymentSettings from './pages/AdminPaymenSettings';
import PembayaranAdmin from './pages/PembayaranAdmin';
import Beranda from './pages/beranda';


// Mengambil Client ID dari environment variable Vite (.env)
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
            <Route path="/PusatBantuan" element={<PusatBantuan />} />
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
            <Route path="/SuperAdminDashboard" element={<SuperAdminDashboard />} /> 
            <Route path="/pusatbantuanuser" element={<PusatBantuanuser />} /> 
            <Route path="/dokumen-sewa/:id" element={<Dokumen />} />

            {/* Admin Routes */}
            <Route path="/AdminPaymentSettings" element={<AdminPaymentSettings/>} /> 

            <Route path="/adminprofile" element={<AdminProfile />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/adminlaporan" element={<AdminLaporanKeuangan />} />
            <Route path="/adminTO" element={<AdminTagihanOrder />} />
            <Route path="/adminpenyewa" element={<AdminPenyewa />} />
            <Route path="/adminpengaturan" element={<AdminPengaturan />} />
            <Route path="/admin/properti" element={<AdminDataProperti />} />
            <Route path="/admin/komplain" element={<AdminKomplain />} />
            <Route path="/admin/dokumen-sewa" element={<AdminDokumenSewa />} />
            <Route path="/admin/dokumen-sewa/:id" element={<AdminDokumenSewa />} />
            <Route path="/NotificationBell" element={<NotificationBell />} />
            <Route path="/pusatbantuanadmin" element={<PusatBantuanAdmin />} /> 
            <Route path="/AdminRoomChat" element={<AdminRoomChat/>} /> 
            <Route path="/PembayaranAdmin/:id" element={<PembayaranAdmin/>} /> 

          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}