import React, { useState } from 'react';

// Data Daftar Properti (Kos Putra, Kos Putri, Kontrakan)
const DATA_PROPERTI = [
  {
    id: 'kos-putra-1',
    tipe: 'Kos Putra',
    nama: 'Kos Putra Barokah Standar',
    alamat: 'Jl. Sukabirus No. 42, Dayeuhkolot, Bandung',
    hargaPerBulan: 750000,
    gambar: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=800',
    deskripsi: 'Kamar kos nyaman dan tenang, cocok untuk mahasiswa atau pekerja.',
    fasilitasKamar: ['Kasur (Spring Bed)', 'Lemari Pakaian', 'Meja & Kursi Belajar'],
    fasilitasBersama: ['Kamar Mandi Luar', 'Dapur Bersama', 'Area Parkir Motor']
  },
  {
    id: 'kos-putri-1',
    tipe: 'Kos Putri',
    nama: 'Kos Putri Mawar Asri',
    alamat: 'Jl. Sukabirus No. 15, Dayeuhkolot, Bandung',
    hargaPerBulan: 850000,
    gambar: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800',
    deskripsi: 'Kos khusus putri aman dengan gerbang auto-lock dan CCTV 24 jam.',
    fasilitasKamar: ['Kamar Mandi Dalam', 'AC', 'Kasur Spring Bed'],
    fasilitasBersama: ['Dapur Bersama', 'WiFi 100Mbps', 'Mesin Cuci']
  },
  {
    id: 'kontrakan-1',
    tipe: 'Kontrakan',
    nama: 'Kontrakan House 2 Kamar',
    alamat: 'Gg. PGA No. 8, Dayeuhkolot, Bandung',
    hargaPerBulan: 2500000,
    gambar: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800',
    deskripsi: 'Rumah kontrakan minimalis 1 lantai, cocok untuk sewa sekelompok teman.',
    fasilitasKamar: ['2 Kamar Tidur', 'Ruang Tamu Luas', 'Dapur Pribadi'],
    fasilitasBersama: ['Garasi Mobil', 'Air PDAM', 'Listrik PLN 1300W']
  }
];

function KatalogProperti({ onPilihProperti }) {
  const [filter, setFilter] = useState('Semua');

  // Filter properti berdasarkan kategori yang diklik
  const propertiFiltered = DATA_PROPERTI.filter((item) => {
    if (filter === 'Semua') return true;
    return item.tipe === filter;
  });

  return (
    <div style={{ backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh', padding: '32px 24px', fontFamily: 'sans-serif' }}>
      
      {/* Header Judul */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '8px' }}>Pilih Hunian Impianmu</h1>
        <p style={{ color: '#aaa', fontSize: '14px' }}>Temukan Kos Putra, Kos Putri, atau Kontrakan sesuai kebutuhanmu</p>
      </div>

      {/* Tombol Filter Kategori */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {['Semua', 'Kos Putra', 'Kos Putri', 'Kontrakan'].map((kat) => (
          <button
            key={kat}
            onClick={() => setFilter(kat)}
            style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: filter === kat ? '1px solid #d4af37' : '1px solid #333',
              backgroundColor: filter === kat ? '#d4af37' : '#1e1e1e',
              color: filter === kat ? '#000' : '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Grid Kartu Properti */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
        {propertiFiltered.map((item) => (
          <div 
            key={item.id}
            style={{
              backgroundColor: '#1e1e1e',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
          >
            <div>
              {/* Gambar Properti */}
              <div style={{ height: '180px', overflow: 'hidden' }}>
                <img src={item.gambar} alt={item.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              {/* Detail Singkat */}
              <div style={{ padding: '16px' }}>
                <span style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {item.tipe}
                </span>
                <h3 style={{ color: '#fff', margin: '6px 0', fontSize: '18px' }}>{item.nama}</h3>
                <p style={{ color: '#aaa', fontSize: '12px', margin: '0 0 12px 0' }}>📍 {item.alamat}</p>
                <div style={{ color: '#d4af37', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  Rp {item.hargaPerBulan.toLocaleString('id-ID')} <span style={{ fontSize: '12px', color: '#aaa' }}>/ bulan</span>
                </div>
              </div>
            </div>

            {/* Tombol Lihat Detail */}
            <div style={{ padding: '0 16px 16px 16px' }}>
              <button
                onClick={() => onPilihProperti(item)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d4af37',
                  color: '#d4af37',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                Lihat Detail Kamar →
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default KatalogProperti;