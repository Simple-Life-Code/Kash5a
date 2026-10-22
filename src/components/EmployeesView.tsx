import React, { useState } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { Employee, EmployeeRole } from '../types/erp';
import {
  Users,
  PlusCircle,
  Scissors,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Calendar,
  Phone,
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { lang, employees, productionOrders, createEmployee, postJournalEntry } = useErp();
  const t = getTranslation(lang);

  const [isNewEmpModalOpen, setIsNewEmpModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  // New Employee State
  const [empCode, setEmpCode] = useState(`EMP-${(employees.length + 1).toString().padStart(2, '0')}`);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('Tailor');
  const [phone, setPhone] = useState('+971 50 ');
  const [salaryType, setSalaryType] = useState<'Monthly' | 'PieceRate' | 'Mixed'>('PieceRate');
  const [baseSalary, setBaseSalary] = useState<number>(1500);
  const [pieceRate, setPieceRate] = useState<number>(65);

  const handleSaveEmployee = async () => {
    if (!fullName.trim() || !empCode.trim()) {
      alert('يرجى كتابة الاسم ورقم الموظف');
      return;
    }

    await createEmployee({
      empCode,
      fullName,
      role,
      phone,
      salaryType,
      baseSalary,
      pieceRatePerPiece: pieceRate,
      hireDate: new Date().toISOString().split('T')[0],
      active: true,
      completedPiecesThisMonth: 0,
    });

    setIsNewEmpModalOpen(false);
    setFullName('');
  };

  // Calculate Atelier Total Payroll
  const totalPayrollEst = employees.reduce((sum, emp) => {
    const pieces = emp.completedPiecesThisMonth || 0;
    const pieceEarning = pieces * emp.pieceRatePerPiece;
    return sum + emp.baseSalary + pieceEarning;
  }, 0);

  // Post Monthly Payroll to Double-Entry Accounting
  // Debit 5020 (COGS Direct Labor) = Total Payroll
  // Credit 1020 (Bank NBD) or 2060 (Accrued Wages)
  const handlePostPayrollJournal = async () => {
    const res = await postJournalEntry({
      entryNumber: `PAY-2026-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      description: `صرف مسيرات رواتب وأجور خياطي الورشة لشهر ${new Date().toLocaleDateString('ar-AE', { month: 'long', year: 'numeric' })}`,
      referenceType: 'Payroll',
      totalAmount: totalPayrollEst,
      postedBy: 'مدير الموارد البشرية والمالية',
      createdAt: new Date().toISOString(),
      lines: [
        {
          accountId: '5020',
          accountCode: '5020',
          accountName: 'تكلفة العمالة المباشرة وتفصيل الخياطين',
          debit: totalPayrollEst,
          credit: 0,
          memo: 'استحقاق أجور خياطة وتفصيل العبايات',
        },
        {
          accountId: '1020',
          accountCode: '1020',
          accountName: 'حساب بنك الإمارات دبي الوطني',
          debit: 0,
          credit: totalPayrollEst,
          memo: 'تحويل الرواتب عبر نظام حماية الأجور (WPS)',
        },
      ],
    });

    if (res.success) {
      alert('تم ترحيل مسير رواتب الخياطين بنجاح إلى شجرة الحسابات (القيد متوازن 100%).');
      setIsPayrollModalOpen(false);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Employee Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.employees}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة طاقم الباترون والقص والخياطة، حساب أجور القطعة، ومسيرات رواتب حماية الأجور (WPS)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPayrollModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-[#E2C785] text-xs font-semibold rounded-xl border border-[#C5A059]/40 transition-colors"
          >
            <DollarSign className="w-4 h-4 text-[#C5A059]" />
            <span>مسير الرواتب الشهري</span>
          </button>

          <button
            onClick={() => {
              setEmpCode(`EMP-${(employees.length + 1).toString().padStart(2, '0')}`);
              setIsNewEmpModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة خياط / موظف</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">إجمالي كادر المصنع والورشة:</span>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {employees.length} <span className="text-xs font-sans text-slate-400">فني وموظف</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">قصاصين، خياطين، مطرزين وإدارة</span>
        </div>

        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">إجمالي مستحقات الأجور للشهر الحالي:</span>
          <div className="text-xl font-bold font-mono text-[#E2C785] mt-1 tabular-nums">
            {totalPayrollEst.toLocaleString()} {t.currency}
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">شامل الراتب الأساسي + حوافز القطعة</span>
        </div>

        <div className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4">
          <span className="text-xs text-slate-400">نظام الأجور المتبع:</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            WPS / Piece-Rate
          </div>
          <span className="text-[11px] text-slate-500 block mt-0.5">متوافق مع وزارة الموارد البشرية والتوطين</span>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => {
          const pieces = emp.completedPiecesThisMonth || 0;
          const pieceTotal = pieces * emp.pieceRatePerPiece;
          const totalMonthEarnings = emp.baseSalary + pieceTotal;

          return (
            <div
              key={emp.id}
              className="bg-[#131B26] border border-[#1E293B] hover:border-[#C5A059]/50 rounded-2xl p-5 space-y-4 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0B0F17] text-[#E2C785] border border-slate-800">
                    {emp.empCode}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">
                    {emp.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-[#C5A059] mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{emp.role}</span>
                  </div>
                </div>

                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  emp.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {emp.active ? 'نشط بالورشة' : 'في إجازة'}
                </span>
              </div>

              {/* Compensation details */}
              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>نوع الراتب:</span>
                  <strong className="text-white font-mono">{emp.salaryType}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>الراتب الأساسي:</span>
                  <strong className="text-white font-mono">{emp.baseSalary} AED</strong>
                </div>
                {emp.pieceRatePerPiece > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>أجرة تفصيل القطعة:</span>
                    <strong className="text-[#E2C785] font-mono">{emp.pieceRatePerPiece} AED/قطعة</strong>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold text-white">
                  <span>إجمالي أجر هذا الشهر:</span>
                  <span className="text-emerald-400 font-mono tabular-nums">{totalMonthEarnings.toLocaleString()} AED</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1E293B]">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-mono text-[11px]">{emp.phone}</span>
                </div>
                <span className="text-[10px] text-slate-500">منذ {emp.hireDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#C5A059]" />
                مسير رواتب وأجور خياطي الورشة (Payroll Run)
              </h3>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#131B26] border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-[#0B0F17] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">الاسم / الكود</th>
                    <th className="py-2.5 px-3">الوظيفة</th>
                    <th className="py-2.5 px-3 text-left rtl:text-left">الأساسي</th>
                    <th className="py-2.5 px-3 text-left rtl:text-left">حافز القطعة</th>
                    <th className="py-2.5 px-3 text-left rtl:text-left font-bold text-white">الصافي المستحق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                  {employees.map(emp => {
                    const pieces = emp.completedPiecesThisMonth || 0;
                    const pieceTotal = pieces * emp.pieceRatePerPiece;
                    const total = emp.baseSalary + pieceTotal;
                    return (
                      <tr key={emp.id} className="hover:bg-[#182333]">
                        <td className="py-2 px-3 font-sans">
                          <span className="text-[#E2C785] font-mono mr-1">{emp.empCode}</span> {emp.fullName}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-400">{emp.role}</td>
                        <td className="py-2 px-3 text-left rtl:text-left">{emp.baseSalary} AED</td>
                        <td className="py-2 px-3 text-left rtl:text-left text-slate-400">{pieceTotal} AED</td>
                        <td className="py-2 px-3 text-left rtl:text-left font-bold text-emerald-400">{total} AED</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#0B0F17] border-t-2 border-[#C5A059]/40 text-xs font-bold text-white">
                  <tr>
                    <td colSpan={4} className="py-3 px-3 font-sans text-right">
                      إجمالي مسير الرواتب المستحق الصرف:
                    </td>
                    <td className="py-3 px-3 text-left rtl:text-left font-mono text-[#E2C785] text-sm tabular-nums">
                      {totalPayrollEst.toLocaleString()} {t.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 bg-[#131B26] rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-[#E2C785] font-semibold block">الأثر المحاسبي في القيد المزدوج:</span>
              <p className="text-slate-300">
                • مدين: حساب تكلفة عمالة الورشة (5020 - COGS Labor) بقيمة {totalPayrollEst.toLocaleString()} AED.
                <br />
                • دائن: حساب بنك الإمارات دبي الوطني (1020 - NBD Operating) بقيمة {totalPayrollEst.toLocaleString()} AED.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPayrollModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handlePostPayrollJournal}
                className="flex items-center gap-2 px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وصرف المسير وترحيل القيد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isNewEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#C5A059]" />
                إضافة خياط أو فني جديد للورشة
              </h3>
              <button
                onClick={() => setIsNewEmpModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">الرقم الوظيفي</label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={e => setEmpCode(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">الاسم الكامل</label>
                  <input
                    type="text"
                    placeholder="مثال: محمد عبد الله (معلم خياطة)"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">المسمى الوظيفي / التخصص</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="MasterCutter">كبير الباترونيست والقصاصين</option>
                    <option value="Tailor">معلم خياطة وتجميع عبايات</option>
                    <option value="Embroiderer">فني شك يدوي وتطريز</option>
                    <option value="IronerFinisher">تشطيب وكي وتغليف</option>
                    <option value="Supervisor">مشرف خط الإنتاج</option>
                    <option value="SalesAssociate">بائعة بوتيك</option>
                    <option value="Accountant">محاسب مالي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نظام الراتب</label>
                  <select
                    value={salaryType}
                    onChange={e => setSalaryType(e.target.value as any)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                  >
                    <option value="PieceRate">بالقطعة (Piece)</option>
                    <option value="Monthly">شهري ثابت (Monthly)</option>
                    <option value="Mixed">مختلط (أساسي + قطعة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">الراتب الأساسي (AED)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={e => setBaseSalary(Number(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#C5A059] mb-1 font-semibold">أجرة القطعة (AED)</label>
                  <input
                    type="number"
                    value={pieceRate}
                    onChange={e => setPieceRate(Number(e.target.value) || 0)}
                    className="w-full bg-[#1E293B] border border-[#C5A059] rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewEmpModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEmployee}
                className="px-5 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl shadow-lg shadow-[#C5A059]/20"
              >
                حفظ بيانات الخياط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
