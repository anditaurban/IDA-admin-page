'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import {
  BASE_URL,
  buildJsonHeaders,
  readApiResponse,
} from '@/utils/api';
import {
  calculateTotalPrice,
  DiscountMode,
  normalizeNumberString,
} from '@/utils/coursePricing';
import type { CourseCategory } from '@/hooks/useCourseCategories';

export interface CourseLevel {
  level_id: number;
  owner_id: number;
  level_name: string;
}

type ToastType = 'success' | 'error' | 'info' | 'loading';
type ToastFn = (type: ToastType, message: string) => void;
type ApiRecord = Record<string, unknown>;

type ThumbnailUpdateResponse = {
  message?: string;
  thumbnail?: string;
  url?: string;
  file_url?: string;
  data?: {
    thumbnail?: string;
    url?: string;
    file_url?: string;
    message?: string;
  };
};

export interface BasicCourseData {
  course_id?: number;
  author_name?: string;
  title: string;
  thumbnail: string;
  level_id?: number;
  level_name?: string;
  price: string;
  discount: string;
  discount_nominal?: string;
  discount_percent?: string;
  total_price?: string;
  isPublished?: boolean;
  category_id?: number;
  category_name?: string;
  author?: string;
  rating?: string;
  students?: number;
  deskripsi?: string;
  tech_stack?: string[];
  target_audience?: string[];
}

export const defaultBasicData: BasicCourseData = {
  course_id: undefined,
  title: '',
  thumbnail: '',
  level_id: 1, 
  level_name: 'Beginner',
  price: '',
  discount: '',
  discount_nominal: '',
  discount_percent: '',
  total_price: '0',
  isPublished: false,
  category_id: 1,
  category_name: 'Umum',
  author: 'Instruktur',
  rating: '0.0',
  students: 0,
  deskripsi: '',
  tech_stack: [],
  target_audience: [],
};

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const cleanValue = value.trim();
    if (!cleanValue) return [];

    try {
      const parsed: unknown = JSON.parse(cleanValue);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback comma-separated string
    }

    return cleanValue
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function extractCoursePayload(resJson: unknown, courseSlug: string): ApiRecord | null {
  if (!resJson || typeof resJson !== 'object') return null;

  const data = resJson as ApiRecord;
  const tableData = data.tableData;
  const detail = data.detail;
  const responseData = data.data;

  if (Array.isArray(tableData)) {
    const matched = tableData.find((course) => {
      if (!course || typeof course !== 'object') return false;
      return String((course as ApiRecord).course_id) === String(courseSlug);
    });

    const fallback = tableData[0];

    if (matched && typeof matched === 'object') return matched as ApiRecord;
    if (fallback && typeof fallback === 'object') return fallback as ApiRecord;

    return null;
  }

  if (Array.isArray(detail)) {
    const firstDetail = detail[0];
    return firstDetail && typeof firstDetail === 'object' ? (firstDetail as ApiRecord) : null;
  }

  if (detail && typeof detail === 'object') return detail as ApiRecord;

  if (Array.isArray(responseData)) {
    const firstData = responseData[0];
    return firstData && typeof firstData === 'object' ? (firstData as ApiRecord) : null;
  }

  if (responseData && typeof responseData === 'object') return responseData as ApiRecord;

  if (Array.isArray(resJson)) {
    const firstItem = resJson[0];
    return firstItem && typeof firstItem === 'object' ? (firstItem as ApiRecord) : null;
  }

  return data;
}

