import { useEffect, useState } from 'react';
import API from '../api';

export default function VendorBanner({ placement = 'home_hero' }) {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    API.get(`/vendor-ads/active?placement=${placement}`)
      .then((res) => setAds(res.data.data))
      .catch((err) => console.error('Gagal memuat iklan vendor', err));
  }, [placement]);

  if (ads.length === 0) return null;

  return (
    <div className="my-6 w-full">
      {ads.map((ad) => (
        <a key={ad.id} href={ad.link_url || '#'} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl shadow-md transition transform hover:scale-[1.01]">
          <img
            src={`http://127.0.0.1:8000/storage/${ad.banner_image}`}
            alt={ad.vendor_name}
            className="w-full h-auto max-h-48 object-cover rounded-2xl"
          />
        </a>
      ))}
    </div>
  );
}