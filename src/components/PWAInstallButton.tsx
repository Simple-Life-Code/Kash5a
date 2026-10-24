import React, { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Monitor,
  Smartphone,
  ExternalLink,
  X,
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
    isInstallable,
    isInstalled,
    isIOS,
    isInIframe,
    installStatus,
    install,
  } = usePWAInstall();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);

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
        setTimeout(() => setFeedback(null), 4000);
      } else {
        // If in iframe or iOS or ambient prompt needs direct link/steps, show guide modal
        setShowGuideModal(true);
        setFeedback(null);
      }
    } catch (err) {
      console.error(err);
      setShowGuideModal(true);
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
    <>
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

        {/* Feedback message tooltip */}
        {feedback && (
          <div className="absolute top-full mt-2 right-0 sm:left-0 z-50 min-w-[240px] p-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-[#C5A059]/40 text-center animate-in fade-in slide-in-from-top-1">
            {feedback}
          </div>
        )}
      </div>

      {/* Guide Modal for iOS or when ambient browser install needs 1-tap instruction (from Retaj-Today) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-[#0E1523] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#C5A059]/40 space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    تثبيت تطبيق Kashkha Fashions
                  </h3>
                  <p className="text-[11px] text-[#C5A059]">
                    دار ومصنع العبايات • يعمل مباشرة على هاتفك أو حاسوبك
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Platform Specific Instructions */}
            {isIOS ? (
              <div className="space-y-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="font-extrabold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#C5A059]" />
                  <span>طريقة التثبيت على أجهزة iPhone / iPad (Safari):</span>
                </p>
                <ol className="list-decimal list-inside space-y-2 font-medium leading-relaxed">
                  <li>
                    اضغط على أيقونة <strong>المشاركة (Share ⎋)</strong> في أسفل شاشة Safari.
                  </li>
                  <li>
                    مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen ⊕)</strong>.
                  </li>
                  <li>
                    اضغط على <strong>إضافة (Add)</strong> في أعلى اليمين ليظهر التطبيق مباشرة على شاشتك كبرنامج مستقل.
                  </li>
                </ol>
              </div>
            ) : isInIframe ? (
              <div className="space-y-3 bg-red-950/30 p-4 rounded-2xl border border-rose-500/30 text-xs text-rose-200">
                <p className="font-extrabold flex items-center gap-2 text-white">
                  <ExternalLink className="w-4 h-4 text-rose-400" />
                  <span>التثبيت المباشر من المتصفح:</span>
                </p>
                <p className="leading-relaxed text-slate-300">
                  نظراً لأنك تشاهد التطبيق داخل إطار المعاينة، المتصفح يحتاج فتح الرابط مباشرة في نافذة مستقلة لتثبيت أيقونة التطبيق على سطح المكتب أو شاشة الهاتف بنقرة واحدة.
                </p>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-center cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح الرابط المباشر وتثبيت التطبيق الآن ↗</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="font-extrabold text-white flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#C5A059]" />
                  <span>طريقة التثبيت على الحاسوب أو أندرويد (Chrome / Edge):</span>
                </p>
                <ol className="list-decimal list-inside space-y-2 font-medium leading-relaxed">
                  <li>
                    انقر على أيقونة التثبيت <strong>(⊕ تثبيت التطبيق)</strong> الموجودة في أقصى يمين شريط العنوان بالمتصفح.
                  </li>
                  <li>
                    أو اضغط على زر القائمة <strong>(⋮)</strong> في المتصفح ثم اختر <strong>&quot;تثبيت Kashkha Fashions&quot;</strong>.
                  </li>
                  <li>
                    سيتم إنشاء اختصار رسمي على سطح المكتب وشريط المهام فوراً.
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold transition-colors cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
