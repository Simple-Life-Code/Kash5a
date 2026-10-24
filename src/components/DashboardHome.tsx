import React from 'react';
import { useErp, ActiveTab } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import {
  Calculator,
  Shirt,
  Scissors,
  Layers,
  ShoppingBag,
  Users,
  Building2,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Landmark,
} from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const {
    lang,
    setActiveTab,
    salesInvoices,
    productionOrders,
    inventoryItems,
    accounts,
    employees,
    models,
    settings,
  } = useErp();
  const t = getTranslation(lang);

  // Dynamic Metrics based strictly on actual data
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesTotal = salesInvoices
    .filter(inv => inv.date === todayStr)
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const activeWorkshopOrders = productionOrders.filter(
    p => !['Delivered'].includes(p.currentStage)
  );

  const lowStockFabrics = inventoryItems.filter(
    item => item.currentStock <= item.minStockAlert
  );

  const cashBankTotal = accounts
    .filter(a => ['1010', '1020'].includes(a.code))
    .reduce((sum, a) => sum + a.balance, 0);

  const arAccount = accounts.find(a => a.code === '1300');
  const arValue = arAccount ? arAccount.balance : 0;

  // 7 Clean Department Cards (VAT tab removed as requested)
  const departments: {
    key: ActiveTab;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    statValue: string;
    statLabel: string;
    quickActionText: string;
  }[] = [
    {
      key: 'accounting',
      title: t.accounting,
      desc: t.accountingDesc,
      icon: Calculator,
      accentColor: 'from-[#C5A059]/20 to-transparent border-[#C5A059]/40',
      statValue: `${cashBankTotal.toLocaleString()} ${t.currency}`,
      statLabel: 'سيولة الصندوق والبنك (1010 + 1020)',
      quickActionText: t.postNewEntry,
    },
    {
      key: 'models',
      title: t.models,
      desc: t.modelsDesc,
      icon: Shirt,
      accentColor: 'from-amber-500/15 to-transparent border-amber-500/30',
      statValue: `${models.length} ${lang === 'ar' ? 'موديل' : 'Models'}`,
      statLabel: 'عبايات، شيلات، قفاطين مع المرفقات وBOM',
      quickActionText: t.newModel,
    },
    {
      key: 'production',
      title: t.production,
      desc: t.productionDesc,
      icon: Scissors,
      accentColor: 'from-blue-500/15 to-transparent border-blue-500/30',
      statValue: `${activeWorkshopOrders.length} ${lang === 'ar' ? 'أمر تفصيل' : 'Active Orders'}`,
      statLabel: 'مراحل القص والخياطة والتطريز والكي',
      quickActionText: 'متابعة خط الإنتاج (7 مراحل)',
    },
    {
      key: 'sales',
      title: t.salesPos,
      desc: t.salesPosDesc,
      icon: ShoppingBag,
      accentColor: 'from-emerald-500/15 to-transparent border-emerald-500/30',
      statValue: `${todaySalesTotal.toLocaleString()} ${t.currency}`,
      statLabel: 'مبيعات وفواتير اليوم وتصدير Excel',
      quickActionText: t.newSale,
    },
    {
      key: 'inventory',
      title: t.inventory,
      desc: t.inventoryDesc,
      icon: Layers,
      accentColor: 'from-purple-500/15 to-transparent border-purple-500/30',
      statValue: `${inventoryItems.length} ${lang === 'ar' ? 'صنف خامة' : 'SKUs'}`,
      statLabel: lowStockFabrics.length > 0 ? `${lowStockFabrics.length} تنبيهات نقص` : 'المخزون متوازن',
      quickActionText: 'إدارة المستودع والأقمشة',
    },
    {
      key: 'employees',
      title: t.employees,
      desc: t.employeesDesc,
      icon: Users,
      accentColor: 'from-cyan-500/15 to-transparent border-cyan-500/30',
      statValue: `${employees.filter(e => e.active).length} ${lang === 'ar' ? 'خياط وموظف' : 'Staff'}`,
      statLabel: 'أجور القطعة والرواتب وتكلفة التفصيل',
      quickActionText: 'سجل الخياطين والأجور',
    },
    {
      key: 'stakeholders',
      title: t.stakeholders,
      desc: t.stakeholdersDesc,
      icon: Building2,
      accentColor: 'from-slate-500/15 to-transparent border-slate-700',
      statValue: `${arValue.toLocaleString()} ${t.currency}`,
      statLabel: 'الذمم المدينة على العملاء (AR)',
      quickActionText: 'كشوف الحسابات والموردين',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Executive Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#131B26] via-[#101824] to-[#131B26] border border-[#C5A059]/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]/30">
                ERP/POS · Kashkha Fashions (UAE)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                العملة: {settings.currency || 'AED'}
              </span>
              {settings.tradeLicenseNumber && (
                <span className="text-xs text-slate-400 font-mono">
                  رخصة: {settings.tradeLicenseNumber}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight">
              {settings.companyName || 'Kashkha Fashions'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              بوابة الإدارة الشاملة لدار ومصنع أزياء العبايات والملابس: نظام القيد المزدوج المحاسبي، إدارة خطوط الإنتاج والورشة، بطاقات الموديلات والتكاليف، وإصدار الفواتير.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('sales')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#C5A059]/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>نقطة بيع سريعة (POS)</span>
            </button>
            <button
              onClick={() => setActiveTab('accounting')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              <Calculator className="w-4 h-4 text-[#C5A059]" />
              <span>ترحيل قيد يومية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Strip (Clean, genuine numbers without fake figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Sales */}
        <div className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.todaySales}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {todaySalesTotal.toLocaleString()} <span className="text-xs font-sans text-[#C5A059]">{t.currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            إجمالي فواتير اليوم المسجلة
          </div>
        </div>

        {/* KPI 2: Active Workshop Orders */}
        <div className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.workshopWorkload}</span>
            <Scissors className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {activeWorkshopOrders.length} <span className="text-xs font-sans text-blue-300">أمر تفصيل</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            موزعة على 7 مراحل تشغيل
          </div>
        </div>

        {/* KPI 3: Low Stock Alerts */}
        <div className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t.lowStockItems}</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockFabrics.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {lowStockFabrics.length} <span className="text-xs font-sans text-amber-300">أصناف حرجة</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {lowStockFabrics.length > 0 ? 'تتطلب إعادة طلب من المورد' : 'المخزون كافٍ'}
          </div>
        </div>

        {/* KPI 4: Cash & Bank Liquidity (Replaced fake VAT card with real liquidity) */}
        <div className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-xl p-4 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>السيولة النقدية والمصرفية</span>
            <Landmark className="w-4 h-4 text-[#C5A059]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white tabular-nums">
            {cashBankTotal.toLocaleString()} <span className="text-xs font-sans text-[#C5A059]">{t.currency}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            رصيد الخزينة والحسابات البنكية الفعلية
          </div>
        </div>
      </div>

      {/* Dedicated Executive Department Sections (VAT section removed) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              {t.departments}
            </h2>
            <p className="text-xs text-slate-400">
              أقسام المنظومة التشغيلية المتكاملة لمصنع وبوتيك كشخة للأزياء
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.key}
                onClick={() => setActiveTab(dept.key)}
                className={`group relative bg-[#131B26] hover:bg-[#182333] border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl ${dept.accentColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-[#0B0F17] rounded-xl border border-slate-800 text-[#E2C785] group-hover:border-[#C5A059]/60 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="p-1 rounded-full text-slate-500 group-hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mt-4 group-hover:text-[#E2C785] transition-colors">
                  {dept.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                  {dept.desc}
                </p>

                <div className="mt-4 pt-3 border-t border-[#1E293B]/80 flex flex-col">
                  <span className="text-[11px] text-slate-400">{dept.statLabel}</span>
                  <span className="text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
                    {dept.statValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Atelier Status Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Workshop Orders */}
        <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#C5A059]" />
              أوامر ورشة التفصيل النشطة
            </h3>
            <button
              onClick={() => setActiveTab('production')}
              className="text-xs text-[#C5A059] hover:underline"
            >
              عرض كانبان المراحل ({productionOrders.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {productionOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                onClick={() => setActiveTab('production')}
                className="flex items-center justify-between p-3 bg-[#0B0F17] border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-mono text-xs flex items-center justify-center font-bold">
                    {order.size}
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-white truncate max-w-[220px]">
                      {order.modelName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {order.orderNumber} · {order.customerName || 'عميل البوتيك'}
                    </div>
                  </div>
                </div>

                <div className="text-left rtl:text-right">
                  <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/30">
                    {t[`stage_${order.currentStage}` as keyof typeof t] || order.currentStage}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {order.assignedTailor || 'غير مسند'}
                  </div>
                </div>
              </div>
            ))}
            {productionOrders.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                لا توجد أوامر تشغيل حالياً في الورشة
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              أحدث الفواتير والمبيعات
            </h3>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs text-[#C5A059] hover:underline"
            >
              سجل الفواتير ({salesInvoices.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {salesInvoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                onClick={() => setActiveTab('sales')}
                className="flex items-center justify-between p-3 bg-[#0B0F17] border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-white">
                    {inv.customerName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {inv.invoiceNumber} · {inv.saleType === 'Retail' ? 'تجزئة' : 'جملة'}
                  </div>
                </div>

                <div className="text-left rtl:text-right">
                  <div className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
                    {inv.grandTotal.toLocaleString()} {t.currency}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {inv.paymentMethod} · {inv.paymentStatus === 'Paid' ? 'مدفوعة' : 'آجل'}
                  </div>
                </div>
              </div>
            ))}
            {salesInvoices.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-500">
                لم تسجل فواتير مبيعات بعد
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
