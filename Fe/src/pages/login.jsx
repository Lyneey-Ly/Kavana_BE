import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import API from '../api';
import { kafanaSuccess, kafanaError } from '../components/kafanaAlert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // State untuk Syarat & Ketentuan
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fromBooking = location.state?.fromBooking;
  const bookingData = location.state?.bookingData;

  // --- FUNGSI LOGIN STANDAR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi T&C Mutlak
    if (!termsAccepted) {
      kafanaError('Persetujuan Diperlukan', 'Anda harus mencentang dan menyetujui Syarat & Ketentuan serta Kebijakan Privasi Kafana Vista.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/login', { email, password });
      handleLoginSuccess(response.data);
    } catch (error) {
      console.error('Gagal Login:', error);
      const errorMessage = error.response?.data?.message || 'Email atau password salah!';
      kafanaError('Gagal Masuk System', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI LOGIN GOOGLE (OAUTH) ---
  const executeGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true);
        // Kirim Access Token Google ke Backend Laravel
        const response = await API.post('/auth/google', {
          access_token: tokenResponse.access_token,
          terms_accepted: termsAccepted
        });
        handleLoginSuccess(response.data);
      } catch (error) {
        console.error('Backend Google Auth Error:', error);
        kafanaError('Gagal Autentikasi', 'Gagal memverifikasi akun Google Anda ke server.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      kafanaError('Login Dibatalkan', 'Proses login dengan Google dibatalkan atau terputus.');
    }
  });

  const handleGoogleClick = () => {
    if (!termsAccepted) {
      kafanaError('Persetujuan Diperlukan', 'Harap setujui Syarat & Ketentuan di bawah terlebih dahulu.');
      return;
    }
    executeGoogleLogin();
  };

  // --- HANDLE SUCCESS RESPONSE UNTUK KEDUA METODE LOGIN ---
  const handleLoginSuccess = async (data) => {
    const token = data.token || data.access_token;
    const user = data.user;
    const role = data.role;

    sessionStorage.setItem('token', token);
    if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (user) sessionStorage.setItem('user', JSON.stringify(user));

    if (fromBooking && bookingData && role === 'customer') {
      try {
        const bookingRes = await API.post('/pemesanan/booking', {
          properti_id: bookingData.properti_id,
          kamar_id: bookingData.kamar_id,
          check_in_date: bookingData.check_in_date,
          duration_months: bookingData.duration_months
        });

        const pemesananId = bookingRes.data?.data?.id || bookingRes.data?.id;
        const dataDikirim = {
          ...bookingData,
          pemesanan_id: pemesananId,
          property_id: bookingData.properti_id,
        };

        await kafanaSuccess('Login & Booking Berhasil! 🎉', 'Mengalihkan Anda langsung ke halaman pembayaran...');
        navigate('/pembayaran', { state: { itemTransaksi: dataDikirim } });
        return;
      } catch (bookingErr) {
        const errMsg = bookingErr.response?.data?.message || 'Gagal memproses booking.';
        kafanaError('Pemesanan Terkendala', errMsg);
        navigate(`/kamar/${bookingData.properti_id}`);
        return;
      }
    }

    let welcomeMessage = role === 'admin' ? 'Admin Kafana' : role === 'superadmin' ? 'Super Admin Kafana' : 'Sahabat Kafana';
    await kafanaSuccess('Login Berhasil! 🎉', `Selamat datang kembali, ${welcomeMessage}.`);

    switch (role) {
      case 'superadmin': navigate('/SuperAdminDashboard'); break;
      case 'admin': navigate('/admindashboard'); break;
      default: navigate('/beranda');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4EFEA] w-full items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#B38E5D] selection:text-white relative overflow-hidden">
      
      {/* Background Decorative Ambient Blur */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B38E5D]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#261C19]/10 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER CARD */}
      <div className="flex w-full max-w-[1100px] min-h-[720px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(38,28,25,0.18)] overflow-hidden border border-[#D7C4B0]/50 relative z-10 transition-all">
        
        {/* ================= SISI KIRI: ELEGANT BRAND BANNER ================= */}
        <div className="hidden lg:flex flex-1 bg-[#261C19] text-[#FAF5EF] p-12 flex-col justify-between items-start relative select-none overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop" 
              alt="Luxury Living" 
              className="w-full h-full object-cover grayscale contrast-125 opacity-25 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1412] via-[#261C19]/80 to-[#261C19]/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#B38E5D]/20 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B38E5D] animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#D7C4B0] uppercase font-semibold">Kafana Residence</span>
            </div>
            <span className="px-3.5 py-1 bg-[#B38E5D]/15 border border-[#B38E5D]/30 backdrop-blur-md rounded-full text-[10px] text-[#E6D5C3] font-mono font-medium tracking-wider uppercase">
              v2.5 Luxury Ed.
            </span>
          </div>

          <div className="relative z-10 my-auto space-y-6 max-w-md">
            <div className="inline-flex p-3.5 bg-[#261C19]/80 border border-[#B38E5D]/40 rounded-2xl backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
              <svg className="w-10 h-10 text-[#B38E5D]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
              </svg>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-light tracking-[0.2em] uppercase font-serif text-[#FAF5EF] leading-tight">
                KAFANA <span className="font-bold text-[#B38E5D]">VISTA</span>
              </h1>
              <p className="text-xs text-[#D7C4B0] tracking-wider uppercase leading-relaxed font-sans opacity-90 border-l-2 border-[#B38E5D] pl-3">
                Experience refined living with unmatched comfort and seamless property management.
              </p>
            </div>
          </div>
        </div>

        {/* ================= SISI KANAN: FORM LOGIN BERKELAS ================= */}
        <div className="flex-1 bg-white p-8 sm:p-12 md:p-14 flex flex-col justify-between items-center text-[#261C19]">
          <div className="w-full max-w-[400px] mx-auto my-auto space-y-6">
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold tracking-tight text-[#261C19]">Selamat Datang</h2>
              <p className="text-xs text-gray-500 font-sans tracking-wide">Masukkan akses akun Kafana Vista Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 font-mono">Email Address</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input 
                    type="email" placeholder="nama@email.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF5EF]/50 border border-[#D7C4B0]/80 rounded-xl text-sm text-[#261C19] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#B38E5D]/50 focus:border-[#B38E5D] focus:bg-white transition-all shadow-sm"
                    value={email} onChange={(e) => setEmail(e.target.value)} required 
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 font-mono">Password</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'} placeholder="••••••••" 
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF5EF]/50 border border-[#D7C4B0]/80 rounded-xl text-sm text-[#261C19] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#B38E5D]/50 focus:border-[#B38E5D] focus:bg-white transition-all shadow-sm"
                    value={password} onChange={(e) => setPassword(e.target.value)} required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-gray-400 hover:text-[#B38E5D] transition-colors focus:outline-none">
                    {showPassword ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              {/* Persetujuan T&C Checkbox */}
              <div className="flex items-start gap-3 p-3 bg-[#FAF5EF]/40 border border-[#D7C4B0]/40 rounded-xl mt-2">
                <input 
                  type="checkbox" 
                  id="tnc"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#D7C4B0] text-[#B38E5D] focus:ring-[#B38E5D] cursor-pointer shrink-0" 
                />
                <label htmlFor="tnc" className="text-[10px] leading-tight text-gray-600 cursor-pointer">
                  Saya telah membaca dan menyetujui{' '}
                  <span onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-[#C5A059] font-bold hover:underline cursor-pointer">
                    Syarat & Ketentuan
                  </span> serta {' '}
                  <span onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="text-[#C5A059] font-bold hover:underline cursor-pointer">
                    Kebijakan Privasi
                  </span> Kafana Vista.
                </label>
              </div>

              {/* Tombol Login Manual */}
              <button 
                type="submit" 
                disabled={loading || googleLoading || !termsAccepted}
                className="w-full bg-gradient-to-r from-[#261C19] via-[#3D2D29] to-[#261C19] hover:from-[#3D2D29] hover:to-[#1A1311] text-[#FAF5EF] py-3.5 px-4 text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'MEMPROSES...' : 'MASUK SEKARANG'}
              </button>
            </form>

            {/* Visual Divider */}
            <div className="flex items-center space-x-3 my-6">
              <hr className="flex-1 border-[#D7C4B0]/50" />
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Atau masuk dengan</span>
              <hr className="flex-1 border-[#D7C4B0]/50" />
            </div>

            {/* Tombol Login Google */}
            <button 
              type="button"
              onClick={handleGoogleClick}
              disabled={loading || googleLoading}
              className={`w-full bg-white border border-[#D7C4B0]/80 text-[#261C19] py-3 px-4 text-xs font-bold rounded-xl transition-all duration-300 shadow-sm hover:shadow-md hover:bg-gray-50 flex items-center justify-center gap-3 ${(!termsAccepted || loading || googleLoading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
            >
              {googleLoading ? (
                <span className="animate-pulse">Menghubungkan ke Google...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Lanjutkan dengan Google
                </>
              )}
            </button>

            <div className="text-center text-xs text-gray-500 pt-4">
              <span>Belum memiliki akun? </span>
              <Link to="/register" state={location.state} className="font-bold text-[#C5A059] hover:text-[#261C19] underline underline-offset-4 transition-colors">
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL T&C DAN KEBIJAKAN PRIVASI ================= */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#D7C4B0] overflow-hidden">
            
            <div className="p-6 border-b border-[#E5D7C5] bg-[#FAF5EF] flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#261C19]">Syarat & Ketentuan</h3>
                <p className="text-[10px] uppercase tracking-widest text-[#B38E5D] font-bold mt-1">Kafana Vista Residence</p>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#D7C4B0] text-gray-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-600 leading-relaxed font-medium">
              <p>Selamat datang di Kafana Vista. Dengan mendaftar dan menggunakan layanan kami, Anda secara sadar menyetujui seluruh ketentuan berikut:</p>
              <h4 className="font-bold text-[#261C19] text-sm pt-2">1. Penggunaan Layanan</h4>
              <p>Platform ini dirancang khusus untuk manajemen penyewaan properti. Anda diwajibkan memberikan informasi data diri yang valid dan sah demi keamanan lingkungan hunian.</p>
              
              <h4 className="font-bold text-[#261C19] text-sm pt-2">2. Kebijakan Privasi Data</h4>
              <p>Kami menjamin kerahasiaan data pribadi Anda (seperti Email, Nomor HP, dan Identitas). Data yang diperoleh melalui Otentikasi Google (OAuth) hanya digunakan untuk keperluan profil dan verifikasi sistem.</p>
              
              <h4 className="font-bold text-[#261C19] text-sm pt-2">3. Transaksi & Pembayaran</h4>
              <p>Segala bentuk pembayaran tagihan sewa wajib dilakukan melalui metode atau rekening resmi yang tertera pada aplikasi. Kafana Vista tidak bertanggung jawab atas penipuan di luar sistem kami.</p>
              
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mt-4 text-amber-800">
                Dengan menekan tombol di bawah, Anda otomatis memberikan tanda centang persetujuan pada formulir pendaftaran/login.
              </div>
            </div>

            <div className="p-5 border-t border-[#E5D7C5] bg-white">
              <button 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="w-full bg-[#261C19] hover:bg-[#3D2D29] text-white py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-colors shadow-md"
              >
                Saya Mengerti & Setuju
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}