import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { InventoryCategory, InventoryItem } from '../types/erp';
import {
  Layers,
  PlusCircle,
  Search,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Package,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export const InventoryView: React.FC = () => {
  const { lang, inventoryItems, stockMovements, createInventoryItem, adjustInventoryStock } = useErp();
  const t = getTranslation(lang);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);

  // New Item State
  const [sku, setSku] = useState(`FAB-KSH-${(inventoryItems.length + 1).toString().padStart(2, '0')}`);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('Fabric');
  const [unit, setUnit] = useState('Meter');
  const [currentStock, setCurrentStock] = useState<number>(100);
  const [minStockAlert, setMinStockAlert] = useState<number>(30);
  const [unitCost, setUnitCost] = useState<number>(35);
  const [warehouseLocation, setWarehouseLocation] = useState('Zone A - Shelf 01');

  // Adjustment State
  const [qtyDelta, setQtyDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('توريد شحنة جديدة من المورد');

  const totalInventoryValuation = inventoryItems.reduce(
    (sum, item) => sum + item.currentStock * item.unitCost,
    0
  );

  const lowStockCount = inventoryItems.filter(i => i.currentStock <= i.minStockAlert).length;

  const handleSaveItem = async () => {
    if (!sku.trim() || !nameAr.trim()) {
      alert('يرجى إكمال رمز الصنف واسمه بالعربية');
      return;
    }

    await createInventoryItem({
      sku,
      nameAr,
      nameEn: nameEn || nameAr,
      nameFr: nameEn || nameAr,
      category,
      unit,
      currentStock,
      minStockAlert,
      unitCost,
      warehouseLocation,
      updatedAt: new Date().toISOString(),
    });

    setIsNewItemModalOpen(false);
    setNameAr('');
    setNameEn('');
  };

  const handleSaveAdjust = async () => {
    if (!selectedItemForAdjust) return;
    await adjustInventoryStock(selectedItemForAdjust.id, qtyDelta, adjustReason);
    setIsAdjustModalOpen(false);
    setSelectedItemForAdjust(null);
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleExportInventoryToExcel = () => {
    if (inventoryItems.length === 0) {
      alert('لا توجد أصناف خامات مسجلة بالمستودع حالياً للتصدير');
      return;
    }
    const rows = inventoryItems.map(item => ({
      'رمز الصنف SKU': item.sku,
      'اسم الخامة / الصنف': item.nameAr,
      'الاسم بالإنجليزية': item.nameEn,
      'التصنيف': item.category,
      'الوحدة': item.unit,
      'الرصيد المتوفر': item.currentStock,
      'حد الطلب الأدنى': item.minStockAlert,
      'تكلفة الوحدة (AED)': item.unitCost,
      'إجمالي القيمة الدفترية (AED)': item.currentStock * item.unitCost,
      'موقع المستودع / الرف': item.warehouseLocation || '',
      'تاريخ آخر تحديث': item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ar-AE') : '',
    }));
    exportToExcel(rows, `مخزون_الخامات_والمستودع_${new Date().toISOString().split('T')[0]}`, 'InventoryStock');
  };

  return (
    <div className="space-y-6">
      {/* Header & Valuation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.inventory}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            مستودع الأقمشة الفاخرة (ندى، صالونة)، الدانتيل، الكريستال، وتتبع الرصيد الدفتري بسعر التكلفة المرجحة (WAC)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleExportInventoryToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#131B26] hover:bg-[#1E293B] border border-emerald-500/40 text-emerald-400 text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0"
            title="تصدير بيانات مخزون الخامات إلى شيت إكسيل Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير المخزون (Excel)</span>
          </button>

          <button
            onClick={() => {
              setSku(`FAB-KSH-${(inventoryItems.length + 1).toString().padStart(2, '0')}`);
              setIsNewItemModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة خامة / قماش جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">إجمالي القيمة الدفترية للمخزون:</span>
          <div className="text-xl font-bold font-mono text-[#E2C785] mt-1 tabular-nums">
            {totalInventoryValuation.toLocaleString()} {t.currency}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">مطابق لحساب المخزون (1200)</span>
        </div>

        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">عدد الأصناف المسجلة بالمستودع:</span>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {inventoryItems.length} <span className="text-xs font-sans text-slate-400">صنف خامة</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">أقمشة، دانتيل، شك وتغليف</span>
        </div>

        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">أصناف تحت حد الطلب الأدنى:</span>
          <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockCount} <span className="text-xs font-sans text-slate-400">أصناف حرجة</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">تتطلب أمر شراء عاجل من المورد</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث برمز الصنف SKU أو اسم القماش..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#131B26] border border-[#1E293B] rounded-lg pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          {['all', 'Fabric', 'Lace_Trim', 'Beads_Crystals', 'Packaging', 'Finished_Product'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#C5A059] text-[#0B0F17] font-bold'
                  : 'bg-[#131B26] text-slate-400 hover:text-white border border-[#1E293B]'
              }`}
            >
              {cat === 'all' ? 'جميع الخامات' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs text-right">
          <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1E293B]">
            <tr>
              <th className="py-3 px-4">رمز الصنف SKU</th>
              <th className="py-3 px-4">اسم الخامة / القماش</th>
              <th className="py-3 px-4">التصنيف</th>
              <th className="py-3 px-4">الوحدة</th>
              <th className="py-3 px-4 text-left rtl:text-left">الرصيد الفعلي</th>
              <th className="py-3 px-4 text-left rtl:text-left">متوسط التكلفة</th>
              <th className="py-3 px-4 text-left rtl:text-left">إجمالي القيمة</th>
              <th className="py-3 px-4 text-center">إجراءات المستودع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-slate-200">
            {filteredItems.map(item => {
              const isLow = item.currentStock <= item.minStockAlert;
              const itemTotal = item.currentStock * item.unitCost;
              return (
                <tr key={item.id} className="hover:bg-[#182333] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#E2C785]">{item.sku}</td>
                  <td className="py-3 px-4 font-medium">
                    <div>{lang === 'ar' ? item.nameAr : item.nameEn}</div>
                    <span className="text-[10px] text-slate-500">{item.warehouseLocation}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{item.unit}</td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono font-bold tabular-nums">
                    <span className={isLow ? 'text-amber-400 font-bold' : 'text-white'}>
                      {item.currentStock.toLocaleString()}
                    </span>
                    {isLow && (
                      <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                        منخفض
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono tabular-nums text-slate-300">
                    {item.unitCost} {t.currency}
                  </td>
                  <td className="py-3 px-4 text-left rtl:text-left font-mono font-bold text-emerald-400 tabular-nums">
                    {itemTotal.toLocaleString()} {t.currency}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedItemForAdjust(item);
                        setQtyDelta(10);
                        setIsAdjustModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-300 text-[11px] rounded-lg transition-colors"
                    >
                      تسوية / توريد
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-500">
            لا توجد خامات مطابقة لخيارات البحث.
          </div>
        )}
      </div>

      {/* Stock Adjustment / Receipt Modal */}
      {isAdjustModalOpen && selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#C5A059]" />
                تسوية وتوريد مخزون: {selectedItemForAdjust.sku}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#131B26] rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block">{selectedItemForAdjust.nameAr}</span>
              <div className="flex justify-between mt-1 font-mono">
                <span>الرصيد الدفتري الحالي: <strong>{selectedItemForAdjust.currentStock} {selectedItemForAdjust.unit}</strong></span>
                <span>تكلفة الوحدة: <strong>{selectedItemForAdjust.unitCost} AED</strong></span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  الكمية (موجب للتوريد والشراء / سالب للصرف والتالف)
                </label>
                <input
                  type="number"
                  value={qtyDelta}
                  onChange={e => setQtyDelta(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">سبب الحركة / المرجع الدفتري</label>
                <input
                  type="text"
                  placeholder="مثال: فاتورة شراء رقم PO-902..."
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="p-3 bg-[#0B0F17] rounded-lg border border-slate-800 text-xs flex justify-between font-mono">
                <span className="font-sans text-slate-400">الرصيد الجديد المتوقع:</span>
                <span className="text-emerald-400 font-bold">
                  {Math.max(0, selectedItemForAdjust.currentStock + qtyDelta)} {selectedItemForAdjust.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveAdjust}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20"
              >
                تأكيد وقيد الحركة بالمستودع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#C5A059]" />
                إضافة خامة / قماش جديد للمستودع
              </h3>
              <button
                onClick={() => setIsNewItemModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">رمز الصنف SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">اسم القماش / الخامة (بالعربية)</label>
                <input
                  type="text"
                  placeholder="مثال: قماش ندى ياباني أصلي..."
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">الفئة</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="Fabric">أقمشة (Fabric)</option>
                  <option value="Lace_Trim">دانتيل وكلف (Lace)</option>
                  <option value="Beads_Crystals">شك وكريستال</option>
                  <option value="Packaging">تغليف وعلب</option>
                  <option value="Finished_Product">عباية تامة الصنع</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">وحدة القياس</label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="Meter">متر (Meter)</option>
                  <option value="Yard">يارده (Yard)</option>
                  <option value="Roll">طاقة / لفة (Roll)</option>
                  <option value="Pack">باكيت (Pack)</option>
                  <option value="Piece">قطعة (Piece)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">الرصيد الافتتاحي</label>
                <input
                  type="number"
                  value={currentStock}
                  onChange={e => setCurrentStock(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[#C5A059] mb-1 font-semibold">سعر التكلفة (AED)</label>
                <input
                  type="number"
                  value={unitCost}
                  onChange={e => setUnitCost(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-[#C5A059] rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">حد تنبيه انخفاض المخزون</label>
                <input
                  type="number"
                  value={minStockAlert}
                  onChange={e => setMinStockAlert(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">موقع التخزين بالمستودع</label>
                <input
                  type="text"
                  placeholder="مثال: رف أ-1"
                  value={warehouseLocation}
                  onChange={e => setWarehouseLocation(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewItemModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20"
              >
                تسجيل الصنف بالمستودع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
