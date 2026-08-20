import { useState, useEffect } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';

const DEFAULT_VALUES = {
  site_name: 'KafanaVista',
  site_logo: '',
  footer_about_text: '',
  footer_copyright: '',
  footer_phone: '',
  footer_email: '',
  footer_address: '',
  social_facebook: '',
  social_instagram: '',
  social_tiktok: '',
  property_extra_fee: 150000,
  platform_commission_percent: 3.00,
};

const inputClass =
  'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D]';

const labelClass = 'text-sm font-bold text-slate-700';

export default function SettingsPage() {
  const [formData, setFormData] = useState(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get('/site-settings');
        if (cancelled) return;
        const data = res.data?.data || {};
        setFormData({ ...DEFAULT_VALUES, ...data, site_logo: data.site_logo || '' });
      } catch (err) {
        if (cancelled) return;
        console.error('Gagal memuat pengaturan website', err);
        Swal.fire('Gagal', 'Gagal memuat data pengaturan website.', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.post('/admin/site-settings', {
        ...formData,
        property_extra_fee: Number(formData.property_extra_fee) || 0,
        platform_commission_percent: Number(formData.platform_commission_percent) || 0,
      });

      setFormData((prev) => ({ ...prev, ...res.data?.data }));
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Pengaturan website berhasil disimpan.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(', ')
          : 'Gagal menyimpan pengaturan website!';
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#D7C4B0] p-10 text-center text-sm font-bold text-slate-500">
        Memuat pengaturan website...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm p-8 space-y-8">
      {/* INFORMASI UMUM */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-[#261C19] border-b border-slate-100 pb-3">
          Informasi Umum Website
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className={labelClass}>Nama Website</label>
            <input
              type="text"
              name="site_name"
              value={formData.site_name}
              onChange={handleChange}
              placeholder="Cth: KafanaVista"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Logo URL (Opsional)</label>
            <input
              type="text"
              name="site_logo"
              value={formData.site_logo}
              onChange={handleChange}
              placeholder="https://.../logo.png"
              className={inputClass}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Teks Tentang (About)</label>
            <textarea
              name="footer_about_text"
              value={formData.footer_about_text}
              onChange={handleChange}
              rows={3}
              placeholder="Deskripsi singkat perusahaan/platform"
              className={inputClass}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Teks Copyright</label>
            <input
              type="text"
              name="footer_copyright"
              value={formData.footer_copyright}
              onChange={handleChange}
              placeholder="© 2026 Kafana Vista. All rights reserved."
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Biaya Ekstra Properti (Rp)</label>
            <input
              type="number"
              name="property_extra_fee"
              value={formData.property_extra_fee}
              onChange={handleChange}
              min={0}
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Komisi Platform per Booking (%)</label>
            <input
              type="number"
              name="platform_commission_percent"
              value={formData.platform_commission_percent}
              onChange={handleChange}
              min={0}
              max={100}
              step="0.01"
              className={inputClass}
            />
            <p className="text-[10px] text-slate-400">Persentase komisi yang dipotong dari setiap booking kost terkonfirmasi.</p>
          </div>
        </div>
      </section>

      {/* KONTAK */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-[#261C19] border-b border-slate-100 pb-3">
          Kontak &amp; Alamat
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className={labelClass}>No. WhatsApp / Telepon</label>
            <input
              type="text"
              name="footer_phone"
              value={formData.footer_phone}
              onChange={handleChange}
              placeholder="628xxxxxxxxxx"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Email</label>
            <input
              type="email"
              name="footer_email"
              value={formData.footer_email}
              onChange={handleChange}
              placeholder="support@kafanavista.com"
              className={inputClass}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelClass}>Alamat</label>
            <input
              type="text"
              name="footer_address"
              value={formData.footer_address}
              onChange={handleChange}
              placeholder="Jl. Contoh No. 123, Kota Anda"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* MEDIA SOSIAL */}
      <section className="space-y-5">
        <h2 className="text-lg font-bold text-[#261C19] border-b border-slate-100 pb-3">
          Link Media Sosial
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className={labelClass}>Facebook</label>
            <input
              type="url"
              name="social_facebook"
              value={formData.social_facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>Instagram</label>
            <input
              type="url"
              name="social_instagram"
              value={formData.social_instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label className={labelClass}>TikTok</label>
            <input
              type="url"
              name="social_tiktok"
              value={formData.social_tiktok}
              onChange={handleChange}
              placeholder="https://tiktok.com/@..."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-lg transition shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}