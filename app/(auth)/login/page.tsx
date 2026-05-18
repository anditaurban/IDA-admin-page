"use client";

import React from "react";
import Image from "next/image";
import { DM_Sans } from "next/font/google";
import { useAuthLogic } from "../../../hooks/useAuthLogic";

const googleSansAlt = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export default function LoginPage() {
  const {
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
  } = useAuthLogic();

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-[#0f111a] text-[#121217] dark:text-white font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 mesh-gradient opacity-90" />
      <div className="absolute top-[-10%] right-[-5%] w-150 h-150 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-125 h-125 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-1 flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          <Image
            src="/assets/inovasia.png"
            alt="Inovasia"
            width={120}
            height={32}
            className="object-contain dark:brightness-200"
            unoptimized
            priority
          />
        </div>

        {/* Card Container */}
        <div className="w-full max-w-md bg-white dark:bg-[#111111] p-8 sm:p-10 rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-800/80 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-10 lg:mt-0">
          {/* Header Card */}
          <header className="mb-10 text-center flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 bg-[#00BCD4] rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="material-symbols-outlined text-white text-[28px]">
                  school
                </span>
              </div>

              <span
                className={`text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight ${googleSansAlt.className}`}
              >
                Instructor<span className="text-[#00BCD4]">Hub</span>
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium px-2">
              Selamat datang! Masuk dengan WhatsApp Anda untuk mengelola kelas.
            </p>
          </header>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold border border-red-100 dark:border-red-500/20 flex items-start gap-3 animate-in shake-in duration-300">
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  error
                </span>
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Input Phone */}
            <div className="text-left">
              <div
                className={`relative flex items-center rounded-2xl border bg-white dark:bg-[#161616] transition-all duration-300 h-18 overflow-hidden ${
                  loginState === "otp"
                    ? "border-slate-200 dark:border-slate-800 opacity-60 pointer-events-none"
                    : "border-slate-300 dark:border-slate-700 focus-within:border-[#00BCD4] focus-within:ring-4 focus-within:ring-[#00BCD4]/10 shadow-sm"
                }`}
              >
                <div className="pl-5 pr-3 flex items-center justify-center text-[#00BCD4]">
                  <span className="material-symbols-outlined text-[28px]">
                    phone_iphone
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center h-full pt-1">
                  <label
                    className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5 ${googleSansAlt.className}`}
                  >
                    Nomor WhatsApp
                  </label>

                  <input
                    className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 text-sm sm:text-base font-bold p-0 outline-none"
                    placeholder="0812... / +628..."
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val.replace(/(?!^\+)[^\d]/g, "");
                      setPhoneNumber(cleaned);
                    }}
                    readOnly={loginState === "otp"}
                    autoFocus
                  />
                </div>

                {loginState === "otp" && (
                  <button
                    type="button"
                    onClick={resetLogin}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#00BCD4] hover:text-cyan-600 pointer-events-auto transition-colors bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-lg border border-cyan-100 dark:border-cyan-800"
                  >
                    UBAH
                  </button>
                )}
              </div>
            </div>

            {/* Input OTP */}
            {loginState === "otp" && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-left">
                <div className="flex items-center justify-between mb-4">
                  <label
                    className={`text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 ${googleSansAlt.className}`}
                  >
                    Kode OTP (6 Digit)
                  </label>

                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    Cek WhatsApp Anda
                  </span>
                </div>

                <div className="flex gap-2 sm:gap-3 justify-between">
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      className={`h-12 sm:h-14 w-full rounded-xl sm:rounded-2xl border text-center font-extrabold text-xl outline-none transition-all duration-200 ${
                        digit
                          ? "border-[#00BCD4] bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(0,188,212,0.1)]"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161616] text-slate-900 dark:text-white focus:border-[#00BCD4] focus:ring-4 focus:ring-[#00BCD4]/10"
                      }`}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={loginState === "phone" ? handleCheckPhone : handleVerifyLogin}
              disabled={isLoading}
              className={`relative flex w-full items-center justify-center overflow-hidden rounded-2xl h-14 mt-8 text-white font-bold transition-all duration-300 ${
                isLoading
                  ? "bg-slate-400 cursor-wait"
                  : "bg-slate-900 hover:bg-slate-800 dark:bg-[#00BCD4] dark:hover:bg-cyan-400 dark:text-slate-900 shadow-xl shadow-slate-900/20 dark:shadow-cyan-500/20 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    sync
                  </span>
                  Memproses...
                </span>
              ) : (
                <span
                  className={`z-10 flex items-center gap-2 text-[15px] ${googleSansAlt.className}`}
                >
                  {loginState === "phone" ? "Kirim Kode OTP" : "Verifikasi & Masuk"}
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Copyright */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {currentYear} PT Jago Inovasi Bisnis.
            <br className="sm:hidden" /> All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}