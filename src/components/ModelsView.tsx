import React, { useState, useRef } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { Model, BomItem, ModelAttachment } from '../types/erp';
import { exportToExcel } from '../utils/excelExport';
import { compressImage } from '../utils/imageCompressor';
import {
  Shirt,
  PlusCircle,
  Search,
  Scissors,
  Eye,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Film,
  Paperclip,
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'عباية (Abaya)',
  'شيلة (Sheila)',
  'قفطان (Kaftan)',
  'جلابية (Jalabiya)',
  'فستان (Dress)',
  'بشت نسائي (Bisht)',
  'طرحة (Veil)',
];

export const ModelsView: React.FC = () => {
  const { lang, models, inventoryItems, createModel, updateModel, deleteModel } = useErp();
  const t = getTranslation(lang);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isNewModelModalOpen, setIsNewModelModalOpen] = useState(false);
  const [selectedModelForDetails, setSelectedModelForDetails] = useState<Model | null>(null);

  // New Model Form State
  const [modelCode, setModelCode] = useState(`KSH-${(models.length + 1).toString().padStart(3, '0')}`);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState<string>('عباية (Abaya)');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [sizes, setSizes] = useState<string[]>(['52', '54', '56', '58', '60']);
  const [colors, setColors] = useState<string>('أسود ملكي');
  const [fabricConsumption, setFabricConsumption] = useState<number>(3.5);
  const [laborCostEst, setLaborCostEst] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [retailPrice, setRetailPrice] = useState<number>(0);
  const [productionNotes, setProductionNotes] = useState('');
  const [bomList, setBomList] = useState<BomItem[]>([]);

  // Media & Attachments State for New Model
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<ModelAttachment[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload with automatic compression for Firebase Firestore safety
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.78);
        setUploadedImages(prev => [...prev, compressed]);
      } catch (err) {
        console.warn('Error compressing image:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setUploadedImages(prev => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Handle Video Upload with size check
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      alert(`تنبيه: حجم ملف الفيديو (${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت) كبير نسبياً. يُفضل استخدام مقاطع فيديو قصيرة (أقل من 5 ميغابايت) لضمان سرعة الحفظ السحابي وعدم تجاوز حدود المستندات.`);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedVideos(prev => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(file);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Handle Attachment / Invoice Upload
  const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAtt: ModelAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            url: event.target!.result as string,
            type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'doc',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
          setAttachments(prev => [...prev, newAtt]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Item to BOM
  const handleAddBomItem = (itemId: string) => {
    const inv = inventoryItems.find(i => i.id === itemId);
    if (!inv) return;
    const exists = bomList.some(b => b.inventoryItemId === inv.id);
    if (exists) return;
    const newBom: BomItem = {
      inventoryItemId: inv.id,
      itemSku: inv.sku,
      itemName: inv.nameAr,
      qtyNeeded: inv.category === 'Fabric' ? fabricConsumption : 1,
      unit: inv.unit,
      unitCost: inv.unitCost,
      totalCost: (inv.category === 'Fabric' ? fabricConsumption : 1) * inv.unitCost,
    };
    setBomList([...bomList, newBom]);
  };

  const handleUpdateBomQty = (index: number, qty: number) => {
    const updated = [...bomList];
    updated[index].qtyNeeded = qty;
    updated[index].totalCost = qty * updated[index].unitCost;
    setBomList(updated);
  };

  const removeBomItem = (index: number) => {
    setBomList(bomList.filter((_, i) => i !== index));
  };

  const totalMaterialCost = bomList.reduce((sum, b) => sum + b.totalCost, 0);
  const totalUnitCost = totalMaterialCost + laborCostEst;
  const retailMarginPercent = retailPrice > 0 ? (((retailPrice - totalUnitCost) / retailPrice) * 100).toFixed(1) : '0';

  const handleSaveModel = async () => {
    if (!nameAr.trim() || !modelCode.trim()) {
      alert('يرجى إدخال اسم الموديل ورمزه');
      return;
    }

    const finalCategory = customCategoryInput.trim() ? customCategoryInput.trim() : category;

    await createModel({
      modelCode,
      nameAr,
      nameEn: nameEn || nameAr,
      nameFr: nameEn || nameAr,
      category: finalCategory,
      status: 'InProduction',
      images: uploadedImages.length > 0 ? uploadedImages : ['/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg'],
      videos: uploadedVideos,
      attachments,
      sizes,
      colors: colors.split(',').map(c => c.trim()),
      fabricConsumptionMeters: fabricConsumption,
      bom: bomList,
      productionNotes,
      estimatedMaterialCost: totalMaterialCost,
      estimatedLaborCost: laborCostEst,
      totalCost: totalUnitCost,
      wholesalePrice,
      retailPrice,
      createdAt: new Date().toISOString(),
    });

    setIsNewModelModalOpen(false);
    // Reset fields
    setNameAr('');
    setNameEn('');
    setCustomCategoryInput('');
    setUploadedImages([]);
    setUploadedVideos([]);
    setAttachments([]);
    setBomList([]);
    setProductionNotes('');
  };

  // Export Models to Excel
  const handleExportExcel = () => {
    const exportData = models.map(m => ({
      'رمز الموديل': m.modelCode,
      'اسم الموديل': m.nameAr,
      'التصنيف': m.category,
      'الحالة': m.status,
      'المقاسات': m.sizes.join(', '),
      'الألوان': m.colors.join(', '),
      'استهلاك القماش (متر)': m.fabricConsumptionMeters,
      'تكلفة المواد (AED)': m.estimatedMaterialCost,
      'تكلفة التفصيل (AED)': m.estimatedLaborCost,
      'التكلفة الإجمالية (AED)': m.totalCost,
      'سعر الجملة (AED)': m.wholesalePrice,
      'سعر التجزئة (AED)': m.retailPrice,
      'عدد الصور': m.images?.length || 0,
      'عدد الفيديوهات': m.videos?.length || 0,
      'عدد المرفقات والفواتير': m.attachments?.length || 0,
      'تاريخ الإنشاء': m.createdAt?.split('T')[0] || '',
    }));
    exportToExcel(exportData, `سجل_الموديلات_كشخة_${new Date().toISOString().split('T')[0]}`, 'الموديلات');
  };

  const filteredModels = models.filter(m => {
    const matchesSearch =
      m.modelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Shirt className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.models}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            كتالوج العبايات، الشيلات، القفاطين، الفساتين مع حفظ الصور ومقاطع الفيديو والفواتير وقوائم التكاليف (BOM)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={() => {
              setModelCode(`KSH-${(models.length + 1).toString().padStart(3, '0')}`);
              setIsNewModelModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة موديل يدوي</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث برمز الموديل أو الاسم أو التصنيف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#131B26] border border-[#1E293B] rounded-lg pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-[#C5A059] text-[#0B0F17] font-bold'
                : 'bg-[#131B26] text-slate-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            جميع التصاميم
          </button>
          {STANDARD_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#C5A059] text-[#0B0F17] font-bold'
                  : 'bg-[#131B26] text-slate-400 hover:text-white border border-[#1E293B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className="group bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Media Preview (Photo / Video count) */}
              <div className="relative h-48 bg-[#0B0F17] overflow-hidden flex items-center justify-center p-2">
                {model.images && model.images.length > 0 ? (
                  <img
                    src={model.images[0]}
                    alt={model.nameAr}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-1">
                    <Shirt className="w-8 h-8 text-slate-700" />
                    <span className="text-[10px]">لا توجد صورة</span>
                  </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 rtl:right-3 rtl:left-auto flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0B0F17]/90 text-[#E2C785] border border-[#C5A059]/40 backdrop-blur-sm">
                    {model.modelCode}
                  </span>
                </div>

                <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto flex items-center gap-1">
                  {model.videos && model.videos.length > 0 && (
                    <span className="p-1 rounded-full bg-blue-500/80 text-white" title="يحتوي على فيديو">
                      <Film className="w-3 h-3" />
                    </span>
                  )}
                  {model.attachments && model.attachments.length > 0 && (
                    <span className="p-1 rounded-full bg-[#C5A059]/80 text-[#0B0F17]" title="يحتوي على ملفات وفواتير">
                      <Paperclip className="w-3 h-3" />
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                    {model.category}
                  </span>
                </div>
              </div>

              {/* Model Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-[#E2C785] transition-colors leading-snug">
                    {model.nameAr}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {model.productionNotes || 'لا توجد ملاحظات تفصيل مسجلة.'}
                  </p>
                </div>

                {/* Sizes and Details */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500">المقاسات:</span>
                  {model.sizes.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-[#0B0F17] text-[10px] font-mono text-slate-300 border border-slate-800">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1E293B] text-xs">
                  <div className="p-2 bg-[#0B0F17] rounded-lg">
                    <span className="text-[10px] text-slate-400 block">التكلفة الإجمالية:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {model.totalCost.toLocaleString()} {t.currency}
                    </span>
                  </div>
                  <div className="p-2 bg-[#0B0F17] rounded-lg">
                    <span className="text-[10px] text-[#C5A059] block">سعر التجزئة:</span>
                    <span className="font-mono font-bold text-[#E2C785] tabular-nums">
                      {model.retailPrice.toLocaleString()} {t.currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Action */}
            <div className="p-4 pt-0">
              <button
                onClick={() => setSelectedModelForDetails(model)}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>عرض بطاقة الموديل والمرفقات والفيديو</span>
              </button>
            </div>
          </div>
        ))}

        {filteredModels.length === 0 && (
          <div className="col-span-full text-center py-16 text-xs text-slate-500 bg-[#131B26] border border-[#1E293B] rounded-2xl">
            لا توجد موديلات مضافة بعد. اضغط على "إضافة موديل يدوي" للبدء.
          </div>
        )}
      </div>

      {/* Model Full Spec Sheet & Attachments Modal */}
      {selectedModelForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-5 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm px-2.5 py-1 rounded bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]/40">
                  {selectedModelForDetails.modelCode}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedModelForDetails.nameAr}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    التصنيف: {selectedModelForDetails.category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedModelForDetails(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Gallery Images */}
            {selectedModelForDetails.images && selectedModelForDetails.images.length > 0 && (
              <div>
                <span className="text-xs font-bold text-[#E2C785] mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" />
                  معرض صور الموديل:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedModelForDetails.images.map((img, i) => (
                    <div key={i} className="h-32 bg-[#0B0F17] rounded-xl border border-slate-800 overflow-hidden p-1 flex items-center justify-center">
                      <img src={img} alt="Model Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Player if uploaded */}
            {selectedModelForDetails.videos && selectedModelForDetails.videos.length > 0 && (
              <div>
                <span className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  فيديو العرض والتفصيل:
                </span>
                <div className="bg-[#0B0F17] p-2 rounded-xl border border-slate-800">
                  <video
                    src={selectedModelForDetails.videos[0]}
                    controls
                    className="w-full max-h-64 rounded-lg bg-black"
                  />
                </div>
              </div>
            )}

            {/* Files & Invoices Attachments */}
            <div>
              <span className="text-xs font-bold text-[#C5A059] mb-2 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" />
                الملفات والفواتير المرفقة الخاصة بالموديل:
              </span>
              {selectedModelForDetails.attachments && selectedModelForDetails.attachments.length > 0 ? (
                <div className="space-y-2">
                  {selectedModelForDetails.attachments.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-[#131B26] border border-slate-800 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#C5A059]" />
                        <div>
                          <span className="font-semibold text-white block">{att.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{att.size} · {att.uploadedAt}</span>
                        </div>
                      </div>
                      <a
                        href={att.url}
                        download={att.name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-200 rounded-lg text-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>فتح / تحميل</span>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 bg-[#131B26] rounded-xl border border-slate-800">
                  لا توجد فواتير أو مستندات مرفقة لهذا الموديل.
                </div>
              )}
            </div>

            {/* BOM Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#C5A059]" />
                قائمة المواد ومكونات التفصيل (BOM):
              </h4>
              <div className="bg-[#131B26] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-[#0B0F17] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">الخامة / القماش</th>
                      <th className="py-2 px-3">الكمية</th>
                      <th className="py-2 px-3">الوحدة</th>
                      <th className="py-2 px-3">سعر الوحدة</th>
                      <th className="py-2 px-3 text-left rtl:text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                    {selectedModelForDetails.bom?.map((b, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-sans text-white">{b.itemName}</td>
                        <td className="py-2 px-3">{b.qtyNeeded}</td>
                        <td className="py-2 px-3 font-sans text-slate-400">{b.unit}</td>
                        <td className="py-2 px-3">{b.unitCost} AED</td>
                        <td className="py-2 px-3 text-left rtl:text-left font-bold text-emerald-400">{b.totalCost.toFixed(2)} AED</td>
                      </tr>
                    ))}
                    {(!selectedModelForDetails.bom || selectedModelForDetails.bom.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-3 text-center text-slate-500 font-sans">
                          لا توجد بنود BOM مسجلة.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من حذف هذا الموديل؟')) {
                    deleteModel(selectedModelForDetails.id);
                    setSelectedModelForDetails(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الموديل</span>
              </button>

              <button
                onClick={() => setSelectedModelForDetails(null)}
                className="px-5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Model Modal (with Images, Video, Invoices Upload) */}
      {isNewModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-[#C5A059]" />
                إضافة موديل يدوي جديد (عباية / شيلة / قفطان / فستان)
              </h3>
              <button
                onClick={() => setIsNewModelModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{t.modelCode} *</label>
                <input
                  type="text"
                  value={modelCode}
                  onChange={e => setModelCode(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">اسم الموديل / التصميم *</label>
                <input
                  type="text"
                  placeholder="مثال: عباية بشت مطرزة / قفطان مغربي..."
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            {/* Dynamic Category Selector (Abaya, Sheila, Kaftan, etc.) */}
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">تصنيف الموديل</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {STANDARD_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setCustomCategoryInput('');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      category === cat && !customCategoryInput
                        ? 'bg-[#C5A059] text-[#0B0F17] font-bold'
                        : 'bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="أو اكتب تصنيفاً مخصصاً آخر..."
                  value={customCategoryInput}
                  onChange={e => setCustomCategoryInput(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
                />
              </div>
            </div>

            {/* Upload Section: Photos, Videos, Invoices/Attachments */}
            <div className="p-4 bg-[#131B26] border border-slate-800 rounded-xl space-y-4">
              <span className="text-xs font-bold text-[#E2C785] block">
                مرفقات الموديل (صور الموديل، فيديو، وفواتير الشراء/المستندات):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Photos Upload */}
                <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#C5A059]" />
                      صور الموديل ({uploadedImages.length})
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={imageInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صور</span>
                  </button>
                </div>

                {/* 2. Video Upload */}
                <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      فيديو العرض ({uploadedVideos.length})
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={videoInputRef}
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع فيديو للموديل</span>
                  </button>
                </div>

                {/* 3. Invoices & Files Upload */}
                <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#C5A059]" />
                      الفواتير والمستندات ({attachments.length})
                    </span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleAttachmentFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع فاتورة / ملف</span>
                  </button>
                </div>
              </div>

              {/* Uploaded Attachments Preview List */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block">الملفات المرفقة:</span>
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#0B0F17] rounded-lg text-xs">
                      <span className="truncate max-w-[200px] text-slate-300">{att.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">{att.size}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financials & Prices */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">استهلاك القماش (متر)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fabricConsumption}
                  onChange={e => setFabricConsumption(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">أجرة تفصيل الخياط</label>
                <input
                  type="number"
                  value={laborCostEst}
                  onChange={e => setLaborCostEst(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">سعر الجملة (AED)</label>
                <input
                  type="number"
                  value={wholesalePrice}
                  onChange={e => setWholesalePrice(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[#C5A059] mb-1 font-semibold">سعر التجزئة (AED)</label>
                <input
                  type="number"
                  value={retailPrice}
                  onChange={e => setRetailPrice(Number(e.target.value) || 0)}
                  className="w-full bg-[#1E293B] border border-[#C5A059] rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Bill of Materials (BOM) Builder */}
            <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E2C785] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5" />
                  قائمة المواد ومكونات التفصيل (BOM):
                </span>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddBomItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                >
                  <option value="">+ اختر خامة من المستودع</option>
                  {inventoryItems.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.nameAr} ({inv.unitCost} AED/{inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              {bomList.length > 0 ? (
                <div className="space-y-1.5">
                  {bomList.map((bom, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#0B0F17] rounded-lg text-xs font-mono">
                      <span className="font-sans text-slate-200">{bom.itemName}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={bom.qtyNeeded}
                          onChange={e => handleUpdateBomQty(idx, Number(e.target.value) || 0)}
                          className="w-16 bg-[#1E293B] border border-slate-700 rounded px-1.5 py-0.5 text-center text-white"
                        />
                        <span className="text-slate-400 font-sans">{bom.unit}</span>
                        <span className="text-[#E2C785] font-bold">{bom.totalCost.toFixed(2)} AED</span>
                        <button
                          type="button"
                          onClick={() => removeBomItem(idx)}
                          className="text-slate-500 hover:text-rose-400 font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-slate-500">
                  يمكنك إضافة خامات من المستودع لحساب التكلفة التقديرية تلقائياً.
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-xs mb-1">ملاحظات الباترون والتنفيذ</label>
              <textarea
                rows={2}
                placeholder="ملاحظات قصة الأكمام، طريقة التبطين، تعليمات الورشة..."
                value={productionNotes}
                onChange={e => setProductionNotes(e.target.value)}
                className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewModelModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModel}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20"
              >
                حفظ وإدراج في الكتالوج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
