import Swal from 'sweetalert2';

/**
 * ALERT SUKSES KAFANAVISTA
 */
export const kafanaSuccess = (title, message = '') => {
  return Swal.fire({
    title: `<span style="color: #261C19; font-weight: 800; font-size: 20px;">${title}</span>`,
    html: `<span style="color: #6B7280; font-size: 13px; font-family: sans-serif;">${message}</span>`,
    icon: 'success',
    iconColor: '#C5A059',
    background: '#FAF6F0',
    confirmButtonColor: '#C5A059',
    confirmButtonText: '✨ Siap, Mantap!',
    customClass: {
      popup: 'rounded-3xl border border-[#C5A059]/40 shadow-2xl p-6',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white shadow-md hover:bg-[#9C7A3C] transition-all duration-300 cursor-pointer'
    }
  });
};

/**
 * ALERT ERROR / GAGAL KAFANAVISTA
 */
export const kafanaError = (title, message = '') => {
  return Swal.fire({
    title: `<span style="color: #261C19; font-weight: 800; font-size: 20px;">${title}</span>`,
    html: `<span style="color: #4B5563; font-size: 13px; font-family: sans-serif;">${message}</span>`,
    icon: 'error',
    iconColor: '#E11D48',
    background: '#FAF6F0',
    confirmButtonColor: '#261C19',
    confirmButtonText: 'Tutup & Coba Lagi',
    customClass: {
      popup: 'rounded-3xl border border-rose-300 shadow-2xl p-6',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white hover:bg-black transition-all duration-300 cursor-pointer'
    }
  });
};

/**
 * ALERT PERINGATAN / WARNING KAFANAVISTA
 */
export const kafanaWarning = (title, message = '') => {
  return Swal.fire({
    title: `<span style="color: #261C19; font-weight: 800; font-size: 20px;">${title}</span>`,
    html: `<span style="color: #4B5563; font-size: 13px; font-family: sans-serif;">${message}</span>`,
    icon: 'warning',
    iconColor: '#D97706',
    background: '#FAF6F0',
    confirmButtonColor: '#261C19',
    confirmButtonText: 'Saya Mengerti',
    customClass: {
      popup: 'rounded-3xl border border-amber-300 shadow-2xl p-6',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white hover:bg-black transition-all duration-300 cursor-pointer'
    }
  });
};

/**
 * DIALOG KONFIRMASI KAFANAVISTA (Pilihan Ya / Batal)
 */
export const kafanaConfirm = async (title, message = '', confirmText = 'Ya, Lanjutkan') => {
  const result = await Swal.fire({
    title: `<span style="color: #261C19; font-weight: 800; font-size: 20px;">${title}</span>`,
    html: `<span style="color: #4B5563; font-size: 13px; font-family: sans-serif;">${message}</span>`,
    icon: 'question',
    iconColor: '#C5A059',
    showCancelButton: true,
    background: '#FAF6F0',
    confirmButtonColor: '#C5A059',
    cancelButtonColor: '#261C19',
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    customClass: {
      popup: 'rounded-3xl border border-[#C5A059]/40 shadow-2xl p-6',
      confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-white shadow-md hover:bg-[#9C7A3C] transition-all duration-300 cursor-pointer',
      cancelButton: 'px-6 py-2.5 rounded-xl font-bold text-white hover:bg-black transition-all duration-300 cursor-pointer'
    }
  });

  return result.isConfirmed;
};