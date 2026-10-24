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
  updateProductionOrder: (orderId: string, orderData: Partial<ProductionOrder>) => Promise<void>;
  deleteProductionOrder: (orderId: string) => Promise<void>;
  advanceProductionStage: (orderId: string, nextStage: ProductionStage, notes?: string) => Promise<void>;
  createInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (itemId: string, itemData: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  adjustInventoryStock: (itemId: string, qtyDelta: number, reason: string) => Promise<void>;
  createSalesInvoice: (invoice: Omit<SalesInvoice, 'id'>) => Promise<{ invoiceId: string }>;
  createCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (customerId: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (supplierId: string, supplierData: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  createEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (employeeId: string, employeeData: Partial<Employee>) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  resetToZeroState: () => Promise<void>;
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

const getStoredCache = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStoredCache = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

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

  // Multi-tier State with immediate LocalStorage fallback for zero-loss & instant render
  const [settings, setSettings] = useState<Settings>(() => getStoredCache('kashkha_settings_cache', defaultSettings));
  const [accounts, setAccounts] = useState<Account[]>(() => getStoredCache('kashkha_accounts_cache', []));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => getStoredCache('kashkha_journals_cache', []));
  const [models, setModels] = useState<Model[]>(() => getStoredCache('kashkha_models_cache', []));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => getStoredCache('kashkha_orders_cache', []));
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => getStoredCache('kashkha_inventory_cache', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getStoredCache('kashkha_movements_cache', []));
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>(() => getStoredCache('kashkha_invoices_cache', []));
  const [customers, setCustomers] = useState<Customer[]>(() => getStoredCache('kashkha_customers_cache', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStoredCache('kashkha_suppliers_cache', []));
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredCache('kashkha_employees_cache', []));

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
                setStoredCache('kashkha_settings_cache', migrated);
              } else {
                setSettings(loaded);
                setStoredCache('kashkha_settings_cache', loaded);
              }
            } else {
              setDoc(doc(db, 'settings', 'general'), defaultSettings, { merge: true }).catch(() => {});
              setSettings(defaultSettings);
              setStoredCache('kashkha_settings_cache', defaultSettings);
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
              setStoredCache('kashkha_accounts_cache', list);
            } else {
              const cached = getStoredCache<Account[]>('kashkha_accounts_cache', []);
              if (cached.length > 0) {
                setAccounts(cached);
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
                setStoredCache('kashkha_accounts_cache', initialAccounts);
              }
            }
          },
          (error) => {
            console.warn('Accounts listener info:', error.message);
            const cached = getStoredCache<Account[]>('kashkha_accounts_cache', []);
            if (cached.length > 0) setAccounts(cached);
          }
        );

        // Listen to journal entries
        unsubscribeJournals = onSnapshot(
          collection(db, 'journalEntries'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
              list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setJournalEntries(list);
              setStoredCache('kashkha_journals_cache', list);
            } else {
              const cached = getStoredCache<JournalEntry[]>('kashkha_journals_cache', []);
              if (cached.length > 0) setJournalEntries(cached);
            }
          },
          (error) => {
            console.warn('JournalEntries listener info:', error.message);
            const cached = getStoredCache<JournalEntry[]>('kashkha_journals_cache', []);
            if (cached.length > 0) setJournalEntries(cached);
          }
        );

        // Listen to models with dual-layer cloud and local cache protection
        unsubscribeModels = onSnapshot(
          collection(db, 'models'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Model));
              setModels(list);
              setStoredCache('kashkha_models_cache', list);
            } else {
              const cached = getStoredCache<Model[]>('kashkha_models_cache', []);
              if (cached.length > 0) setModels(cached);
            }
          },
          (error) => {
            console.warn('Models listener info:', error.message);
            const cached = getStoredCache<Model[]>('kashkha_models_cache', []);
            if (cached.length > 0) setModels(cached);
          }
        );

        // Listen to production orders
        unsubscribeProduction = onSnapshot(
          collection(db, 'productionOrders'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductionOrder));
              list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setProductionOrders(list);
              setStoredCache('kashkha_orders_cache', list);
            } else {
              const cached = getStoredCache<ProductionOrder[]>('kashkha_orders_cache', []);
              if (cached.length > 0) setProductionOrders(cached);
            }
          },
          (error) => {
            console.warn('ProductionOrders listener info:', error.message);
            const cached = getStoredCache<ProductionOrder[]>('kashkha_orders_cache', []);
            if (cached.length > 0) setProductionOrders(cached);
          }
        );

        // Listen to inventory items
        unsubscribeInventory = onSnapshot(
          collection(db, 'inventoryItems'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
              setInventoryItems(list);
              setStoredCache('kashkha_inventory_cache', list);
            } else {
              const cached = getStoredCache<InventoryItem[]>('kashkha_inventory_cache', []);
              if (cached.length > 0) setInventoryItems(cached);
            }
          },
          (error) => {
            console.warn('InventoryItems listener info:', error.message);
            const cached = getStoredCache<InventoryItem[]>('kashkha_inventory_cache', []);
            if (cached.length > 0) setInventoryItems(cached);
          }
        );

        // Listen to sales invoices
        unsubscribeSales = onSnapshot(
          collection(db, 'salesInvoices'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesInvoice));
              list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
              setSalesInvoices(list);
              setStoredCache('kashkha_invoices_cache', list);
            } else {
              const cached = getStoredCache<SalesInvoice[]>('kashkha_invoices_cache', []);
              if (cached.length > 0) setSalesInvoices(cached);
            }
          },
          (error) => {
            console.warn('SalesInvoices listener info:', error.message);
            const cached = getStoredCache<SalesInvoice[]>('kashkha_invoices_cache', []);
            if (cached.length > 0) setSalesInvoices(cached);
          }
        );

        // Listen to employees
        unsubscribeEmployees = onSnapshot(
          collection(db, 'employees'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Employee));
              setEmployees(list);
              setStoredCache('kashkha_employees_cache', list);
            } else {
              const cached = getStoredCache<Employee[]>('kashkha_employees_cache', []);
              if (cached.length > 0) setEmployees(cached);
            }
          },
          (error) => {
            console.warn('Employees listener info:', error.message);
            const cached = getStoredCache<Employee[]>('kashkha_employees_cache', []);
            if (cached.length > 0) setEmployees(cached);
          }
        );

        // Listen to customers
        unsubscribeCustomers = onSnapshot(
          collection(db, 'customers'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
              setCustomers(list);
              setStoredCache('kashkha_customers_cache', list);
            } else {
              const cached = getStoredCache<Customer[]>('kashkha_customers_cache', []);
              if (cached.length > 0) setCustomers(cached);
            }
          },
          (error) => {
            console.warn('Customers listener info:', error.message);
            const cached = getStoredCache<Customer[]>('kashkha_customers_cache', []);
            if (cached.length > 0) setCustomers(cached);
          }
        );

        // Listen to suppliers
        unsubscribeSuppliers = onSnapshot(
          collection(db, 'suppliers'),
          (snap) => {
            if (!snap.empty) {
              const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Supplier));
              setSuppliers(list);
              setStoredCache('kashkha_suppliers_cache', list);
            } else {
              const cached = getStoredCache<Supplier[]>('kashkha_suppliers_cache', []);
              if (cached.length > 0) setSuppliers(cached);
            }
          },
          (error) => {
            console.warn('Suppliers listener info:', error.message);
            const cached = getStoredCache<Supplier[]>('kashkha_suppliers_cache', []);
            if (cached.length > 0) setSuppliers(cached);
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

  // Production: Create order with dual persistence
  const createProductionOrder = async (order: Omit<ProductionOrder, 'id'>) => {
    const id = `prod_${Date.now()}`;
    const newOrder: ProductionOrder = { id, ...order };
    const updated = [newOrder, ...productionOrders];
    setProductionOrders(updated);
    setStoredCache('kashkha_orders_cache', updated);
    try {
      await setDoc(doc(db, 'productionOrders', id), newOrder);
    } catch (err) {
      console.warn('Firestore createProductionOrder warning:', err);
    }
  };

  // Production: Update order
  const updateProductionOrder = async (orderId: string, orderData: Partial<ProductionOrder>) => {
    const updated = productionOrders.map(o => (o.id === orderId ? { ...o, ...orderData } : o));
    setProductionOrders(updated);
    setStoredCache('kashkha_orders_cache', updated);
    try {
      await setDoc(doc(db, 'productionOrders', orderId), orderData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateProductionOrder warning:', err);
    }
  };

  // Production: Delete order
  const deleteProductionOrder = async (orderId: string) => {
    const updated = productionOrders.filter(o => o.id !== orderId);
    setProductionOrders(updated);
    setStoredCache('kashkha_orders_cache', updated);
    try {
      await deleteDoc(doc(db, 'productionOrders', orderId));
    } catch (err) {
      console.warn('Firestore deleteProductionOrder warning:', err);
    }
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

    const updatedOrder: ProductionOrder = {
      ...order,
      currentStage: nextStage,
      stageHistory: newHistory,
    };

    if (nextStage === 'Cutting' && !order.materialsIssued) {
      updatedOrder.materialsIssued = true;
    }

    const updated = productionOrders.map(o => (o.id === orderId ? updatedOrder : o));
    setProductionOrders(updated);
    setStoredCache('kashkha_orders_cache', updated);

    try {
      await setDoc(doc(db, 'productionOrders', orderId), updatedOrder, { merge: true });
    } catch (err) {
      console.warn('Firestore advanceProductionStage warning:', err);
    }
  };

  // Inventory: Create item with dual persistence
  const createInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const id = `inv_${Date.now()}`;
    const newItem: InventoryItem = { id, ...item };
    const updated = [...inventoryItems, newItem];
    setInventoryItems(updated);
    setStoredCache('kashkha_inventory_cache', updated);
    try {
      await setDoc(doc(db, 'inventoryItems', id), newItem);
    } catch (err) {
      console.warn('Firestore createInventoryItem warning:', err);
    }
  };

  // Inventory: Update item
  const updateInventoryItem = async (itemId: string, itemData: Partial<InventoryItem>) => {
    const updated = inventoryItems.map(i => (i.id === itemId ? { ...i, ...itemData } : i));
    setInventoryItems(updated);
    setStoredCache('kashkha_inventory_cache', updated);
    try {
      await setDoc(doc(db, 'inventoryItems', itemId), itemData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateInventoryItem warning:', err);
    }
  };

  // Inventory: Delete item
  const deleteInventoryItem = async (itemId: string) => {
    const updated = inventoryItems.filter(i => i.id !== itemId);
    setInventoryItems(updated);
    setStoredCache('kashkha_inventory_cache', updated);
    try {
      await deleteDoc(doc(db, 'inventoryItems', itemId));
    } catch (err) {
      console.warn('Firestore deleteInventoryItem warning:', err);
    }
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

    const updatedItems = inventoryItems.map(i => (i.id === itemId ? { ...i, currentStock: newStock } : i));
    const updatedMovements = [movement, ...stockMovements];
    setInventoryItems(updatedItems);
    setStockMovements(updatedMovements);
    setStoredCache('kashkha_inventory_cache', updatedItems);
    setStoredCache('kashkha_movements_cache', updatedMovements);

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'inventoryItems', itemId), {
        currentStock: newStock,
        updatedAt: new Date().toISOString(),
      });
      batch.set(doc(db, 'stockMovements', movement.id), movement);
      await batch.commit();
    } catch (err) {
      console.warn('Firestore adjustInventoryStock warning:', err);
    }
  };

  // Sales: Invoicing with Double-Entry Journal Posting
  const createSalesInvoice = async (invoiceData: Omit<SalesInvoice, 'id'>) => {
    const id = `inv_tax_${Date.now()}`;
    const newInvoice: SalesInvoice = { id, ...invoiceData };

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

    const updatedInvoices = [newInvoice, ...salesInvoices];
    const updatedJournals = [autoJournal, ...journalEntries];
    const updatedAccounts = [...accounts];
    const debitAcc = updatedAccounts.find(a => a.code === debitAccountCode);
    if (debitAcc) debitAcc.balance += invoiceData.grandTotal;
    const revAcc = updatedAccounts.find(a => a.code === revenueAccountCode);
    if (revAcc) revAcc.balance += invoiceData.subtotal;
    const vatAcc = updatedAccounts.find(a => a.code === '2050');
    if (vatAcc) vatAcc.balance += invoiceData.vatAmount;

    setSalesInvoices(updatedInvoices);
    setJournalEntries(updatedJournals);
    setAccounts(updatedAccounts);
    setStoredCache('kashkha_invoices_cache', updatedInvoices);
    setStoredCache('kashkha_journals_cache', updatedJournals);
    setStoredCache('kashkha_accounts_cache', updatedAccounts);

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'salesInvoices', id), newInvoice);
      batch.set(doc(db, 'journalEntries', journalId), autoJournal);
      if (debitAcc) batch.update(doc(db, 'accounts', debitAcc.id), { balance: debitAcc.balance });
      if (revAcc) batch.update(doc(db, 'accounts', revAcc.id), { balance: revAcc.balance });
      if (vatAcc) batch.update(doc(db, 'accounts', vatAcc.id), { balance: vatAcc.balance });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore createSalesInvoice warning:', err);
    }

    return { invoiceId: id };
  };

  // Customers: Create, Update, Delete with dual persistence
  const createCustomer = async (c: Omit<Customer, 'id'>) => {
    const id = `cust_${Date.now()}`;
    const newC: Customer = { id, ...c };
    const updated = [newC, ...customers];
    setCustomers(updated);
    setStoredCache('kashkha_customers_cache', updated);
    try {
      await setDoc(doc(db, 'customers', id), newC);
    } catch (err) {
      console.warn('Firestore createCustomer warning:', err);
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    const updated = customers.map(c => (c.id === customerId ? { ...c, ...customerData } : c));
    setCustomers(updated);
    setStoredCache('kashkha_customers_cache', updated);
    try {
      await setDoc(doc(db, 'customers', customerId), customerData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateCustomer warning:', err);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    setStoredCache('kashkha_customers_cache', updated);
    try {
      await deleteDoc(doc(db, 'customers', customerId));
    } catch (err) {
      console.warn('Firestore deleteCustomer warning:', err);
    }
  };

  // Suppliers: Create, Update, Delete with dual persistence
  const createSupplier = async (s: Omit<Supplier, 'id'>) => {
    const id = `supp_${Date.now()}`;
    const newS: Supplier = { id, ...s };
    const updated = [newS, ...suppliers];
    setSuppliers(updated);
    setStoredCache('kashkha_suppliers_cache', updated);
    try {
      await setDoc(doc(db, 'suppliers', id), newS);
    } catch (err) {
      console.warn('Firestore createSupplier warning:', err);
    }
  };

  const updateSupplier = async (supplierId: string, supplierData: Partial<Supplier>) => {
    const updated = suppliers.map(s => (s.id === supplierId ? { ...s, ...supplierData } : s));
    setSuppliers(updated);
    setStoredCache('kashkha_suppliers_cache', updated);
    try {
      await setDoc(doc(db, 'suppliers', supplierId), supplierData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateSupplier warning:', err);
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    const updated = suppliers.filter(s => s.id !== supplierId);
    setSuppliers(updated);
    setStoredCache('kashkha_suppliers_cache', updated);
    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
    } catch (err) {
      console.warn('Firestore deleteSupplier warning:', err);
    }
  };

  // Employees: Create, Update, Delete with dual persistence
  const createEmployee = async (e: Omit<Employee, 'id'>) => {
    const id = `emp_${Date.now()}`;
    const newE: Employee = { id, ...e };
    const updated = [newE, ...employees];
    setEmployees(updated);
    setStoredCache('kashkha_employees_cache', updated);
    try {
      await setDoc(doc(db, 'employees', id), newE);
    } catch (err) {
      console.warn('Firestore createEmployee warning:', err);
    }
  };

  const updateEmployee = async (employeeId: string, employeeData: Partial<Employee>) => {
    const updated = employees.map(e => (e.id === employeeId ? { ...e, ...employeeData } : e));
    setEmployees(updated);
    setStoredCache('kashkha_employees_cache', updated);
    try {
      await setDoc(doc(db, 'employees', employeeId), employeeData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateEmployee warning:', err);
    }
  };

  const deleteEmployee = async (employeeId: string) => {
    const updated = employees.filter(e => e.id !== employeeId);
    setEmployees(updated);
    setStoredCache('kashkha_employees_cache', updated);
    try {
      await deleteDoc(doc(db, 'employees', employeeId));
    } catch (err) {
      console.warn('Firestore deleteEmployee warning:', err);
    }
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
        updateProductionOrder,
        deleteProductionOrder,
        advanceProductionStage,
        createInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        adjustInventoryStock,
        createSalesInvoice,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        createEmployee,
        updateEmployee,
        deleteEmployee,
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
