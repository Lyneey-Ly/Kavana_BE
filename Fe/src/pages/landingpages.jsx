import React from 'react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  // Fungsi untuk handle navigasi ke beranda
  const handleEnterBeranda = () => {
    window.location.href = '/home';
  };

  // Varian animasi untuk teks agar muncul bergantian
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Jeda antar elemen
        delayChildren: 0.3,   // Delay sebelum animasi mulai
      },
    },
  };

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-800 font-sans overflow-x-hidden selection:bg-[#8B6E4E] selection:text-white">
      
      {/* HERO SECTION */}
      <div className="relative h-screen flex flex-col justify-center items-start px-8 md:px-24 overflow-hidden">
        
        {/* Background dengan efek subtle zoom out */}
        <motion.div
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.6) 30%, rgba(0, 0, 0, 0.2)), url('https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80')` 
          }}
        />

        {/* Logo / Nama Brand (Animasi turun dari atas) */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-8 left-8 md:left-24 z-10"
        >
          <span className="font-serif text-2xl tracking-widest font-bold text-white">KAFANA VISTA</span>
        </motion.div>

        {/* Konten Utama (Staggered Animation) */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="z-10 max-w-2xl space-y-6 text-white text-left"
        >
          {/* Judul Utama Gaya Editorial */}
          <motion.h1 variants={fadeUpVariant} className="text-5xl md:text-6xl font-serif tracking-normal leading-tight font-medium drop-shadow-md">
            CARI KOST DAN KONTRAKAN <br />
            <span className="italic text-[#dcc2a3]">KAFANA VISTA AJA!</span>
          </motion.h1>

          {/* Deskripsi Singkat */}
          <motion.p variants={fadeUpVariant} className="text-sm md:text-base text-neutral-200 max-w-lg font-light leading-relaxed">
            Temukan tempat tinggal yang nyaman, aman, dan sesuai dengan kebutuhan Anda. Kost maupun kontrakan impian kini lebih mudah ditemukan.
          </motion.p>

          {/* Tombol Utama Interaktif */}
          <motion.div variants={fadeUpVariant} className="pt-4">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "#9C7D5A" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnterBeranda}
              className="px-8 py-4 text-xs tracking-widest font-semibold text-white uppercase bg-[#8B6E4E] transition-shadow duration-300 shadow-lg hover:shadow-xl cursor-pointer"
            > 
              CHOOSE ROOM
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* QUICK INFO BAR (Animasi saat di-scroll ke area ini) */}
      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-3 bg-[#8B6E4E] text-white text-sm relative z-20 shadow-xl"
      >
        <motion.div variants={fadeUpVariant} className="flex items-center gap-4 p-8 border-b md:border-b-0 md:border-r border-[#A38564]">
          <div className="text-3xl">🕒</div>
          <div>
            <p className="font-bold tracking-wider text-xs uppercase text-neutral-200">Opening Times</p>
            <p className="text-neutral-100 font-light mt-0.5">Monday - Sunday: 09:00 - 21:00</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUpVariant} className="flex items-center gap-4 p-8 border-b md:border-b-0 md:border-r border-[#A38564]">
          <div className="text-3xl">📍</div>
          <div>
            <p className="font-bold tracking-wider text-xs uppercase text-neutral-200">Our Location</p>
            <p className="text-neutral-100 font-light mt-0.5">Bandung, Sukabumi</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUpVariant} className="flex items-center gap-4 p-8">
          <div className="text-3xl">📞</div>
          <div>
            <p className="font-bold tracking-wider text-xs uppercase text-neutral-200">Customer Support</p>
            <p className="text-neutral-100 font-light mt-0.5">+208 333 9296</p>
          </div>
        </motion.div>
      </motion.div>

      {/* FOOTER */}
      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1 }}
        viewport={{ once: true }}
        className="border-t border-neutral-200 bg-[#1A1A1A] py-8 text-center text-[10px] font-mono text-neutral-400 tracking-widest uppercase"
      >
        © COPYRIGHT 2026 KAFANA VISTA TEAM • ALL RIGHTS RESERVED.
      </motion.footer>

    </div>
  );
}