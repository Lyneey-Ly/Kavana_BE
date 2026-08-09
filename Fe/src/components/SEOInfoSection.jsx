import { useState } from 'react';

export default function SEOInfoSection() {
  const [isOpen, setIsOpen] = useState(true);

  const features = [
    {
      label: 'a.',
      title: 'Fitur Pencarian Smart Search',
      desc: 'Di kolom pencarian, kamu bisa cari kost atau kontrakan di sekitarmu dengan mudah. Cukup masukkan kata kunci seperti nama daerah (Bandung, Sukabumi), nama kampus, atau lokasi terdekat dari tempat aktivitasmu saat ini.'
    },
    {
      label: 'b.',
      title: 'Filter Pencarian Komprehensif',
      desc: 'Cari hunian berdasarkan kriteria spesifik. Filter berdasarkan tipe kamar (Kost Putra, Putri, Campur, atau Kontrakan), fasilitas pendukung (AC, Kamar Mandi Dalam, Wi-Fi), hingga skema pembayaran bulanan maupun tahunan.'
    },
    {
      label: 'c.',
      title: 'Respon & Informasi Tervalidasi',
      desc: 'Seluruh unit yang terdaftar di Kafana Vista telah melewati proses validasi survei lapangan. Kamu bisa melihat foto asli, kelengkapan fasilitas, hingga detail harga secara transparan tanpa biaya tersembunyi.'
    },
    {
      label: 'd.',
      title: 'Booking & Sewa Langsung',
      desc: 'Proses pengajuan sewa bisa dilakukan secara mudah dan cepat langsung melalui sistem online. Transaksi lebih transparan, aman, dan dapat dikonfirmasi secara instan.'
    }
  ];

  return (
    <section className="bg-white rounded-2xl p-6 md:p-10 border border-[#D7C4B0]/60 shadow-sm mb-12 text-[#2D2321]">
      {/* DESKRIPSI UTAMA (SEO TEXT) */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-8">
        <h2 className="text-xl md:text-2xl font-black text-[#261C19] tracking-tight">
          Kafana Vista - Platform Hunian Sewa & Kost Modern
        </h2>
        <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-sans">
          Kafana Vista memanfaatkan teknologi terkini untuk menyajikan pengalaman pencarian kost eksklusif dan kontrakan idaman yang cepat, akurat, serta transparan. Kami berkomitmen menyajikan daftar hunian terverifikasi lengkap dengan foto asli, rincian fasilitas, hingga kemudahan booking instan untuk kenyamanan maksimal calon penghuni.
        </p>
      </div>

      <div className="border-t border-[#D7C4B0]/40 pt-6 max-w-4xl mx-auto">
        {/* TOGGLE ACCORDION HEADER */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-2 text-left font-bold text-sm md:text-base text-[#261C19] hover:text-[#B38E5D] transition"
        >
          <span>Fitur yang dapat dimanfaatkan di Kafana Vista</span>
          <span className="text-xs font-bold bg-[#FAF5EF] border border-[#D7C4B0]/60 px-3 py-1 rounded-full text-[#B38E5D]">
            {isOpen ? '▲ Sembunyikan' : '▼ Tampilkan'}
          </span>
        </button>

        {/* DAFTAR FITUR (EXPANDABLE) */}
        {isOpen && (
          <div className="mt-6 space-y-5 animate-in fade-in duration-300">
            {features.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="font-bold text-[#B38E5D] text-xs md:text-sm pt-0.5">{item.label}</span>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs md:text-sm text-[#261C19]">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}