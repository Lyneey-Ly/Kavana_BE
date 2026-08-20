import { useState, useEffect, useCallback } from 'react';
import API from '../api';

/**
 * Hook data-fetching untuk panel SuperAdmin.
 * - Fetch HANYA dilakukan ketika komponen dipakai (lazy) / deps berubah.
 * - Menggunakan async IIFE + cancellation untuk mencegah race condition.
 * - Menghindari setState sinkron di dalam effect (sesuai rekomendasi React).
 */
export default function useSuperAdminFetch(url, options = {}) {
  const { deps = [], transform, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await API.get(url);
        if (cancelled) return;
        setData(transform ? transform(res.data) : res.data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(`Gagal memuat ${url}`, err);
        setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);

  return { data, loading, error, reload, setData };
}