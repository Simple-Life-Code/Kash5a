export type Language = 'ar' | 'en' | 'fr';

export type UserRole =
  | 'SystemAdministrator'
  | 'BusinessManager'
  | 'Accountant'
  | 'SalesRepresentative'
  | 'InventoryManager'
  | 'ProductionSupervisor'
  | 'Tailor'
  | 'Auditor';

export interface Settings {
  companyName: string;
  tradeLicenseNumber?: string;
  trn?: string; // UAE Tax Registration Number (optional / manual input)
  vatRate: number; // 0.05 (5%)
  currency: string; // 'AED'
  address?: string;
  phone?: string;
  email?: string;
  locationUrl?: string;
  isInitialized: boolean;
  updatedAt?: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense';

export interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  type: AccountType;
  category: string;
  balance: number;
  isSystem?: boolean;
  description?: string;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType?: 'Invoice' | 'Payment' | 'Purchase' | 'Production' | 'Manual' | 'Payroll';
  referenceId?: string;
  lines: JournalLine[];
  totalAmount: number;
  postedBy: string;
  createdAt: string;
}

export type GarmentCategory = string; // 'Abaya' | 'Sheila' | 'Kaftan' | 'Jalabiya' | 'Dress' | 'Bisht' or custom
export type ModelStatus = 'Draft' | 'Approved' | 'InProduction' | 'Discontinued';

export interface ModelAttachment {
  id: string;
  name: string;
  url: string;
  type: 'invoice' | 'pdf' | 'image' | 'video' | 'doc';
  size?: string;
  uploadedAt: string;
}

export interface BomItem {
  inventoryItemId: string;
  itemSku: string;
  itemName: string;
  qtyNeeded: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface Model {
  id: string;
  modelCode: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  category: GarmentCategory;
  status: ModelStatus;
  images: string[];
  videos?: string[];
  attachments?: ModelAttachment[];
  sizes: string[]; // e.g. ["52", "54", "56", "58", "60"]
  colors: string[]; // e.g. ["Black", "Onyx", "Emerald Green", "Midnight Blue"]
  fabricConsumptionMeters: number;
  bom: BomItem[];
  productionNotes: string;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  totalCost: number;
  wholesalePrice: number;
  retailPrice: number;
  createdAt: string;
}

export type ProductionStage =
  | 'New'
  | 'Cutting'
  | 'Sewing'
  | 'Embroidery'
  | 'Ironing'
  | 'Ready'
  | 'Delivered';

export interface StageLog {
  stage: ProductionStage;
  timestamp: string;
  performedBy: string;
  notes?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string;
  modelId: string;
  modelCode: string;
  modelName: string;
  customerOrderId?: string;
  customerName?: string;
  quantity: number;
  size: string;
  color: string;
  currentStage: ProductionStage;
  assignedTailor?: string;
  assignedTailorId?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  notes?: string;
  materialsIssued: boolean;
  stageHistory: StageLog[];
  createdAt: string;
  deliveryDate?: string;
}

export type InventoryCategory =
  | 'Fabric'
  | 'Lace_Trim'
  | 'Beads_Crystals'
  | 'Thread_Accessories'
  | 'Packaging'
  | 'Finished_Product';

export interface InventoryItem {
  id: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  category: InventoryCategory;
  unit: string; // 'Meter', 'Yard', 'Roll', 'Piece', 'Pack'
  currentStock: number;
  minStockAlert: number;
  unitCost: number; // AED
  warehouseLocation: string;
  supplierId?: string;
  updatedAt: string;
}

export type MovementType =
  | 'PurchaseReceipt'
  | 'ProductionIssue'
  | 'SalesDelivery'
  | 'Adjustment'
  | 'Return';

export interface StockMovement {
  id: string;
  movementNumber: string;
  itemId: string;
  itemSku: string;
  type: MovementType;
  quantity: number; // positive or negative
  unitCost: number;
  referenceDoc?: string;
  notes?: string;
  userId: string;
  timestamp: string;
}

export interface InvoiceItem {
  modelId: string;
  modelCode: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  vatRate: number; // 0.05
  vatAmount: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerId: string;
  customerName: string;
  saleType: 'Retail' | 'Wholesale';
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'BankTransfer' | 'Credit' | 'Mixed';
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  productionStatus?: string;
  customMeasurements?: {
    length?: number;
    bust?: number;
    sleeves?: number;
    shoulders?: number;
    waist?: number;
    notes?: string;
  };
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  trn?: string;
  type: 'Retail' | 'Wholesale';
  creditLimit: number;
  currentBalance: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  code: string;
  companyName: string;
  contactName?: string;
  phone: string;
  email?: string;
  trn?: string;
  paymentTerms?: string;
  currentBalance: number;
}

export type EmployeeRole =
  | 'MasterCutter'
  | 'Tailor'
  | 'Embroiderer'
  | 'IronerFinisher'
  | 'Accountant'
  | 'SalesAssociate'
  | 'Supervisor'
  | 'Manager';

export interface Employee {
  id: string;
  empCode: string;
  fullName: string;
  role: EmployeeRole;
  phone: string;
  salaryType: 'Monthly' | 'PieceRate' | 'Mixed';
  baseSalary: number;
  pieceRatePerPiece: number;
  hireDate: string;
  active: boolean;
  completedPiecesThisMonth?: number;
}
