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
      // Menggunakan Base URL spesifik untuk Auth
      const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://auth.katib.cloud';
      const appId = process.env.NEXT_PUBLIC_APP_ID || '20'; // Sesuai dengan spesifikasi /login/20/...
      
      const cleanPhone = formatPhoneNumber(phoneNumber);
      const endpoint = `${authBaseUrl}/login/${appId}/${cleanPhone}`;
      
      console.log("Menembak API ke:", endpoint);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server Error: Endpoint tidak valid atau tidak ditemukan (404/500)");
      }

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(responseJson.message || 'Gagal mengirim OTP');
      }

      if (responseJson.data?.status === 'success' || response.status === 201) {
        console.log('OTP Sent:', responseJson);
        setLoginState('otp');
      } else {
        throw new Error('Gagal mengirim OTP. Pastikan nomor terdaftar.');
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
      const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://auth.katib.cloud';
      const cleanPhone = formatPhoneNumber(phoneNumber);

      const payload = {
        phone: cleanPhone, 
        otp: otpCode 
      };

      const response = await fetch(`${authBaseUrl}/otp/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Kode OTP salah atau kedaluwarsa.');
      }

      console.log('Login Success:', data);

      if (typeof window !== 'undefined') {
        // Simpan Profil
        localStorage.setItem('user_profile', JSON.stringify(data));
        
        // ✨ Menyimpan OWNER_ID ke localStorage untuk digunakan oleh API Assignment
        if (data.owner_id) {
           localStorage.setItem('instructor_owner_id', String(data.owner_id));
        }
      }

      const activeUserId = data?.customer_id || data?.user_id || data?.owner_id || 'session_active';

      // Konfigurasi Cookie Standar Enterprise
      Cookies.set('auth_session', activeUserId.toString(), { 
          expires: 7,          // Usia mutlak: 7 hari
          path: '/',           // Valid untuk semua halaman
          secure: process.env.NODE_ENV === 'production', // Wajib true jika di production
          sameSite: 'lax'      // Keamanan standar browser modern
      });
      
      Cookies.set('token', activeUserId.toString(), { 
          expires: 7, 
          path: '/',
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax'
      });
      
      // ✨ Mengarahkan langsung ke Dashboard Utama (Root)
      router.push('/');

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Verify OTP:', err);
      setErrorMessage(err.message || 'Verifikasi gagal. Silakan coba lagi.');
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