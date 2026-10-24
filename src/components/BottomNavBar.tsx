import React, { useState } from 'react';
import { useErp, ActiveTab } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import {
  Sparkles,
  Shirt,
  Scissors,
  ShoppingBag,
  MoreHorizontal,
  Calculator,
  Layers,
  Users,
  Building2,
  Globe,
  LogOut,
  RotateCcw,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
  onOpenLogout: () => void;
  onOpenReset: () => void;
}

export const BottomNavBar: React.FC<Props> = ({
  onOpenSettings,
  onOpenLogout,
  onOpenReset,
}) => {
  const { lang, setLang, activeTab, setActiveTab, currentUser, isFirebaseConnected } = useErp();
  const t = getTranslation(lang);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainTabs: { key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: t.home, icon: Sparkles },
    { key: 'models', label: t.models, icon: Shirt },
    { key: 'production', label: t.production, icon: Scissors },
    { key: 'sales', label: t.salesPos, icon: ShoppingBag },
  ];

  const moreItems: { key: ActiveTab; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'accounting', label: t.accounting, sub: 'شجرة الحسابات، قيود اليومية، ميزان المراجعة', icon: Calculator },
    { key: 'inventory', label: t.inventory, sub: 'مستودع الأقمشة، الكلف، والتنبيهات', icon: Layers },
    { key: 'employees', label: t.employees, sub: 'الخياطين، كشوف الرواتب، وسجلات العمل', icon: Users },
    { key: 'stakeholders', label: t.stakeholders, sub: 'العملاء، الموردين، والمصانع الشريكة', icon: Building2 },
  ];

  const isMoreActive = ['accounting', 'inventory', 'employees', 'stakeholders'].includes(activeTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Visible only on screens below 768px / md) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0E17]/95 backdrop-blur-xl border-t border-[#1E293B] shadow-[0_-4px_20px_rgba(0,0,0,0.5)] select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        dir="rtl"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setIsMoreMenuOpen(false);
                }}
                className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-90 ${
                  isActive ? 'text-[#E2C785]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#C5A059] shadow-[0_0_8px_#C5A059]" />
                )}
                <div
                  className={`w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
                    isActive ? 'bg-[#C5A059]/20 text-[#E2C785]' : ''
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
                </div>
                <span className={`text-[10px] tracking-tight font-medium mt-0.5 ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More Tab */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center h-full relative transition-all active:scale-90 ${
              isMoreActive || isMoreMenuOpen ? 'text-[#E2C785]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {(isMoreActive || isMoreMenuOpen) && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#C5A059] shadow-[0_0_8px_#C5A059]" />
            )}
            <div
              className={`w-9 h-8 flex items-center justify-center rounded-xl transition-all ${
                isMoreActive || isMoreMenuOpen ? 'bg-[#C5A059]/20 text-[#E2C785]' : ''
              }`}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[2]" />
            </div>
            <span className={`text-[10px] tracking-tight font-medium mt-0.5 ${(isMoreActive || isMoreMenuOpen) ? 'font-bold' : ''}`}>
              المزيد
            </span>
          </button>
        </div>
      </nav>

      {/* "More" Slide-up Bottom Sheet Modal on Mobile */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-xs animate-in fade-in" dir="rtl">
          {/* Backdrop click dismiss */}
          <div className="flex-1" onClick={() => setIsMoreMenuOpen(false)} />

          <div className="bg-[#0E1523] border-t-2 border-[#C5A059]/50 rounded-t-3xl shadow-2xl p-4 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
                <h3 className="text-sm font-bold text-white font-serif">
                  أقسام وإعدادات النظام
                </h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Department Quick Links */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#C5A059] uppercase tracking-wider block px-1">
                الأقسام التشغيلية والمالية:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveTab(item.key);
                        setIsMoreMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
                        isActive
                          ? 'bg-[#C5A059]/15 border-[#C5A059] text-[#E2C785]'
                          : 'bg-[#131B26] border-slate-800 hover:border-slate-700 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-[#C5A059] text-[#0B0F17]' : 'bg-slate-800 text-[#C5A059]'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (Business Profile, Language, Logout) */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                الإعدادات وإدارة الحساب:
              </span>

              {/* Language Switcher */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#131B26] border border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Globe className="w-4 h-4 text-[#C5A059]" />
                  <span>لغة النظام:</span>
                </div>
                <div className="flex items-center gap-1">
                  {(['ar', 'en', 'fr'] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                        lang === l
                          ? 'bg-[#C5A059] text-[#0B0F17]'
                          : 'text-slate-400 hover:text-white bg-slate-800'
                      }`}
                    >
                      {l === 'ar' ? 'عربي' : l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Profile Button */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#131B26] hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-semibold">بيانات المنشأة والسجل التجاري</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 rtl:rotate-180" />
              </button>

              {/* User Profile Info & Logout */}
              {currentUser && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px] truncate max-w-[170px]">
                      {currentUser.email || currentUser.displayName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenLogout();
                    }}
                    className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-bold px-2.5 py-1 bg-rose-950/40 rounded-lg border border-rose-800/40"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>
              )}

              {/* Reset to Zero State */}
              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenReset();
                }}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-950/20 text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير البيانات والبدء بنظام فارغ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