function normalizeCourseData(apiData: ApiRecord, courseSlug: string): BasicCourseData {
  const price = normalizeNumberString(apiData.price);

  // ✨ FIX DISKON HILANG: Baca dari field yang benar sesuai dengan Payload kita
  const discountNominal = Number(apiData.discount_nominal) || 0;
  const discountPercent = Number(apiData.discount_percent) || 0;

  const discountMode: DiscountMode = discountNominal > 0 ? 'nominal' : 'percent';
  
  // ✨ FIX UX STANDAR PROFESIONAL: 
  // Jika nilainya 0, ubah jadi string kosong '' agar form bersih dan Placeholder "0" bisa muncul.
  const cleanNominal = discountNominal > 0 ? String(discountNominal) : '';
  const cleanPercent = discountPercent > 0 ? String(discountPercent) : '';
  const discountValue = discountMode === 'nominal' ? cleanNominal : cleanPercent;

  const totalPrice = apiData.total_price
    ? normalizeNumberString(apiData.total_price)
    : String(calculateTotalPrice(price, discountMode, discountValue || '0'));

  return {
    course_id: apiData.course_id
      ? Number(apiData.course_id)
      : Number.isFinite(Number(courseSlug))
        ? Number(courseSlug)
        : undefined,
    title: typeof apiData.title === 'string' ? apiData.title : '',
    thumbnail: typeof apiData.thumbnail === 'string' ? apiData.thumbnail : '',
    
    // ✨ FIX LEVEL: Tangkap ID-nya (entah backend pakai key 'level_id' atau 'level')
    level_id: apiData.level_id ? Number(apiData.level_id) : (apiData.level ? Number(apiData.level) : 1),
    level_name: typeof apiData.level_name === 'string' ? apiData.level_name : '', // Dibiarkan fleksibel
    
    price,
    discount: discountValue,
    discount_nominal: cleanNominal,  // <-- Sekarang masuk ke state form sebagai string kosong
    discount_percent: cleanPercent,  // <-- Sekarang masuk ke state form sebagai string kosong
    total_price: totalPrice,
    isPublished: apiData.status === 1 || apiData.is_active === true,
    category_id: apiData.category_id ? Number(apiData.category_id) : 1,
    category_name: typeof apiData.category_name === 'string' ? apiData.category_name : 'Umum',
    author: typeof apiData.author === 'string' ? apiData.author : '',
    author_name: typeof apiData.author_name === 'string' ? apiData.author_name : '',
    rating: apiData.rating ? String(apiData.rating) : '0.0',
    students: apiData.students ? Number(apiData.students) : 0,
    deskripsi: typeof apiData.deskripsi === 'string' ? apiData.deskripsi : '',
    tech_stack: normalizeStringArray(apiData.tech_stack),
    target_audience: normalizeStringArray(apiData.target_audience),
  };
}

function resolveUploadedThumbnail(result: ThumbnailUpdateResponse | string | null): string {
  if (!result || typeof result === 'string') return '';

  return (
    result.data?.thumbnail ||
    result.thumbnail ||
    result.url ||
    result.file_url ||
    result.data?.url ||
    result.data?.file_url ||
    ''
  );
}

