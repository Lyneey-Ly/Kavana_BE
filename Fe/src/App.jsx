import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/landingpages'; // Landing Page awal
import Home from './pages/home';
import UserProfile from './pages/profil';       // Jalur file profil
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
import KomplainUser from './pages/KomplainUser'; // Atau sesuaikan lokasi filenya
import AdminKomplain from './pages/AdminKomplain';
import DetailKamar from './pages/detailkamar';
import AdminProfile from './pages/AdminProfile'; 
import AdminDokumenSewa from './pages/AdminDokumenSewa';
import Testimoni from './pages/Testimoni';
import SuperAdminDashboard from './pages/SuperAdminDashboard';


// Placeholder untuk halaman lain (biar routing ga error dulu)
const BerandaUser = () => <div className="p-8 font-bold">Halaman Beranda User</div>;

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
        <Routes>
          {/* Main Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Halaman Home bertema Seaside */}
          <Route path="/home" element={<Home />} />
          <Route path="/PusatBantuan" element={<PusatBantuan />} />
          <Route path="/katalogproperti" element={<KatalogProperti />} />
          
          {/* Rute tunggal yang benar untuk halaman profile */}
          <Route path="/profile" element={<UserProfile />} />
          
          {/* User Routes */}
          <Route path="/beranda" element={<BerandaUser />} />
          <Route path="/FinanceTracker" element={<FinanceTracker />} />
          <Route path="/carihunian" element={<CariHunian />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pembayaran" element={<Pembayaran />} />
          <Route path="/kamar/:id" element={<DetailKamar />} />
          <Route path="/riwayattransaksi" element={<Riwayat/>}/>
          <Route path="/roomchat" element={<ChatRoom />} />
          <Route path="/komplain" element={<KomplainUser />} />
          <Route path="/testimoni" element={<Testimoni />} /> 
          <Route path="/SuperAdminDashboard" element={<SuperAdminDashboard />} /> 

          
          <Route path="/dokumen-sewa/:id" element={<Dokumen />} />

          {/* Admin Routes */}
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

        </Routes>
      </div>
    </Router>
  );
}