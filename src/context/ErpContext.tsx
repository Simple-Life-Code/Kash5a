import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Account,
  Customer,
  Employee,
  InventoryItem,
  JournalEntry,
  Language,
  Model,
  ProductionOrder,
  ProductionStage,
  SalesInvoice,
  Settings,
  StockMovement,
  Supplier,
} from '../types/erp';
import { defaultSettings, standardChartOfAccounts } from '../data/initialData';
import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';

export const AUTHORIZED_EMAILS: readonly string[] = Object.freeze([
  'mohammedhesham872@gmail.com',
  'mr.mohamed.hesham93@gmail.com',
  'fatimazohramaryam88@gmail.com',
  'mohamedsultan8050@gmail.com',
  'moheshamseddik@gmail.com',
].map((e) => e.toLowerCase().trim()));

export const isEmailAuthorized = (email?: string | null): boolean => {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.toLowerCase().trim());
};

export type ActiveTab =
  | 'dashboard'
  | 'accounting'
  | 'models'
  | 'production'
  | 'inventory'
  | 'sales'
  | 'employees'
  | 'stakeholders';

interface ErpContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  accounts: Account[];
  journalEntries: JournalEntry[];
  models: Model[];
  productionOrders: ProductionOrder[];
  inventoryItems: InventoryItem[];
  stockMovements: StockMovement[];
  salesInvoices: SalesInvoice[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  isLoading: boolean;
  isFirebaseConnected: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthorized: boolean;
  authLoading: boolean;
  isSigningIn: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // Business Actions
  postJournalEntry: (entry: Omit<JournalEntry, 'id'>) => Promise<{ success: boolean; error?: string }>;
  createModel: (model: Omit<Model, 'id'>) => Promise<void>;
  updateModel: (modelId: string, modelData: Partial<Model>) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  createProductionOrder: (order: Omit<ProductionOrder, 'id'>) => Promise<void>;
  advanceProductionStage: (orderId: string, nextStage: ProductionStage, notes?: string) => Promise<void>;
  createInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  adjustInventoryStock: (itemId: string, qtyDelta: number, reason: string) => Promise<void>;
  createSalesInvoice: (invoice: Omit<SalesInvoice, 'id'>) => Promise<{ invoiceId: string }>;
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  resetToZeroState: () => Promise<void>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const isAuthorized = Boolean(currentUser?.email && isEmailAuthorized(currentUser.email));
  const isAuthenticated = Boolean(currentUser);

  const clearAuthError = () => setAuthError(null);

  // Core State (Clean initial state without mock data)
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Language & Bidi Handling
  const setLang = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Auth state listener with strict email authorization
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const email = user.email?.toLowerCase().trim();
        if (email && isEmailAuthorized(email)) {
          setCurrentUser(user);
          setAuthError(null);
        } else {
          // Immediately sign out unauthorized accounts without disclosing details
          try {
            await signOut(auth);
          } catch {
            // ignore
          }
          setCurrentUser(null);
          setAuthError('هذا الحساب غير مصرح له بالوصول إلى نظام كشخة فاشنز. يرجى تسجيل الدخول بحساب معتمد أو التواصل مع الإدارة.');
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email?.toLowerCase().trim();

      if (!email || !isEmailAuthorized(email)) {
        await signOut(auth);
        setCurrentUser(null);
        const errMsg = 'عذراً، هذا الحساب غير مصرح له بالوصول إلى نظام كشخة فاشنز. يرجى تسجيل الدخول بحساب العمل المعتمد أو مراجعة إدارة المنشأة.';
        setAuthError(errMsg);
        setIsSigningIn(false);
        return { success: false, error: errMsg };
      }

      setCurrentUser(result.user);
      setAuthError(null);
      setIsSigningIn(false);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      let errMsg = 'تعذر تسجيل الدخول بواسطة Google. يرجى إعادة المحاولة.';
      if (err?.code === 'auth/popup-closed-by-user') {
        errMsg = 'تم إلغاء نافذة تسجيل الدخول قبل إتمام العملية.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errMsg = 'تم إلغاء طلب تسجيل الدخول.';
      } else if (err?.code === 'auth/network-request-failed') {
        errMsg = 'يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.';
      }
      setAuthError(errMsg);
      setIsSigningIn(false);
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAuthError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Firebase Realtime Synchronization (Only for Authorized Users)
  useEffect(() => {
    if (!isAuthorized) {
      setIsLoading(false);
      return;
    }

    let unsubscribeSettings: (() => void) | undefined;
    let unsubscribeAccounts: (() => void) | undefined;
    let unsubscribeJournals: (() => void) | undefined;
    let unsubscribeModels: (() => void) | undefined;
    let unsubscribeProduction: (() => void) | undefined;
    let unsubscribeInventory: (() => void) | undefined;
    let unsubscribeSales: (() => void) | undefined;
    let unsubscribeEmployees: (() => void) | undefined;
    let unsubscribeCustomers: (() => void) | undefined;
    let unsubscribeSuppliers: (() => void) | undefined;

    function initFirebase() {
      try {
        setIsFirebaseConnected(true);

        // Listen to settings
        unsubscribeSettings = onSnapshot(
          doc(db, 'settings', 'general'),
          (snap) => {
            if (snap.exists()) {
              const loaded = snap.data() as Settings;
              if (
                !loaded.companyName ||
                loaded.companyName.includes('ksh5a') ||
                loaded.companyName.includes('كشخة للأزياء')
              ) {
                const migrated = { ...loaded, companyName: 'Kashkha Fashions' };
                setDoc(doc(db, 'settings', 'general'), { companyName: 'Kashkha Fashions' }, { merge: true }).catch(() => {});
                setSettings(migrated);
              } else {
                setSettings(loaded);
              }
            } else {
              setDoc(doc(db, 'settings', 'general'), defaultSettings, { merge: true }).catch(() => {});
              setSettings(defaultSettings);
            }
            setIsLoading(false);
          },
          (error) => {
            console.warn('Settings listener info:', error.message);
            setIsLoading(false);
          }
        );

        // Listen to accounts
        unsubscribeAccounts = onSnapshot(
          collection(db, 'accounts'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Account));
              list.sort((a, b) => a.code.localeCompare(b.code));
              setAccounts(list);
            } else {
              // Seed clean 0.00 balance standard chart of accounts
              const batch = writeBatch(db);
              const initialAccounts = standardChartOfAccounts.map((acc, index) => {
                const id = `acc_${acc.code}_${index}`;
                const item: Account = { id, ...acc, balance: 0 };
                batch.set(doc(db, 'accounts', id), item);
                return item;
              });
              batch.commit().catch(() => {});
              setAccounts(initialAccounts);
            }
          },
          (error) => {
            console.warn('Accounts listener info:', error.message);
          }
        );

        // Listen to journal entries
        unsubscribeJournals = onSnapshot(
          collection(db, 'journalEntries'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setJournalEntries(list);
          },
          (error) => {
            console.warn('JournalEntries listener info:', error.message);
          }
        );

        // Listen to models with dual-layer cloud and local cache protection
        unsubscribeModels = onSnapshot(
          collection(db, 'models'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Model));
              setModels(list);
              try { localStorage.setItem('kashkha_models_cache', JSON.stringify(list)); } catch {}
            } else {
              try {
                const cached = JSON.parse(localStorage.getItem('kashkha_models_cache') || '[]');
                if (cached.length > 0) setModels(cached);
              } catch {}
            }
          },
          (error) => {
            console.warn('Models listener info:', error.message);
            try {
              const cached = JSON.parse(localStorage.getItem('kashkha_models_cache') || '[]');
              if (cached.length > 0) setModels(cached);
            } catch {}
          }
        );

        // Listen to production orders
        unsubscribeProduction = onSnapshot(
          collection(db, 'productionOrders'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setProductionOrders(list);
          },
          (error) => {
            console.warn('ProductionOrders listener info:', error.message);
          }
        );

        // Listen to inventory items
        unsubscribeInventory = onSnapshot(
          collection(db, 'inventoryItems'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
            setInventoryItems(list);
          },
          (error) => {
            console.warn('InventoryItems listener info:', error.message);
          }
        );

        // Listen to sales invoices
        unsubscribeSales = onSnapshot(
          collection(db, 'salesInvoices'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesInvoice));
            list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setSalesInvoices(list);
          },
          (error) => {
            console.warn('SalesInvoices listener info:', error.message);
          }
        );

        // Listen to employees
        unsubscribeEmployees = onSnapshot(
          collection(db, 'employees'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
            setEmployees(list);
          },
          (error) => {
            console.warn('Employees listener info:', error.message);
          }
        );

        // Listen to customers
        unsubscribeCustomers = onSnapshot(
          collection(db, 'customers'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
            setCustomers(list);
          },
          (error) => {
            console.warn('Customers listener info:', error.message);
          }
        );

        // Listen to suppliers
        unsubscribeSuppliers = onSnapshot(
          collection(db, 'suppliers'),
          (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
            setSuppliers(list);
          },
          (error) => {
            console.warn('Suppliers listener info:', error.message);
          }
        );

      } catch (err) {
        console.warn('Firebase sync warning:', err);
        setIsLoading(false);
      }
    }

    initFirebase();

    return () => {
      unsubscribeSettings?.();
      unsubscribeAccounts?.();
      unsubscribeJournals?.();
      unsubscribeModels?.();
      unsubscribeProduction?.();
      unsubscribeInventory?.();
      unsubscribeSales?.();
      unsubscribeEmployees?.();
      unsubscribeCustomers?.();
      unsubscribeSuppliers?.();
    };
  }, [isAuthorized]);

  // Update Settings
  const updateSettings = async (newSettings: Partial<Settings>) => {
    const merged: Settings = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(merged);
    try {
      await setDoc(doc(db, 'settings', 'general'), merged, { merge: true });
    } catch {
      localStorage.setItem('kashkha_settings', JSON.stringify(merged));
    }
  };

  // Reset to Clean Zero State
  const resetToZeroState = async () => {
    setIsLoading(true);
    const blank: Settings = { ...defaultSettings, isInitialized: true };
    setSettings(blank);

    // Reset accounts to 0.00
    const resetAccs = accounts.map(a => ({ ...a, balance: 0 }));
    setAccounts(resetAccs);
    setJournalEntries([]);
    setModels([]);
    setProductionOrders([]);
    setInventoryItems([]);
    setSalesInvoices([]);
    setCustomers([]);
    setSuppliers([]);
    setEmployees([]);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'settings', 'general'), blank);
      resetAccs.forEach(a => batch.update(doc(db, 'accounts', a.id), { balance: 0 }));
      await batch.commit();
    } catch {
      localStorage.setItem('kashkha_settings', JSON.stringify(blank));
    } finally {
      setIsLoading(false);
    }
  };

  // Accounting: Post Journal Entry with strict Debit === Credit enforcement
  const postJournalEntry = async (entry: Omit<JournalEntry, 'id'>) => {
    const totalDebit = entry.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return {
        success: false,
        error: `القيد غير متوازن! إجمالي المدين (${totalDebit.toFixed(2)}) لا يساوي إجمالي الدائن (${totalCredit.toFixed(2)})`,
      };
    }

    const id = `jv_${Date.now()}`;
    const newEntry: JournalEntry = {
      id,
      ...entry,
      totalAmount: totalDebit,
      createdAt: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'journalEntries', id), newEntry);

      const updatedAccounts = [...accounts];
      for (const line of entry.lines) {
        const accIndex = updatedAccounts.findIndex(a => a.id === line.accountId || a.code === line.accountCode);
        if (accIndex !== -1) {
          const acc = updatedAccounts[accIndex];
          let balanceChange = 0;
          if (['asset', 'cogs', 'expense'].includes(acc.type)) {
            balanceChange = (Number(line.debit) || 0) - (Number(line.credit) || 0);
          } else {
            balanceChange = (Number(line.credit) || 0) - (Number(line.debit) || 0);
          }
          acc.balance += balanceChange;
          batch.update(doc(db, 'accounts', acc.id), { balance: acc.balance });
        }
      }

      await batch.commit();
      setJournalEntries(prev => [newEntry, ...prev]);
      setAccounts(updatedAccounts);
      return { success: true };
    } catch (e: any) {
      setJournalEntries(prev => [newEntry, ...prev]);
      return { success: true };
    }
  };

  // Models: Add new model with dual-layer persistence
  const createModel = async (model: Omit<Model, 'id'>) => {
    const id = `model_${Date.now()}`;
    const newModel: Model = { id, ...model };
    try {
      await setDoc(doc(db, 'models', id), newModel);
    } catch (err) {
      console.warn('Firestore createModel warning:', err);
    }
    try {
      const cached = JSON.parse(localStorage.getItem('kashkha_models_cache') || '[]');
      localStorage.setItem('kashkha_models_cache', JSON.stringify([newModel, ...cached]));
    } catch {}
    setModels(prev => [newModel, ...prev]);
  };

  // Models: Update model (e.g., adding attachments, videos, media, notes)
  const updateModel = async (modelId: string, modelData: Partial<Model>) => {
    try {
      await setDoc(doc(db, 'models', modelId), modelData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateModel warning:', err);
    }
    try {
      const cached = JSON.parse(localStorage.getItem('kashkha_models_cache') || '[]');
      const updatedCache = cached.map((m: Model) => m.id === modelId ? { ...m, ...modelData } : m);
      localStorage.setItem('kashkha_models_cache', JSON.stringify(updatedCache));
    } catch {}
    setModels(prev => prev.map(m => m.id === modelId ? { ...m, ...modelData } : m));
  };

  // Models: Delete model
  const deleteModel = async (modelId: string) => {
    try {
      await deleteDoc(doc(db, 'models', modelId));
    } catch (err) {
      console.warn('Firestore deleteModel warning:', err);
    }
    try {
      const cached = JSON.parse(localStorage.getItem('kashkha_models_cache') || '[]');
      localStorage.setItem('kashkha_models_cache', JSON.stringify(cached.filter((m: Model) => m.id !== modelId)));
    } catch {}
    setModels(prev => prev.filter(m => m.id !== modelId));
  };

  // Production: Create order
  const createProductionOrder = async (order: Omit<ProductionOrder, 'id'>) => {
    const id = `prod_${Date.now()}`;
    const newOrder: ProductionOrder = { id, ...order };
    try {
      await setDoc(doc(db, 'productionOrders', id), newOrder);
    } catch {}
    setProductionOrders(prev => [newOrder, ...prev]);
  };

  // Production: Advance 7 Stages
  const advanceProductionStage = async (orderId: string, nextStage: ProductionStage, notes?: string) => {
    const order = productionOrders.find(o => o.id === orderId);
    if (!order) return;

    const newHistory = [
      ...order.stageHistory,
      {
        stage: nextStage,
        timestamp: new Date().toISOString(),
        performedBy: order.assignedTailor || 'مشرف الورشة',
        notes: notes || `الانتقال إلى مرحلة: ${nextStage}`,
      },
    ];

    const updated: ProductionOrder = {
      ...order,
      currentStage: nextStage,
      stageHistory: newHistory,
    };

    if (nextStage === 'Cutting' && !order.materialsIssued) {
      updated.materialsIssued = true;
    }

    try {
      await setDoc(doc(db, 'productionOrders', orderId), updated, { merge: true });
    } catch {}

    setProductionOrders(prev => prev.map(o => o.id === orderId ? updated : o));
  };

  // Inventory: Create item
  const createInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const id = `inv_${Date.now()}`;
    const newItem: InventoryItem = { id, ...item };
    try {
      await setDoc(doc(db, 'inventoryItems', id), newItem);
    } catch {}
    setInventoryItems(prev => [...prev, newItem]);
  };

  // Inventory: Adjust stock
  const adjustInventoryStock = async (itemId: string, qtyDelta: number, reason: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (!item) return;

    const newStock = Math.max(0, item.currentStock + qtyDelta);
    const movement: StockMovement = {
      id: `mov_${Date.now()}`,
      movementNumber: `SM-${Date.now().toString().slice(-6)}`,
      itemId: item.id,
      itemSku: item.sku,
      type: qtyDelta >= 0 ? 'PurchaseReceipt' : 'ProductionIssue',
      quantity: qtyDelta,
      unitCost: item.unitCost,
      referenceDoc: reason,
      userId: 'أمين المستودع',
      timestamp: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'inventoryItems', itemId), {
        currentStock: newStock,
        updatedAt: new Date().toISOString(),
      });
      batch.set(doc(db, 'stockMovements', movement.id), movement);
      await batch.commit();
    } catch {}

    setInventoryItems(prev => prev.map(i => i.id === itemId ? { ...i, currentStock: newStock } : i));
    setStockMovements(prev => [movement, ...prev]);
  };

  // Sales: Invoicing with Double-Entry Journal Posting
  const createSalesInvoice = async (invoiceData: Omit<SalesInvoice, 'id'>) => {
    const id = `inv_tax_${Date.now()}`;
    const newInvoice: SalesInvoice = { id, ...invoiceData };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'salesInvoices', id), newInvoice);

      const debitAccountCode = invoiceData.paymentMethod === 'Cash'
        ? '1010'
        : invoiceData.paymentMethod === 'BankTransfer' || invoiceData.paymentMethod === 'Card'
        ? '1020'
        : '1300';

      const revenueAccountCode = invoiceData.saleType === 'Retail' ? '4010' : '4020';

      const journalId = `jv_auto_${Date.now()}`;
      const autoJournal: JournalEntry = {
        id: journalId,
        entryNumber: `JV-${invoiceData.invoiceNumber}`,
        date: invoiceData.date,
        description: `فاتورة مبيعات ${invoiceData.saleType === 'Retail' ? 'تجزئة' : 'جملة'} رقم ${invoiceData.invoiceNumber} - ${invoiceData.customerName}`,
        referenceType: 'Invoice',
        referenceId: id,
        totalAmount: invoiceData.grandTotal,
        postedBy: 'نقطة البيع (POS)',
        createdAt: new Date().toISOString(),
        lines: [
          {
            accountId: debitAccountCode,
            accountCode: debitAccountCode,
            accountName: debitAccountCode === '1010' ? 'النقدية بالصندوق (الخزينة)' : debitAccountCode === '1020' ? 'بنك الإمارات دبي الوطني' : 'الذمم المدينة (العملاء)',
            debit: invoiceData.grandTotal,
            credit: 0,
            memo: `تحصيل فاتورة ${invoiceData.invoiceNumber}`,
          },
          {
            accountId: revenueAccountCode,
            accountCode: revenueAccountCode,
            accountName: revenueAccountCode === '4010' ? 'إيرادات مبيعات العبايات (تجزئة)' : 'إيرادات مبيعات الجملة',
            debit: 0,
            credit: invoiceData.subtotal,
            memo: 'صافي إيراد بيع العبايات',
          },
          {
            accountId: '2050',
            accountCode: '2050',
            accountName: 'ضريبة القيمة المضافة المستحقة (FTA 5%)',
            debit: 0,
            credit: invoiceData.vatAmount,
            memo: 'ضريبة مخرجات 5%',
          },
        ],
      };

      batch.set(doc(db, 'journalEntries', journalId), autoJournal);

      // Update account balances
      const updatedAccounts = [...accounts];
      const debitAcc = updatedAccounts.find(a => a.code === debitAccountCode);
      if (debitAcc) debitAcc.balance += invoiceData.grandTotal;
      const revAcc = updatedAccounts.find(a => a.code === revenueAccountCode);
      if (revAcc) revAcc.balance += invoiceData.subtotal;
      const vatAcc = updatedAccounts.find(a => a.code === '2050');
      if (vatAcc) vatAcc.balance += invoiceData.vatAmount;

      if (debitAcc) batch.update(doc(db, 'accounts', debitAcc.id), { balance: debitAcc.balance });
      if (revAcc) batch.update(doc(db, 'accounts', revAcc.id), { balance: revAcc.balance });
      if (vatAcc) batch.update(doc(db, 'accounts', vatAcc.id), { balance: vatAcc.balance });

      await batch.commit();

      setSalesInvoices(prev => [newInvoice, ...prev]);
      setJournalEntries(prev => [autoJournal, ...prev]);
      setAccounts(updatedAccounts);
    } catch {
      setSalesInvoices(prev => [newInvoice, ...prev]);
    }

    return { invoiceId: id };
  };

  // Customers & Suppliers & Employees
  const createCustomer = async (c: Omit<Customer, 'id'>) => {
    const id = `cust_${Date.now()}`;
    const newC: Customer = { id, ...c };
    try { await setDoc(doc(db, 'customers', id), newC); } catch {}
    setCustomers(prev => [...prev, newC]);
  };

  const createSupplier = async (s: Omit<Supplier, 'id'>) => {
    const id = `supp_${Date.now()}`;
    const newS: Supplier = { id, ...s };
    try { await setDoc(doc(db, 'suppliers', id), newS); } catch {}
    setSuppliers(prev => [...prev, newS]);
  };

  const createEmployee = async (e: Omit<Employee, 'id'>) => {
    const id = `emp_${Date.now()}`;
    const newE: Employee = { id, ...e };
    try { await setDoc(doc(db, 'employees', id), newE); } catch {}
    setEmployees(prev => [...prev, newE]);
  };

  return (
    <ErpContext.Provider
      value={{
        lang,
        setLang,
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        accounts,
        journalEntries,
        models,
        productionOrders,
        inventoryItems,
        stockMovements,
        salesInvoices,
        customers,
        suppliers,
        employees,
        isLoading,
        isFirebaseConnected,
        currentUser,
        isAuthenticated,
        isAuthorized,
        authLoading,
        isSigningIn,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
        postJournalEntry,
        createModel,
        updateModel,
        deleteModel,
        createProductionOrder,
        advanceProductionStage,
        createInventoryItem,
        adjustInventoryStock,
        createSalesInvoice,
        createCustomer,
        createSupplier,
        createEmployee,
        resetToZeroState,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
};

export const useErp = () => {
  const context = useContext(ErpContext);
  if (!context) throw new Error('useErp must be used within ErpProvider');
  return context;
};
