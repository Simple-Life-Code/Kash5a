import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstalled, justInstalled, installStatus, install } = usePWAInstall();
  const [loading, setLoading] = useState(false);

  const handleDirectInstall = async () => {
    if (isInstalled || justInstalled || installStatus === 'installed') {
      return;
    }

    setLoading(true);
    await install();
    setLoading(false);
  };

  // If already installed or just finished installing -> Always show "تم التثبيت"
  if (isInstalled || justInstalled || installStatus === 'installed') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 rounded-xl text-xs font-semibold shadow-sm transition-all select-none ${className}`}
        title="تم تثبيت التطبيق بنجاح على الشاشة الرئيسية للجهاز"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>تم التثبيت</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleDirectInstall}
      disabled={loading || installStatus === 'installing'}
      title="تثبيت التطبيق مباشرة على سطح المكتب أو الشاشة الرئيسية"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#C5A059] to-[#E2C785] hover:brightness-110 active:scale-95 text-[#0B0F17] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#C5A059]/25 shrink-0 cursor-pointer ${
        loading || installStatus === 'installing' ? 'opacity-85 cursor-wait' : ''
      } ${className}`}
    >
      {loading || installStatus === 'installing' ? (
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
