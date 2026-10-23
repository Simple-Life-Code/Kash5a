import React, { useState, useRef, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { Model, BomItem, ModelAttachment } from '../types/erp';
import { exportToExcel } from '../utils/excelExport';
import { compressImage } from '../utils/imageCompressor';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';
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
  Edit,
  X,
  Check,
  AlertTriangle,
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
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

  // Register modals in global navigation stack for Esc / phone back button
  useEffect(() => {
    if (isNewModelModalOpen) return registerGlobalModal(() => setIsNewModelModalOpen(false));
  }, [isNewModelModalOpen]);

  useEffect(() => {
    if (selectedModelForDetails) return registerGlobalModal(() => setSelectedModelForDetails(null));
  }, [selectedModelForDetails]);

  useEffect(() => {
    if (editingModel) return registerGlobalModal(() => setEditingModel(null));
  }, [editingModel]);

  useEffect(() => {
    if (modelToDelete) return registerGlobalModal(() => setModelToDelete(null));
  }, [modelToDelete]);

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

  // Edit Model Form State
  const [editModelCode, setEditModelCode] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSizes, setEditSizes] = useState<string[]>([]);
  const [editColors, setEditColors] = useState('');
  const [editFabricConsumption, setEditFabricConsumption] = useState<number>(3.5);
  const [editLaborCostEst, setEditLaborCostEst] = useState<number>(0);
  const [editWholesalePrice, setEditWholesalePrice] = useState<number>(0);
  const [editRetailPrice, setEditRetailPrice] = useState<number>(0);
  const [editProductionNotes, setEditProductionNotes] = useState('');
  const [editBomList, setEditBomList] = useState<BomItem[]>([]);
  const [editUploadedImages, setEditUploadedImages] = useState<string[]>([]);
  const [editUploadedVideos, setEditUploadedVideos] = useState<string[]>([]);
  const [editAttachments, setEditAttachments] = useState<ModelAttachment[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editImageInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload with automatic compression for Firestore safety
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.78);
        if (isEdit) {
          setEditUploadedImages(prev => [...prev, compressed]);
        } else {
          setUploadedImages(prev => [...prev, compressed]);
        }
      } catch (err) {
        console.warn('Error compressing image:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            if (isEdit) {
              setEditUploadedImages(prev => [...prev, event.target!.result as string]);
            } else {
              setUploadedImages(prev => [...prev, event.target!.result as string]);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    }
    if (isEdit) {
      if (editImageInputRef.current) editImageInputRef.current.value = '';
    } else {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Handle Video Upload with size check
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 8 * 1024 * 1024) {
      alert(`تنبيه: حجم ملف الفيديو (${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت) كبير نسبياً. يُفضل استخدام مقاطع فيديو قصيرة (أقل من 5 ميغابايت) لضمان سرعة الحفظ والمعالجة السليمة.`);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (isEdit) {
          setEditUploadedVideos(prev => [...prev, event.target!.result as string]);
        } else {
          setUploadedVideos(prev => [...prev, event.target!.result as string]);
        }
      }
    };
    reader.readAsDataURL(file);
    if (isEdit) {
      if (editVideoInputRef.current) editVideoInputRef.current.value = '';
    } else {
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Handle Invoices/Files Attachments Upload
  const handleAttachmentFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const getAttachmentType = (mimeType: string, filename: string): 'invoice' | 'pdf' | 'image' | 'video' | 'doc' => {
      if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(filename)) return 'image';
      if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(filename)) return 'video';
      if (mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf')) return 'pdf';
      if (filename.toLowerCase().includes('inv') || filename.toLowerCase().includes('فاتورة')) return 'invoice';
      return 'doc';
    };

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAtt: ModelAttachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            type: getAttachmentType(file.type || '', file.name),
            url: event.target.result as string,
            uploadedAt: new Date().toISOString().split('T')[0],
          };
          if (isEdit) {
            setEditAttachments(prev => [...prev, newAtt]);
          } else {
            setAttachments(prev => [...prev, newAtt]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    if (isEdit) {
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // BOM Material Addition State
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState('');
  const [neededQty, setNeededQty] = useState<number>(1);

  const handleAddBomItem = (isEdit = false) => {
    const item = inventoryItems.find(i => i.id === selectedInventoryItemId);
    if (!item) return;

    const newItem: BomItem = {
      inventoryItemId: item.id,
      itemSku: item.sku,
      itemName: item.nameAr,
      qtyNeeded: neededQty,
      unit: item.unit,
      unitCost: item.unitCost,
      totalCost: neededQty * item.unitCost,
    };

    if (isEdit) {
      setEditBomList(prev => [...prev, newItem]);
    } else {
      setBomList(prev => [...prev, newItem]);
    }
    setSelectedInventoryItemId('');
    setNeededQty(1);
  };

  // Calculate Costs for New Model
  const primaryFabric = inventoryItems.find(i => i.category === 'Fabric');
  const fabricUnitCost = primaryFabric ? primaryFabric.unitCost : 0;
  const estimatedFabricCost = fabricConsumption * fabricUnitCost;
  const bomCost = bomList.reduce((sum, b) => sum + b.totalCost, 0);
  const totalMaterialCost = estimatedFabricCost + bomCost;
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

  // Open Edit Modal
  const openEditModal = (model: Model) => {
    setEditingModel(model);
    setEditModelCode(model.modelCode || '');
    setEditNameAr(model.nameAr || '');
    setEditNameEn(model.nameEn || '');
    setEditCategory(model.category || 'عباية (Abaya)');
    setEditSizes(model.sizes || ['52', '54', '56', '58', '60']);
    setEditColors(Array.isArray(model.colors) ? model.colors.join(', ') : (model.colors || ''));
    setEditFabricConsumption(model.fabricConsumptionMeters || 3.5);
    setEditLaborCostEst(model.estimatedLaborCost || 0);
    setEditWholesalePrice(model.wholesalePrice || 0);
    setEditRetailPrice(model.retailPrice || 0);
    setEditProductionNotes(model.productionNotes || '');
    setEditBomList(model.bom || []);
    setEditUploadedImages(model.images || []);
    setEditUploadedVideos(model.videos || []);
    setEditAttachments(model.attachments || []);
  };

  // Save Model Edits to Firestore
  const handleSaveModelEdits = async () => {
    if (!editingModel) return;
    if (!editNameAr.trim() || !editModelCode.trim()) {
      alert('يرجى إدخال اسم الموديل ورمزه');
      return;
    }

    const editFabricCost = editFabricConsumption * fabricUnitCost;
    const editBomTotal = editBomList.reduce((sum, b) => sum + b.totalCost, 0);
    const updatedMaterialCost = editFabricCost + editBomTotal;
    const updatedTotalCost = updatedMaterialCost + editLaborCostEst;

    const updatedData: Partial<Model> = {
      modelCode: editModelCode.trim(),
      nameAr: editNameAr.trim(),
      nameEn: editNameEn.trim() || editNameAr.trim(),
      category: editCategory,
      sizes: editSizes,
      colors: editColors.split(',').map(c => c.trim()).filter(Boolean),
      fabricConsumptionMeters: Number(editFabricConsumption) || 3.5,
      estimatedMaterialCost: updatedMaterialCost,
      estimatedLaborCost: Number(editLaborCostEst) || 0,
      totalCost: updatedTotalCost,
      wholesalePrice: Number(editWholesalePrice) || 0,
      retailPrice: Number(editRetailPrice) || 0,
      productionNotes: editProductionNotes,
      bom: editBomList,
      images: editUploadedImages.length > 0 ? editUploadedImages : ['/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg'],
      videos: editUploadedVideos,
      attachments: editAttachments,
    };

    await updateModel(editingModel.id, updatedData);
    setEditingModel(null);
  };

  // Export Models to Excel
  const handleExportExcel = () => {
    const exportData = models.map(m => ({
      'رمز الموديل': m.modelCode,
      'اسم الموديل': m.nameAr,
      'التصنيف': m.category,
      'الحالة': m.status,
      'المقاسات': m.sizes.join(', '),
      'الألوان': Array.isArray(m.colors) ? m.colors.join(', ') : m.colors,
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
      m.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.modelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E293B]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide flex items-center gap-2">
            <Shirt className="w-6 h-6 text-[#C5A059]" />
            كتالوج وتصاميم أزياء كشخة (BOM & Catalog)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            كتالوج العبايات، الشيلات، القفاطين، الفساتين مع حفظ الصور ومقاطع الفيديو والفواتير وقوائم التكاليف (BOM)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#131B26] hover:bg-[#1E293B] border border-[#1E293B] text-emerald-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>
          <button
            onClick={() => {
              setModelCode(`KSH-${(models.length + 1).toString().padStart(3, '0')}`);
              setIsNewModelModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C5A059] to-[#E2C785] hover:brightness-110 active:scale-95 text-[#0B0F17] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#C5A059]/25 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#0B0F17] stroke-[2.5]" />
            <span>إضافة موديل يدوي جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#131B26] border border-[#1E293B] rounded-2xl p-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 rtl:left-auto left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث بالاسم أو الرمز (KSH-...) أو التصنيف..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0F17] border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#C5A059] text-[#0B0F17] font-bold shadow-sm'
                : 'text-slate-400 hover:text-white bg-[#0B0F17] border border-slate-800'
            }`}
          >
            الكل ({models.length})
          </button>
          {STANDARD_CATEGORIES.map(cat => {
            const count = models.filter(m => m.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#C5A059] text-[#0B0F17] font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white bg-[#0B0F17] border border-slate-800'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/60 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-[#C5A059]/10 group flex flex-col justify-between"
          >
            {/* Model Card Image Lockup */}
            <div className="relative aspect-[4/5] bg-black overflow-hidden">
              <img
                src={model.images[0] || '/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg'}
                alt={model.nameAr}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-transparent to-transparent opacity-80" />

              <div className="absolute top-3 left-3 rtl:right-3 rtl:left-auto">
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

            {/* Card Action Buttons (View & Direct Edit) */}
            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                onClick={() => setSelectedModelForDetails(model)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>عرض التفاصيل</span>
              </button>
              <button
                onClick={() => openEditModal(model)}
                className="p-2 bg-[#C5A059]/15 hover:bg-[#C5A059]/25 text-[#E2C785] border border-[#C5A059]/40 rounded-xl transition-colors cursor-pointer"
                title="تعديل بيانات الموديل"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredModels.length === 0 && (
          <div className="col-span-full text-center py-16 text-xs text-slate-500 bg-[#131B26] border border-[#1E293B] rounded-2xl">
            لا توجد موديلات مضافة بعد. اضغط على "إضافة موديل يدوي جديد" للبدء.
          </div>
        )}
      </div>

      {/* Model Full Spec Sheet & Details Modal */}
      {selectedModelForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
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
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
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
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setModelToDelete(selectedModelForDetails)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الموديل</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const m = selectedModelForDetails;
                    setSelectedModelForDetails(null);
                    openEditModal(m);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>تعديل الموديل</span>
                </button>
                <button
                  onClick={() => setSelectedModelForDetails(null)}
                  className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Model Modal */}
      {editingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Edit className="w-4 h-4 text-[#C5A059]" />
                تعديل بيانات وتفاصيل الموديل ({editModelCode})
              </h3>
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">{t.modelCode} *</label>
                  <input
                    type="text"
                    value={editModelCode}
                    onChange={e => setEditModelCode(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">اسم الموديل / التصميم *</label>
                  <input
                    type="text"
                    value={editNameAr}
                    onChange={e => setEditNameAr(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">تصنيف الموديل</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STANDARD_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        editCategory === cat
                          ? 'bg-[#C5A059] text-[#0B0F17] font-bold'
                          : 'bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes and Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">المقاسات المتاحة</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['50', '52', '54', '56', '58', '60', '62', 'Free Size'].map(s => {
                      const isSelected = editSizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditSizes(editSizes.filter(x => x !== s));
                            } else {
                              setEditSizes([...editSizes, s]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]'
                              : 'bg-[#1E293B] text-slate-400 border border-slate-800'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">الألوان (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    value={editColors}
                    onChange={e => setEditColors(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Production and Financials */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">استهلاك القماش (متر)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editFabricConsumption}
                    onChange={e => setEditFabricConsumption(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">أجرة التفصيل (AED)</label>
                  <input
                    type="number"
                    value={editLaborCostEst}
                    onChange={e => setEditLaborCostEst(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سعر الجملة (AED)</label>
                  <input
                    type="number"
                    value={editWholesalePrice}
                    onChange={e => setEditWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#C5A059] mb-1 font-bold">سعر التجزئة (AED) *</label>
                  <input
                    type="number"
                    value={editRetailPrice}
                    onChange={e => setEditRetailPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-[#C5A059] rounded-lg px-3 py-1.5 text-[#E2C785] font-mono font-bold"
                  />
                </div>
              </div>

              {/* Upload New Photos & Videos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                      الصور ({editUploadedImages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => editImageInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + إضافة صور
                    </button>
                    <input
                      ref={editImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleImageFileChange(e, true)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {editUploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 group">
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditUploadedImages(editUploadedImages.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-blue-400" />
                      فيديو العرض ({editUploadedVideos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => editVideoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-blue-500 hover:text-white text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + رفع فيديو
                    </button>
                    <input
                      ref={editVideoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => handleVideoFileChange(e, true)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {editUploadedVideos.map((vid, idx) => (
                      <div key={idx} className="relative px-2 py-1 bg-blue-950/40 border border-blue-500/40 rounded text-[11px] text-blue-300 flex items-center gap-1">
                        <span>فيديو {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setEditUploadedVideos(editUploadedVideos.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Production Notes */}
              <div>
                <label className="block text-slate-400 text-xs mb-1">ملاحظات الباترون والتنفيذ</label>
                <textarea
                  rows={2}
                  value={editProductionNotes}
                  onChange={e => setEditProductionNotes(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setEditingModel(null)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModelEdits}
                className="flex items-center gap-2 px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات في قاعدة البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Model Modal */}
      {isNewModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-[#0F172A]">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                <Shirt className="w-5 h-5 text-[#C5A059]" />
                إضافة موديل يدوي جديد (عباية / شيلة / قفطان / فستان)
              </h3>
              <button
                type="button"
                onClick={() => setIsNewModelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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

              {/* Dynamic Category Selector */}
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

              {/* Sizes and Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">المقاسات المتاحة للتفصيل</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['50', '52', '54', '56', '58', '60', '62', 'Free Size'].map(s => {
                      const isSelected = sizes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSizes(sizes.filter(x => x !== s));
                            } else {
                              setSizes([...sizes, s]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#C5A059]/20 text-[#E2C785] border border-[#C5A059]'
                              : 'bg-[#1E293B] text-slate-400 border border-slate-800'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">الألوان (مفصولة بفاصلة)</label>
                  <input
                    type="text"
                    placeholder="أسود ملكي, كحلي, بيج..."
                    value={colors}
                    onChange={e => setColors(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Media: Photos & Videos & Invoices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Images Upload Box */}
                <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                      معرض الصور ({uploadedImages.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + رفع صور
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleImageFileChange(e, false)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 group">
                        <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages(uploadedImages.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Videos Upload Box */}
                <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-blue-400" />
                      فيديو العرض ({uploadedVideos.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-blue-500 hover:text-white text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + رفع فيديو
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={e => handleVideoFileChange(e, false)}
                    />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {uploadedVideos.map((vid, idx) => (
                      <div key={idx} className="relative px-2 py-1 bg-blue-950/40 border border-blue-500/40 rounded text-[11px] text-blue-300 flex items-center gap-1">
                        <span>فيديو {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setUploadedVideos(uploadedVideos.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Files/Invoices Attachments Box */}
                <div className="p-3 bg-[#131B26] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-[#C5A059]" />
                      الفواتير والمرفقات ({attachments.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-[#1E293B] hover:bg-[#C5A059] hover:text-[#0B0F17] text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      + إضافة فواتير
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => handleAttachmentFileChange(e, false)}
                    />
                  </div>
                  <div className="space-y-1 max-h-16 overflow-y-auto">
                    {attachments.map((att, idx) => (
                      <div key={att.id} className="flex items-center justify-between text-[11px] text-slate-300 bg-[#0B0F17] px-2 py-1 rounded">
                        <span className="truncate max-w-[120px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          className="text-rose-400 hover:text-rose-300 mr-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BOM Materials Selector */}
              <div className="p-4 bg-[#131B26] border border-slate-800 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-[#C5A059]" />
                    قائمة المواد ومكونات التفصيل (BOM Items)
                  </span>
                  <span className="text-slate-400">إجمالي تكلفة المكونات: {bomCost.toFixed(2)} AED</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedInventoryItemId}
                    onChange={e => setSelectedInventoryItemId(e.target.value)}
                    className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="">اختر خامة / زرار / بطانة / خيط من المخزون...</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nameAr} ({item.category}) - تكلفة: {item.unitCost} AED /{item.unit} (متاح: {item.currentStock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="الكمية"
                    value={neededQty}
                    onChange={e => setNeededQty(parseFloat(e.target.value) || 1)}
                    className="w-20 bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddBomItem(false)}
                    className="px-3 py-1.5 bg-[#C5A059] text-[#0B0F17] font-bold rounded-lg hover:bg-[#E2C785] transition-colors"
                  >
                    + إضافة لبند BOM
                  </button>
                </div>

                {bomList.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {bomList.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-[#0B0F17] rounded-lg text-xs font-mono">
                        <span className="font-sans text-white">{b.itemName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">{b.qtyNeeded} {b.unit} × {b.unitCost} AED</span>
                          <span className="text-emerald-400 font-bold">{b.totalCost.toFixed(2)} AED</span>
                          <button
                            type="button"
                            onClick={() => setBomList(bomList.filter((_, i) => i !== idx))}
                            className="text-rose-400 hover:text-rose-300"
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
                    onChange={e => setFabricConsumption(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">أجرة التفصيل والخياط (AED)</label>
                  <input
                    type="number"
                    value={laborCostEst}
                    onChange={e => setLaborCostEst(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">سعر الجملة (AED)</label>
                  <input
                    type="number"
                    value={wholesalePrice}
                    onChange={e => setWholesalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#C5A059] mb-1 font-bold">سعر التجزئة (AED) *</label>
                  <input
                    type="number"
                    value={retailPrice}
                    onChange={e => setRetailPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-[#C5A059] rounded-lg px-3 py-1.5 text-[#E2C785] font-mono font-bold"
                  />
                </div>
              </div>

              {/* Production Notes */}
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
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 p-3 sm:p-4 border-t border-slate-800 shrink-0 bg-[#0A0E17]">
              <button
                type="button"
                onClick={() => setIsNewModelModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveModel}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20 cursor-pointer"
              >
                حفظ وإدراج في الكتالوج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Model Confirmation Modal */}
      {modelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-[#0E1523] border border-rose-500/50 rounded-2xl p-6 text-center text-slate-100 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">تأكيد حذف الموديل</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الموديل <strong className="text-white">({modelToDelete.nameAr} - {modelToDelete.modelCode})</strong> نهائياً من قاعدة البيانات؟
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  await deleteModel(modelToDelete.id);
                  setModelToDelete(null);
                  setSelectedModelForDetails(null);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
              >
                نعم، تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setModelToDelete(null)}
                className="px-4 py-2.5 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
