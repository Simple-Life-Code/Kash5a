import React, { useState, useEffect } from 'react';
import { useErp } from '../context/ErpContext';
import { getTranslation } from '../i18n/translations';
import { Account, JournalLine } from '../types/erp';
import {
  Calculator,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scale,
  TrendingUp,
  Landmark,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { registerGlobalModal } from '../hooks/useGlobalNavigation';

export const AccountingView: React.FC = () => {
  const { lang, accounts, journalEntries, postJournalEntry } = useErp();
  const t = getTranslation(lang);

  const [activeSubTab, setActiveSubTab] = useState<'coa' | 'journal' | 'trial' | 'pnl' | 'balanceSheet'>('coa');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  useEffect(() => {
    if (isPostingModalOpen) return registerGlobalModal(() => setIsPostingModalOpen(false));
  }, [isPostingModalOpen]);

  // New Journal Entry Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryReference, setEntryReference] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, memo: '' },
    { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, memo: '' },
  ]);

  const totalDebits = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  const handleLineAccountChange = (index: number, accountId: string) => {
    const acc = accounts.find(a => a.id === accountId || a.code === accountId);
    if (!acc) return;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      accountId: acc.id,
      accountCode: acc.code,
      accountName: lang === 'ar' ? acc.nameAr : lang === 'fr' ? acc.nameFr : acc.nameEn,
    };
    setLines(updated);
  };

  const handleLineValueChange = (index: number, field: 'debit' | 'credit' | 'memo', value: any) => {
    const updated = [...lines];
    if (field === 'debit') {
      updated[index].debit = Number(value) || 0;
      if (Number(value) > 0) updated[index].credit = 0; // standard accounting mutual exclusion
    } else if (field === 'credit') {
      updated[index].credit = Number(value) || 0;
      if (Number(value) > 0) updated[index].debit = 0;
    } else {
      updated[index].memo = value;
    }
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, memo: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSaveEntry = async () => {
    setPostError(null);
    if (!entryDescription.trim()) {
      setPostError('يرجى كتابة بيان ووصف القيد');
      return;
    }
    if (!isBalanced) {
      setPostError('القيد غير متوازن! يجب أن يتساوى إجمالي المدين مع إجمالي الدائن.');
      return;
    }
    const hasEmptyAccount = lines.some(l => !l.accountCode);
    if (hasEmptyAccount) {
      setPostError('يرجى اختيار الحساب لجميع أطراف القيد');
      return;
    }

    const res = await postJournalEntry({
      entryNumber: `JV-${Date.now().toString().slice(-6)}`,
      date: entryDate,
      description: entryDescription,
      referenceType: 'Manual',
      referenceId: entryReference,
      lines,
      totalAmount: totalDebits,
      postedBy: 'المحاسب المالي',
      createdAt: new Date().toISOString(),
    });

    if (res.success) {
      setIsPostingModalOpen(false);
      setEntryDescription('');
      setEntryReference('');
      setLines([
        { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, memo: '' },
        { accountId: '', accountCode: '', accountName: '', debit: 0, credit: 0, memo: '' },
      ]);
    } else {
      setPostError(res.error || 'حدث خطأ أثناء الترحيل');
    }
  };

  // Trial Balance Calculations
  const trialBalanceRows = accounts.map(acc => {
    // Normal balance classification
    const isDebitNormal = ['asset', 'cogs', 'expense'].includes(acc.type);
    const debit = isDebitNormal ? (acc.balance >= 0 ? acc.balance : 0) : (acc.balance < 0 ? Math.abs(acc.balance) : 0);
    const credit = !isDebitNormal ? (acc.balance >= 0 ? acc.balance : 0) : (acc.balance < 0 ? Math.abs(acc.balance) : 0);
    return { ...acc, debit, credit };
  });
  const sumTrialDebits = trialBalanceRows.reduce((s, r) => s + r.debit, 0);
  const sumTrialCredits = trialBalanceRows.reduce((s, r) => s + r.credit, 0);

  // Profit and Loss Calculations
  const revenueTotal = accounts.filter(a => a.type === 'revenue').reduce((s, a) => s + a.balance, 0);
  const cogsTotal = accounts.filter(a => a.type === 'cogs').reduce((s, a) => s + a.balance, 0);
  const grossProfit = revenueTotal - cogsTotal;
  const expenseTotal = accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0);
  const netIncome = grossProfit - expenseTotal;

  // Balance Sheet Calculations
  const assetsTotal = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0);
  const liabilitiesTotal = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0);
  const equityAccountsTotal = accounts.filter(a => a.type === 'equity').reduce((s, a) => s + a.balance, 0);
  const totalEquity = equityAccountsTotal + netIncome; // Retained earnings included

  // Export to Excel Handlers
  const handleExportJournalToExcel = () => {
    if (journalEntries.length === 0) {
      alert('لا توجد قيود يومية مسجلة بعد للتصدير');
      return;
    }
    const rows = journalEntries.flatMap(entry =>
      entry.lines.map(line => ({
        'رقم القيد': entry.entryNumber,
        'التاريخ': entry.date,
        'البيان': entry.description,
        'رقم الحساب': line.accountCode,
        'اسم الحساب': line.accountName,
        'مدين (AED)': Number(line.debit) || 0,
        'دائن (AED)': Number(line.credit) || 0,
        'البيان التفصيلي للسطر': line.memo || '',
        'رقم المرجع': entry.referenceId || '',
        'المُرحّل': entry.postedBy || '',
      }))
    );
    exportToExcel(rows, `قيود_اليومية_العامة_${new Date().toISOString().split('T')[0]}`, 'JournalEntries');
  };

  const handleExportCOAToExcel = () => {
    const rows = accounts.map(acc => ({
      'رمز الحساب': acc.code,
      'اسم الحساب بالعربية': acc.nameAr,
      'اسم الحساب بالإنجليزية': acc.nameEn,
      'النوع': acc.type,
      'طبيعة الرصيد': ['asset', 'cogs', 'expense'].includes(acc.type) ? 'مدين (Debit)' : 'دائن (Credit)',
      'الرصيد الدفتري (AED)': acc.balance,
    }));
    exportToExcel(rows, `شجرة_الحسابات_${new Date().toISOString().split('T')[0]}`, 'ChartOfAccounts');
  };

  const handleExportTrialBalanceToExcel = () => {
    const rows = trialBalanceRows.map(row => ({
      'رمز الحساب': row.code,
      'اسم الحساب': lang === 'ar' ? row.nameAr : row.nameEn,
      'التصنيف': row.type,
      'إجمالي مدين (AED)': row.debit,
      'إجمالي دائن (AED)': row.credit,
    }));
    exportToExcel(rows, `ميزان_المراجعة_${new Date().toISOString().split('T')[0]}`, 'TrialBalance');
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-serif flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-[#C5A059] shrink-0" />
            <span>{t.accounting}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            نظام القيد المزدوج الإماراتي (Double-Entry Bookkeeping): ميزان المراجعة المتطابق، شجرة الحسابات، وقوائم المركز المالي
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (activeSubTab === 'journal') handleExportJournalToExcel();
              else if (activeSubTab === 'trial') handleExportTrialBalanceToExcel();
              else handleExportCOAToExcel();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#131B26] hover:bg-[#1E293B] border border-emerald-500/40 text-emerald-400 text-xs font-medium rounded-xl transition-all shadow-sm"
            title="تصدير السجلات الحالية إلى شيت إكسيل Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>تصدير السجلات (Excel)</span>
          </button>

          <button
            onClick={() => setIsPostingModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] text-xs font-bold rounded-xl transition-all shadow-md shadow-[#C5A059]/10 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.postNewEntry}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1E293B] pb-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('coa')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'coa'
              ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40'
              : 'text-slate-400 hover:text-white hover:bg-[#131B26]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{t.chartOfAccounts}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('journal')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'journal'
              ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40'
              : 'text-slate-400 hover:text-white hover:bg-[#131B26]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t.journalEntries} ({journalEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('trial')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'trial'
              ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40'
              : 'text-slate-400 hover:text-white hover:bg-[#131B26]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t.trialBalance}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pnl')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'pnl'
              ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40'
              : 'text-slate-400 hover:text-white hover:bg-[#131B26]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t.profitAndLoss}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('balanceSheet')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            activeSubTab === 'balanceSheet'
              ? 'bg-[#C5A059]/15 text-[#E2C785] border border-[#C5A059]/40'
              : 'text-slate-400 hover:text-white hover:bg-[#131B26]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>{t.balanceSheet}</span>
        </button>
      </div>

      {/* 1. Chart of Accounts Table */}
      {activeSubTab === 'coa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="البحث بالرمز أو اسم الحساب..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#131B26] border border-[#1E293B] rounded-lg pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {accounts.length} حسابات نشطة
            </span>
          </div>

          <div className="bg-[#131B26] border border-[#1E293B] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[560px] text-xs text-right rtl:text-right">
                <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold text-right">رمز الحساب</th>
                    <th className="py-2.5 px-4 font-semibold text-right">اسم الحساب</th>
                    <th className="py-2.5 px-4 font-semibold text-right">النوع / التبويب</th>
                    <th className="py-2.5 px-4 font-semibold text-right">التصنيف</th>
                    <th className="py-2.5 px-4 font-semibold text-left rtl:text-left">الرصيد الدفتري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-slate-200">
                  {accounts
                    .filter(a =>
                      a.code.includes(searchTerm) ||
                      a.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      a.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(acc => (
                      <tr key={acc.id} className="hover:bg-[#182333] transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#E2C785]">{acc.code}</td>
                        <td className="py-2.5 px-4 font-medium">
                          {lang === 'ar' ? acc.nameAr : lang === 'fr' ? acc.nameFr : acc.nameEn}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {acc.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">{acc.category}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-left rtl:text-left text-white tabular-nums">
                          {acc.balance.toLocaleString()} {t.currency}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. General Journal Table */}
      {activeSubTab === 'journal' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {journalEntries.map(entry => (
              <div key={entry.id} className="bg-[#131B26] border border-[#1E293B] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E293B] pb-2 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-[#E2C785] px-2 py-0.5 rounded bg-[#C5A059]/15 border border-[#C5A059]/30">
                      {entry.entryNumber}
                    </span>
                    <span className="text-slate-400 font-mono">{entry.date}</span>
                    <span className="text-white font-medium">{entry.description}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    رحّله: {entry.postedBy}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-1 px-3 text-right">الحساب</th>
                        <th className="py-1 px-3 text-right">البيان / البيان الفرعي</th>
                        <th className="py-1 px-3 text-left rtl:text-left">مدين (Debit)</th>
                        <th className="py-1 px-3 text-left rtl:text-left">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {entry.lines.map((l, idx) => (
                        <tr key={idx} className="hover:bg-[#182333]/50">
                          <td className="py-1.5 px-3 font-sans text-slate-200">
                            <span className="text-[#E2C785] mr-1.5 font-mono">{l.accountCode}</span>
                            {l.accountName}
                          </td>
                          <td className="py-1.5 px-3 font-sans text-slate-400 text-[11px]">{l.memo || '-'}</td>
                          <td className="py-1.5 px-3 text-left rtl:text-left font-bold text-white tabular-nums">
                            {l.debit > 0 ? `${l.debit.toLocaleString()} ${t.currency}` : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-left rtl:text-left font-bold text-white tabular-nums">
                            {l.credit > 0 ? `${l.credit.toLocaleString()} ${t.currency}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {journalEntries.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-500 bg-[#131B26] border border-[#1E293B] rounded-xl">
                لا توجد قيود يومية عامة مسجلة بعد.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Trial Balance */}
      {activeSubTab === 'trial' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#131B26] border border-[#1E293B] rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#C5A059]" />
                ميزان المراجعة بالأرصدة الدفترية
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تأكيد التوازن المحاسبي للقيد المزدوج: إجمالي المدين = إجمالي الدائن
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${Math.abs(sumTrialDebits - sumTrialCredits) < 0.01 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{Math.abs(sumTrialDebits - sumTrialCredits) < 0.01 ? 'الميزان متطابق ومتوازن 100%' : 'الميزان به فرق'}</span>
            </div>
          </div>

          <div className="bg-[#131B26] border border-[#1E293B] rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[560px] text-xs text-right">
                <thead className="bg-[#0B0F17] text-slate-400 border-b border-[#1E293B]">
                  <tr>
                    <th className="py-2.5 px-4">رمز الحساب</th>
                    <th className="py-2.5 px-4">اسم الحساب</th>
                    <th className="py-2.5 px-4 text-left rtl:text-left">أرصدة مدينة (Debit)</th>
                    <th className="py-2.5 px-4 text-left rtl:text-left">أرصدة دائنة (Credit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-slate-200 font-mono">
                  {trialBalanceRows.map(row => (
                    <tr key={row.id} className="hover:bg-[#182333]">
                      <td className="py-2 px-4 font-bold text-[#E2C785]">{row.code}</td>
                      <td className="py-2 px-4 font-sans font-medium">
                        {lang === 'ar' ? row.nameAr : lang === 'fr' ? row.nameFr : row.nameEn}
                      </td>
                      <td className="py-2 px-4 text-left rtl:text-left tabular-nums text-white">
                        {row.debit > 0 ? `${row.debit.toLocaleString()} ${t.currency}` : '-'}
                      </td>
                      <td className="py-2 px-4 text-left rtl:text-left tabular-nums text-white">
                        {row.credit > 0 ? `${row.credit.toLocaleString()} ${t.currency}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#0B0F17] border-t-2 border-[#C5A059]/40 font-mono font-bold text-sm text-white">
                  <tr>
                    <td colSpan={2} className="py-3 px-4 font-sans text-right">
                      إجمالي ميزان المراجعة العام:
                    </td>
                    <td className="py-3 px-4 text-left rtl:text-left text-[#E2C785] tabular-nums">
                      {sumTrialDebits.toLocaleString()} {t.currency}
                    </td>
                    <td className="py-3 px-4 text-left rtl:text-left text-[#E2C785] tabular-nums">
                      {sumTrialCredits.toLocaleString()} {t.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Profit & Loss Statement */}
      {activeSubTab === 'pnl' && (
        <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl p-6 space-y-6 max-w-3xl mx-auto">
          <div className="text-center border-b border-[#1E293B] pb-4">
            <h3 className="text-lg font-bold text-white font-serif">
              قائمة الأرباح والخسائر (Income Statement / P&L)
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              عن الفترة التشغيلية المنتهية في {new Date().toISOString().split('T')[0]} · جميع المبالغ بـ (AED)
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue */}
            <div>
              <div className="font-bold text-[#E2C785] uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between">
                <span>1. إيرادات المبيعات (Operating Revenue)</span>
                <span className="font-mono">{revenueTotal.toLocaleString()} {t.currency}</span>
              </div>
              <div className="space-y-1.5 pl-4 rtl:pr-4 text-slate-300">
                {accounts.filter(a => a.type === 'revenue').map(a => (
                  <div key={a.id} className="flex justify-between font-mono">
                    <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                    <span>{a.balance.toLocaleString()} {t.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* COGS */}
            <div>
              <div className="font-bold text-rose-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between">
                <span>2. تكلفة البضاعة المصنعة والمباعة (COGS)</span>
                <span className="font-mono">({cogsTotal.toLocaleString()}) {t.currency}</span>
              </div>
              <div className="space-y-1.5 pl-4 rtl:pr-4 text-slate-300">
                {accounts.filter(a => a.type === 'cogs').map(a => (
                  <div key={a.id} className="flex justify-between font-mono">
                    <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                    <span>{a.balance.toLocaleString()} {t.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gross Profit Strip */}
            <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 flex justify-between font-bold text-sm text-white">
              <span>مجمل الربح التشغيلي (Gross Profit):</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                {grossProfit.toLocaleString()} {t.currency}
              </span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="font-bold text-amber-400 uppercase tracking-wider mb-2 border-b border-slate-800 pb-1 flex justify-between">
                <span>3. المصروفات التشغيلية والإدارية (Operating Expenses)</span>
                <span className="font-mono">({expenseTotal.toLocaleString()}) {t.currency}</span>
              </div>
              <div className="space-y-1.5 pl-4 rtl:pr-4 text-slate-300">
                {accounts.filter(a => a.type === 'expense').map(a => (
                  <div key={a.id} className="flex justify-between font-mono">
                    <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                    <span>{a.balance.toLocaleString()} {t.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Income Strip */}
            <div className="p-4 bg-gradient-to-r from-[#0B0F17] via-[#101824] to-[#0B0F17] rounded-xl border-2 border-[#C5A059] flex justify-between font-bold text-base text-white">
              <span className="font-serif">صافي الربح للفترة (Net Profit):</span>
              <span className="font-mono text-[#E2C785] tabular-nums">
                {netIncome.toLocaleString()} {t.currency}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Balance Sheet */}
      {activeSubTab === 'balanceSheet' && (
        <div className="bg-[#131B26] border border-[#1E293B] rounded-2xl p-6 space-y-6 max-w-4xl mx-auto">
          <div className="text-center border-b border-[#1E293B] pb-4">
            <h3 className="text-lg font-bold text-white font-serif">
              الميزانية العمومية والمركز المالي (Balance Sheet)
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              الأصول = الخصوم + حقوق الملكية (Assets = Liabilities + Equity)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Assets */}
            <div className="space-y-3 bg-[#0B0F17] p-4 rounded-xl border border-slate-800">
              <div className="font-bold text-emerald-400 border-b border-slate-800 pb-2 flex justify-between text-sm">
                <span>الأصول (Assets)</span>
                <span className="font-mono">{assetsTotal.toLocaleString()} {t.currency}</span>
              </div>
              <div className="space-y-2 text-slate-300">
                {accounts.filter(a => a.type === 'asset').map(a => (
                  <div key={a.id} className="flex justify-between font-mono">
                    <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                    <span>{a.balance.toLocaleString()} {t.currency}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white font-mono">
                <span>إجمالي الأصول:</span>
                <span>{assetsTotal.toLocaleString()} {t.currency}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="space-y-4">
              {/* Liabilities */}
              <div className="space-y-3 bg-[#0B0F17] p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-rose-400 border-b border-slate-800 pb-2 flex justify-between text-sm">
                  <span>الخصوم والالتزامات (Liabilities)</span>
                  <span className="font-mono">{liabilitiesTotal.toLocaleString()} {t.currency}</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  {accounts.filter(a => a.type === 'liability').map(a => (
                    <div key={a.id} className="flex justify-between font-mono">
                      <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                      <span>{a.balance.toLocaleString()} {t.currency}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-3 bg-[#0B0F17] p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-[#E2C785] border-b border-slate-800 pb-2 flex justify-between text-sm">
                  <span>حقوق الملكية (Equity)</span>
                  <span className="font-mono">{totalEquity.toLocaleString()} {t.currency}</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  {accounts.filter(a => a.type === 'equity').map(a => (
                    <div key={a.id} className="flex justify-between font-mono">
                      <span className="font-sans">{a.code} - {lang === 'ar' ? a.nameAr : a.nameEn}</span>
                      <span>{a.balance.toLocaleString()} {t.currency}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-mono text-emerald-400 font-semibold">
                    <span className="font-sans">صافي أرباح الفترة التشغيلية</span>
                    <span>{netIncome.toLocaleString()} {t.currency}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-white font-mono">
                  <span>إجمالي الخصوم وحقوق الملكية:</span>
                  <span>{(liabilitiesTotal + totalEquity).toLocaleString()} {t.currency}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Balanced Journal Entry Modal */}
      {isPostingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl max-h-[92vh] bg-[#0F172A] border border-[#C5A059]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-[#0B0F17]">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#C5A059]" />
                ترحيل قيد يومية متوازن جديد (Double-Entry General Journal)
              </h3>
              <button
                type="button"
                onClick={() => setIsPostingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {postError && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{postError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">تاريخ القيد</label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">وصف وبيان العملية المالية</label>
                  <input
                    type="text"
                    placeholder="مثال: شراء أقمشة ندى وسداد إيجار الورشة..."
                    value={entryDescription}
                    onChange={e => setEntryDescription(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Journal Lines Table with Horizontal Scroll */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full min-w-[550px] text-xs text-right">
                  <thead className="bg-[#0B0F17] text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">الحساب</th>
                      <th className="py-2.5 px-3">ملاحظة فرعية (Memo)</th>
                      <th className="py-2.5 px-3 text-left rtl:text-left w-28">مدين (Debit)</th>
                      <th className="py-2.5 px-3 text-left rtl:text-left w-28">دائن (Credit)</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-[#131B26]">
                    {lines.map((line, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            value={line.accountId || line.accountCode}
                            onChange={e => handleLineAccountChange(idx, e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                          >
                            <option value="">-- اختر الحساب من شجرة الحسابات --</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.nameAr}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="ملاحظة السطر..."
                            value={line.memo || ''}
                            onChange={e => handleLineValueChange(idx, 'memo', e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={e => handleLineValueChange(idx, 'debit', e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs text-left"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={e => handleLineValueChange(idx, 'credit', e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 rounded px-2 py-1.5 text-white font-mono text-xs text-left"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-slate-500 hover:text-rose-400 font-bold p-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs text-[#C5A059] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  + إضافة طرف قيد جديد
                </button>

                {/* Balance Summary Bar */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 mr-2">إجمالي المدين:</span>
                    <span className="text-white font-bold">{totalDebits.toFixed(2)} AED</span>
                  </div>
                  <div>
                    <span className="text-slate-400 mr-2">إجمالي الدائن:</span>
                    <span className="text-white font-bold">{totalCredits.toFixed(2)} AED</span>
                  </div>
                  <div className={`px-2.5 py-1 rounded text-xs font-sans font-semibold ${isBalanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {isBalanced ? 'متوازن 100%' : `الفرق: ${(totalDebits - totalCredits).toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-slate-800 shrink-0 bg-[#0B0F17]">
              <button
                type="button"
                onClick={() => setIsPostingModalOpen(false)}
                className="px-4 py-2 bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEntry}
                disabled={!isBalanced}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isBalanced
                    ? 'bg-[#C5A059] hover:bg-[#E2C785] text-[#0B0F17] shadow-lg shadow-[#C5A059]/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                ترحيل القيد رسمياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
