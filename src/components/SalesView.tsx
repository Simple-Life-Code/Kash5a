import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { InvoiceItem, SalesInvoice } from '../types/erp';
import { exportToExcel } from '../utils/excelExport';
import {
  ShoppingBag,
  PlusCircle,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  User,
  CreditCard,
  DollarSign,
  FileCheck,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';

export const SalesView: React.FC<{ onPrintInvoice: (inv: SalesInvoice) => void }> = ({ onPrintInvoice }) => {
  const {
    lang,
    salesInvoices,
    models,
    customers,
    settings,
    createSalesInvoice,
  } = useErp();
  const t = getTranslation(lang);

  const [searchTerm, setSearchTerm] = useState('');
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  useEffect(() => {
    if (isPosModalOpen) return registerGlobalModal(() => setIsPosModalOpen(false));
  }, [isPosModalOpen]);

  // New Invoice / POS State
  const [saleType, setSaleType] = useState<'Retail' | 'Wholesale'>('Retail');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [walkInCustomerName, setWalkInCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'BankTransfer' | 'Credit'>('Cash');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Bespoke Abaya Body Measurements
  const [abayaLength, setAbayaLength] = useState<number>(56);
  const [bustSize, setBustSize] = useState<number>(42);
  const [sleeveSize, setSleeveSize] = useState<number>(27);
  const [shoulderSize, setShoulderSize] = useState<number>(16);
  const [notes, setNotes] = useState('');

  // Add Item to Sale
  const handleAddItem = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    const price = saleType === 'Retail' ? model.retailPrice : model.wholesalePrice;
    const vat = price * settings.vatRate;
    const newItem: InvoiceItem = {
      modelId: model.id,
      modelCode: model.modelCode,
      name: model.nameAr,
      size: model.sizes[0] || '56',
      color: model.colors[0] || 'Black Gold',
      quantity: 1,
      unitPrice: price,
      vatRate: settings.vatRate,
      vatAmount: vat,
      total: price + vat,
    };
    const nextItems = [...items, newItem];
    setItems(nextItems);
    const newGrand = nextItems.reduce((s, i) => s + i.total, 0);
    setAmountPaid(newGrand);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    if (field === 'quantity' || field === 'unitPrice') {
      const q = updated[index].quantity;
      const p = updated[index].unitPrice;
      const sub = q * p;
      const vat = sub * settings.vatRate;
      updated[index].vatAmount = vat;
      updated[index].total = sub + vat;
    }
    setItems(updated);
    const newGrand = updated.reduce((s, i) => s + i.total, 0);
    setAmountPaid(newGrand);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const newGrand = updated.reduce((s, i) => s + i.total, 0);
    setAmountPaid(newGrand);
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);
  const grandTotal = subtotal + totalVat;

  const handleSaveInvoice = async () => {
    if (items.length === 0) {
      alert('يرجى إضافة عباية واحدة على الأقل للفاتورة');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const custName = customer ? customer.name : walkInCustomerName || 'عميل البوتيك (نقدي)';

    const invNumber = `INV-2026-${(salesInvoices.length + 101).toString().padStart(4, '0')}`;
    const paymentStatus: 'Pending' | 'Partial' | 'Paid' =
      amountPaid >= grandTotal ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending';

    const { invoiceId } = await createSalesInvoice({
      invoiceNumber: invNumber,
      date: invoiceDate,
      customerId: selectedCustomerId || 'walk-in',
      customerName: custName,
      saleType,
      items,
      subtotal,
      vatAmount: totalVat,
      grandTotal,
      paidAmount: amountPaid,
      paymentMethod,
      paymentStatus,
      customMeasurements: {
        length: abayaLength,
        bust: bustSize,
        sleeves: sleeveSize,
        shoulders: shoulderSize,
        notes,
      },
      notes,
      createdAt: new Date().toISOString(),
    });

    setIsPosModalOpen(false);
    setItems([]);
    setWalkInCustomerName('');
    setNotes('');

    // Trigger Print Preview for the new invoice
    const saved = {
      id: invoiceId,
      invoiceNumber: invNumber,
      date: invoiceDate,
      customerId: selectedCustomerId || 'walk-in',
      customerName: custName,
      saleType,
      items,
      subtotal,
      vatAmount: totalVat,
      grandTotal,
      paidAmount: amountPaid,
      paymentMethod,
      paymentStatus,
      customMeasurements: {
        length: abayaLength,
        bust: bustSize,
        sleeves: sleeveSize,
        shoulders: shoulderSize,
      },
      notes,
      createdAt: new Date().toISOString(),
    };
    onPrintInvoice(saved);
  };

  const handleExportInvoicesExcel = () => {
    const exportData = salesInvoices.map(inv => ({
      'رقم الفاتورة': inv.invoiceNumber,
      'التاريخ': inv.date,
      'اسم العميل': inv.customerName,
      'نوع البيع': inv.saleType === 'Retail' ? 'تجزئة' : 'جملة',
      'عدد القطع': inv.items.reduce((s, it) => s + it.quantity, 0),
      'المجموع الصافي (AED)': inv.subtotal,
      'ضريبة القيمة المضافة (AED)': inv.vatAmount,
      'الإجمالي النهائي (AED)': inv.grandTotal,
      'المبلغ المسدد (AED)': inv.paidAmount,
      'المبلغ المتبقي (AED)': Math.max(0, inv.grandTotal - inv.paidAmount),
      'طريقة الدفع': inv.paymentMethod,
      'حالة السداد': inv.paymentStatus === 'Paid' ? 'مدفوعة' : 'آجل / جزئي',
      'ملاحظات': inv.notes || '',
    }));
    exportToExcel(exportData, `سجل_فواتير_المبيعات_${new Date().toISOString().split('T')[0]}`, 'فواتير المبيعات');
  };

  const filteredInvoices = salesInvoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Open POS Modal Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.salesPos}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إصدار فواتير بيع العبايات والملابس (Boutique POS & Tax Invoices) مع التصدير إلى Excel والترحيل الدفتري الآلي
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportInvoicesExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير الفواتير Excel</span>
          </button>

          <button
            onClick={() => {
              setItems([]);
              setIsPosModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.newSale} / نقطة البيع</span>
          </button>
        </div>
      </div>

      {/* Sales Invoices List */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث برقم الفاتورة أو اسم العميل..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#131B26] border border-[#1E293B] rounded-lg pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-xs text-right">
            <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4">رقم الفاتورة الضريبية</th>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">العميل</th>
                <th className="py-3 px-4">نوع البيع</th>
                <th className="py-3 px-4 text-left rtl:text-left">المجموع الصافي</th>
                <th className="py-3 px-4 text-left rtl:text-left">ضريبة 5%</th>
                <th className="py-3 px-4 text-left rtl:text-left">الإجمالي شامل الضريبة</th>
                <th className="py-3 px-4 text-center">حالة السداد</th>
                <th className="py-3 px-4 text-center">طباعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B] text-slate-200">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-[#182333] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#E2C785]">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{inv.date}</td>
                  <td className="py-3 px-4 font-medium">{inv.customerName}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {inv.saleType === 'Retail' ? 'تجزئة بوتيك' : 'جملة تجار'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono tabular-nums text-slate-300">
                    {inv.subtotal.toLocaleString()} {t.currency}
                  </td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono tabular-nums text-slate-400">
                    {inv.vatAmount.toLocaleString()} {t.currency}
                  </td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono font-bold text-emerald-400 tabular-nums">
                    {inv.grandTotal.toLocaleString()} {t.currency}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      inv.paymentStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {inv.paymentStatus === 'Paid' ? 'مدفوعة بالكامل' : 'آجل / جزئي'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onPrintInvoice(inv)}
                      className="p-1.5 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-300 rounded-lg transition-colors"
                      title="معاينة وطباعة الفاتورة الضريبية"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="text-center py-12 text-xs text-slate-500">
              لم تسجل فواتير بعد. اضغط على زر "فاتورة بيع جديدة".
            </div>
          )}
        </div>
      </div>

      {/* POS Terminal & Invoice Builder Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
                نقطة البيع وإصدار الفاتورة الضريبية (Tax Invoice Terminal)
              </h3>
              <button
                type="button"
                onClick={() => setIsPosModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Header Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">نوع العملية</label>
                <select
                  value={saleType}
                  onChange={e => setSaleType(e.target.value as any)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="Retail">تجزئة (سعر البوتيك)</option>
                  <option value="Wholesale">جملة (سعر الموزع)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">العميل المسجل</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="">عميل مباشر (Walk-in)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div>
                  <label className="block text-slate-400 mb-1">اسم العميل المباشر</label>
                  <input
                    type="text"
                    placeholder="اسم السيدة..."
                    value={walkInCustomerName}
                    onChange={e => setWalkInCustomerName(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 mb-1">تاريخ الفاتورة</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            {/* Catalog Quick Add Strip */}
            <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-[#E2C785] block">
                اختر العباية لإضافتها إلى بنود الفاتورة:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {models.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleAddItem(m.id)}
                    className="flex items-center gap-2 p-2 bg-[#0B0F17] hover:bg-[#1E293B] border border-slate-800 hover:border-[#C5A059] rounded-lg text-xs shrink-0 transition-colors"
                  >
                    <span className="font-mono text-[#E2C785] font-bold">{m.modelCode}</span>
                    <span className="text-white max-w-[120px] truncate">{m.nameAr}</span>
                    <span className="text-emerald-400 font-mono font-semibold">
                      {saleType === 'Retail' ? m.retailPrice : m.wholesalePrice} AED
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-[#0B0F17] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">الموديل</th>
                    <th className="py-2 px-3 w-20">المقاس</th>
                    <th className="py-2 px-3 w-16 text-center">الكمية</th>
                    <th className="py-2 px-3 text-left rtl:text-left w-24">سعر الوحدة</th>
                    <th className="py-2 px-3 text-left rtl:text-left w-24">الضريبة 5%</th>
                    <th className="py-2 px-3 text-left rtl:text-left w-28">الإجمالي</th>
                    <th className="py-2 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#131B26] font-mono">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-sans text-slate-200">
                        <span className="text-[#E2C785] font-mono mr-1.5 font-bold">{item.modelCode}</span>
                        {item.name}
                      </td>
                      <td className="p-2">
                        <select
                          value={item.size}
                          onChange={e => handleUpdateItem(idx, 'size', e.target.value)}
                          className="w-full bg-[#1E293B] border border-slate-700 rounded px-1.5 py-1 text-white text-xs"
                        >
                          {['52', '54', '56', '58', '60'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value) || 1)}
                          className="w-12 bg-[#1E293B] border border-slate-700 rounded px-1.5 py-1 text-center text-white"
                        />
                      </td>
                      <td className="p-2 text-left rtl:text-left text-slate-300">
                        {item.unitPrice} AED
                      </td>
                      <td className="p-2 text-left rtl:text-left text-slate-400">
                        {item.vatAmount.toFixed(2)} AED
                      </td>
                      <td className="p-2 text-left rtl:text-left font-bold text-white tabular-nums">
                        {item.total.toFixed(2)} AED
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-500 hover:text-rose-400 font-bold"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-sans text-xs">
                        لم تضف عبايات بعد للفاتورة. اختر موديلات من الشريط أعلاه.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bespoke Measurements & Notes Accordion */}
            <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                مقاسات التفصيل الخاصة للزبون (Custom Abaya Tailoring Measurements - بالإنش):
              </span>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">الطول الكامل</label>
                  <input
                    type="number"
                    step="0.5"
                    value={abayaLength}
                    onChange={e => setAbayaLength(Number(e.target.value) || 56)}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">محيط الصدر</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bustSize}
                    onChange={e => setBustSize(Number(e.target.value) || 42)}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">طول الكم</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleeveSize}
                    onChange={e => setSleeveSize(Number(e.target.value) || 27)}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">عرض الكتف</label>
                  <input
                    type="number"
                    step="0.5"
                    value={shoulderSize}
                    onChange={e => setShoulderSize(Number(e.target.value) || 16)}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded px-2 py-1 text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary & Payment */}
            <div className="p-4 bg-[#0B0F17] border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">طريقة السداد</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="Cash">نقداً (Cash)</option>
                    <option value="Card">بطاقة بنكية (Card)</option>
                    <option value="BankTransfer">تحويل بنكي (NBD)</option>
                    <option value="Credit">على الحساب (آجل)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">المبلغ المسدد الآن (AED)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={e => setAmountPaid(Number(e.target.value) || 0)}
                    className="w-32 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="text-left rtl:text-right font-mono text-xs space-y-1">
                <div className="text-slate-400">
                  المجموع الصافي: <strong className="text-white">{subtotal.toFixed(2)} AED</strong>
                </div>
                <div className="text-slate-400">
                  ضريبة القيمة المضافة 5%: <strong className="text-white">{totalVat.toFixed(2)} AED</strong>
                </div>
                <div className="text-base font-bold text-[#E2C785] pt-1 border-t border-slate-800">
                  الإجمالي شامل الضريبة: {grandTotal.toFixed(2)} AED
                </div>
              </div>
            </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setIsPosModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={items.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>إصدار الفاتورة وترحيل القيد المحاسبي</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
