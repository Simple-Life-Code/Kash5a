import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstalled, justInstalled, triggerDirectInstall } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleClick = async () => {
    if (isInstalled || justInstalled) {
      return;
    }

    setIsInstalling(true);
    await triggerDirectInstall();
    setIsInstalling(false);
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
    <button
      onClick={handleClick}
      disabled={isInstalling}
      title="تثبيت التطبيق مباشرة على جهازك"
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
  );
};
