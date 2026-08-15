import { useState } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';

export default function BantuanAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openIndex, setOpenIndex] = useState(null);

  // Daftar Dokumentasi & FAQ Khusus Admin
  const adminGuides = [
    {
      category: 'Keuangan & Order',
      question: 'Bagaimana cara memverifikasi atau menolak bukti pembayaran penyewa?',
      answer: 'Masuk ke menu Tagihan & Order pada sidebar. Pilih daftar invoice yang berstatus "Pending" atau "Menunggu Verifikasi", lalu klik tombol "Detail". Periksa foto bukti transfer yang diunggah penyewa, kemudian klik "Terima & Verifikasi" untuk mengonfirmasi atau "Tolak" jika bukti tidak valid.'
    },
    {
      category: 'Keuangan & Order',
      question: 'Apa yang terjadi setelah status tagihan diubah menjadi Dikonfirmasi?',
      answer: 'Sistem akan memperbarui status transaksi menjadi lunas/sukses. Jika pemesanan tersebut terhubung dengan sistem otomatis, status sewa penyewa akan tercatat secara real-time di sistem manajemen.'
    },
    {
      category: 'Manajemen Penyewa',
      question: 'Bagaimana cara memantau kontrak sewa yang hampir habis?',
      answer: 'Buka menu Data Penyewa. Gunakan filter status "Akan Habis" atau lihat kartu ringkasan di bagian atas. Sistem secara otomatis mendeteksi penyewa yang masa kontraknya tersisa kurang dari 30 hari, dan Anda dapat langsung mengirim pesan pengingat via tombol WhatsApp.'
    },
    {
      category: 'Manajemen Penyewa',
      question: 'Bagaimana cara mengirim pesan otomatis ke WhatsApp penyewa?',
      answer: 'Pada tabel Data Penyewa atau Detail Penyewa, klik tombol "WA". Sistem akan otomatis mengarahkan Anda ke WhatsApp Web/App dengan template pesan terformat yang menyebutkan nama penyewa, unit kamar, serta informasi batas kontrak.'
    },
    {
      category: 'Properti & Kamar',
      question: 'Bagaimana cara menambahkan unit kamar atau properti baru?',
      answer: 'Anda dapat menavigasi ke halaman Profil Admin, lalu klik tombol "Tambah Unit Kamar" di bagian atas header. Masukkan detail informasi seperti nama unit, alamat/lokasi, harga sewa per bulan, dan unggah foto utama properti.'
    },
    {
      category: 'Akun & Profil',
      question: 'Bagaimana cara memperbarui informasi kredensial atau password admin?',
      answer: 'Buka menu Profil Admin, klik tombol "Edit Identitas Admin". Anda dapat mengubah nama, email, nomor WhatsApp, mengganti foto profil, atau berpindah ke tab "Kata Sandi & Akses" untuk memperbarui password admin.'
    }
  ];

  // Filter Panduan berdasarkan pencarian dan kategori
  const filteredGuides = adminGuides.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans">
        
        {/* AMBIENT GLOW DEKORATIF */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          
          {/* ================= HEADER SECTION ================= */}
          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
                Kafana Vista Control Panel
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#261C19] tracking-tight">Pusat Bantuan Admin</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
                Panduan operasional sistem manajemen, instruksi verifikasi keuangan, dan dokumentasi pengelolaan properti.
              </p>
            </div>

            {/* Quick Search Bar */}
            <div className="relative w-full md:w-72">
              <input 
                type="text"
                placeholder="Cari panduan admin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5D7C5] text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 outline-none focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] shadow-2xs transition"
              />
              <svg className="w-4 h-4 text-[#C5A059] absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              )}
            </div>
          </div>

          {/* ================= KATEGORI FILTER TABS ================= */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {['Semua', 'Keuangan & Order', 'Manajemen Penyewa', 'Properti & Kamar', 'Akun & Profil'].map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer border ${
                  activeCategory === category
                    ? 'bg-[#261C19] text-white border-[#261C19] shadow-md'
                    : 'bg-white text-slate-500 border-[#E5D7C5] hover:bg-slate-50 hover:text-[#261C19]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* ================= ACCORDION FAQ LIST ================= */}
          <div className="space-y-3">
            {filteredGuides.length > 0 ? (
              filteredGuides.map((item, index) => {
                const isOpen = openIndex === index;
                return (
                  <div 
                    key={index} 
                    className="bg-white rounded-2xl border border-[#E5D7C5] overflow-hidden shadow-2xs transition-all"
                  >
                    <button
                      onClick={() => toggleAccordion(index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 hover:bg-[#FAF6F0]/40 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-[#FAF6F0] text-[#C5A059] rounded-lg border border-[#E5D7C5]">
                          {item.category}
                        </span>
                        <span className="font-extrabold text-xs md:text-sm text-[#261C19]">
                          {item.question}
                        </span>
                      </div>
                      <span className={`text-[#C5A059] font-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white animate-in fade-in duration-200">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 bg-white rounded-3xl border border-[#E5D7C5] text-center space-y-2">
                <span className="text-3xl block opacity-50">🔍</span>
                <p className="text-sm font-bold text-slate-600">Tidak ada topik bantuan admin yang cocok.</p>
                <p className="text-xs text-slate-400">Coba gunakan kata kunci pencarian yang lain.</p>
              </div>
            )}
          </div>

          {/* ================= SUPPORT SYSTEM INFO CARD ================= */}
          <div className="bg-[#261C19] text-[#FAF5EF] p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mt-8 border border-[#C5A059]/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="space-y-1.5 text-center md:text-left relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C5A059]">Bantuan Teknis Sistem</span>
              <h3 className="text-lg md:text-xl font-extrabold text-white">Mengalami Kendala Teknis atau Bug Database?</h3>
              <p className="text-xs text-slate-300 font-light max-w-lg">
                Hubungi tim pengembang atau administrator pusat jika Anda mendapati galat koneksi API, kendala sinkronisasi server Laravel, atau masalah hak akses superadmin.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0">
              <a 
                href="mailto:support@kafanavista.com" 
                className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#b08e4a] text-[#261C19] text-xs font-black uppercase tracking-widest rounded-xl transition shadow-lg flex items-center gap-2 active:scale-95"
              >
                <span>✉️</span> Kontak Tim IT Support
              </a>
            </div>
          </div>

        </div>
      </div>
    </SidebarAdmin>
  );
}