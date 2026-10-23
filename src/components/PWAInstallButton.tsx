import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Loader2, Share2, Info, X } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstalled, justInstalled, isIOS, triggerDirectInstall } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [guideMessage, setGuideMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (isInstalled || justInstalled) {
      return;
    }

    setIsInstalling(true);
    setGuideMessage(null);

    // Call native installation trigger
    const result = await triggerDirectInstall();
    setIsInstalling(false);

    if (result === 'accepted') {
      // Installed successfully!
      return;
    }

    if (result === 'manual_guide') {
      if (isIOS) {
        setGuideMessage('على أجهزة آبل (iOS): اضغط على زر المشاركة (Share) في المتصفح ثم اختر «إضافة إلى الشاشة الرئيسية».');
      } else {
        setGuideMessage('على هاتفك أو حاسوبك: اضغط على قائمة المتصفح (⋮) ثم اختر «تثبيت التطبيق» أو أيقونة التثبيت (⊕) بشريط العنوان.');
      }
    }
  };

  // If already installed or just finished installing
  if (isInstalled || justInstalled) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold shadow-sm transition-all ${className}`}
        title="التطبيق مثبت بنجاح على الشاشة الرئيسية للجهاز"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>تم التثبيت</span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={isInstalling}
        title="تثبيت Kashkha Fashions كتطبيق مباشر على هاتفك أو حاسوبك"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#E2C785] hover:brightness-110 active:scale-95 text-[#0B0F17] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#C5A059]/25 shrink-0 cursor-pointer ${
          isInstalling ? 'opacity-85 cursor-wait' : ''
        } ${className}`}
      >
        {isInstalling ? (
          <>
            <Loader2 className="w-3.5 h-3.5 text-[#0B0F17] shrink-0 animate-spin" />
            <span className="whitespace-nowrap">جارٍ التثبيت...</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-[#0B0F17] shrink-0 stroke-[2.5]" />
            <span className="whitespace-nowrap">تثبيت التطبيق</span>
          </>
        )}
      </button>

      {/* Guide tooltip if manual action required by device OS */}
      {guideMessage && (
        <div className="fixed sm:absolute top-20 sm:top-full mt-2 left-4 right-4 sm:left-auto sm:right-0 sm:w-80 z-[999999] bg-[#0E1523] border border-[#C5A059] text-slate-100 text-xs p-3.5 rounded-2xl shadow-2xl flex items-start gap-2.5 animate-fadeIn">
          <Info className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <p className="flex-1 leading-relaxed text-[11px] text-slate-200">
            {guideMessage}
          </p>
          <button
            onClick={() => setGuideMessage(null)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
