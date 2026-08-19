export const parseTemplate = (template = '', data = {}) => {
  if (!template) return '';
  return template
    .replaceAll('{NAMA_PROPERTI}', data.property_name || '[Nama Properti]')
    .replaceAll('{ALAMAT_PROPERTI}', data.property_address || '[Alamat Properti]')
    .replaceAll('{HARGA_SEWA}', data.price ? `Rp ${data.price.toLocaleString('id-ID')}` : '[Harga]')
    .replaceAll('{NAMA_PENYEWA}', data.tenant_name || '[Nama Penyewa]');
};