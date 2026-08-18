import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import SidebarUser from '../components/sidebaruser'

export default function BantuanUser() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openIndex, setOpenIndex] = useState(null);

  // Daftar Pertanyaan & Jawaban Pusat Bantuan (FAQ)
  const faqData = [
    {
      category: 'Pemesanan',
      question: 'Bagaimana cara memesan kamar di Kafana Vista?',
      answer: 'Anda dapat menjelajahi katalog unit di halaman beranda atau detail kamar, memilih durasi sewa serta tanggal check-in, lalu klik "Pesan Sekarang". Anda akan diminta masuk atau membuat akun sebelum dilanjutkan ke halaman pembayaran.'
    },
    {
      category: 'Pemesanan',
      question: 'Apakah saya bisa membatalkan atau mengubah jadwal booking?',
      answer: 'Pembatalan atau perubahan jadwal dapat dilakukan dengan menghubungi tim customer service kami melalui WhatsApp maksimal 1x24 jam setelah pemesanan dibuat sebelum diverifikasi.'
    },
    {
      category: 'Pembayaran',
      question: 'Bagaimana cara mengunggah bukti transfer pembayaran?',
      answer: 'Setelah melakukan pemesanan, Anda akan diarahkan ke halaman pembayaran. Di sana terdapat opsi untuk mengunggah foto atau screenshot bukti transfer bank. Pastikan nominal dan rekening tujuan sudah sesuai.'
    },
    {
      category: 'Pembayaran',
      question: 'Berapa lama proses verifikasi pembayaran oleh admin?',
      answer: 'Verifikasi pembayaran biasanya diproses dalam waktu 1 hingga 3 jam kerja setelah bukti transfer diunggah. Anda dapat memantau status pesanan secara real-time di akun Anda.'
    },
    {
      category: 'Akun',
      question: 'Bagaimana jika saya lupa kata sandi akun saya?',
      answer: 'Saat ini pemulihan sandi otomatis dapat dilakukan dengan menghubungi admin melalui WhatsApp untuk bantuan reset kredensial akun demi keamanan data Anda.'
    },
    {
      category: 'Hunian',
      question: 'Apa saja fasilitas standar yang didapatkan di setiap kamar?',
      answer: 'Setiap kamar di Kafana Vista sudah dilengkapi dengan AC, Wi-Fi berkecepatan tinggi, tempat tidur premium, lemari pakaian, kamar mandi dalam, serta akses keamanan 24 jam.'
    }
  ];

  // Filter FAQ berdasarkan pencarian dan kategori
  const filteredFaq = faqData.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <SidebarUser>

    <div className="min-h-screen bg-[#FAF5EF] text-[#261C19] font-sans selection:bg-[#B38E5D] selection:text-white flex flex-col justify-between">
      
      {/* ================= NAVBAR ================= */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#D7C4B0]/40 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/Home')}>
          <div className="p-2 rounded-xl bg-[#261C19] text-[#B38E5D]">
            <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm md:text-base font-black tracking-[0.2em] uppercase text-[#261C19]">
            KAFANA <span className="text-[#B38E5D]">VISTA</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/Home" 
            className="text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#B38E5D] transition"
          >
            ← Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* ================= HEADER & SEARCH HERO ================= */}
      <section className="px-6 py-16 md:py-20 max-w-4xl mx-auto text-center space-y-6 w-full">
        <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#B38E5D]/15 text-[#B38E5D] text-[10px] font-black uppercase tracking-[0.25em] border border-[#B38E5D]/30">
          Pusat Bantuan &amp; Informasi
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#261C19]">
          Ada yang Bisa Kami Bantu?
        </h1>
        <p className="text-xs md:text-sm text-gray-600 font-medium max-w-lg mx-auto leading-relaxed">
          Temukan jawaban seputar pemesanan kamar, panduan pembayaran, verifikasi akun, dan informasi fasilitas hunian Kafana Vista di sini.
        </p>

        {/* Search Bar Input */}
        <div className="relative max-w-xl mx-auto pt-2">
          <input 
            type="text"
            placeholder="Cari topik bantuan (cth: pembayaran, cara pesan, dll)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#D7C4B0] text-xs md:text-sm font-medium rounded-2xl pl-11 pr-10 py-3.5 shadow-sm outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition"
          />
          <svg className="w-5 h-5 text-[#B38E5D] absolute left-4 top-1/2 -translate-y-1/2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 mt-1 text-gray-400 hover:text-gray-600 text-xs font-bold">✕</button>
          )}
        </div>
      </section>

      {/* ================= KATEGORI & FAQ ACCORDION ================= */}
      <section className="px-6 pb-20 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Kategori Filter Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {['Semua', 'Pemesanan', 'Pembayaran', 'Akun', 'Hunian'].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                activeCategory === category
                  ? 'bg-[#261C19] text-white border-[#261C19] shadow-md'
                  : 'bg-white text-gray-600 border-[#D7C4B0] hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl border border-[#D7C4B0]/70 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center gap-4 hover:bg-[#FAF5EF]/40 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 bg-[#FAF5EF] text-[#B38E5D] rounded-lg border border-[#D7C4B0]/60 uppercase tracking-widest">
                        {item.category}
                      </span>
                      <span className="font-extrabold text-xs md:text-sm text-[#261C19]">
                        {item.question}
                      </span>
                    </div>
                    <span className={`text-[#B38E5D] font-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs md:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 bg-white animate-fadeIn">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-[#D7C4B0]/60 text-center space-y-2">
              <span className="text-3xl">🔍</span>
              <p className="text-sm font-bold text-gray-700">Tidak ada informasi yang sesuai dengan pencarian Anda.</p>
              <p className="text-xs text-gray-400">Coba gunakan kata kunci lain atau hubungi tim bantuan kami.</p>
            </div>
          )}
        </div>

        {/* BANNER BANTUAN LANJUTAN (WHATSAPP) */}
        <div className="bg-[#261C19] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mt-12 border border-[#B38E5D]/30">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B38E5D]">Butuh Solusi Langsung?</span>
            <h3 className="text-lg md:text-xl font-extrabold text-[#FAF5EF]">Tim Customer Support Kami Siap Membantu</h3>
            <p className="text-xs text-gray-300 font-light">Hubungi kami via WhatsApp untuk kendala mendesak seputar sewa hunian Anda.</p>
          </div>
          <a 
            href="https://wa.me/6281234567890?text=Halo%20Kafana%20Vista,%20saya%20butuh%20bantuan%20terkait%20layanan." 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-3.5 bg-[#B38E5D] hover:bg-[#916F42] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg shrink-0 flex items-center gap-2 active:scale-95"
          >
            <span>💬</span> Chat WhatsApp Admin
          </a>
        </div>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white text-gray-500 py-8 px-6 md:px-12 border-t border-[#D7C4B0]/40 text-center text-xs font-medium">
        <div>&copy; 2026 KAFANA VISTA. ALL RIGHTS RESERVED.</div>
      </footer>

    </div>
        </SidebarUser>

  );
}