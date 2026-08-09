import { useState } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';


export default function AdminPengaturan() {
  // State untuk Tab Navigasi Pengaturan
  const [activeTab, setActiveTab] = useState('profil');

  // State form dummy
  const [profileData, setProfileData] = useState({ name: 'M. Faiz Ilham', email: 'faiz.admin@kafanavista.com', phone: '081234567890' });
  const [bankData, setBankData] = useState({ bankName: 'BNI', accountNumber: '1234567890', accountName: 'KAFANA VISTA PROPERTY' });

  const handleSave = (e) => {
    e.preventDefault();
    alert('Pengaturan berhasil disimpan!');
  };

  return (
    <SidebarAdmin>

    // LANGSUNG RETURN MAIN (Sesuai konsep Layout Outlet)
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF5EF]">
      
    

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#261C19] tracking-tight">Pengaturan</h1>
            <p className="text-slate-500 mt-1">Kelola profil Anda, preferensi keamanan, dan data operasional properti.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* KIRI: MENU TABS */}
            <div className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden flex flex-col">
                <button 
                  onClick={() => setActiveTab('profil')}
                  className={`text-left px-6 py-4 font-bold text-sm transition-all border-l-4 ${activeTab === 'profil' ? 'border-[#B38E5D] bg-[#FAF5EF] text-[#B38E5D]' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  Profil Akun
                </button>
                <button 
                  onClick={() => setActiveTab('keamanan')}
                  className={`text-left px-6 py-4 font-bold text-sm transition-all border-l-4 border-t border-t-slate-100 ${activeTab === 'keamanan' ? 'border-[#B38E5D] bg-[#FAF5EF] text-[#B38E5D]' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  Keamanan & Sandi
                </button>
                <button 
                  onClick={() => setActiveTab('pembayaran')}
                  className={`text-left px-6 py-4 font-bold text-sm transition-all border-l-4 border-t border-t-slate-100 ${activeTab === 'pembayaran' ? 'border-[#B38E5D] bg-[#FAF5EF] text-[#B38E5D]' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                >
                  Rekening Penerima
                </button>
              </div>
            </div>

            {/* KANAN: KONTEN FORM */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm p-8">
                
                {/* TAMPILAN TAB PROFIL */}
                {activeTab === 'profil' && (
                  <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-[#261C19] border-b border-slate-100 pb-4">Informasi Profil</h2>
                    
                    <div className="flex items-center gap-6">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-[#FAF5EF] shadow-sm" />
                      <div>
                        <button type="button" className="px-4 py-2 bg-white border border-[#D7C4B0] text-[#261C19] text-sm font-bold rounded-lg hover:bg-[#FAF5EF] transition shadow-sm">
                          Ubah Foto
                        </button>
                        <p className="text-xs text-slate-500 mt-2">Format JPG/PNG maksimal 2MB.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                        <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nomor Telepon / WA</label>
                        <input type="text" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-bold text-slate-700">Alamat Email</label>
                        <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-lg transition shadow-md shadow-[#B38E5D]/30">
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                )}

                {/* TAMPILAN TAB KEAMANAN */}
                {activeTab === 'keamanan' && (
                  <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-xl font-bold text-[#261C19] border-b border-slate-100 pb-4">Ubah Kata Sandi</h2>
                    
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kata Sandi Saat Ini</label>
                        <input type="password" placeholder="Masukkan sandi lama" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Kata Sandi Baru</label>
                        <input type="password" placeholder="Minimal 8 karakter" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                        <input type="password" placeholder="Ulangi sandi baru" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-[#261C19] hover:bg-[#3D2D29] text-white font-bold text-sm rounded-lg transition shadow-md">
                        Perbarui Sandi
                      </button>
                    </div>
                  </form>
                )}

                {/* TAMPILAN TAB PEMBAYARAN */}
                {activeTab === 'pembayaran' && (
                  <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-300">
                    <div>
                      <h2 className="text-xl font-bold text-[#261C19]">Rekening Pembayaran</h2>
                      <p className="text-sm text-slate-500 mt-1 pb-4 border-b border-slate-100">Informasi ini akan ditampilkan pada invoice penyewa saat tagihan dibuat.</p>
                    </div>
                    
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nama Bank / E-Wallet</label>
                        <input type="text" value={bankData.bankName} onChange={(e) => setBankData({...bankData, bankName: e.target.value})} placeholder="Cth: Bank BCA / GoPay" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nomor Rekening</label>
                        <input type="text" value={bankData.accountNumber} onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})} placeholder="Cth: 1234567890" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Nama Pemilik Rekening</label>
                        <input type="text" value={bankData.accountName} onChange={(e) => setBankData({...bankData, accountName: e.target.value})} placeholder="Sesuai buku tabungan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button type="submit" className="px-6 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-lg transition shadow-md shadow-[#B38E5D]/30">
                        Simpan Rekening
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
    </SidebarAdmin>
  );
}