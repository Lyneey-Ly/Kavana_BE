import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarUser from '../components/SidebarUser';
import { 
  Sparkles, Calendar, Clock, Key, ShieldCheck, 
  Wallet, Heart, ChevronRight, Star, MapPin, 
  Building2, Zap, AlertCircle, ChevronLeft, ArrowRight
} from 'lucide-react';

// --- FRAMER MOTION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.15 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function HomeUser() {
  // --- MOCK DATA ---
  const userName = "Faiz";
  
  const activeLease = {
    unitName: "Executive Suite 302 - Wing A",
    dueDate: "20 Agustus 2026",
    daysLeft: 5, // Kurang dari 7 hari untuk memicu Alert
    totalDays: 180, // 6 Bulan kontrak
    billAmount: 6500000,
  };

  const progressPercent = ((activeLease.totalDays - activeLease.daysLeft) / activeLease.totalDays) * 100;

  const promos = [
    {
      id: 1,
      title: "Diskon Perpanjangan Tahunan",
      desc: "Perpanjang sewa unit Anda selama 1 tahun penuh dan dapatkan cashback serta potongan harga hingga 15%.",
      tag: "Special Offer",
      img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Weekend Coffee & Chill",
      desc: "Bergabunglah di acara komunitas penghuni eksklusif kami di Rooftop Lounge pada akhir pekan ini.",
      tag: "Community Event",
      img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Refer-a-Friend Program",
      desc: "Ajak rekan Anda untuk menetap di Kafana Vista dan nikmati potongan sewa senilai Rp 1 Juta.",
      tag: "Referral",
      img: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  const features = [
    { icon: Key, title: "Smart Keyless Access", desc: "Akses kamar digital via aplikasi 24/7 aman dan praktis." },
    { icon: Zap, title: "Express Room Care", desc: "Penanganan komplain & maintenance kilat via aplikasi." },
    { icon: Wallet, title: "Finance Tracker", desc: "Catatan tagihan, invoice, dan riwayat pembayaran transparan." },
    { icon: Sparkles, title: "Premium Amenities", desc: "Wi-Fi high-speed, pembersihan berkala, & lounge eksklusif." },
  ];

  const roomsCatalog = [
    { id: 1, name: "Penthouse Royale 01", type: "Executive", price: 12500000, rating: 4.9, loc: "Tower A, Lantai 40", img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop", badge: "Limited", amenities: ["Private Pool", "Bathtub", "Balcony"] },
    { id: 2, name: "Deluxe Comfort 204", type: "Deluxe", price: 5500000, rating: 4.8, loc: "Tower B, Lantai 12", img: "https://images.unsplash.com/photo-1502672260266-1c1c24226133?q=80&w=600&auto=format&fit=crop", badge: "Populer", amenities: ["City View", "King Bed", "Smart TV"] },
    { id: 3, name: "Cozy Studio B12", type: "Studio", price: 3800000, rating: 4.7, loc: "Wing C, Lantai 5", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=600&auto=format&fit=crop", badge: "Tersedia", amenities: ["Work Desk", "Queen Bed", "Kitchenette"] },
  ];

  // --- STATES ---
  const [currentPromo, setCurrentPromo] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');

  // Format Rupiah
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  // Auto-slide Promo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  return (
    <SidebarUser>

    <div className="min-h-screen bg-[#FAF5EF] text-[#1E1614] font-sans pb-20 selection:bg-[#B38E5D] selection:text-white">
      
      {/* --- TOP NAVBAR (Simulated) --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E5D7C5]/60 px-6 md:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#261C19] to-[#1E1614] text-[#B38E5D] flex items-center justify-center shadow-lg border border-[#C5A059]/30">
            <Building2 size={20} />
          </div>
          <span className="text-lg font-black tracking-widest uppercase text-[#261C19]">
            Kafana<span className="text-[#B38E5D] font-light">Vista</span>
          </span>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-[#B38E5D]/50 overflow-hidden shadow-md">
          <img src={`https://ui-avatars.com/api/?name=${userName}&background=261C19&color=B38E5D&bold=true`} alt="Avatar" />
        </div>
      </nav>

      <motion.main 
        className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-16"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* ========================================================= */}
        {/* SECTION 1: PERSONALIZED WELCOME & ACTIVE LEASE            */}
        {/* ========================================================= */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#261C19]">
              Selamat Datang Kembali, {userName} <Sparkles className="inline-block text-[#B38E5D] pb-2" size={32} />
            </h1>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#261C19] via-[#1E1614] to-[#110C0B] text-white rounded-[2rem] p-8 md:p-10 shadow-2xl border border-[#4A3B32]">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#C5A059]/15 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Unit Info & Progress */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Kontrak Aktif
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-[#FAF5EF]">{activeLease.unitName}</h2>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-[#E5D7C5]/70 uppercase tracking-wider">
                    <span>Durasi Sewa</span>
                    <span className="text-[#C5A059]">{activeLease.daysLeft} Hari Lagi</span>
                  </div>
                  <div className="w-full bg-[#3D2D29] rounded-full h-2.5 overflow-hidden border border-[#4A3B32]">
                    <motion.div 
                      className="bg-gradient-to-r from-[#B38E5D] to-[#C5A059] h-2.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Alert Warning if < 7 days */}
                {activeLease.daysLeft <= 7 && (
                  <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl backdrop-blur-sm">
                    <AlertCircle className="text-rose-400 shrink-0" size={20} />
                    <p className="text-xs font-medium text-rose-200">
                      Tagihan Anda jatuh tempo pada <strong className="text-white font-bold">{activeLease.dueDate}</strong>. Segera perpanjang untuk menghindari denda keterlambatan.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions & Bill */}
              <div className="flex flex-col sm:flex-row md:flex-col justify-end gap-4 md:border-l border-[#4A3B32] md:pl-8 lg:pl-12">
                <div className="mb-2 hidden md:block">
                  <p className="text-[10px] text-[#E5D7C5]/50 uppercase tracking-[0.2em] font-bold">Tagihan Bulan Ini</p>
                  <p className="text-3xl font-black text-white">{formatRupiah(activeLease.billAmount)}</p>
                </div>
                
                <button className="w-full py-4 bg-gradient-to-r from-[#B38E5D] to-[#C5A059] hover:opacity-90 text-[#1E1614] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(197,160,89,0.3)] hover:shadow-[0_0_25px_rgba(197,160,89,0.5)] hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2">
                  <Calendar size={16} /> Perpanjang Sewa
                </button>
                <button className="w-full py-4 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest rounded-xl border border-white/20 transition-all hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2">
                  <Wallet size={16} /> Bayar Tagihan
                </button>
              </div>

            </div>
          </div>
        </motion.section>

        {/* ========================================================= */}
        {/* SECTION 2: PROMO CAROUSEL                                 */}
        {/* ========================================================= */}
        <motion.section variants={itemVariants} className="relative w-full h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-lg border border-[#E5D7C5] group">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentPromo}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <img src={promos[currentPromo].img} alt="Promo" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#261C19]/90 via-[#261C19]/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-3/4 lg:w-1/2">
                <span className="inline-block px-3 py-1 mb-3 bg-[#B38E5D] text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md">
                  {promos[currentPromo].tag}
                </span>
                <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-3">
                  {promos[currentPromo].title}
                </h3>
                <p className="text-sm text-gray-200 font-medium mb-6 line-clamp-2 md:line-clamp-none">
                  {promos[currentPromo].desc}
                </p>
                <button className="px-6 py-3 bg-white text-[#261C19] hover:bg-[#FAF5EF] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn">
                  Lihat Promo <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows & Dots */}
          <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPromo(prev => prev === 0 ? promos.length - 1 : prev - 1)}
                className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition border border-white/30"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentPromo(prev => (prev + 1) % promos.length)}
                className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition border border-white/30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="flex gap-1.5">
              {promos.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPromo ? 'w-6 bg-[#C5A059]' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </div>
        </motion.section>

        {/* ========================================================= */}
        {/* SECTION 3: HIGHLIGHT FITUR UNGGULAN                       */}
        {/* ========================================================= */}
        <motion.section variants={itemVariants} className="space-y-6">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B38E5D]">Layanan Premium</span>
            <h3 className="text-2xl font-black text-[#261C19]">Keistimewaan Kafana Vista</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-[#E5D7C5]/60 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-default"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#B38E5D]/5 rounded-full group-hover:bg-[#B38E5D]/10 transition-colors duration-500"></div>
                <div className="w-12 h-12 rounded-2xl bg-[#FAF5EF] text-[#B38E5D] border border-[#D7C4B0]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <feature.icon size={22} strokeWidth={2.5} />
                </div>
                <h4 className="font-extrabold text-[#261C19] text-base mb-2">{feature.title}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ========================================================= */}
        {/* SECTION 4: ROOM CATALOG EXPLORATION                       */}
        {/* ========================================================= */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#B38E5D]">Eksplorasi Hunian</span>
              <h3 className="text-2xl font-black text-[#261C19]">Jelajahi Unit Lainnya</h3>
            </div>
            
            {/* Filter Pills */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 w-full md:w-auto pb-2 md:pb-0">
              {['All', 'Executive', 'Deluxe', 'Studio'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    activeFilter === filter 
                      ? 'bg-[#261C19] text-white border-[#261C19] shadow-md' 
                      : 'bg-white text-slate-500 border-[#E5D7C5] hover:bg-slate-50 hover:text-[#261C19]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomsCatalog
              .filter(room => activeFilter === 'All' || room.type === activeFilter)
              .map(room => (
              <div key={room.id} className="group bg-white rounded-3xl border border-[#E5D7C5] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                
                {/* Image Header */}
                <div className="relative h-56 overflow-hidden">
                  <img src={room.img} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#261C19]/80 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md ${
                      room.badge === 'Tersedia' ? 'bg-emerald-500' : 
                      room.badge === 'Populer' ? 'bg-[#C5A059]' : 'bg-rose-500'
                    }`}>
                      {room.badge}
                    </span>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition duration-300 border border-white/30">
                    <Heart size={16} />
                  </button>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="text-white">
                      <h4 className="font-extrabold text-lg drop-shadow-md">{room.name}</h4>
                      <p className="text-[10px] flex items-center gap-1 font-medium opacity-90 mt-0.5"><MapPin size={10} /> {room.loc}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#261C19]/80 backdrop-blur-sm px-2 py-1 rounded-md border border-white/10">
                      <Star size={12} className="text-[#C5A059] fill-[#C5A059]" />
                      <span className="text-xs font-bold text-white">{room.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Details Body */}
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {room.amenities.map((amenity, idx) => (
                      <span key={idx} className="text-[10px] font-bold text-slate-500 bg-[#FAF5EF] border border-[#E5D7C5]/60 px-2 py-1 rounded-md uppercase tracking-wider">
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#E5D7C5]/50 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Harga Sewa</p>
                      <p className="text-base font-black text-[#C5A059]">
                        {formatRupiah(room.price)}<span className="text-[10px] text-slate-400 font-medium">/bln</span>
                      </p>
                    </div>
                    <button className="px-5 py-2.5 bg-[#FAF5EF] hover:bg-[#261C19] text-[#261C19] hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all border border-[#D7C4B0] shadow-sm">
                      Detail
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </motion.section>

      </motion.main>
    </div>
        </SidebarUser>

  );
}