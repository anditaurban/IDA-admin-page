export type DiscountMode = 'percent' | 'nominal';

export function normalizeNumberString(value: unknown) {
  // Return string kosong untuk UX yang lebih baik saat user menghapus input
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/\D/g, '');
}

export function formatRibuan(value: string | number) {
  const normalized = normalizeNumberString(value);
  if (!normalized) return '';
  return new Intl.NumberFormat('id-ID').format(Number(normalized));
}

export function calculateTotalPrice(
  price: string | number,
  discountMode: DiscountMode,
  discountValue: string | number,
) {
  // Tambahkan fallback || 0 saat melakukan operasi matematika
  const basePrice = Number(normalizeNumberString(price)) || 0;
  const discount = Number(normalizeNumberString(discountValue)) || 0;

  if (discountMode === 'percent') {
    const safePercent = Math.min(discount, 100);
    return Math.max(basePrice - (basePrice * safePercent) / 100, 0);
  }

  return Math.max(basePrice - discount, 0);
}