export function useCourseEditor(params: {
  courseSlug: string;
  categories: CourseCategory[];
  levels: CourseLevel[];
  showToast: ToastFn;
  onUnauthorized: () => void;
  currentOwnerId?: string;
}) {
  const { courseSlug, categories, levels, showToast, onUnauthorized, currentOwnerId } = params;

  const [basicData, setBasicData] = useState<BasicCourseData>(defaultBasicData);
  const [initialBasicData, setInitialBasicData] = useState<BasicCourseData>(defaultBasicData);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [discountMode, setDiscountMode] = useState<DiscountMode>('percent');

  const getActiveToken = useCallback(() => {
    const cookieToken = Cookies.get('api_token');
    if (cookieToken && cookieToken.length > 20) return cookieToken;
    return process.env.NEXT_PUBLIC_API_TOKEN || '';
  }, []);

  const fetchCourseDetail = useCallback(async () => {
    try {
      setIsFetching(true);

      if (!BASE_URL) throw new Error('Base URL API belum diset.');

      const token = getActiveToken();
      if (!token) throw new Error('Token API tidak tersedia.');

      // 🎯 LANGKAH 1: Ambil ID Kelas terupdate langsung dari URL (?course=32)
      const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlCourseId = searchParams ? searchParams.get('course') : null;
      
      // Prioritaskan ID dari URL, jika kosong baru gunakan courseSlug bawaan
      const targetParam = urlCourseId || courseSlug;

      if (!targetParam) return;

      // Bilas state thumbnail sebelum fetch agar gambar kelas sebelumnya tidak nyangkut
      setBasicData((prev) => ({
        ...prev,
        thumbnail: '', 
      }));

      // 🎯 LANGKAH 2: Tembak API menggunakan ID dinamis dari URL, bukan slug statis lagi!
      const response = await fetch(`${BASE_URL}/detail/course/${targetParam}`, {
        method: 'GET',
        headers: buildJsonHeaders(token),
      });

      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }

      const result = await readApiResponse<{ data?: { thumbnail?: string }; thumbnail?: string }>(response);
      
      // 🚨 BANTUAN DEBUG: Tampilkan isi JSON asli dari backend ke Console Browser
      console.log(`🔥 JSON ASLI KELAS ${targetParam}:`, result);

      if (!response.ok) {
        throw new Error(`Gagal mengambil detail course (Status ${response.status})`);
      }

      const apiData = extractCoursePayload(result, targetParam);

      if (apiData) {
        if (currentOwnerId && apiData.owner_id && String(apiData.owner_id) !== String(currentOwnerId)) {
          showToast('error', 'Akses Ditolak: Anda tidak memiliki hak untuk mengedit kelas ini.');
          setTimeout(() => { window.location.href = '/'; }, 2000);
          return;
        }

        const freshData = normalizeCourseData(apiData, targetParam);
        
        // ✨ JURUS BYPASS TYPE-SAFE: Ekstrak gambar dengan cara yang disukai TypeScript
        let rawThumbnailFromBackend = '';

        // 1. Pastikan 'result' adalah sebuah objek, bukan sekadar string pesan error
        if (typeof result === 'object' && result !== null) {
          // Bungkus (Cast) dengan tipe yang kita harapkan
          const resObj = result as { data?: { thumbnail?: string }; thumbnail?: string };
          rawThumbnailFromBackend = resObj.data?.thumbnail || resObj.thumbnail || '';
        }

        // 2. Jika masih kosong, coba ekstrak dari apiData
        if (!rawThumbnailFromBackend) {
          rawThumbnailFromBackend = (apiData as { thumbnail?: string })?.thumbnail || '';
        }

        // ✨ INI BAGIAN YANG SEMPAT HILANG: Kita buat forcedFreshData-nya!
        const forcedFreshData = {
          ...freshData, // Menggunakan freshData agar ESLint tidak protes
          course_id: Number(targetParam) || freshData.course_id,
          thumbnail: rawThumbnailFromBackend // Paksa gunakan gambar langsung dari database
        };

        // 3. Masukkan data yang sudah sempurna ke dalam state
        setBasicData(forcedFreshData);
        setInitialBasicData(forcedFreshData);
        setDiscountMode(Number(forcedFreshData.discount_nominal || 0) > 0 ? 'nominal' : 'percent');
        
        // (Opsional) Kosongkan local preview jika ada
        // setLocalPreview('');
      }
    } catch (error) {
      console.error('Gagal mengambil detail course:', error);
      showToast('error', error instanceof Error ? error.message : 'Gagal mengambil detail course.');
    } finally {
      setIsFetching(false);
    }
  }, [courseSlug, getActiveToken, onUnauthorized, showToast, currentOwnerId]);

  // Trigger ulang fetch setiap kali string parameter URL berubah
  const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
  
  useEffect(() => {
    fetchCourseDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch]);

  const handleBasicChange = useCallback(
    (field: keyof BasicCourseData, value: string | boolean | number) => {
      setBasicData((prev) => {
        const next: BasicCourseData = { ...prev, [field]: value };

        if (field === 'category_id') {
          const selectedCategory = categories.find(
            (category) => String(category.category_id) === String(value),
          );

          next.category_name = selectedCategory?.category_name || prev.category_name;
        }

        if (field === 'level_id') {
          const selectedLevel = levels.find( // Pastikan parameter 'levels' sudah diterima hook ini
            (lvl) => String(lvl.level_id) === String(value),
          );
          next.level_id = selectedLevel?.level_id || prev.level_id;
        }

        // ✨ FIX LOGIKA PROFESIONAL: Auto-Sync Harga, Diskon Nominal, dan Diskon Persen
        if (field === 'price' || field === 'discount_percent' || field === 'discount_nominal') {
          // 1. Ambil inputan user yang paling baru
          const rawPrice = field === 'price' ? String(value) : (prev.price || '');
          const rawPercent = field === 'discount_percent' ? String(value) : (prev.discount_percent || '');
          const rawNominal = field === 'discount_nominal' ? String(value) : (prev.discount_nominal || '');

          // 2. Bersihkan Harga (P) agar bisa dihitung mesin
          const p = Number(normalizeNumberString(rawPrice)) || 0;
          
          let calcNominal = 0;
          let calcPercent = 0;

          // SKENARIO A: Instruktur mengetik di kolom PERSEN
          if (field === 'discount_percent') {
            const safePercentStr = rawPercent.replace(',', '.'); // Sanitasi koma
            calcPercent = parseFloat(safePercentStr) || 0;
            
            // Hitung otomatis Nominalnya (Dibulatkan agar tidak ada harga pecahan rupiah)
            calcNominal = Math.round(p * (calcPercent / 100)); 

            next.discount_percent = rawPercent; // Biarkan input user apa adanya (misal "50,5")
            next.discount_nominal = calcNominal > 0 ? String(calcNominal) : '';
          } 
          
          // SKENARIO B: Instruktur mengetik di kolom NOMINAL (Rupiah)
          else if (field === 'discount_nominal') {
            calcNominal = Number(normalizeNumberString(rawNominal)) || 0;
            
            // Hitung otomatis Persennya (Dibulatkan max 2 desimal, cegah error dibagi 0)
            calcPercent = p > 0 ? Number(((calcNominal / p) * 100).toFixed(2)) : 0;

            next.discount_nominal = rawNominal; // Biarkan format ketikan user
            next.discount_percent = calcPercent > 0 ? String(calcPercent).replace('.', ',') : '';
          } 
          
          // SKENARIO C: Instruktur merubah HARGA UTAMA (Price)
          else if (field === 'price') {
            // Jika harga berubah, patokan utamanya adalah Persen yang sudah ada
            const safePercentStr = String(prev.discount_percent || '').replace(',', '.');
            calcPercent = parseFloat(safePercentStr) || 0;
            calcNominal = Math.round(p * (calcPercent / 100));

            next.price = rawPrice;
            // Persen tetap, tapi Nominal dihitung ulang berdasarkan harga baru
            next.discount_nominal = calcNominal > 0 ? String(calcNominal) : '';
          }

          // 3. Kalkulasi TOTAL HARGA (T = P - Dn)
          const total = Math.max(0, p - calcNominal); // Cegah harga minus
          next.total_price = total > 0 ? String(total) : '';
        }

        return next;
      });
    },
    [categories, levels],
  );

  const switchDiscountMode = useCallback((mode: DiscountMode) => {
    setDiscountMode(mode);
    setBasicData((prev) => {
      const total = calculateTotalPrice(prev.price, mode, prev.discount);

      return {
        ...prev,
        discount_percent: mode === 'percent' ? prev.discount : '',
        discount_nominal: mode === 'nominal' ? prev.discount : '',
        total_price: String(total),
      };
    });
  }, []);

  // ✨ TAMBAHAN BARU: Fungsi untuk membatalkan edit
  const discardChanges = useCallback(() => {
    setBasicData(initialBasicData);
    setDiscountMode(Number(initialBasicData.discount_nominal || 0) > 0 ? 'nominal' : 'percent');
  }, [initialBasicData]);

  // Konversi semua ke Number agar perubahan string '0' ke '' tidak memicu 'Unsaved Changes' palsu
  const editablePayload = useMemo(
    () => ({
      title: basicData.title,
      level_name: basicData.level_name,
      price: Number(normalizeNumberString(basicData.price)) || 0,
      category_id: basicData.category_id,
      author: basicData.author,
      discount_nominal: Number(normalizeNumberString(basicData.discount_nominal)) || 0,
      discount_percent: parseFloat(String(basicData.discount_percent).replace(',', '.')) || 0,
      total_price: Number(normalizeNumberString(basicData.total_price)) || 0,
    }),
    [basicData],
  );

  const initialEditablePayload = useMemo(
    () => ({
      title: initialBasicData.title,
      level_name: initialBasicData.level_name,
      price: Number(normalizeNumberString(initialBasicData.price)) || 0,
      category_id: initialBasicData.category_id,
      author: initialBasicData.author,
      discount_nominal: Number(normalizeNumberString(initialBasicData.discount_nominal)) || 0,
      discount_percent: parseFloat(String(initialBasicData.discount_percent).replace(',', '.')) || 0,
      total_price: Number(normalizeNumberString(initialBasicData.total_price)) || 0,
    }),
    [initialBasicData],
  );

  const hasUnsavedChanges = JSON.stringify(editablePayload) !== JSON.stringify(initialEditablePayload);

  const saveCourseChanges = useCallback(async () => {
    try {
      setIsSaving(true);
      showToast('loading', 'Menyimpan perubahan kelas...');

      if (!BASE_URL) throw new Error('API URL tidak diset.');

      const token = getActiveToken();
      if (!token) throw new Error('Token API tidak tersedia.');

      // Di dalam fungsi saveCourseChanges()

      const targetCourseId = basicData.course_id || courseSlug;

      // ✨ FIX: 1. Bersihkan Harga dan Diskon terlebih dahulu
      const cleanPrice = Number(normalizeNumberString(basicData.price)) || 0;
      const cleanNominal = Number(normalizeNumberString(basicData.discount_nominal)) || 0;
      
      // ✨ FIX: 2. Kalkulasi ulang Total Price secara mutlak (Cegah Harga Minus)
      const finalTotalPrice = Math.max(0, cleanPrice - cleanNominal);

      // 3. Masukkan ke dalam Payload
      const payload = {
        title: basicData.title.trim(),
        level_id: basicData.level_id,
        category_id: basicData.category_id,
        author: basicData.author,
        
        // Data Harga yang dijamin 100% akurat
        price: cleanPrice,
        discount_nominal: cleanNominal,
        discount_percent: parseFloat(String(basicData.discount_percent).replace(',', '.')) || 0,
        
        // ✨ FIX: 3. Tembak hasil kalkulasi mutlak ini ke backend!
        total_price: finalTotalPrice, 
      };

      const response = await fetch(`${BASE_URL}/update/course/${targetCourseId}`, {

        method: 'PUT',
        headers: buildJsonHeaders(token),
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Gagal menyimpan perubahan kelas.');
      }

      setInitialBasicData(basicData);
      showToast('success', 'Perubahan kelas berhasil disimpan.');
    } catch (error) {
      console.error('Save course failed:', error);
      showToast('error', error instanceof Error ? error.message : 'Gagal menyimpan perubahan kelas.');
    } finally {
      setIsSaving(false);
    }
  }, [basicData, courseSlug, getActiveToken, onUnauthorized, showToast]);

  const updateThumbnail = useCallback(
    async (file: File) => {
      try {
        setIsUploadingThumbnail(true);
        showToast('loading', 'Mengunggah thumbnail kelas...');

        if (!BASE_URL) throw new Error('Base URL tidak diset.');

        const token = getActiveToken();
        if (!token) throw new Error('Token API tidak tersedia.');

        // (KODE YANG BENAR)
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const currentCourseId = searchParams ? searchParams.get('course') : null;

        // ✨ FIX KRITIS: Balik prioritasnya!
        // Gunakan currentCourseId yang sudah dibuat di atas
        const targetCourseId = currentCourseId || basicData.course_id;

        if (!targetCourseId || String(targetCourseId) === 'undefined') {
          throw new Error('ID Kelas tidak ditemukan. Pastikan URL memiliki parameter ?course=...');
        }

        const formData = new FormData();
        formData.append('thumbnail', file);

        const customHeaders: HeadersInit = {
          Accept: 'application/json',
        };
        if (token) {
          customHeaders.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${BASE_URL}/update/course/thumbnail/${targetCourseId}`, {
          method: 'PUT',
          headers: customHeaders,
          body: formData,
        });

        if (response.status === 401 || response.status === 403) {
          onUnauthorized();
          return;
        }

        const result = await readApiResponse<ThumbnailUpdateResponse>(response);

        if (!response.ok) {
          const message =
            typeof result === 'object' && result !== null && 'message' in result
              ? String(result.message)
              : `Upload thumbnail gagal (Status ${response.status})`;

          throw new Error(message);
        }

        const uploadedUrl = resolveUploadedThumbnail(result);

        if (uploadedUrl) {
          setBasicData((prev) => ({ ...prev, thumbnail: uploadedUrl }));
          setInitialBasicData((prev) => ({ ...prev, thumbnail: uploadedUrl }));
        } else {
          // Fallback lokal
          const localPreviewUrl = URL.createObjectURL(file);
          setBasicData((prev) => ({ ...prev, thumbnail: localPreviewUrl }));
          setInitialBasicData((prev) => ({ ...prev, thumbnail: localPreviewUrl }));
        }

        showToast('success', 'Thumbnail kelas berhasil diperbarui.');
      } catch (error) {
        console.error('Thumbnail update failed:', error);
        showToast('error', error instanceof Error ? error.message : 'Gagal memperbarui thumbnail.');
      } finally {
        setIsUploadingThumbnail(false);
      }
    },
    // Pastikan courseQueryId (atau searchParams) tidak memicu infinite render, jadi cukup ambil manual di dalam fungsi seperti di atas
    [basicData.course_id, getActiveToken, onUnauthorized, showToast]
  );

  const resolvedCourseId =
    basicData.course_id || (Number.isFinite(Number(courseSlug)) ? Number(courseSlug) : undefined);

  return {
    basicData,
    isFetching,
    isSaving,
    isUploadingThumbnail,
    discountMode,
    hasUnsavedChanges,
    resolvedCourseId,
    getActiveToken,
    handleBasicChange,
    switchDiscountMode,
    saveCourseChanges,
    updateThumbnail,
    refetchCourseDetail: fetchCourseDetail,
    discardChanges,
  };
}

export default useCourseEditor;