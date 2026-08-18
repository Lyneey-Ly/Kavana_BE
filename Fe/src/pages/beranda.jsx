import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Wallet, MessageSquare, FileText, 
  AlertTriangle, Heart, Bell, MapPin, 
  Wifi, ShieldCheck, Sparkles, ChevronRight, HelpCircle
} from 'lucide-react';

// --- ANIMATION VARIANTS ---
=======
import { motion, AnimatePresence } from 'framer-motion';
import SidebarUser from '../components/SidebarUser';
import { 
  Sparkles, Calendar, Clock, Key, ShieldCheck, 
  Wallet, Heart, ChevronRight, Star, MapPin, 
  Building2, Zap, AlertCircle, ChevronLeft, ArrowRight
} from 'lucide-react';

// --- FRAMER MOTION VARIANTS ---
>>>>>>> a867d6a4b5a6bd0de4bfdccb1e31640a70df8e21
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
<<<<<<< HEAD
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export default function HomeUser() {
  const navigate = useNavigate();
  
  // State dummy untuk simulasi data user (Bisa diganti dengan data dari API/Session)
  const [user, setUser] = useState({
    name: "Faiz",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    activeLease: {
      unitName: "Unit #204 - Premium Suite",
      daysLeft: 124,
      currentBill: 4500000,
      dueDate: "10 September 2026",
    }
  });

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
=======
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
>>>>>>> a867d6a4b5a6bd0de4bfdccb1e31640a70df8e21
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
<<<<<<< HEAD
    <div className="min-h-screen bg-[#FAF5EF] text-[#261C19] font-sans selection:bg-[#B38E5D] selection:text-white relative overflow-hidden">
      
      {/* --- AMBIENT GLOW BACKGROUNDS --- */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#B38E5D]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#C5A059]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- NAVBAR HEADER --- */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#B38E5D]/20 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#261C19] to-[#3D2D29] text-[#B38E5D] flex items-center justify-center font-serif font-black text-lg shadow-lg border border-[#C5A059]/30">
            K
          </div>
          <span className="text-lg font-serif font-black tracking-[0.15em] uppercase text-[#261C19]">
            Kafana<span className="text-[#B38E5D] font-light">Vista</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-[#B38E5D] transition-colors rounded-full hover:bg-white/50">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse border border-white"></span>
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#B38E5D]/30 shadow-md">
            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <motion.main 
        className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-10 relative z-10"
=======
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
>>>>>>> a867d6a4b5a6bd0de4bfdccb1e31640a70df8e21
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
<<<<<<< HEAD
        {/* 1. HERO WELCOME & STATUS BANNER */}
        <motion.section variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-tight text-[#261C19] flex items-center gap-3">
              Selamat Datang Kembali, {user.name} <Sparkles className="text-[#B38E5D]" size={32} />
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium max-w-xl leading-relaxed">
              Kelola hunian impianmu dan nikmati kenyamanan hidup berkelas eksklusif di Kafana Vista.
            </p>
          </div>

          {user.activeLease && (
            <div className="bg-white/80 backdrop-blur-md border border-[#B38E5D]/30 px-5 py-3.5 rounded-2xl shadow-lg flex items-center gap-4 shrink-0">
              <div className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Status Penghuni: Aktif</p>
                <p className="font-bold text-[#261C19] text-sm">{user.activeLease.unitName}</p>
                <p className="text-xs text-[#B38E5D] font-extrabold mt-0.5">Sisa Masa Sewa: {user.activeLease.daysLeft} Hari</p>
              </div>
            </div>
          )}
        </motion.section>

        {/* 2. ACTIVE LEASE & PAYMENT QUICK ACTION CARD */}
        <motion.section variants={itemVariants}>
          <div className="relative overflow-hidden bg-gradient-to-br from-[#211715] via-[#2A1F1D] to-[#1A1311] text-[#FAF5EF] rounded-3xl p-8 shadow-2xl border border-[#4A3B32]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#C5A059]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#C5A059] block mb-1">
                    Tagihan Bulan Berjalan
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    {formatRupiah(user.activeLease.currentBill)}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Jatuh tempo pada <strong className="text-white">{user.activeLease.dueDate}</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Link to="/dokumen-sewa" className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition border border-white/10 flex items-center justify-center gap-2 backdrop-blur-sm">
                  <FileText size={16} /> Dokumen Sewa
                </Link>
                <Link to="/pembayaran" className="relative group overflow-hidden px-8 py-3.5 bg-gradient-to-r from-[#C5A059] to-[#9C7A3C] text-[#1E1614] text-xs font-black uppercase tracking-widest rounded-xl transition shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center gap-2">
                  <span className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out"></span>
                  <Wallet size={16} /> Bayar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 3. QUICK ACCESS MENU GRID */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-serif font-black text-[#261C19]">Akses Cepat</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { title: "Cari Hunian", icon: Search, link: "/carihunian", color: "bg-blue-50 text-blue-600" },
              { title: "Finance Tracker", icon: Wallet, link: "/financetracker", color: "bg-emerald-50 text-emerald-600" },
              { title: "Room Chat", icon: MessageSquare, link: "/roomchat", color: "bg-purple-50 text-purple-600" },
              { title: "Dokumen Sewa", icon: FileText, link: "/dokumen-sewa", color: "bg-amber-50 text-amber-600" },
              { title: "Maintenance", icon: AlertTriangle, link: "/komplain", color: "bg-rose-50 text-rose-600" },
              { title: "Wishlist Favorit", icon: Heart, link: "/wishlist", color: "bg-pink-50 text-pink-600" },
            ].map((menu, index) => (
              <Link key={index} to={menu.link} className="group relative bg-white/60 backdrop-blur-md p-5 rounded-2xl border border-[#D7C4B0]/50 hover:border-[#B38E5D]/60 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-center justify-center text-center gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#B38E5D]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 ${menu.color}`}>
                  <menu.icon size={24} />
                </div>
                <span className="text-xs font-bold text-[#261C19] group-hover:text-[#B38E5D] transition-colors">{menu.title}</span>
              </Link>
            ))}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* 4. REKOMENDASI HUNIAN EKSKLUSIF (2 Columns on Desktop) */}
          <motion.section variants={itemVariants} className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-black text-[#261C19]">Rekomendasi Eksklusif</h3>
                <p className="text-xs text-slate-500 font-medium">Temukan standar hidup baru yang memukau.</p>
              </div>
              <Link to="/carihunian" className="text-xs font-black uppercase tracking-widest text-[#B38E5D] hover:text-[#261C19] transition flex items-center gap-1">
                Lihat Semua <ChevronRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop", name: "Vista Penthouse 01", price: 8500000, loc: "Tower A, Lantai 40", tag: "Hot Offer", color: "bg-rose-500" },
                { img: "https://images.unsplash.com/photo-1502672260266-1c1c24226133?q=80&w=600&auto=format&fit=crop", name: "Executive Suite A", price: 6200000, loc: "Tower B, Lantai 12", tag: "Tersedia", color: "bg-[#B38E5D]" },
              ].map((room, i) => (
                <div key={i} className="group bg-white rounded-3xl border border-[#D7C4B0]/60 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="relative h-48 overflow-hidden">
                    <img src={room.img} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#261C19]/80 to-transparent opacity-60"></div>
                    
                    <span className={`absolute top-3 left-3 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${room.color}`}>
                      {room.tag}
                    </span>
                    <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-rose-500 hover:text-white transition duration-300 border border-white/30">
                      <Heart size={16} />
                    </button>
                    
                    <div className="absolute bottom-3 left-3 text-white">
                      <h4 className="font-extrabold text-base drop-shadow-md">{room.name}</h4>
                      <p className="text-[10px] flex items-center gap-1 font-medium opacity-90"><MapPin size={10} /> {room.loc}</p>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between bg-white">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Mulai Dari</p>
                      <p className="text-sm font-black text-[#B38E5D]">{formatRupiah(room.price)}<span className="text-[10px] text-gray-400 font-medium">/bln</span></p>
                    </div>
                    <div className="flex gap-2">
                      <div className="p-1.5 bg-[#FAF5EF] rounded-md text-[#B38E5D] border border-[#D7C4B0]/40"><Wifi size={14}/></div>
                      <div className="p-1.5 bg-[#FAF5EF] rounded-md text-[#B38E5D] border border-[#D7C4B0]/40"><ShieldCheck size={14}/></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* 5. WIDGET PENGUMUMAN & LAYANAN PENGHUNI */}
          <motion.section variants={itemVariants} className="space-y-5">
            <h3 className="text-lg font-serif font-black text-[#261C19]">Layanan & Pengumuman</h3>
            
            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-[#D7C4B0]/60 shadow-sm p-6 space-y-4">
              <div className="p-4 bg-[#FAF5EF] rounded-2xl border border-[#B38E5D]/20 flex gap-4 items-start group hover:border-[#B38E5D]/50 transition">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-[#C5A059] group-hover:scale-110 transition shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#261C19]">Jadwal Housekeeping Bulanan</h4>
                  <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">Unit Anda dijadwalkan untuk pembersihan AC & general cleaning pada 15 Sept 2026.</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-[#261C19] to-[#3D2D29] rounded-2xl border border-[#4A3B32] flex gap-4 items-center group">
                <div className="p-2.5 bg-white/10 rounded-xl shadow-sm text-[#C5A059] shrink-0 backdrop-blur-sm">
                  <Wallet size={18} />
                </div>
                <div className="text-white">
                  <h4 className="text-xs font-extrabold">Promo Early Bird Perpanjangan</h4>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Diskon 10% s.d akhir bulan.</p>
                </div>
              </div>
            </div>
          </motion.section>
          
        </div>
      </motion.main>

      {/* 6. FAST HELP / CONCIERGE FLOATING WIDGET */}
      <motion.button 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-[#C5A059] to-[#9C7A3C] text-white rounded-full shadow-[0_10px_25px_rgba(197,160,89,0.5)] flex items-center justify-center z-50 group border-2 border-white"
        title="Bantuan Concierge"
      >
        <HelpCircle size={24} className="group-hover:rotate-12 transition duration-300" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
      </motion.button>
=======
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
>>>>>>> a867d6a4b5a6bd0de4bfdccb1e31640a70df8e21

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
                      Detailll
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