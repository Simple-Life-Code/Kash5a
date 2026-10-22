import React from 'react';
import { useErp } from '../context/ErpContext';
import { LogoLoader } from './LogoLoader';
import { ShieldCheck, AlertCircle, Phone, Mail, MapPin, ExternalLink, Lock } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, isSigningIn, authError, clearAuthError } = useErp();

  if (isSigningIn) {
    return (
      <LogoLoader
        title="Kashkha Fashions"
        subtitle="جارٍ تسجيل الدخول والتحقق من الصلاحيات..."
        size="lg"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-between items-center relative overflow-hidden px-4 py-8 selection:bg-[#C5A059]/30 selection:text-[#E2C785]">
      {/* Background Decorative Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-radial from-[#C5A059]/15 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-radial from-[#C5A059]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Top Brand Marker */}
      <div className="w-full max-w-md flex items-center justify-center gap-2 pt-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#C5A059] flex items-center gap-1.5 bg-[#131B26]/80 px-3 py-1 rounded-full border border-[#C5A059]/20 shadow-sm">
          <Lock className="w-3 h-3 text-[#E2C785]" />
          بوابة الإدارة المعتمدة · Kashkha ERP
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md my-auto relative z-10">
        <div className="bg-[#0E1523]/90 backdrop-blur-xl border border-[#C5A059]/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(197,160,89,0.15)] text-center space-y-6">
          
          {/* Central Logo Emblem */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1.5 border-2 border-[#C5A059]/60 bg-gradient-to-b from-[#1E293B] to-[#0A0E17] shadow-[0_0_35px_rgba(197,160,89,0.3)]">
              <div className="w-full h-full rounded-full overflow-hidden border border-[#E2C785] bg-black">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg"
                  alt="Kashkha Fashions Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="absolute inset-0 rounded-full border-t-2 border-[#E2C785] pointer-events-none" />
            </div>
          </div>

          {/* Titles & Typography */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-wide">
              Kashkha Fashions
            </h1>
            <p className="text-xs sm:text-sm text-[#E2C785] font-sans font-medium tracking-wide">
              دار ومصنع أزياء العبايات الراقية
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1 leading-relaxed">
              يرجى تسجيل الدخول بحساب Google المعتمد للوصول إلى لوحة التحكم والعمليات المحاسبية والإنتاجية.
            </p>
          </div>

          {/* Error Message Banner if unauthorized or error occurred */}
          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs text-right space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 text-rose-300 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>تعذر إتمام الدخول</span>
              </div>
              <p className="text-rose-200/90 leading-relaxed pr-6">
                {authError}
              </p>
            </div>
          )}

          {/* Single Authorized Sign-In Action: Google */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                if (authError) clearAuthError();
                loginWithGoogle();
              }}
              className="w-full group relative flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-[#C5A059]/20 hover:scale-[1.01] active:scale-[0.99] border border-slate-200 cursor-pointer"
            >
              {/* Google SVG Official Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="font-semibold tracking-wide">تسجيل الدخول بواسطة Google</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>بوابة دخول رقمية مشفرة ومؤمنة بالكامل</span>
            </div>
          </div>
        </div>
      </div>

      {/* Business Support Footer Info */}
      <div className="w-full max-w-md pt-4 text-center space-y-2 text-xs text-slate-400 relative z-10">
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <a
            href="tel:+971589366255"
            dir="ltr"
            className="flex items-center gap-1.5 hover:text-[#E2C785] transition-colors"
          >
            <Phone className="w-3 h-3 text-[#C5A059]" />
            <span>+971 58 936 6255</span>
          </a>
          <span>·</span>
          <a
            href="https://share.google/kytFkIoB2HiU4Cryn"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#E2C785] transition-colors"
          >
            <MapPin className="w-3 h-3 text-[#C5A059]" />
            <span>المقر في دبي 🇦🇪</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} Kashkha Fashions. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
};
