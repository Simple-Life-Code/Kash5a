import React from 'react';
import { useErp } from '../context/ErpContext';
import { SalesInvoice } from '../types/erp';
import { Printer, X } from 'lucide-react';

export const InvoicePrintModal: React.FC<{
  invoice: SalesInvoice | null;
  onClose: () => void;
}> = ({ invoice, onClose }) => {
  const { settings } = useErp();
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8 print:p-0 print:m-0 print:shadow-none print:rounded-none">
        
        {/* Actions bar (hidden on print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5A059]/20 text-[#8E7033] font-bold text-xs">
              معاينة الفاتورة الضريبية الرسمية
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#C5A059] hover:bg-[#8E7033] text-white text-xs font-bold rounded-lg transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="space-y-6 text-xs text-slate-800">
          
          {/* Header Lockup */}
          <div className="flex items-start justify-between border-b-2 border-[#C5A059] pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#C5A059] p-0.5 shrink-0 bg-white">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg"
                  alt="Kashkha Fashion"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold font-serif text-slate-900">
                  {settings.companyName || 'Kashkha Fashions'}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  {settings.address || 'دار ومصنع أزياء العبايات الراقية - دولة الإمارات العربية المتحدة'}
                </p>
                {settings.trn && (
                  <div className="font-mono text-[11px] text-[#8E7033] font-bold mt-1">
                    الرقم الضريبي TRN: {settings.trn}
                  </div>
                )}
              </div>
            </div>

            <div className="text-left rtl:text-right">
              <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">
                فاتورة ضريبية / TAX INVOICE
              </div>
              <div className="font-mono font-bold text-sm text-slate-900 mt-2">
                {invoice.invoiceNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                التاريخ: {invoice.date}
              </div>
            </div>
          </div>

          {/* Client & Atelier Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                بيانات المشتري / Customer:
              </span>
              <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
              <div className="text-[11px] text-slate-600">
                نوع التعامل: {invoice.saleType === 'Retail' ? 'تجزئة بوتيك' : 'توريد جملة'}
              </div>
            </div>
            <div className="text-left rtl:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                تفاصيل السداد / Payment:
              </span>
              <div className="font-mono font-bold text-slate-900">
                طريقة الدفع: {invoice.paymentMethod}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                الحالة: {invoice.paymentStatus === 'Paid' ? 'مسددة بالكامل' : 'دفعة جزئية / آجل'}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">البيان / موديل العباية</th>
                  <th className="py-2.5 px-3 text-center">المقاس</th>
                  <th className="py-2.5 px-3 text-center">الكمية</th>
                  <th className="py-2.5 px-3 text-left rtl:text-left">سعر الوحدة</th>
                  <th className="py-2.5 px-3 text-left rtl:text-left">الضريبة (5%)</th>
                  <th className="py-2.5 px-3 text-left rtl:text-left">الإجمالي شامل الضريبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-sans text-slate-900 font-medium">
                      <span className="font-mono text-[#8E7033] font-bold mr-1">{it.modelCode}</span> {it.name}
                    </td>
                    <td className="py-2 px-3 text-center">{it.size}</td>
                    <td className="py-2 px-3 text-center font-bold">{it.quantity}</td>
                    <td className="py-2 px-3 text-left rtl:text-left">{it.unitPrice.toFixed(2)} AED</td>
                    <td className="py-2 px-3 text-left rtl:text-left text-slate-600">{it.vatAmount.toFixed(2)} AED</td>
                    <td className="py-2 px-3 text-left rtl:text-left font-bold text-slate-900">{it.total.toFixed(2)} AED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Custom Tailoring Measurements if any */}
          {invoice.customMeasurements && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-slate-700 block">
                مقاسات التفصيل الخاصة المعتمدة (Bespoke Body Measurements - بالإنش):
              </span>
              <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                <div className="bg-white p-1 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">الطول:</span>
                  <strong>{invoice.customMeasurements.length}"</strong>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">الصدر:</span>
                  <strong>{invoice.customMeasurements.bust}"</strong>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">الكم:</span>
                  <strong>{invoice.customMeasurements.sleeves}"</strong>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200">
                  <span className="text-slate-500 block text-[9px]">الكتف:</span>
                  <strong>{invoice.customMeasurements.shoulders}"</strong>
                </div>
              </div>
            </div>
          )}

          {/* Totals & QR Verification */}
          <div className="flex items-center justify-between border-t-2 border-slate-200 pt-4">
            {/* Mock FTA QR Box */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded p-1 flex items-center justify-center font-mono text-[9px] text-center text-slate-500">
                [FTA QR Code E-Invoice]
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                فاتورة ضريبية مبسطة معتمدة
                <br />
                مطابقة للمعيار الإلكتروني لهيئة الضرائب
              </div>
            </div>

            {/* Totals Summary */}
            <div className="text-left rtl:text-right font-mono space-y-1 text-xs">
              <div className="text-slate-600">
                المجموع غير شامل الضريبة: <strong>{invoice.subtotal.toFixed(2)} AED</strong>
              </div>
              <div className="text-slate-600">
                ضريبة القيمة المضافة (5% VAT): <strong>{invoice.vatAmount.toFixed(2)} AED</strong>
              </div>
              <div className="text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">
                الإجمالي المستحق: {invoice.grandTotal.toFixed(2)} AED
              </div>
              <div className="text-[11px] text-emerald-700">
                المبلغ المسدد: {invoice.paidAmount.toFixed(2)} AED
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
            شكراً لثقتكم بدار {settings.companyName || 'Kashkha Fashions'} للأزياء والعبايات · هاتف: {settings.phone || '+971 58 936 6255'} · بريد: {settings.email || 'fatimazohramaryam88@gmail.com'}
          </div>
        </div>

      </div>
    </div>
  );
};
