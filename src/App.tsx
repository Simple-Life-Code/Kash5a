import React, { useState } from 'react';
import { ErpProvider, useErp } from './context/ErpContext';
import { Header } from './components/Header';
import { DashboardHome } from './components/DashboardHome';
import { AccountingView } from './components/AccountingView';
import { ModelsView } from './components/ModelsView';
import { ProductionView } from './components/ProductionView';
import { InventoryView } from './components/InventoryView';
import { SalesView } from './components/SalesView';
import { EmployeesView } from './components/EmployeesView';
import { StakeholdersView } from './components/StakeholdersView';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { SalesInvoice } from './types/erp';

import { Phone, MapPin, Mail, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { LoginPage } from './components/LoginPage';
import { LogoLoader } from './components/LogoLoader';

const MainLayout: React.FC = () => {
  const { settings, activeTab, isLoading, authLoading, isAuthorized } = useErp();
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<SalesInvoice | null>(null);

  const cleanCompanyName = !settings.companyName || settings.companyName.includes('ksh5a') || settings.companyName.includes('كشخة للأزياء')
    ? 'Kashkha Fashions'
    : settings.companyName;

  // 1. Initial Authentication Check Loader with Logo
  if (authLoading) {
    return (
      <LogoLoader
        title={cleanCompanyName}
        subtitle="جارٍ التحقق من بيانات الدخول..."
        size="lg"
        fullScreen={true}
      />
    );
  }

  // 2. If not authenticated or not authorized, show Login Page
  if (!isAuthorized) {
    return <LoginPage />;
  }

  // 3. Initial database load
  if (isLoading) {
    return (
      <LogoLoader
        title={cleanCompanyName}
        subtitle="جارٍ تحميل سجلات المنشأة..."
        size="lg"
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-[#C5A059]/30 selection:text-[#E2C785]">
      {/* Top Bar with Responsive Navigation & Business Profile */}
      <Header />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <DashboardHome />}
        {activeTab === 'accounting' && <AccountingView />}
        {activeTab === 'models' && <ModelsView />}
        {activeTab === 'production' && <ProductionView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'sales' && <SalesView onPrintInvoice={setSelectedInvoiceForPrint} />}
        {activeTab === 'employees' && <EmployeesView />}
        {activeTab === 'stakeholders' && <StakeholdersView />}
      </main>

      {/* Printable Invoice Modal */}
      {selectedInvoiceForPrint && (
        <InvoicePrintModal
          invoice={selectedInvoiceForPrint}
          onClose={() => setSelectedInvoiceForPrint(null)}
        />
      )}

      {/* Comprehensive Official Business Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0A0E17] text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-[#1E293B]">
            {/* Column 1: Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A059] p-0.5 bg-[#131B26]">
                  <img
                    src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg"
                    alt="Kashkha Fashions"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-white text-base">
                    {cleanCompanyName}
                  </h3>
                  <span className="text-[11px] text-[#C5A059]">دار ومصنع أزياء العبايات الراقية</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                منظومة رقمية متكاملة لإدارة خطوط إنتاج العبايات، مستودع الأقمشة، ونظام القيد المزدوج المحاسبي بدولة الإمارات.
              </p>
            </div>

            {/* Column 2: Direct Contact */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                الاتصال والتواصل المباشر
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="tel:+971589366255"
                    className="flex items-center gap-2 text-slate-300 hover:text-[#E2C785] transition-colors group"
                    dir="ltr"
                  >
                    <Phone className="w-4 h-4 text-[#C5A059] group-hover:scale-110 transition-transform" />
                    <span className="font-mono font-medium">+971 58 936 6255</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:fatimazohramaryam88@gmail.com"
                    className="flex items-center gap-2 text-slate-300 hover:text-[#E2C785] transition-colors group break-all"
                  >
                    <Mail className="w-4 h-4 text-[#C5A059] shrink-0 group-hover:scale-110 transition-transform" />
                    <span>fatimazohramaryam88@gmail.com</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Location / Headquarters */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                المقر والموقع الجغرافي
              </h4>
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <span>{settings.address || 'دولة الإمارات العربية المتحدة'}</span>
                </p>
                <a
                  href={settings.locationUrl || 'https://share.google/kytFkIoB2HiU4Cryn'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#131B26] hover:bg-[#1E293B] border border-[#C5A059]/30 hover:border-[#C5A059] text-[#E2C785] rounded-lg transition-colors font-medium text-xs shadow-sm"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>فتح الموقع في خرائط Google</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>

            {/* Column 4: Compliance & Registration */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                الاعتماد والامتثال المالي
              </h4>
              <div className="p-3 rounded-xl bg-[#131B26] border border-[#1E293B] space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>القيد المزدوج الإماراتي</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {settings.tradeLicenseNumber ? `الرخصة: ${settings.tradeLicenseNumber}` : 'رخصة تجارية موثقة'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {settings.trn ? `TRN: ${settings.trn}` : 'العملة الأساسية: درهم إماراتي (AED)'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} {settings.companyName || 'Kashkha Fashions'}. جميع الحقوق محفوظة.
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>دولة الإمارات العربية المتحدة 🇦🇪</span>
              <span>·</span>
              <span className="text-[#C5A059]">Double-Entry ERP & POS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErpProvider>
      <MainLayout />
    </ErpProvider>
  );
}
