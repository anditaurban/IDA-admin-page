'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useToast } from '@/components/ui/ToastProvider';

export interface CourseItem {
  id: string | number;
  slug: string;
  title: string;
  status: string;
  students: number;
  lastUpdated: string;
  progress: number;
  batch?: string;
  thumbnail?: string;
  totalPrice: number; // ✨ TAMBAHAN DATA HARGA
}

interface ApiCourseItem {
  course_id: number;
  owner_id?: number;
  user_id?: number;
  category_id?: number;
  category_name?: string;
  title: string;
  level?: string;
  price?: number;
  total_price?: number; // ✨ BACA DARI API
  thumbnail?: string;
  author?: string;
  rating?: string;
  students?: number;
  updated_at?: string;
  created_at?: string;
  progress?: number;
}

export interface UserProfile {
  id?: string | number;
  user_id?: string | number;
  owner_id?: string | number;
  email?: string;
  role?: string;
  name?: string;
  [key: string]: unknown;
}

export function useInstructorDashboard() {
  const router = useRouter();
  const { showToast } = useToast();

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;
  const ENV_OWNER_ID = process.env.NEXT_PUBLIC_OWNER_ID || '';
  const ENV_API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || '';

  // ✨ AMBIL owner_id (Lembaga)
  const activeOwnerId = useMemo(() => {
    const profileOwnerId = userProfile?.owner_id;
    return profileOwnerId ? String(profileOwnerId) : ENV_OWNER_ID;
  }, [userProfile, ENV_OWNER_ID]);

  // ✨ AMBIL user_id (Instruktur Spesifik)
  const activeUserId = useMemo(() => {
    return userProfile?.user_id ? String(userProfile.user_id) : '';
  }, [userProfile]);

  const performLogout = useCallback(() => {
    Cookies.remove('auth_session');
    Cookies.remove('api_token');
    Cookies.remove('token');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('instructor_owner_id');
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    const sessionToken = Cookies.get('auth_session');
    if (!sessionToken) {
      performLogout();
      return;
    }
    const savedProfile = localStorage.getItem('user_profile');
    if (!savedProfile) {
      showToast('error', 'Data profil login tidak ditemukan.');
      performLogout();
      return;
    }
    try {
      setUserProfile(JSON.parse(savedProfile) as UserProfile);
    } catch {
      performLogout();
    } finally {
      setIsAuthChecking(false);
    }
  }, [performLogout, showToast]);

  const getActiveToken = useCallback(() => Cookies.get('api_token') || ENV_API_TOKEN, [ENV_API_TOKEN]);

  const formatSimpleDate = (dateString?: string) => {
    if (!dateString) return 'Baru ditambahkan';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Baru ditambahkan';
      return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
    } catch {
      return 'Baru ditambahkan';
    }
  };

  const fetchCourses = useCallback(
    async (page: number, search: string = '') => {
      if (isAuthChecking) return;
      setIsLoading(true);

      try {
        if (!BASE_URL || !activeOwnerId) throw new Error('ENV_OR_OWNER_ID_MISSING');

        const userParam = activeUserId ? `&user_id=${activeUserId}` : '';
        const activeToken = getActiveToken();
        const headers: HeadersInit = { Accept: 'application/json', 'Content-Type': 'application/json' };
        if (activeToken) headers.Authorization = `Bearer ${activeToken}`;

        // 🛠️ FUNGSI BANTUAN PENGAMBIL DATA PER HALAMAN
        const fetchPageFromBackend = async (pageNumber: number) => {
          const endpoint = search
            ? `${BASE_URL}/table/course/${activeOwnerId}/${pageNumber}?search=${encodeURIComponent(search)}${userParam}`
            : `${BASE_URL}/table/course/${activeOwnerId}/${pageNumber}?${userParam}`;
          
          const response = await fetch(endpoint, { method: 'GET', headers });
          if (!response.ok) {
            if (response.status === 401 || response.status === 403) throw new Error('UNAUTHORIZED');
            return { tableData: [], totalPages: 1 }; // Return kosong jika error 404/500 dll
          }
          return await response.json();
        };

        // ✨ 1. AMBIL HALAMAN PERTAMA (Untuk mengecek ada berapa total halaman di Backend)
        const firstData = await fetchPageFromBackend(1);
        let allRawData = Array.isArray(firstData.tableData) ? [...firstData.tableData] : [];
        const backendTotalPages = firstData.totalPages || 1;

        // ✨ 2. JURUS SAPU JAGAT: Jika backend memecah data ke beberapa halaman, sedot semuanya!
        if (backendTotalPages > 1) {
          const promises = [];
          // Kita loop mulai dari halaman 2 sampai halaman terakhir milik backend
          for (let i = 2; i <= backendTotalPages; i++) {
            promises.push(fetchPageFromBackend(i));
          }
          // Eksekusi secara bersamaan (Parallel) agar super cepat
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (Array.isArray(res.tableData)) {
              allRawData = [...allRawData, ...res.tableData]; // Gabungkan semua kelas!
            }
          });
        }

        // ✨ 3. SARING DATA KITA (Sekarang kita punya akses ke 100% database)
        const myCourses = activeUserId
          ? allRawData.filter((item: ApiCourseItem) => String(item.user_id) === activeUserId)
          : allRawData;

        // ✨ 4. PAGINASI LOKAL (Kita atur 10 Course per Halaman)
        const itemsPerPage = 10;
        const finalTotalItems = myCourses.length; // Ini PASTI menemukan 12/13 kelas Anda!
        const finalTotalPages = Math.ceil(finalTotalItems / itemsPerPage) || 1;

        // Sabuk Pengaman Paginasi: Mencegah user nyasar ke halaman yang kosong
        const safePage = page > finalTotalPages ? finalTotalPages : (page < 1 ? 1 : page);

        // Potong array data khusus untuk halaman yang sedang dibuka
        const startIndex = (safePage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedCourses = myCourses.slice(startIndex, endIndex);

        // ✨ 5. FORMAT DATA UNTUK DITAMPILKAN
        const formattedData: CourseItem[] = paginatedCourses.map((item: ApiCourseItem) => {
          let displayThumb = item.thumbnail || '';
          
          if (displayThumb) {
            if (!displayThumb.startsWith('http') && !displayThumb.startsWith('bg-') && !displayThumb.startsWith('data:')) {
              const filename = displayThumb.split('/').pop(); 
              displayThumb = `${BASE_URL}/thumbnail/course/${filename}`;
            }
          }

          const finalPrice = Number(item.total_price) || Number(item.price) || 0;
          const dateToUse = item.updated_at || item.created_at;

          return {
            id: item.course_id,
            slug: String(item.course_id),
            title: item.title,
            status: 'Published',
            students: item.students || 0,
            lastUpdated: formatSimpleDate(dateToUse),
            progress: item.progress || 100,
            batch: item.category_name || 'Umum',
            thumbnail: displayThumb,
            totalPrice: finalPrice,
          };
        });

        // ✨ 6. SIMPAN SEMUA KONDISI KE STATE
        setCourses(formattedData);
        setTotalItems(finalTotalItems); // Pasti Akurat! (misal: 13)
        setTotalPages(finalTotalPages); // Pasti Akurat! (misal: 2)
        setCurrentPage(safePage);

      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          showToast('error', 'Sesi login Anda telah berakhir.');
          performLogout();
          return;
        }
        console.error('Gagal memuat data kelas:', error);
        setCourses([]);
        setTotalPages(1);
        setCurrentPage(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    },
    [BASE_URL, activeOwnerId, activeUserId, getActiveToken, isAuthChecking, performLogout, showToast]
  );

  useEffect(() => {
    if (isAuthChecking || !activeOwnerId) return;
    const timer = setTimeout(() => fetchCourses(1, searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchCourses, isAuthChecking, activeOwnerId]);

  const getDisplayName = useCallback(() => {
    if (!userProfile) return 'Instruktur';
    if (userProfile.name) return String(userProfile.name);
    const emailName = userProfile.email ? userProfile.email.split('@')[0] : 'User';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }, [userProfile]);

  return {
    courses,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    totalItems, // ✨ EXPORT DATA TOTAL ITEM
    fetchCourses,
    isAddModalOpen,
    setIsAddModalOpen,
    userProfile,
    isAuthChecking,
    activeOwnerId,
    getDisplayName,
    performLogout,
  };
}