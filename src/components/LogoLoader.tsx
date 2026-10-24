import React from 'react';
import appLogo from '../assets/logo.jpg';

interface LogoLoaderProps {
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LogoLoader: React.FC<LogoLoaderProps> = ({
  title = 'Kashkha Fashions',
  subtitle = 'جارٍ التحميل والتحقق من الصلاحيات...',
  size = 'lg',
  fullScreen = true,
}) => {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28 sm:w-32 sm:h-32',
    lg: 'w-36 h-36 sm:w-44 sm:h-44',
  }[size];

  const content = (
    <div className="relative flex flex-col items-center select-none text-center px-4">
      {/* Ambient Glow */}
      <div className="absolute -inset-10 bg-radial from-[#C5A059]/30 via-transparent to-transparent blur-2xl pointer-events-none animate-pulse" />

      {/* Luxury Large Emblem Frame */}
      <div className={`relative ${sizeClasses} rounded-full p-1.5 border-2 border-[#C5A059]/50 bg-gradient-to-b from-[#1E293B] to-[#080C14] shadow-[0_0_55px_rgba(197,160,89,0.35)] transition-transform`}>
        <div className="w-full h-full rounded-full overflow-hidden border border-[#E2C785] bg-black shadow-inner">
          <img
            src={appLogo}
            onError={(e) => {
              e.currentTarget.src = '/logo.jpg';
            }}
            alt="Kashkha Fashions Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        
        {/* Outer Orbit Spin Ring */}
        <div className="absolute -inset-1 rounded-full border-t-2 border-r-2 border-[#E2C785] animate-spin [animation-duration:3s] pointer-events-none" />
        {/* Inner Counter-Orbit Spin Ring */}
        <div className="absolute inset-0 rounded-full border-b-2 border-l-2 border-[#C5A059]/60 animate-spin [animation-duration:5s] [animation-direction:reverse] pointer-events-none" />
      </div>

      {/* Brand Typography & Status */}
      <div className="mt-6 text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm font-sans text-[#E2C785] tracking-wide">
            {subtitle}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#C5A059] animate-bounce" />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-slate-200">
        {content}
      </div>
    );
  }

  return content;
};
