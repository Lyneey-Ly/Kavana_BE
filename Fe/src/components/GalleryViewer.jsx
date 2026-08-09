import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/getImageUrl';

export default function GalleryViewer({ mainImage, galleryImages = [], title = 'Properti' }) {
  // Gabungkan foto utama dan galeri ke dalam 1 list array tanpa duplikat/null
  const rawList = [mainImage, ...(Array.isArray(galleryImages) ? galleryImages : [])].filter(Boolean);
  const images = Array.from(new Set(rawList));

  const [activeImage, setActiveImage] = useState(images[0] || '');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (images.length > 0 && !images.includes(activeImage)) {
      setActiveImage(images[0]);
    }
  }, [mainImage, galleryImages]);

  const currentSrc = getImageUrl(activeImage);

  return (
    <div className="bg-white p-3 rounded-3xl border border-[#D7C4B0] shadow-sm space-y-3">
      {/* Lightbox / Modal Fullscreen */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button className="absolute top-6 right-6 text-white text-2xl font-bold bg-white/10 w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
            ✕
          </button>
          <img 
            src={currentSrc} 
            alt={title} 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
          />
        </div>
      )}

      {/* Tampilan Gambar Utama Besar */}
      <div 
        onClick={() => setIsLightboxOpen(true)}
        className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 group cursor-zoom-in"
      >
        <img 
          src={currentSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 Klik untuk Perbesar
        </div>
      </div>

      {/* Grid Thumbnail Foto Galeri */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((img, idx) => {
            const isActive = activeImage === img;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImage(img)}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-[#B38E5D] ring-2 ring-[#B38E5D]/30 opacity-100 scale-95' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img 
                  src={getImageUrl(img)} 
                  alt={`${title} thumbnail ${idx + 1}`} 
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}