import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MitraRegisterLanding() {
  // State Modal Form Pendaftaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State Kalkulator Estimasi Pendapatan
  const [roomCount, setRoomCount] = useState(5);
  const [roomPrice, setRoomPrice] = useState(1500000);

  // State Form Pendaftaran Mitra
  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    email: '',
    propertyName: '',
    propertyType: 'Kost Putra',
    totalRooms: '',
    city: 'Bandung / Bojongsoang'
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Terima kasih Bapak/Ibu ${formData.ownerName}! Tim KafanaVista akan menghubungi Anda melalui WhatsApp ${formData.phone} dalam kurun waktu 1x24 jam untuk verifikasi properti.`);
    setIsModalOpen(false);
  };

  // Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // Estimasi Pendapatan Bersih (asumsi okupansi 85%)
  const estimatedRevenue = Math.round(roomCount * roomPrice * 0.85);

  return (
    <div className="min-h-screen bg-[#FAF5EF] font-sans text-slate-800 overflow-x-hidden selection:bg-[#B38E5D] selection:text-white">
      
      {/* CSS Animasi Internal */}
      <style>
        {`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes scaleUp {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-fade-up {
            animation: fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .animate-scale-up {
            animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          .delay-400 { animation-delay: 400ms; }
          .delay-500 { animation-delay: 500ms; }
        `}
      </style>

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-[#261C19]/95 backdrop-blur-md border-b border-white/10 text-[#FAF5EF] animate-fade-in">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-black tracking-wider flex items-center gap-2">
            <svg className="w-8 h-8 text-[#B38E5D]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.7l6 5.3v9.5h-2v-6H8v6H6v-9.5l6-5.3z"/></svg>
            <span>KAFANA<span className="text-[#B38E5D]">VISTA</span> <span className="text-xs text-[#D7C4B0] font-normal tracking-normal border border-[#B38E5D]/40 px-2 py-0.5 rounded-full ml-1">MITRA</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#D7C4B0]">
            <a href="#keunggulan" className="hover:text-white transition">Keunggulan</a>
            <a href="#kalkulator" className="hover:text-white transition">Simulasi Pendapatan</a>
            <a href="#cara-kerja" className="hover:text-white transition">Cara Kerja</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
           
           <a 
                href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
                className="px-8 py-4 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition shadow-md hover:-translate-y-0.5"
              >
                Daftar Mitra Sekarang
              </a>
          </div>
        </div>
      </header>

      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-16 pb-24 bg-[#261C19] text-[#FAF5EF] overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B38E5D]/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#3D2D29]/50 rounded-full blur-3xl -z-0 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3D2D29] border border-[#B38E5D]/30 text-xs font-semibold text-[#D7C4B0] animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-[#B38E5D] animate-ping"></span>
              Platform Pengelolaan Kost & Kontrakan Modern
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight animate-fade-up delay-100">
              Maksimalkan Okupansi & Otomatisasi Kost Anda.
            </h1>

            <p className="text-base sm:text-lg text-[#D7C4B0] leading-relaxed max-w-2xl animate-fade-up delay-200">
              Bergabunglah menjadi bagian dari <span className="text-white font-semibold">KafanaVista Partner</span>. Bebaskan diri Anda dari ribetnya penagihan sewa bulanan, pencatatan keuangan manual, dan pemasaran kamar kosong.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 animate-fade-up delay-300">
              <a 
                href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
                className="px-8 py-4 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition shadow-md hover:-translate-y-0.5"
              >
                Daftarkan Properti Anda
              </a>
              <a 
                href="#kalkulator"
                className="px-8 py-4 bg-[#3D2D29] hover:bg-[#4D3D39] text-[#FAF5EF] border border-white/10 font-bold rounded-xl transition-all duration-300 flex items-center justify-center text-base hover:-translate-y-1"
              >
                Hitung Potensi Hasil
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 border-t border-white/10 grid grid-cols-3 gap-6 animate-fade-up delay-400">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#B38E5D]">95%+</p>
                <p className="text-xs text-[#D7C4B0] mt-0.5">Rata-rata Okupansi</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#B38E5D]">120+</p>
                <p className="text-xs text-[#D7C4B0] mt-0.5">Properti Terdaftar</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-[#B38E5D]">Otomatis</p>
                <p className="text-xs text-[#D7C4B0] mt-0.5">Sistem Tagihan WA</p>
              </div>
            </div>
          </div>

          {/* Hero Banner Image Card */}
          <div className="lg:col-span-5 animate-fade-up delay-300">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#3D2D29]/40 p-3">
              <img 
                src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80" 
                alt="Properti Kost Modern" 
                className="w-full h-[420px] object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#261C19] via-transparent to-transparent opacity-80"></div>
              
              <div className="absolute bottom-6 left-6 right-6 p-5 bg-[#261C19]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#B38E5D] text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Manajemen Tanpa Pusing</h4>
                    <p className="text-xs text-[#D7C4B0]">Monitoring pendapatan & laporan keuangan secara realtime.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURE / KEUNGGULAN ================= */}
      <section id="keunggulan" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B38E5D] mb-2">Mengapa Pilih KafanaVista?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#261C19]">Solusi Lengkap Bisnis Kost & Kontrakan Anda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl border border-[#D7C4B0]/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-[#FAF5EF] text-[#B38E5D] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#B38E5D] group-hover:text-white transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-[#261C19] mb-3">Tagihan Automatic via WA</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Sistem akan otomatis mengirimkan reminder tagihan jatuh tempo ke WhatsApp penyewa beserta tautan pembayaran instan.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#D7C4B0]/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-[#FAF5EF] text-[#B38E5D] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#B38E5D] group-hover:text-white transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-[#261C19] mb-3">Dashboard Keuangan Rapi</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Pantau arus kas (cashflow), biaya perbaikan operasional, dan statistik occupancy kamar secara transparan kapan saja.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#D7C4B0]/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div className="w-14 h-14 bg-[#FAF5EF] text-[#B38E5D] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#B38E5D] group-hover:text-white transition-colors duration-300">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-[#261C19] mb-3">Pemasaran Luas & Cepat</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Kamar kosong Anda dipasarkan secara agresif ke ribuan pencari kost, mahasiswa, dan karyawan secara online.
            </p>
          </div>
        </div>
      </section>

      {/* ================= KALKULATOR ESTIMASI PENDAPATAN ================= */}
      <section id="kalkulator" className="py-20 bg-white border-y border-[#D7C4B0]/40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#FAF5EF] rounded-3xl border border-[#D7C4B0] p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">Simulasi Penghasilan</span>
                <h2 className="text-3xl font-extrabold text-[#261C19] mt-1">Berapa Potensi Pendapatan Anda?</h2>
                <p className="text-slate-600 text-sm mt-2">Geser slider di bawah untuk menghitung perkiraan pendapatan bersih bulanan Anda bersama kami.</p>
              </div>

              {/* Slider 1: Jumlah Kamar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Jumlah Kamar Tersedia:</span>
                  <span className="text-[#B38E5D] font-extrabold">{roomCount} Kamar</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="50" 
                  value={roomCount} 
                  onChange={(e) => setRoomCount(Number(e.target.value))}
                  className="w-full accent-[#B38E5D] cursor-pointer"
                />
              </div>

              {/* Slider 2: Harga per Kamar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-700">
                  <span>Harga Sewa Rata-rata / Bulan:</span>
                  <span className="text-[#B38E5D] font-extrabold">{formatRupiah(roomPrice)}</span>
                </div>
                <input 
                  type="range" 
                  min="500000" 
                  max="5000000" 
                  step="100000"
                  value={roomPrice} 
                  onChange={(e) => setRoomPrice(Number(e.target.value))}
                  className="w-full accent-[#B38E5D] cursor-pointer"
                />
              </div>
            </div>

            {/* Kotak Hasil Kalkulasi */}
            <div className="lg:col-span-6">
              <div className="bg-[#261C19] text-[#FAF5EF] p-8 rounded-2xl border border-[#3D2D29] shadow-xl text-center space-y-4 relative overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-wider text-[#D7C4B0]">Estimasi Pendapatan / Bulan</p>
                <h3 className="text-4xl sm:text-5xl font-black text-[#FAF5EF] tracking-tight">{formatRupiah(estimatedRevenue)}</h3>
                <p className="text-xs text-[#D7C4B0] italic">*Dihitung berdasarkan estimasi rata-rata okupansi 85% per bulan.</p>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-3.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition shadow-md hover:-translate-y-0.5"
                >
                  Klaim Konsultasi Gratis
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CARA KERJA ================= */}
      <section id="cara-kerja" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[#B38E5D] mb-2">Proses Mudah</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#261C19]">4 Langkah Mudah Menjadi Mitra</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Daftar Formulir', desc: 'Isi data singkat properti dan nomor WhatsApp Anda pada tombol pendaftaran.' },
            { step: '02', title: 'Verifikasi Lokasi', desc: 'Tim KafanaVista akan melakukan survei singkat & foto profesional properti Anda.' },
            { step: '03', title: 'Setup Sistem Admin', desc: 'Data kamar & rekening pembayaran Anda diintegrasikan ke sistem manajemen admin.' },
            { step: '04', title: 'Terima Penghasilan', desc: 'Sambut penyewa baru & pantau masuknya dana sewa langsung ke rekening Anda.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#D7C4B0]/50 shadow-sm relative">
              <span className="text-4xl font-black text-[#B38E5D]/30 mb-2 block">{item.step}</span>
              <h4 className="text-lg font-bold text-[#261C19] mb-2">{item.title}</h4>
              <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section id="faq" className="py-20 bg-white border-t border-[#D7C4B0]/40">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-[#B38E5D] mb-2">FAQ</p>
            <h2 className="text-3xl font-extrabold text-[#261C19]">Pertanyaan Sering Diajukan</h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-[#FAF5EF] p-5 rounded-2xl border border-[#D7C4B0]/60 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex justify-between items-center font-bold text-[#261C19]">
                <span>Apakah ada biaya pendaftaran awal untuk mitra?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Tidak ada! Pendaftaran dan survei lokasi properti Anda 100% GRATIS tanpa biaya tersembunyi.
              </p>
            </details>

            <details className="group bg-[#FAF5EF] p-5 rounded-2xl border border-[#D7C4B0]/60 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex justify-between items-center font-bold text-[#261C19]">
                <span>Bagaimana mekanisme pencairan uang sewa dari penyewa?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Setiap pembayaran sewa dari penyewa langsung ditransfer ke rekening bank pribadi mitra sesuai data yang didaftarkan pada sistem admin.
              </p>
            </details>

            <details className="group bg-[#FAF5EF] p-5 rounded-2xl border border-[#D7C4B0]/60 [&_summary::-webkit-details-marker]:hidden cursor-pointer">
              <summary className="flex justify-between items-center font-bold text-[#261C19]">
                <span>Apakah saya tetap bisa memantau properti saya sendiri?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Tentu saja! Anda akan diberikan akses khusus ke Dashboard Admin KafanaVista untuk melihat status kamar, laporan keuangan, dan data penyewa secara real-time.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[#261C19] text-[#D7C4B0] py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
          <div className="text-xl font-bold tracking-wide text-white">
            KAFANA<span className="text-[#B38E5D]">VISTA</span>
          </div>
          <p>© 2026 KafanaVista Property Management. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition">Syarat & Ketentuan</a>
          </div>
        </div>
      </footer>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-[#D7C4B0]">
            
            {/* Header Modal */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-[#FAF5EF]">
              <div>
                <h3 className="text-lg font-bold text-[#261C19]">Formulir Kemitraan Properti</h3>
                <p className="text-xs text-slate-500">Isi data di bawah untuk dihubungi tim KafanaVista.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1 rounded-full transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Body Form Modal */}
            <form onSubmit={handleSubmit} className="p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Pemilik / Pengelola</label>
                <input required type="text" name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="Contoh: Budi Santoso" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">No. WhatsApp</label>
                  <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="08123456789" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kota / Lokasi</label>
                  <input required type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Cth: Bojongsoang" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Kost / Kontrakan</label>
                <input required type="text" name="propertyName" value={formData.propertyName} onChange={handleInputChange} placeholder="Contoh: Kost Vista Asri" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tipe Properti</label>
                  <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D] cursor-pointer">
                    <option value="Kost Putra">Kost Putra</option>
                    <option value="Kost Putri">Kost Putri</option>
                    <option value="Kost Campur">Kost Campur</option>
                    <option value="Kontrakan / Paviliun">Kontrakan / Paviliun</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Jumlah Kamar</label>
                  <input required type="number" name="totalRooms" value={formData.totalRooms} onChange={handleInputChange} placeholder="Cth: 10" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#B38E5D]" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
                  Batal
                </button>
                <button type="submit" className="px-6 py-2.5 text-xs font-bold text-white bg-[#B38E5D] hover:bg-[#8F6E45] rounded-xl transition shadow-md shadow-[#B38E5D]/30">
                  Kirim Pendaftaran
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}