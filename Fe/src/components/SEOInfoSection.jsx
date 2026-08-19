import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function SEOInfoSection() {
  // State untuk menyimpan ID fitur mana saja yang sedang terbuka
  const [openItems, setOpenItems] = useState([0]); // Default poin 'a' terbuka

  const features = [
    {
      id: 0,
      letter: 'a',
      title: 'Fitur Pencarian Smart Search',
      content: 'Di kolom pencarian, kamu bisa cari kost atau kontrakan di sekitarmu dengan mudah. Cukup masukkan kata kunci seperti nama daerah (Bandung, Sukabumi), nama kampus, atau lokasi terdekat dari tempat aktivitasmu saat ini.'
    },
    {
      id: 1,
      letter: 'b',
      title: 'Filter Pencarian Komprehensif',
      content: 'Cari hunian berdasarkan kriteria spesifik. Filter berdasarkan tipe kamar (Kost Putra, Putri, Campur, atau Kontrakan), fasilitas pendukung (AC, Kamar Mandi Dalam, Wi-Fi), hingga skema pembayaran bulanan maupun tahunan.'
    },
    {
      id: 2,
      letter: 'c',
      title: 'Respon & Informasi Tervalidasi',
      content: 'Seluruh unit yang terdaftar di Kafana Vista telah melewati proses validasi survei lapangan. Kamu bisa melihat foto asli, kelengkapan fasilitas, hingga detail harga secara transparan tanpa biaya tersembunyi.'
    },
    {
      id: 3,
      letter: 'd',
      title: 'Booking & Sewa Langsung',
      content: 'Proses pengajuan sewa bisa dilakukan secara mudah dan cepat langsung melalui sistem online. Transaksi lebih transparan, aman, dan dapat dikonfirmasi secara instan.'
    }
  ];

  const toggleItem = (id) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter(item => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-10 border border-[#D7C4B0]/60 shadow-sm max-w-7xl mx-auto my-12 text-[#2D2321]">
      
      {/* JUDUL UTAMA */}
      <div className="text-center space-y-3 mb-8 pb-6 border-b border-[#D7C4B0]/40">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Kafana Vista - Platform Hunian Sewa &amp; Kost Modern
        </h2>
        <p className="text-xs md:text-sm text-gray-600 max-w-4xl mx-auto leading-relaxed">
          Kafana Vista memanfaatkan teknologi terkini untuk menyajikan pengalaman pencarian kost eksklusif dan kontrakan idaman yang cepat, akurat, serta transparan. Kami berkomitmen menyajikan daftar hunian terverifikasi lengkap dengan foto asli, rincian fasilitas, hingga kemudahan booking instan untuk kenyamanan maksimal calon penghuni.
        </p>
      </div>

      {/* SECTION ACCORDION FITUR (SERUPA DENGAN PERTANYAAN POPULER) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#B38E5D] mb-4">
          Fitur yang dapat dimanfaatkan di Kafana Vista
        </h3>

        <div className="space-y-3">
          {features.map((item) => {
            const isOpen = openItems.includes(item.id);

            return (
              <div 
                key={item.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? 'bg-[#FAF5EF]/50 border-[#B38E5D] shadow-sm' 
                    : 'bg-white border-[#D7C4B0]/60 hover:border-[#B38E5D]/60'
                }`}
              >
                {/* HEADER / TOMBOL JUDUL ACCORDION */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 md:p-5 flex items-center justify-between text-left cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 pr-4">
                    <span className="font-bold text-[#B38E5D] text-sm md:text-base">
                      {item.letter}.
                    </span>
                    <h4 className="font-extrabold text-[#2D2321] text-sm md:text-base">
                      {item.title}
                    </h4>
                  </div>

                  {/* TOMBOL PANAH TOGGLE */}
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isOpen ? 'bg-[#B38E5D]/10 text-[#B38E5D]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </div>
                </button>

                {/* CONTENT PENJELASAN (TERSEMBUNYI JIKA BELUM DIKLIK) */}
                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 pt-1 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-[#D7C4B0]/30 animate-in fade-in duration-200">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}