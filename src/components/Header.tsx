import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useErp, ActiveTab } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import {
  Calculator,
  Shirt,
  Sparkles,
  Scissors,
  Layers,
  ShoppingBag,
  Users,
  Building2,
  Globe,
  Settings as SettingsIcon,
  RotateCcw,
  Check,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  LogOut,
  AlertTriangle,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    activeTab,
    setActiveTab,
    resetToZeroState,
    isFirebaseConnected,
    settings,
    updateSettings,
    currentUser,
    logout,
  } = useErp();
  const t = getTranslation(lang);

  const getCleanCompanyName = (name?: string) => {
    if (!name || name.includes('ksh5a') || name.includes('كشخة للأزياء')) {
      return 'Kashkha Fashions';
    }
    return name;
  };

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) return registerGlobalModal(() => setIsSettingsModalOpen(false));
  }, [isSettingsModalOpen]);

  useEffect(() => {
    if (isLogoutModalOpen) return registerGlobalModal(() => setIsLogoutModalOpen(false));
  }, [isLogoutModalOpen]);

  useEffect(() => {
    if (isResetModalOpen) return registerGlobalModal(() => setIsResetModalOpen(false));
  }, [isResetModalOpen]);

  const [formData, setFormData] = useState({
    companyName: getCleanCompanyName(settings.companyName),
    tradeLicenseNumber: settings.tradeLicenseNumber || '',
    trn: settings.trn || '',
    address: settings.address || 'دولة الإمارات العربية المتحدة',
    locationUrl: settings.locationUrl || 'https://share.google/kytFkIoB2HiU4Cryn',
    phone: settings.phone || '+971589366255',
    email: settings.email || 'fatimazohramaryam88@gmail.com',
    currency: settings.currency || 'AED',
  });

  const handleOpenSettings = () => {
    setFormData({
      companyName: getCleanCompanyName(settings.companyName),
      tradeLicenseNumber: settings.tradeLicenseNumber || '',
      trn: settings.trn || '',
      address: settings.address || 'دولة الإمارات العربية المتحدة',
      locationUrl: settings.locationUrl || 'https://share.google/kytFkIoB2HiU4Cryn',
      phone: settings.phone || '+971589366255',
      email: settings.email || 'fatimazohramaryam88@gmail.com',
      currency: settings.currency || 'AED',
    });
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    await updateSettings(formData);
    setIsSettingsModalOpen(false);
  };

  const navItems: { key: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: t.home, icon: Sparkles },
    { key: 'accounting', label: t.accounting, icon: Calculator },
    { key: 'models', label: t.models, icon: Shirt },
    { key: 'production', label: t.production, icon: Scissors },
    { key: 'inventory', label: t.inventory, icon: Layers },
    { key: 'sales', label: t.salesPos, icon: ShoppingBag },
    { key: 'employees', label: t.employees, icon: Users },
    { key: 'stakeholders', label: t.stakeholders, icon: Building2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-[#1E293B]">
      {/* Top Utility & Brand Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* Zone 1: Luxury Logo & Brand (Kashkha Fashions) */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#C5A059]/50 bg-[#131B26] p-0.5 shadow-md shadow-[#C5A059]/15 group-hover:border-[#E2C785] transition-colors">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg"
                alt="Kashkha Fashions"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[#E2C785] transition-colors font-serif">
                  Kashkha Fashions
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]/30">
                  UAE
                </span>
              </div>
              <span className="text-[11px] text-[#C5A059] font-medium tracking-wide">
                كشخة فاشنز · دار ومصنع العبايات
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links for Large Desktop Screens */}
          <nav className="hidden 2xl:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B26]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E2C785]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language, Business Settings & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#131B26] border border-[#1E293B] rounded-xl p-0.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-[#C5A059] mx-1 hidden sm:inline" />
              <button
                onClick={() => setLang('ar')}
                className={`px-2 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  lang === 'ar' ? 'bg-[#C5A059] text-[#0B0F17] font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  lang === 'en' ? 'bg-[#C5A059] text-[#0B0F17] font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('fr')}
                className={`px-2 py-1 rounded-lg transition-colors font-medium text-[11px] ${
                  lang === 'fr' ? 'bg-[#C5A059] text-[#0B0F17] font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                FR
              </button>
            </div>

            {/* System Connection Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#131B26] border border-[#1E293B] rounded-xl text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="font-mono text-[11px]">النظام متصل</span>
            </div>

            {/* PWA Direct Install Button */}
            <PWAInstallButton />

            {/* Business Settings Modal Trigger */}
            <button
              onClick={handleOpenSettings}
              title="بيانات المنشأة الرسمية والسجل التجاري"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#E2C785] border border-[#C5A059]/40 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">بيانات المنشأة</span>
            </button>

            {/* Authenticated User & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-1 border-r border-[#1E293B]">
                <div
                  title={currentUser.email || currentUser.displayName || ''}
                  className="hidden md:flex items-center gap-1.5 bg-[#131B26] border border-[#1E293B] rounded-xl px-2 py-1 text-xs"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover border border-[#C5A059]/40"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-[#C5A059]/20 text-[#E2C785] flex items-center justify-center font-bold text-[9px]">
                      {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-slate-300 max-w-[100px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </div>

                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  title="تسجيل الخروج من النظام"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/60 border border-rose-800/50 hover:border-rose-600 rounded-xl transition-all font-medium cursor-pointer shadow-sm active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-[11px] font-semibold">خروج</span>
                </button>
              </div>
            )}

            {/* Reset to Clean Zero State */}
            <button
              onClick={() => setIsResetModalOpen(true)}
              title="تصفير البيانات والبدء بنظام فارغ"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#131B26] rounded-xl transition-colors border border-transparent hover:border-[#1E293B] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar for Mobile / Tablet / Laptop horizontal scroll menu */}
      <div className="2xl:hidden border-t border-[#1E293B] bg-[#0E1520] px-3 sm:px-6 overflow-x-auto py-2 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max mx-auto">
          {/* Mobile direct install trigger */}
          <div className="sm:hidden pr-1 border-l border-slate-700 ml-1">
            <PWAInstallButton className="text-[11px] py-1 px-2.5 shadow-none" />
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 bg-[#131B26] border border-[#1E293B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Facility / Business Settings Modal rendered outside header stacking context via Portal */}
      {isSettingsModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          {/* Backdrop overlay dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsSettingsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-lg max-h-[92vh] bg-[#0E1523] border-2 border-[#C5A059] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden my-auto text-slate-100 ring-1 ring-[#C5A059]/30">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-[#0B0F17]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-serif">
                  <Building2 className="w-5 h-5 text-[#C5A059]" />
                  بيانات منشأة Kashkha Fashions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  إدارة بيانات المقر، الهاتف، ورابط خرائط Google المعتمد
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق النافذة"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">اسم المنشأة والتطبيق *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Kashkha Fashions"
                  className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl px-3.5 py-2 text-white font-serif shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">رقم الهاتف والتواصل المباشر</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+971589366255"
                      className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-white font-mono text-left shadow-inner"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">البريد الإلكتروني الرسمي</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="fatimazohramaryam88@gmail.com"
                      className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-white text-left font-mono shadow-inner"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">رابط موقع المقر في خرائط Google</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={formData.locationUrl}
                    onChange={e => setFormData({ ...formData, locationUrl: e.target.value })}
                    placeholder="https://share.google/kytFkIoB2HiU4Cryn"
                    className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl pl-9 pr-3 py-2 text-white text-left font-mono text-[11px] shadow-inner"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">رقم السجل / الرخصة التجارية</label>
                  <input
                    type="text"
                    value={formData.tradeLicenseNumber}
                    onChange={e => setFormData({ ...formData, tradeLicenseNumber: e.target.value })}
                    placeholder="رقم الرخصة التجارية (اختياري)"
                    className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl px-3.5 py-2 text-white font-mono shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-medium">الرقم الضريبي (TRN)</label>
                  <input
                    type="text"
                    value={formData.trn}
                    onChange={e => setFormData({ ...formData, trn: e.target.value })}
                    placeholder="رقم التسجيل الضريبي (اختياري)"
                    className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl px-3.5 py-2 text-white font-mono shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">عنوان المقر / البوتيك</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: دبي / الشارقة - دولة الإمارات العربية المتحدة"
                  className="w-full bg-[#182334] border border-[#2A3B53] focus:border-[#C5A059] focus:outline-none rounded-xl px-3.5 py-2 text-white shadow-inner"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 shrink-0 bg-[#0B0F17]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 bg-[#182334] hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="flex items-center gap-1.5 px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ البيانات</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Logout Warning Confirmation Modal */}
      {isLogoutModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!isLoggingOut) setIsLogoutModalOpen(false);
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md bg-[#0E1523] border-2 border-rose-500/50 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(244,63,94,0.15)] p-6 my-auto text-slate-100 space-y-5 ring-1 ring-rose-500/30 text-center">
            {/* Warning Icon Badge */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-rose-950/60 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50">
                <AlertTriangle className="w-8 h-8 text-rose-400 stroke-[2.2]" />
              </div>
            </div>

            {/* Warning Title & Body */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-white tracking-wide">
                تأكيد تسجيل الخروج
              </h3>
              <p className="text-sm font-semibold text-rose-300">
                هل أنت متأكد من رغبتك في تسجيل الخروج من نظام كشخة فاشنز؟
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                سيتم إنهاء جلستك الحالية والعودة إلى شاشة تسجيل الدخول. ستحتاج لتسجيل الدخول مجدداً بحسابك المعتمد لمتابعة العمليات وسجلات المنشأة.
              </p>
            </div>

            {/* Account Info Pill */}
            {currentUser && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#182334] border border-[#2A3B53] text-xs text-slate-300 max-w-full truncate font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate">{currentUser.email || currentUser.displayName}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  await logout();
                  setIsLoggingOut(false);
                  setIsLogoutModalOpen(false);
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-900/40 cursor-pointer disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'جارٍ تسجيل الخروج...' : 'نعم، تسجيل الخروج'}</span>
              </button>

              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 bg-[#182334] hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                إلغاء والعودة
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Data Warning Confirmation Modal */}
      {isResetModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!isResetting) setIsResetModalOpen(false);
            }}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md bg-[#0E1523] border-2 border-amber-500/50 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] p-6 my-auto text-slate-100 space-y-5 ring-1 ring-amber-500/30 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-amber-950/60 border-2 border-amber-500/50 flex items-center justify-center text-amber-400">
                <RotateCcw className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-serif text-white tracking-wide">
                تأكيد تصفير البيانات
              </h3>
              <p className="text-sm font-semibold text-amber-300">
                هل تريد تصفير جميع السجلات والبدء بقاعدة بيانات جديدة كلياً؟
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                هذا الإجراء سيقوم بتصفير الحسابات والكتالوج والإنتاج والمخزون للبدء بنظام نظيف وجديد.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row-reverse items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={async () => {
                  setIsResetting(true);
                  await resetToZeroState();
                  setIsResetting(false);
                  setIsResetModalOpen(false);
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isResetting ? 'جارٍ تصفير السجلات...' : 'نعم، تصفير السجلات'}</span>
              </button>

              <button
                type="button"
                disabled={isResetting}
                onClick={() => setIsResetModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 bg-[#182334] hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                إلغاء وتراجع
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
