import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

const DEFAULT_SETTINGS = {
  site_name: 'KafanaVista',
  footer_about_text: 'Platform terpercaya untuk memesan hunian nyaman, kamar kost eksklusif, dan kontrakan premium langsung dari pemiliknya.',
  footer_copyright: `© ${new Date().getFullYear()} Kafana Vista. All rights reserved.`,
  footer_phone: '6283808699130',
  footer_email: 'support@kafanavista.com',
  footer_address: '',
  social_facebook: '',
  social_instagram: '',
  social_tiktok: '',
};

export default function Footer() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    let active = true;
    API.get('/site-settings')
      .then((res) => {
        if (active && res.data?.data) {
          setSettings((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch((err) => console.error('Gagal memuat pengaturan footer', err));
    return () => { active = false; };
  }, []);

  const phone = settings.footer_phone || DEFAULT_SETTINGS.footer_phone;
  const waNumber = phone.replace(/[^0-9]/g, '');
  const waLink = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;

  const siteName = settings.site_name || DEFAULT_SETTINGS.site_name;
  const isDefaultBrand = siteName.toLowerCase() === 'kafanavista';

  return (
    <footer className="bg-[#261C19] text-[#FAF5EF] rounded-2xl border border-[#B38E5D]/20 mt-16 overflow-hidden shadow-2xl">
      {/* AREA UTAMA FOOTER (4 KOLOM) */}
      <div className="p-8 md:p-12 lg:p-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

        {/* KOLOM 1: BRAND & DESKRIPSI */}
        <div className="space-y-4">
          <div className="text-2xl font-bold font-serif tracking-wider text-white">
            {isDefaultBrand ? (
              <>Kafana<span className="text-[#B38E5D] font-light">Vista</span></>
            ) : (
              siteName
            )}
          </div>
          <p className="text-xs text-[#FAF5EF]/70 leading-relaxed font-sans">
            {settings.footer_about_text}
          </p>

          {/* SOCIAL MEDIA */}
          {(settings.social_facebook || settings.social_instagram || settings.social_tiktok) && (
            <div className="flex items-center gap-3 pt-1">
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noreferrer" aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/5 border border-[#B38E5D]/20 flex items-center justify-center text-sm hover:bg-[#B38E5D] hover:text-white transition-colors">
                  f
                </a>
              )}
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noreferrer" aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/5 border border-[#B38E5D]/20 flex items-center justify-center text-sm hover:bg-[#B38E5D] hover:text-white transition-colors">
                  ◎
                </a>
              )}
              {settings.social_tiktok && (
                <a href={settings.social_tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"
                  className="w-9 h-9 rounded-full bg-white/5 border border-[#B38E5D]/20 flex items-center justify-center text-sm hover:bg-[#B38E5D] hover:text-white transition-colors">
                  ♪
                </a>
              )}
            </div>
          )}
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
              <Link to="/carihunian" className="hover:text-[#B38E5D] transition-colors">
                Promo &amp; Diskon Hunian
              </Link>
            </li>
            <li>
              <Link to="/testimoni" className="hover:text-[#B38E5D] transition-colors">
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
                href={waLink('Halo Admin Kafana Vista, saya ingin mendaftarkan properti')}
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

          {settings.footer_address && (
            <p className="text-xs text-[#FAF5EF]/70 leading-relaxed flex items-start gap-2">
              <span>📍</span> {settings.footer_address}
            </p>
          )}
          {settings.footer_email && (
            <a href={`mailto:${settings.footer_email}`} className="text-xs text-[#FAF5EF]/70 hover:text-[#B38E5D] transition-colors flex items-start gap-2">
              <span>✉️</span> {settings.footer_email}
            </a>
          )}

          <div className="pt-1">
            <a
              href={waLink('Halo Admin Kafana Vista, saya butuh bantuan')}
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
          {settings.footer_copyright}
        </p>
        <div className="flex items-center gap-6">
          <Link to="/PusatBantuan" className="hover:text-[#B38E5D] transition-colors">
            Syarat &amp; Ketentuan
          </Link>
          <Link to="/PusatBantuan" className="hover:text-[#B38E5D] transition-colors">
            Kebijakan Privasi
          </Link>
        </div>
      </div>
    </footer>
  );
}