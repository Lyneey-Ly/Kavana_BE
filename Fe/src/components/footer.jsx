import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#261C19] text-[#FAF5EF] rounded-2xl border border-[#B38E5D]/20 mt-16 overflow-hidden shadow-2xl">
      {/* AREA UTAMA FOOTER (4 KOLOM) */}
      <div className="p-8 md:p-12 lg:p-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
        
        {/* KOLOM 1: BRAND & DESKRIPSI */}
        <div className="space-y-4">
          <div className="text-2xl font-bold font-serif tracking-wider text-white">
            Kafana<span className="text-[#B38E5D] font-light">Vista</span>
          </div>
          <p className="text-xs text-[#FAF5EF]/70 leading-relaxed font-sans">
            Platform terpercaya untuk memesan hunian nyaman, kamar kost eksklusif, dan kontrakan premium langsung dari pemiliknya.
          </p>
        </div>

        {/* KOLOM 2: LAYANAN KAMI */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
            Layanan Kami
          </h4>
          <ul className="space-y-2.5 text-xs text-[#FAF5EF]/80">
            <li>
              <Link to="/carihunian" className="hover:text-[#B38E5D] transition-colors">
                Booking Penginapan
              </Link>
            </li>
            <li>
              <Link to="/carihunian" className="hover:text-[#B38E5D] transition-colors">
                Sewa Kost &amp; Kontrakan
              </Link>
            </li>
            <li>
              <Link to="/promo" className="hover:text-[#B38E5D] transition-colors">
                Promo &amp; Diskon Hunian
              </Link>
            </li>
            <li>
              <Link to="/survei" className="hover:text-[#B38E5D] transition-colors">
                Jadwalkan Survei Gratis
              </Link>
            </li>
          </ul>
        </div>

        {/* KOLOM 3: GABUNG BERSAMA KAMI */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
            Gabung Bersama Kami
          </h4>
          <ul className="space-y-2.5 text-xs text-[#FAF5EF]/80">
            <li>
              <a 
                href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20ingin%20mendaftarkan%20properti" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-[#B38E5D] transition-colors"
              >
                Daftarkan Properti Anda
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-[#B38E5D] transition-colors">
                Login Sebagai Pemilik
              </Link>
            </li>
          </ul>
        </div>

        {/* KOLOM 4: BANTUAN & HUBUNGI KAMI */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
            Bantuan &amp; Hubungi Kami
          </h4>
          <p className="text-xs text-[#FAF5EF]/70 leading-relaxed">
            Ada pertanyaan? Tim dukungan pelanggan kami siap membantu Anda 24/7.
          </p>
          <div className="pt-1">
            <a
              href="https://wa.me/6283808699130?text=Halo%20Admin%20Kafana%20Vista,%20saya%20butuh%20bantuan"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-3 rounded-xl text-xs font-bold tracking-wide transition shadow-lg hover:shadow-green-900/30 cursor-pointer"
            >
              <span className="text-base">💬</span>
              <span>Hubungi Kami (WA)</span>
            </a>
          </div>
        </div>

      </div>

      {/* BOTTOM BAR / COPYRIGHT & LEGAL */}
      <div className="border-t border-[#B38E5D]/20 bg-[#1d1513] px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-[#FAF5EF]/60">
        <p className="text-center sm:text-left">
          © 2026 Kafana Vista. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link to="/syarat-ketentuan" className="hover:text-[#B38E5D] transition-colors">
            Syarat &amp; Ketentuan
          </Link>
          <Link to="/kebijakan-privasi" className="hover:text-[#B38E5D] transition-colors">
            Kebijakan Privasi
          </Link>
        </div>
      </div>
    </footer>
  );
}