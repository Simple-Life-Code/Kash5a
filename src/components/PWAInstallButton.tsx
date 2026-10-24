import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Monitor,
  Loader2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  className?: string;
  variant?: 'primary' | 'header' | 'compact';
}

export const PWAInstallButton: React.FC<Props> = ({
  className = '',
  variant = 'header',
}) => {
  const {
    isInstalled,
    installStatus,
    install,
  } = usePWAInstall();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDirectInstall = async () => {
    setLoading(true);
    setFeedback('جاري بدء التثبيت...');
    try {
      const result = await install();
      if (result.success) {
        if (result.reason === 'already_installed') {
          setFeedback('التطبيق مثبت بالفعل على جهازك وهو جاهز للعمل!');
        } else {
          setFeedback('تم تثبيت التطبيق بنجاح على جهازك!');
        }
        setTimeout(() => setFeedback(null), 3500);
      } else {
        if (result.reason === 'dismissed') {
          setFeedback('تم إلغاء التثبيت من قبل المستخدم');
        } else if (result.reason === 'not_ready') {
          setFeedback('يمكنك التثبيت عبر أيقونة (⊕) بشريط المتصفح أيضاً');
        } else {
          setFeedback('حدث خطأ أثناء محاولة التثبيت');
        }
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err) {
      console.warn('Install trigger error:', err);
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  };

  // If already running standalone, show installed badge
  if (isInstalled || installStatus === 'installed') {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs font-bold shadow-sm select-none ${className}`}>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="hidden sm:inline">التطبيق مثبت على الجهاز</span>
        <span className="sm:hidden">تم التثبيت</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {variant === 'header' ? (
        <button
          onClick={handleDirectInstall}
          disabled={loading}
          title="تثبيت كشخة فاشنز مباشرة على سطح المكتب والشاشة الرئيسية"
          className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-rose-900/30 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white cursor-pointer disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>جاري التثبيت...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 animate-bounce shrink-0" />
              <span className="hidden sm:inline">تثبيت التطبيق على الجهاز</span>
              <span className="sm:hidden">تثبيت التطبيق</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleDirectInstall}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>جاري تثبيت Kashkha Fashions على جهازك...</span>
            </>
          ) : (
            <>
              <Monitor className="w-5 h-5" />
              <span>تثبيت تطبيق كشخة فاشنز على سطح المكتب والشاشة الرئيسية</span>
              <Download className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Subtle feedback message tooltip without any modal overlay */}
      {feedback && (
        <div className="absolute top-full mt-2 right-0 sm:left-0 z-50 min-w-[240px] p-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-[#C5A059]/40 text-center animate-in fade-in slide-in-from-top-1">
          {feedback}
        </div>
      )}
    </div>
  );
};
