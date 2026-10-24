import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { Customer, Supplier } from '../types/erp';
import {
  Building2,
  Users,
  PlusCircle,
  Phone,
  Mail,
  FileText,
  Search,
  DollarSign,
  X,
} from 'lucide-react';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';

export const StakeholdersView: React.FC = () => {
  const { lang, customers, suppliers, createCustomer, createSupplier } = useErp();
  const t = getTranslation(lang);

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  useEffect(() => {
    if (isCustomerModalOpen) return registerGlobalModal(() => setIsCustomerModalOpen(false));
  }, [isCustomerModalOpen]);

  useEffect(() => {
    if (isSupplierModalOpen) return registerGlobalModal(() => setIsSupplierModalOpen(false));
  }, [isSupplierModalOpen]);

  // New Customer State
  const [cCode, setCCode] = useState(`CUST-${(customers.length + 1).toString().padStart(3, '0')}`);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('+971 5');
  const [cEmail, setCEmail] = useState('');
  const [cTrn, setCTrn] = useState('');
  const [cType, setCType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [cCreditLimit, setCCreditLimit] = useState<number>(10000);

  // New Supplier State
  const [sCode, setSCode] = useState(`SUPP-${(suppliers.length + 1).toString().padStart(2, '0')}`);
  const [sCompany, setSCompany] = useState('');
  const [sContact, setSContact] = useState('');
  const [sPhone, setSPhone] = useState('+971 ');
  const [sEmail, setSEmail] = useState('');
  const [sTerms, setSTerms] = useState('Net 30 Days');

  const handleSaveCustomer = async () => {
    if (!cName.trim()) return;
    await createCustomer({
      code: cCode,
      name: cName,
      phone: cPhone,
      email: cEmail,
      trn: cTrn,
      type: cType,
      creditLimit: cCreditLimit,
      currentBalance: 0,
    });
    setIsCustomerModalOpen(false);
    setCName('');
  };

  const handleSaveSupplier = async () => {
    if (!sCompany.trim()) return;
    await createSupplier({
      code: sCode,
      companyName: sCompany,
      contactName: sContact,
      phone: sPhone,
      email: sEmail,
      paymentTerms: sTerms,
      currentBalance: 0,
    });
    setIsSupplierModalOpen(false);
    setSCompany('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.stakeholders}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            سجل عملاء التجزئة وبوتيكات الجملة وموردي أقمشة ندى والدانتيل ومستلزمات الإنتاج
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'customers' ? (
            <button
              onClick={() => {
                setCCode(`CUST-${(customers.length + 1).toString().padStart(3, '0')}`);
                setIsCustomerModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة عميل جديد</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSCode(`SUPP-${(suppliers.length + 1).toString().padStart(2, '0')}`);
                setIsSupplierModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة مورد أقمشة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2 text-xs font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'customers'
              ? 'bg-[#C5A059] text-[#0B0F17]'
              : 'bg-[#131B26] text-slate-400 hover:text-white border border-[#1E293B]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>العملاء وبوتيكات الجملة ({customers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            activeTab === 'suppliers'
              ? 'bg-[#C5A059] text-[#0B0F17]'
              : 'bg-[#131B26] text-slate-400 hover:text-white border border-[#1E293B]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>موردو الأقمشة والكلف ({suppliers.length})</span>
        </button>
      </div>

      {/* Customers Tab Content */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map(c => (
              <div key={c.id} className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-2xl p-5 space-y-3 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B0F17] text-[#E2C785]">
                      {c.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{c.name}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.type === 'Wholesale' ? 'جملة' : 'تجزئة'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                  {c.trn && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono">TRN: {c.trn}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex justify-between items-center text-xs">
                  <span className="text-slate-400">الرصيد الدفتري الحالي:</span>
                  <span className={`font-mono font-bold tabular-nums ${c.currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {c.currentBalance.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="col-span-full text-center py-12 text-xs text-slate-500 bg-[#131B26] border border-[#1E293B] rounded-2xl">
                لا يوجد عملاء مسجلين بعد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suppliers Tab Content */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/40 rounded-2xl p-5 space-y-3 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B0F17] text-[#E2C785]">
                      {s.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{s.companyName}</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.paymentTerms || 'نقد'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{s.phone}</span>
                  </div>
                  {s.contactName && (
                    <div className="text-[11px] text-slate-300">
                      مسؤول التواصل: {s.contactName}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1E293B] flex justify-between items-center text-xs">
                  <span className="text-slate-400">مستحقات المورد الدائنة (AP):</span>
                  <span className={`font-mono font-bold tabular-nums ${s.currentBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {s.currentBalance.toLocaleString()} {t.currency}
                  </span>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full text-center py-12 text-xs text-slate-500 bg-[#131B26] border border-[#1E293B] rounded-2xl">
                لا يوجد موردون مسجلون بعد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C5A059]" />
                إضافة عميل أو متجر جديد
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">اسم العميل / المتجر *</label>
                <input
                  type="text"
                  value={cName}
                  onChange={e => setCName(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نوع العميل</label>
                  <select
                    value={cType}
                    onChange={e => setCType(e.target.value as any)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                  >
                    <option value="Retail">تجزئة (بوتيك)</option>
                    <option value="Wholesale">جملة (متجر)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={e => setCPhone(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">الرقم الضريبي TRN (إن وجد)</label>
                <input
                  type="text"
                  value={cTrn}
                  onChange={e => setCTrn(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl"
              >
                حفظ العميل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#C5A059]" />
                إضافة مورد أقمشة ومستلزمات
              </h3>
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">اسم شركة المورد / المعمل *</label>
                <input
                  type="text"
                  placeholder="مثال: شركة ندى اليابان للأقمشة..."
                  value={sCompany}
                  onChange={e => setSCompany(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">اسم مسؤول التواصل</label>
                  <input
                    type="text"
                    value={sContact}
                    onChange={e => setSContact(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={sPhone}
                    onChange={e => setSPhone(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveSupplier}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl"
              >
                حفظ المورد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
