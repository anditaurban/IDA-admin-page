import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

type LoginState = 'phone' | 'otp';

type AuthResponse = {
  status?: string;
  message?: string;
  token?: string;
  access_token?: string;
  owner_id?: string | number;
  user_id?: string | number;
  customer_id?: string | number;
  email?: string;
  role?: string;
  name?: string;
  data?: {
    status?: string;
    token?: string;
    access_token?: string;
    owner_id?: string | number;
    user_id?: string | number;
    customer_id?: string | number;
    email?: string;
    role?: string;
    name?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const SESSION_EXPIRES_DAYS = 1;

export const useAuthLogic = () => {
  const router = useRouter();

  const [loginState, setLoginState] = useState<LoginState>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatPhoneNumber = (raw: string) => {
    let clean = raw.replace(/\D/g, '');

    if (clean.startsWith('62')) {
      clean = `0${clean.substring(2)}`;
    } else if (!clean.startsWith('0')) {
      clean = `0${clean}`;
    }

    return clean;
  };

  const getAuthBaseUrl = () => {
    return process.env.NEXT_PUBLIC_AUTH_BASE_URL || 'https://auth.katib.cloud';
  };

  const getAppId = () => {
    return process.env.NEXT_PUBLIC_APP_ID || '20';
  };

  const getNestedAuthData = (data: AuthResponse) => {
    return data.data && typeof data.data === 'object' ? data.data : {};
  };

  const buildUserProfile = (data: AuthResponse) => {
    const nestedData = getNestedAuthData(data);

    return {
      ...data,
      ...nestedData,
      owner_id: data.owner_id ?? nestedData.owner_id,
      user_id: data.user_id ?? nestedData.user_id,
      customer_id: data.customer_id ?? nestedData.customer_id,
      email: data.email ?? nestedData.email,
      role: data.role ?? nestedData.role,
      name: data.name ?? nestedData.name,
      login_at: new Date().toISOString(),
    };
  };

  const getSessionId = (data: AuthResponse) => {
    const nestedData = getNestedAuthData(data);

    return (
      data.customer_id ||
      data.user_id ||
      data.owner_id ||
      nestedData.customer_id ||
      nestedData.user_id ||
      nestedData.owner_id ||
      ''
    );
  };

  const getApiToken = (data: AuthResponse) => {
    const nestedData = getNestedAuthData(data);
    return data.token || data.access_token || nestedData.token || nestedData.access_token || '';
  };

  const clearOldSession = () => {
    Cookies.remove('auth_session', { path: '/' });
    Cookies.remove('api_token', { path: '/' });
    Cookies.remove('token', { path: '/' });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('instructor_owner_id');
    }
  };

  const saveSession = (data: AuthResponse) => {
    const userProfile = buildUserProfile(data);
    const sessionId = getSessionId(data);
    const apiToken = getApiToken(data);

    if (!sessionId) {
      throw new Error('Login berhasil, tetapi ID pengguna tidak ditemukan dari server.');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('user_profile', JSON.stringify(userProfile));

      const activeOwnerId = userProfile.owner_id ?? userProfile.user_id ?? userProfile.customer_id;
      if (activeOwnerId) {
        localStorage.setItem('instructor_owner_id', String(activeOwnerId));
      }
    }

    Cookies.set('auth_session', String(sessionId), {
      expires: SESSION_EXPIRES_DAYS,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    if (apiToken) {
      Cookies.set('api_token', String(apiToken), {
        expires: SESSION_EXPIRES_DAYS,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    Cookies.remove('token', { path: '/' });
  };

  const handleCheckPhone = async () => {
    setErrorMessage('');

    const cleanPhone = formatPhoneNumber(phoneNumber);

    if (cleanPhone.length < 10) {
      setErrorMessage('Nomor WhatsApp terlalu pendek');
      return;
    }

    setIsLoading(true);

    try {
      const authBaseUrl = getAuthBaseUrl();
      const appId = getAppId();
      const endpoint = `${authBaseUrl}/login/${appId}/${cleanPhone}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server Error (${response.status}): Endpoint tidak valid.`);
      }

      const responseJson = await response.json();

      if (!response.ok) {
        throw new Error(responseJson.message || `Gagal mengirim OTP (Error ${response.status})`);
      }

      if (responseJson.data?.status === 'success' || response.status === 201) {
        setLoginState('otp');
        return;
      }

      throw new Error('Gagal mengirim OTP. Pastikan nomor terdaftar.');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Request OTP:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLogin = async () => {
    const otpCode = otpValues.join('');

    if (otpCode.length < 6) {
      setErrorMessage('Harap masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      clearOldSession();

      const authBaseUrl = getAuthBaseUrl();
      const cleanPhone = formatPhoneNumber(phoneNumber);

      const payload = {
        phone: cleanPhone,
        otp: otpCode,
      };

      const response = await fetch(`${authBaseUrl}/otp/login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server Error (${response.status}): Response login bukan JSON.`);
      }

      const data: AuthResponse = await response.json();

      if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || 'Kode OTP salah atau kedaluwarsa.');
      }

      saveSession(data);

      router.replace('/');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error Verify OTP:', err);
      setErrorMessage(err.message || 'Verifikasi gagal. Silakan coba lagi.');
      setOtpValues(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpValues];
    newOtp[index] = value.substring(value.length - 1);
    setOtpValues(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
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
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });

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
    resetLogin,
  };
};
