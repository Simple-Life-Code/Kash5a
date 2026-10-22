import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstalled, justInstalled, triggerDirectInstall } = usePWAInstall();
  const [isProcessing, setIsProcessing] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  const handleClick = async () => {
    if (isInstalled || justInstalled) {
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 3000);
      return;
    }

    setIsProcessing(true);
    await triggerDirectInstall();
    setIsProcessing(false);
    setInstalledNotice(true);
    setTimeout(() => setInstalledNotice(false), 4000);
  };

  // If already installed or just installed
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
        disabled={isProcessing}
        title="تثبيت Kashkha Fashions كتطبيق مباشر على هاتفك أو حاسوبك"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#E2C785] hover:brightness-110 active:scale-95 text-[#0B0F17] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#C5A059]/25 shrink-0 ${
          isProcessing ? 'opacity-70 cursor-wait' : ''
        } ${className}`}
      >
        <Download className="w-3.5 h-3.5 text-[#0B0F17] shrink-0 stroke-[2.5]" />
        <span className="whitespace-nowrap">تثبيت التطبيق</span>
      </button>

      {/* Direct discreet notification without intrusive modals or popups */}
      {installedNotice && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap bg-[#0F172A] border border-emerald-500/50 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl animate-fade-in flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>تم التثبيت على جهازك بنجاح!</span>
        </div>
      )}
    </div>
  );
};
