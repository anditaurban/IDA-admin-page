import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export const useAuthLogic = () => {
  const router = useRouter();

  // --- STATE ---
  const [loginState, setLoginState] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- HELPER: FORMAT NOMOR HP ---
  const formatPhoneNumber = (raw: string) => {
    let clean = raw.replace(/\D/g, ''); 
    if (clean.startsWith('62')) {
      clean = '0' + clean.substring(2);
    } else if (!clean.startsWith('0')) {
      clean = '0' + clean;
    }
    return clean;
  };

  // --- 1. API: REQUEST OTP ---
  const handleCheckPhone = async () => {
    setErrorMessage('');
    
    if (phoneNumber.length < 9) {
      setErrorMessage('Nomor WhatsApp terlalu pendek');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Menggunakan variabel ENV khusus Auth
      const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://auth.katib.cloud';
      const appId = process.env.NEXT_PUBLIC_APP_ID || '20';
      
      const cleanPhone = formatPhoneNumber(phoneNumber);
      const endpoint = `${authBaseUrl}/login/${appId}/${cleanPhone}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server Error: Endpoint tidak ditemukan (404/500)");
      }

      const responseJson = await response.json();

      // ✅ Menangkap error "Failed to send WA message"
      if (responseJson.data?.status === 'Error' || responseJson.status === 'Error') {
        throw new Error(responseJson.data?.message || responseJson.message || 'Gagal mengirim pesan WhatsApp.');
      }

      if (!response.ok) {
        throw new Error(responseJson.message || 'Gagal menghubungi server OTP');
      }

      if (responseJson.data?.status === 'success' || responseJson.status === 'success' || response.status === 201 || response.status === 200) {
        setLoginState('otp');
      } else {
        throw new Error('Gagal mengirim OTP. Pastikan nomor Anda terdaftar.');
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Request OTP:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. API: VERIFY OTP ---
  const handleVerifyLogin = async () => {
    const otpCode = otpValues.join('');
    
    if (otpCode.length < 6) {
      setErrorMessage('Harap masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // ✅ Menggunakan variabel ENV khusus Auth
      const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://auth.katib.cloud';
      const cleanPhone = formatPhoneNumber(phoneNumber);

      const payload = {
        phone: cleanPhone, 
        otp: otpCode 
      };

      const response = await fetch(`${authBaseUrl}/otp/login`, {
        method: 'POST', // ✅ SESUAI INFO ANDA: Method harus PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.data?.status === 'Error' || data.status === 'Error') {
        throw new Error(data.data?.message || data.message || 'Kode OTP salah.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Kode OTP salah atau kedaluwarsa.');
      }

      if (typeof window !== 'undefined') {
        // Karena datanya flat (tidak dibungkus objek .data di balasan API Anda)
        localStorage.setItem('user_profile', JSON.stringify(data));

        // ✅ Simpan owner_id untuk API Dasbor Instruktur
        if (data.owner_id) {
          localStorage.setItem('instructor_owner_id', String(data.owner_id));
        }
      }

      // 1. Fokus pada user_id
      const activeUserId = data.user_id || data.owner_id;
      
      // 2. Ambil REAL API Token HANYA jika backend memang mengirimkannya
      const realApiToken = data.token || data.access_token || data.data?.token || data.data?.access_token;

      if (!activeUserId) {
        throw new Error("Data user_id tidak ditemukan dari server.");
      }

      // 3. Simpan Sesi Login Utama
      Cookies.set('auth_session', String(activeUserId), { 
          expires: 1, 
          path: '/',
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax'
      });
      
      // 4. ✨ PERBAIKAN: Hanya set api_token jika token aslinya ada!
      if (realApiToken) {
        Cookies.set('api_token', String(realApiToken), { 
            expires: 1, 
            path: '/',
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax'
        });
      } else {
        // Jika tidak ada token dari API, hapus cookie agar Beranda fallback ke ENV
        Cookies.remove('api_token', { path: '/' });
      }
      
      Cookies.set('token', String(activeUserId), { 
          expires: 1, 
          path: '/',
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax'
      });
      
      // 5. Redirect ke Beranda Instruktur
      router.push('/');

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Verify OTP:', err);
      setErrorMessage(err.message || 'Verifikasi gagal. Silakan periksa kembali kode OTP Anda.');
      setOtpValues(['', '', '', '', '', '']); 
    } finally {
      setIsLoading(false);
    }
  };

  // --- HELPER UI ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.substring(value.length - 1);
    setOtpValues(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;
    const newOtp = [...otpValues];
    pastedData.split('').forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtpValues(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  const resetLogin = () => {
    setLoginState('phone');
    setErrorMessage('');
    setOtpValues(['', '', '', '', '', '']);
  };

  return {
    loginState,
    phoneNumber,
    otpValues,
    isLoading,
    errorMessage,
    setPhoneNumber,
    handleCheckPhone,
    handleVerifyLogin,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    resetLogin
  };
};