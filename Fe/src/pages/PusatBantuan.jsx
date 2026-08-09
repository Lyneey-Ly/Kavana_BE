import { useState } from 'react';
import SidebarUser from '../components/SidebarUser';

export default function PusatBantuan() {
  // State Tab Aktif ('penyewa' | 'pemilik' | 'umum')
  const [activeTab, setActiveTab] = useState('penyewa');

  // State Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // State Accordion FAQ yang terbuka
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Data Kategori
  const categories = [
    {
      id: 'penyewa',
      title: 'Penyewa Kos',
      desc: 'Panduan sewa, pembayaran, hingga survei lokasi bagi calon penyewa.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80',
      badge: 'Paling Dicari'
    },
    {
      id: 'pemilik',
      title: 'Pemilik Kos',
      desc: 'Cara mendaftarkan properti, kelola tagihan, dan maksimalkan okupansi.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      badge: 'Mitra Vista'
    },
    {
      id: 'umum',
      title: 'Info Umum & Privasi',
      desc: 'Informasi keamanan akun, syarat & ketentuan, serta kebijakan layanan.',
      image: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
      badge: 'Keamanan'
    }
  ];

  // Data FAQ per Kategori
  const faqData = {
    penyewa: [
      {
        question: 'Bagaimana cara booking kamar di Kafana Vista?',
        answer: 'Pilih unit hunian yang kamu suka, klik tombol "Book", tentukan tanggal masuk, lalu ikuti instruksi pembayaran resmi melalui aplikasi. Tim kami akan memverifikasi pesananmu secara otomatis.'
      },
      {
        question: 'Apakah foto properti di Kafana Vista terjamin akurat?',
        answer: 'Ya, 100%! Seluruh properti dengan badge "VISTA VERIFIED" telah melewati proses survei fisik langsung oleh tim validasi kami untuk memastikan foto dan fasilitas sesuai kenyataan.'
      },
      {
        question: 'Bagaimana jika pesan / chat saya dengan pemilik kos hilang?',
        answer: 'Fitur chat dienkripsi demi keamanan. Jika chat terhapus, pastikan kamu login dengan akun yang sama. Kamu juga bisa mengecek histori transaksi atau menghubungi CS via WhatsApp.'
      },
      {
        question: 'Apakah bisa melakukan survei lokasi sebelum bayar?',
        answer: 'Bisa banget! Kamu dapat memilih fitur "Jadwalkan Survei" pada detail properti agar didampingi atau disetujui oleh pemilik kos secara aman.'
      }
    ],
    pemilik: [
      {
        question: 'Bagaimana cara mendaftarkan properti kos saya?',
        answer: 'Klik menu "Daftarkan Properti" pada dashboard, lengkapi data lokasi, fasilitas, harga, serta unggah foto kamar terbaikmu. Tim kami akan melakukan verifikasi dalam 1x24 jam.'
      },
      {
        question: 'Berapa biaya komisi untuk pemilik kos?',
        answer: 'Pendaftaran properti di Kafana Vista 100% Gratis! Kami hanya mengenakan biaya penanganan layanan yang sangat transparan saat terjadi transaksi sewa berhasil.'
      },
      {
        question: 'Bagaimana sistem pencairan uang sewa dari penyewa?',
        answer: 'Dana dari penyewa akan ditampung di rekening bersama Kafana Vista dan diteruskan otomatis ke rekening Bank/E-Wallet milikmu maksimal 1x24 jam setelah penghuni melakukan check-in.'
      }
    ],
    umum: [
      {
        question: 'Bagaimana jika saya lupa password akun?',
        answer: 'Klik opsi "Lupa Password" di halaman Login, masukkan email yang terdaftar, lalu ikuti link instruksi reset password yang dikirimkan ke kotak masuk emailmu.'
      },
      {
        question: 'Apakah data pribadi saya aman di Kafana Vista?',
        answer: 'Sangat aman. Seluruh data transaksi dan informasi identitas dilindungi enkripsi standar industri dan tidak akan diperjualbelikan kepada pihak ketiga.'
      }
    ]
  };

  // Filter FAQ berdasarkan Pencarian
  const currentFaqs = faqData[activeTab] || [];
  const filteredFaqs = currentFaqs.filter(item => 
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleAccordion = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <SidebarUser>
      <div className="bg-[#FAF5EF] text-[#2D2321] font-sans antialiased min-h-screen pb-20 relative">
        
        {/* ========================================================================= */}
        {/* 🌟 1. HERO HEADER & SEARCH BAR */}
        {/* ========================================================================= */}
        <div className="bg-[#261C19] text-[#FAF5EF] pt-12 pb-20 px-6 md:px-12 rounded-b-3xl shadow-xl relative overflow-hidden">
          {/* Accent Gold Circle Deco */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#B38E5D]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest bg-[#B38E5D]/20 px-3 py-1 rounded-full border border-[#B38E5D]/30">
              Pusat Bantuan & Support
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-serif">
              Ada yang Bisa Kami Bantu, Lek?
            </h1>
            <p className="text-xs md:text-sm text-[#FAF5EF]/70 max-w-xl mx-auto font-sans leading-relaxed">
              Temukan jawaban cepat mengenai proses sewa, pendaftaran properti, hingga informasi keamanan transaksi di Kafana Vista.
            </p>

            {/* SEARCH INPUT BAR */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="bg-white p-2.5 rounded-2xl shadow-2xl border border-[#D7C4B0] flex items-center gap-3">
                <span className="text-gray-400 pl-3 text-lg">🔍</span>
                <input
                  type="text"
                  placeholder="Ketik pertanyaanmu (misal: 'lupa password', 'booking', 'pemilik')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[#2D2321] text-xs font-semibold placeholder-gray-400 focus:outline-none py-2"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-gray-400 hover:text-red-500 font-bold pr-3"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-10 relative z-10 space-y-12">
          
          {/* ========================================================================= */}
          {/* 🌟 2. PILIHAN KATEGORI TIPE AKUN (CARDS) */}
          {/* ========================================================================= */}
          <div>
            <p className="text-xs font-bold text-[#261C19] uppercase tracking-wider mb-4 text-center md:text-left">
              Pilih Kategori Informasi Sesuai Kebutuhanmu:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setActiveTab(cat.id);
                      setOpenFaqIndex(null);
                    }}
                    className={`cursor-pointer group bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl ${
                      isActive 
                        ? 'border-[#B38E5D] ring-2 ring-[#B38E5D]/30 scale-[1.02]' 
                        : 'border-[#D7C4B0]/60 hover:border-[#B38E5D]/50'
                    }`}
                  >
                    <div className="h-40 overflow-hidden relative">
                      <img 
                        src={cat.image} 
                        alt={cat.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-[#261C19]/80 text-[#FAF5EF] px-2.5 py-1 rounded-md backdrop-blur-sm">
                        {cat.badge}
                      </span>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className={`text-base font-bold transition ${isActive ? 'text-[#B38E5D]' : 'text-[#261C19]'}`}>
                        {cat.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {cat.desc}
                      </p>
                      
                      <div className="pt-2 flex items-center text-xs font-bold text-[#B38E5D] group-hover:translate-x-1 transition duration-300">
                        <span>{isActive ? 'Sedang Dipilih' : 'Telusuri Topik'}</span>
                        <span className="ml-1">➔</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 3. LIST FAQ ACCORDION (INTERAKTIF) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-2xl border border-[#D7C4B0]/60 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 pb-4 gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#B38E5D] uppercase tracking-widest block">Pertanyaan Populer</span>
                <h2 className="text-xl font-bold text-[#261C19]">
                  Kategori: <span className="capitalize text-[#B38E5D]">{activeTab}</span>
                </h2>
              </div>

              {/* NAV TABS KECIL */}
              <div className="flex bg-[#FAF5EF] p-1 rounded-xl border border-[#D7C4B0]/40 text-xs font-bold">
                {['penyewa', 'pemilik', 'umum'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setOpenFaqIndex(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg capitalize transition ${
                      activeTab === tab ? 'bg-[#261C19] text-white shadow' : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* LIST ACCORDION */}
            <div className="space-y-3">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div 
                      key={idx}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isOpen ? 'border-[#B38E5D] bg-[#FAF5EF]/50' : 'border-gray-200 bg-white hover:border-[#D7C4B0]'
                      }`}
                    >
                      <button
                        onClick={() => toggleAccordion(idx)}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs md:text-sm text-[#261C19] hover:text-[#B38E5D] transition gap-4"
                      >
                        <span className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#B38E5D]"></span>
                          {faq.question}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded bg-[#FAF5EF] text-[#B38E5D] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 text-xs text-gray-600 leading-relaxed font-sans border-t border-[#D7C4B0]/30 animate-in fade-in duration-200">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <p className="text-2xl">🔍</p>
                  <p className="text-xs font-bold">Tidak ada hasil untuk "{searchQuery}"</p>
                  <p className="text-[11px]">Coba gunakan kata kunci lain atau hubungi tim Customer Service kami.</p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 4. CALL TO ACTION (HUBUNGI CS) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-r from-[#261C19] to-[#3D2D28] rounded-2xl p-6 md:p-8 text-[#FAF5EF] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-lg font-bold">Belum menemukan jawaban yang kamu cari?</h3>
              <p className="text-xs text-[#FAF5EF]/70 max-w-lg">
                Tim Customer Service Kafana Vista siap melayani pertanyaanmu setiap hari dari pukul 08:00 - 21:00 WIB.
              </p>
            </div>

            <a
              href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
              target="_blank"
              rel="noreferrer"
              className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg flex items-center gap-2 shrink-0"
            >
              <span>💬 Chat Customer Service</span>
            </a>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 🌟 5. FLOATING WHATSAPP BUTTON (POJOK KANAN BAWAH) */}
        {/* ========================================================================= */}
        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition duration-300 flex items-center justify-center z-50 group"
          title="Tanya CS via WhatsApp"
        >
          <span className="text-2xl">💬</span>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2">
            Bantuan Live
          </span>
        </a>

      </div>
    </SidebarUser>
  );
}