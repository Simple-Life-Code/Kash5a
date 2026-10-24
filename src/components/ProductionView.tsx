import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { ProductionOrder, ProductionStage } from '../types/erp';
import {
  Scissors,
  PlusCircle,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileCheck,
  X,
} from 'lucide-react';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';

const STAGES: { stage: ProductionStage; labelAr: string; labelEn: string; color: string }[] = [
  { stage: 'New', labelAr: '1. طلب جديد', labelEn: '1. New Order', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { stage: 'Cutting', labelAr: '2. قص وباترون', labelEn: '2. Cutting', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { stage: 'Sewing', labelAr: '3. خياطة وتركيب', labelEn: '3. Sewing', color: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  { stage: 'Embroidery', labelAr: '4. شك وتطريز', labelEn: '4. Embroidery', color: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  { stage: 'Ironing', labelAr: '5. كوي وتغليف', labelEn: '5. Ironing & Pack', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' },
  { stage: 'Ready', labelAr: '6. جاهز للاستلام', labelEn: '6. Ready', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  { stage: 'Delivered', labelAr: '7. تم التسليم', labelEn: '7. Delivered', color: 'border-[#C5A059]/40 bg-[#C5A059]/10 text-[#E2C785]' },
];

export const ProductionView: React.FC = () => {
  const {
    lang,
    productionOrders,
    models,
    employees,
    createProductionOrder,
    advanceProductionStage,
  } = useErp();
  const t = getTranslation(lang);

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    if (isNewOrderModalOpen) return registerGlobalModal(() => setIsNewOrderModalOpen(false));
  }, [isNewOrderModalOpen]);

  useEffect(() => {
    if (selectedOrderForHistory) return registerGlobalModal(() => setSelectedOrderForHistory(null));
  }, [selectedOrderForHistory]);

  // New Order Form State
  const [selectedModelId, setSelectedModelId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('56');
  const [color, setColor] = useState('Black Gold');
  const [assignedTailorId, setAssignedTailorId] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High' | 'Urgent'>('Normal');
  const [notes, setNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  const handleCreateOrder = async () => {
    const model = models.find(m => m.id === selectedModelId);
    if (!model) {
      alert('يرجى اختيار الموديل');
      return;
    }
    const tailor = employees.find(e => e.id === assignedTailorId);

    await createProductionOrder({
      orderNumber: `WO-2026-${(productionOrders.length + 44).toString().padStart(4, '0')}`,
      modelId: model.id,
      modelCode: model.modelCode,
      modelName: model.nameAr,
      customerName: customerName || 'زبون البوتيك',
      quantity,
      size,
      color,
      currentStage: 'New',
      assignedTailor: tailor ? tailor.fullName : 'لم يتم التعيين',
      assignedTailorId: tailor?.id,
      priority,
      notes,
      materialsIssued: false,
      stageHistory: [
        {
          stage: 'New',
          timestamp: new Date().toISOString(),
          performedBy: 'مشرف الإنتاج',
          notes: 'إنشاء أمر تشغيل في الورشة',
        },
      ],
      createdAt: new Date().toISOString(),
      deliveryDate,
    });

    setIsNewOrderModalOpen(false);
    setSelectedModelId('');
    setCustomerName('');
    setNotes('');
  };

  const getNextStage = (current: ProductionStage): ProductionStage | null => {
    const order: ProductionStage[] = ['New', 'Cutting', 'Sewing', 'Embroidery', 'Ironing', 'Ready', 'Delivered'];
    const idx = order.indexOf(current);
    if (idx !== -1 && idx < order.length - 1) {
      return order[idx + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.production}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            خط إنتاج وتفصيل العبايات في المشغل (7 مراحل تشغيلية): القص، الباترون، الخياطة، التطريز، الكي والتسليم
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>أمر تفصيل ورشة جديد</span>
        </button>
      </div>

      {/* 7-Stage Interactive Kanban Board */}
      <div className="flex lg:grid lg:grid-cols-7 gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
        {STAGES.map(s => {
          const ordersInStage = productionOrders.filter(o => o.currentStage === s.stage);
          return (
            <div
              key={s.stage}
              className="bg-[#131B26] border border-[#1E293B] rounded-xl flex flex-col w-[85vw] sm:w-[300px] lg:w-auto shrink-0 min-h-[440px] snap-center shadow-sm"
            >
              {/* Column Header */}
              <div className={`p-3 border-b rounded-t-xl font-medium text-xs flex items-center justify-between ${s.color}`}>
                <span className="font-semibold">{lang === 'ar' ? s.labelAr : s.labelEn}</span>
                <span className="font-mono px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-bold">
                  {ordersInStage.length}
                </span>
              </div>

              {/* Order Cards Container */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto">
                {ordersInStage.map(order => {
                  const nextStage = getNextStage(order.currentStage);
                  return (
                    <div
                      key={order.id}
                      className="group bg-[#0B0F17] border border-slate-800 hover:border-[#C5A059]/60 rounded-xl p-3 space-y-2.5 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#131B26] text-[#E2C785] border border-slate-800">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                          order.priority === 'Urgent'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : order.priority === 'High'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {order.priority}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {order.modelName}
                        </h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {order.customerName}
                        </div>
                      </div>

                      {/* Specs badges */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-[#131B26]">المقاس: {order.size}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#131B26]">العدد: {order.quantity}</span>
                      </div>

                      {/* Tailor info */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                        <User className="w-3 h-3 text-[#C5A059]" />
                        <span className="truncate">{order.assignedTailor || 'غير مسند'}</span>
                      </div>

                      {/* Stage Action Controls */}
                      <div className="pt-1 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForHistory(order)}
                          className="text-[10px] text-slate-400 hover:text-white underline"
                        >
                          السجل ({order.stageHistory.length})
                        </button>

                        {nextStage && (
                          <button
                            type="button"
                            onClick={() => advanceProductionStage(order.id, nextStage)}
                            className="flex items-center gap-1 px-2 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-300 text-[10px] font-medium rounded-lg transition-colors"
                          >
                            <span>تحويل: {t[`stage_${nextStage}` as keyof typeof t] || nextStage}</span>
                            <ArrowLeft className="w-3 h-3 rtl:inline ltr:hidden" />
                            <ArrowRight className="w-3 h-3 ltr:inline rtl:hidden" />
                          </button>
                        )}
                        {!nextStage && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> تم التسليم
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {ordersInStage.length === 0 && (
                  <div className="text-center py-12 text-[11px] text-slate-600">
                    لا توجد أوامر في هذه المرحلة
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Production History Modal */}
      {selectedOrderForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <div>
                <span className="font-mono text-xs font-bold text-[#E2C785] px-2 py-0.5 rounded bg-[#C5A059]/20">
                  {selectedOrderForHistory.orderNumber}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  سجل حركة أمر الإنتاج والتفصيل
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForHistory(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {selectedOrderForHistory.stageHistory.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-[#131B26] border border-slate-800 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-[#C5A059]/20 text-[#E2C785] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        {t[`stage_${log.stage}` as keyof typeof t] || log.stage}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {log.timestamp.replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      المسؤول: {log.performedBy}
                    </div>
                    {log.notes && (
                      <div className="text-slate-300 mt-1 italic bg-[#0B0F17] p-2 rounded">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setSelectedOrderForHistory(null)}
                className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Production Order Modal */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-xl max-h-[92vh] bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-[#0B0F17]">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#C5A059]" />
                إنشاء أمر تفصيل عباية جديد بالورشة
              </h3>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">الموديل المطلوب تفصيله *</label>
                <select
                  value={selectedModelId}
                  onChange={e => setSelectedModelId(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">-- اختر موديل العباية من الكتالوج --</option>
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.modelCode} - {m.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">اسم العميل / المتجر</label>
                  <input
                    type="text"
                    placeholder="مثال: الشيخة مريم..."
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الكمية المطلوبة (قطع)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value) || 1)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">المقاس القياسي</label>
                  <select
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  >
                    {['50', '52', '54', '56', '58', '60', '62', 'Custom'].map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">اللون المعتمد</label>
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">إسناد للخياط / المشرف</label>
                  <select
                    value={assignedTailorId}
                    onChange={e => setAssignedTailorId(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">-- اختر خياط الورشة --</option>
                    {employees.filter(e => ['Tailor', 'MasterCutter', 'Embroiderer'].includes(e.role)).map(e => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">درجة الأولوية</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Normal">عادي (Normal)</option>
                    <option value="High">عالي (High)</option>
                    <option value="Urgent">عاجل جداً (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ملاحظات القياس والتفصيل الخاصة</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات العميل، تفريغ الصدر، طول الأكمام..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 shrink-0 bg-[#0B0F17]">
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20 cursor-pointer"
              >
                توليد أمر التشغيل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
