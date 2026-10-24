# Kashkha Fashion – Abaya Factory & Clothing ERP/POS (Phase 1: Architecture & Specification)

Production-grade ERP & POS system designed specifically for haute couture abaya and fashion ateliers in the United Arab Emirates (UAE). The platform provides end-to-end operational governance spanning double-entry bookkeeping (AED / UAE VAT), atelier production workflow stages (Cutting, Sewing, Embroidery, Ironing, Ready, Delivered), bill of materials (BOM), raw fabric and accessories warehouse tracking, point of sale, customer/supplier ledgers, and staff payroll.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were selected during Phase 1 interactive alignment:

- **Confirmed Decision 1 (Persistence & Database)**: Firebase Firestore configured with strict server-side Attribute-Based Access Control (ABAC) Security Rules (`firestore.rules`), atomic `WriteBatch`/`runTransaction` primitives for financial integrity, and document schemas documented in `firebase-blueprint.json`.
- **Confirmed Decision 2 (Initial State & Setup)**: Clean zero-state on initial launch paired with a guided multi-step Onboarding & Atelier Setup Wizard (allowing seamless configuration of factory locations, initial UAE VAT settings, chart of accounts initialization, and optional demo dataset injection).
- **Confirmed Decision 3 (Homepage Architecture & Layout)**: Dense enterprise ERP dashboard with immediate live metric feeds, partitioned into distinct executive departmental hubs:
  1. **Accounting & Bookkeeping** (المحاسبة والمالية / Comptabilité)
  2. **Models & Product Catalog** (الموديلات والكتالوج / Modèles & Créations)
  3. **Employees & Production Labor** (الموظفين والأجور / Personnel & RH)
  4. **Atelier Production & Manufacturing Stages** (الإنتاج وورش العمل / Atelier de Production)
  5. **Sales, POS & Invoicing** (المبيعات ونقاط البيع / Ventes & Facturation)
  6. **Inventory, Fabrics & Warehouse** (المستودع والمخزون / Stock & Matières)
  7. **Customers & Suppliers** (العملاء والموردون / Clients & Fournisseurs)
  8. **UAE VAT & Executive Reports** (الضرائب والتقارير المالية / TVA EAU & Rapports)
- **Confirmed Decision 4 (Localization & Multilingualism)**: Complete tri-lingual support: **العربية (Arabic - RTL default)**, **English (LTR)**, and **Français (French - LTR)**, with reactive bidirectional layout flipping, localized calendar/date formatting, and AED currency formatting.
- **Confirmed Decision 5 (Visual Identity)**: Direct derivation from the provided Kashkha Fashion logo (`/public/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg`): Royal deep charcoal/onyx backdrop, warm polished antique gold (`#C5A059` / `#D4AF37`), subtle champagne ivory surface fills, crisp hairline framing, and luxury fashion atelier typography.

---

## 1. Overview & Core Concept

- **What It Does**: A complete, audit-grade enterprise management application built for luxury Emirati abaya manufacturing, wholesale distribution, and bespoke/retail boutique sales.
- **Target Audience / Roles**:
  - *Business Owners & General Managers*: Real-time cash position, gross profit, production throughput, and VAT obligations.
  - *Chief Accountants*: Chart of accounts, general ledger, trial balance, P&L, balance sheet, customer/vendor aging.
  - *Production Supervisors & Tailors*: Abaya production orders across 7 stages (New Order $\to$ Cutting $\to$ Sewing $\to$ Embroidery $\to$ Ironing & Packaging $\to$ Ready $\to$ Delivered).
  - *Store Associates & POS Cashiers*: Rapid barcode/catalog POS terminal, split AED payments (Cash, Card, Bank Transfer, Deposit), and UAE VAT compliance.
  - *Inventory Managers*: Fabric rolls (by meters/yards), laces, beads, thread cones, and finished abayas with automated weighted average costing.
  - *HR & Workshop Managers*: Tailor piece-rates, monthly salaries, advances, and labor cost allocation per abaya model.
- **Key Value**: Eradicates disconnected spreadsheets and unverified manual notes by unifying production job tickets directly with warehouse inventory deductions and double-entry general journal postings.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Executive Departmental Hub (Homepage)**:
   - High-density top bar displaying current atelier status, active exchange rates (fixed AED), quick action switcher, language selector (`AR` / `EN` / `FR`), and user profile/role badge.
   - Primary KPI summary strip: Today's Gross Sales, Pending Workshop Workload (Pieces in Cutting/Sewing/Embroidery), Low Fabric Alerts, and Net Vat Payable (FTA-compliant 5%).
   - Modular Department Cards: Direct navigation with live counts into Accounting, Models, Employees, Production, POS/Sales, Warehouse, and Stakeholders.
2. **Abaya Model Catalog & BOM Designer**:
   - High-fashion model cards with gallery view, model code (e.g., `KSH-2026-AB01`), design status (Draft, Approved, In Production, Discontinued).
   - Technical Spec Sheet: Fabric breakdown (e.g., 3.5m Salona / Nada Crepe, 1.2m French lace trim), estimated cutting/sewing hours, target retail price, and automated unit margin calculation.
3. **Atelier Production Kanban & Job Tickets**:
   - 7 sequential swimlanes: New Order $\to$ Cutting $\to$ Sewing $\to$ Embroidery $\to$ Ironing $\to$ Quality Control / Ready $\to$ Delivered.
   - Stage transitions enforce material consumption and record assignees, timestamps, and quality check sign-offs.
4. **Sales & POS Terminal**:
   - Dual-mode interface (Fast Boutique Retail vs. Wholesale Bulk Orders).
   - Custom abaya measurements input (Length, Bust, Sleeve, Shoulder, Waist) attached to order lines.
   - Tax invoice generation with QR code compliance, Arabic/English/French printable invoices, and PDF export.
5. **Double-Entry General Ledger & Financial Center**:
   - Interactive Chart of Accounts (Assets, Liabilities, Equity, Revenue, COGS, Expenses).
   - General Journal entry creation with strict validation: $\sum \text{Debits} = \sum \text{Credits}$.
   - Real-time Trial Balance, Income Statement (P&L), and Balance Sheet reports generated dynamically from posted entries.

### Visual Identity & Theme Tokens

Rooted in the royal metallic gold emblem and flowing abaya silhouette of the Kashkha Fashion mark:

```
Canvas / Neutral Ground:   #0B0F17 (Deep Onyx / Midnight Charcoal)
Surface Elevation 1:      #131B26 (Subtle Navy Slate)
Surface Elevation 2:      #1A2433 (Muted Atelier Border & Hover)
Brand Primary Gold:       #C5A059 (Antique Emirati Gold)
Brand Accent Highlight:   #E2C785 (Bright Champagne Gold)
Text Primary:             #F8FAFC (Clean High-Contrast White)
Text Secondary / Muted:   #94A3B8 (Sophisticated Slate)
Success / Nominal:        #10B981 (Emerald)
Warning / Inspection:     #F59E0B (Amber Gold)
Critical / Alert:         #EF4444 (Crimson)
```

- **Typography**:
  - Arabic Display & Navigation: *Noto Kufi Arabic* / *Amiri* / *Cairo* (balanced, geometric luxury feel).
  - English & French Display: *Playfair Display* / *Plus Jakarta Sans* (editorial haute couture elegance).
  - Financial Data & Metric Displays: `font-mono tabular-nums` for rock-solid tabular alignment of AED currencies, quantities, and dates.
- **RTL/LTR Bidi Engine**: Native dynamic document direction switching (`dir="rtl"` for Arabic, `dir="ltr"` for English and French) with mirroring of navigation grids, table alignments, and icon placements.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Persistence Architecture (Firestore + Atomic Client Batches)
- **Chosen Approach**: Firestore collections managed with Firestore SDK `WriteBatch` and `runTransaction` blocks.
- **Why**: Allows instant real-time sync across workshop tablets, front-desk POS terminals, and executive laptops without maintaining a standalone websocket cluster.
- **Trade-Off**: Firestore does not have SQL foreign key constraints or server-side JOINs. Consistency between the sales ledger, stock movements, and journal entries is guaranteed by atomic multi-document transaction batches on write and schema validation helpers in `firestore.rules`.

### Decision 2: Double-Entry Ledger Invariants
- **Chosen Approach**: Ledger entries are **immutable once posted**. No destructive deletions or silent in-place edits. Corrections require reversal documents or adjustment journals with reference IDs.
- **Why**: Mandatory for UAE Federal Tax Authority (FTA) audit readiness and genuine commercial bookkeeping integrity.

### Decision 3: Zero-State with Guided Onboarding
- **Chosen Approach**: On first boot, provide an atelier onboarding wizard:
  1. Atelier details (Trade Name, TRN - Tax Registration Number, Location: Dubai/Abu Dhabi/Sharjah).
  2. Standard UAE Chart of Accounts generation (Assets, Liabilities, Equity, Sales, COGS, VAT Output, VAT Input).
  3. Option to load curated haute couture sample data (Sample Abayas, Japanese Nada fabric, pearl beads, tailor profiles, and active orders) or start completely blank.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KASHKHA FASHION CLIENT                          │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             Top Bar: Language (AR/EN/FR) · Role · Quick Actions│   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                  │                                     │
│   ┌──────────────────────────────┴─────────────────────────────────┐   │
│   │             Executive Departmental Hub & Live Metrics          │   │
│   │  [Accounting]  [Catalog]  [Production]  [Inventory]  [Sales]   │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │   Operational Modules: POS, Stage Kanban, BOM, Ledger, Payroll │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │  Core Services & Consistency Layer       │
              │  - AccountingEngine (Balanced Debits/Cr) │
              │  - InventoryEngine (Weighted Avg Cost)   │
              │  - ProductionPipeline (Strict 7-Stages)   │
              │  - LocalizationEngine (AR/EN/FR + Bidi)  │
              └────────────────────┬─────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │  Firestore Security Rules (ABAC / ABAC)   │
              │  - Master Gate Identity & Role Guards    │
              │  - ValidId / ValidEntity Schema Helpers  │
              │  - Atomic write batch assertions         │
              └────────────────────┬─────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │           Cloud Firestore Database       │
              │  /accounts        /journalEntries        │
              │  /models          /productionOrders      │
              │  /inventoryItems  /stockMovements        │
              │  /salesInvoices   /customers             │
              │  /purchaseOrders  /suppliers             │
              │  /employees       /payrollPeriods        │
              └──────────────────────────────────────────┘
```

### Core Database Entities

| Collection | Key Fields | Description |
| :--- | :--- | :--- |
| `accounts` | `code`, `name`, `type` (asset/liability/equity/revenue/expense), `category`, `balance`, `currency` | Standard Chart of Accounts (COA) |
| `journalEntries` | `entryNumber`, `date`, `description`, `referenceType`, `referenceId`, `lines: [{accountId, debit, credit, memo}]`, `postedBy`, `createdAt` | Immutable double-entry general journal |
| `models` | `modelCode`, `name`, `category` (Abaya, Kaftan, Hijab, Jalabiya), `images: []`, `status` (Draft/Approved/InProduction/Discontinued), `bom: [{itemId, qtyNeeded, unit}]`, `laborCostEst`, `materialCostEst`, `wholesalePrice`, `retailPrice` | Model and garment catalog |
| `productionOrders` | `orderNumber`, `modelId`, `qty`, `stage` (New/Cutting/Sewing/Embroidery/Ironing/Ready/Delivered), `assignedTo`, `customerOrderId`, `actualMaterials: []`, `statusLog: []` | 7-stage manufacturing workflow |
| `inventoryItems` | `sku`, `name`, `category` (Fabric, Trim, Bead, Packaging, Finished), `unit` (meter, piece, roll, kg), `currentStock`, `minStock`, `unitCost` (weighted avg), `location` | Warehouse stock catalog |
| `stockMovements` | `movementNumber`, `itemId`, `type` (Receipt, Issue_Production, Adjustment, Return), `quantity`, `unitCost`, `sourceDocRef`, `createdAt`, `userId` | Audit subledger for inventory changes |
| `salesInvoices` | `invoiceNumber`, `customerId`, `type` (Retail, Wholesale), `lines: [{modelId, size, color, qty, unitPrice, vatRate, vatAmount, total}]`, `subtotal`, `vatTotal`, `grandTotal`, `paidAmount`, `paymentStatus` (Pending/Partial/Paid), `productionStatus` | Sales, POS & Tax Invoices |
| `customers` | `code`, `name`, `phone`, `email`, `trn`, `type` (Retail, Wholesale), `creditLimit`, `currentBalance` | Client profiles & AR subledger |
| `suppliers` | `code`, `companyName`, `contactName`, `phone`, `trn`, `paymentTerms`, `currentBalance` | Fabric mills & supplier profiles |
| `purchaseOrders` | `poNumber`, `supplierId`, `date`, `items: []`, `subtotal`, `vatAmount`, `total`, `status` (Draft, Ordered, Received, Paid) | Inventory purchase documents |
| `employees` | `empCode`, `fullName`, `role` (Tailor, Cutter, Embroiderer, Ironer, Accountant, Sales, Manager), `salaryType` (Monthly, PieceRate), `baseSalary`, `pieceRatePerUnit` | Staff & atelier personnel |
| `payrollPeriods` | `period`, `records: [{empId, regularPay, pieceRatePay, advances, deductions, netPay}]`, `totalPayroll`, `status` | Monthly payroll runs |
| `settings` | `companyName`, `taxRegistrationNumber`, `vatRate` (0.05), `currency` (AED), `atelierAddress`, `isInitialized` | Factory & system configurations |

---

## 5. Phased Implementation Roadmap & Acceptance Criteria

### Phase 1: Architecture, Blueprint & Project Foundation
- **Deliverables**:
  - System architecture document (`implementation_plan.md`).
  - `firebase-blueprint.json` defining all entity schemas and Firestore paths.
  - Setup of Firebase connection via `set_up_firebase` tool.
  - Brand visual identity integration (Logo display, Gold/Onyx color tokens, typography, clean Tailwind design system).
  - Multilingual localization dictionary (`ar`, `en`, `fr`) with RTL/LTR bidi switching.
  - Initial Guided Setup Wizard (Atelier profile, VAT config, Chart of Accounts initializer).
- **Acceptance Criteria**:
  - Zero compilation or TypeScript errors.
  - Switching between Arabic, English, and French instantly updates all strings and layout direction.
  - Logo asset loads cleanly from `/public/assets/aistudio/WhatsApp_Image_2026-10-20_at_12.35.18_PM_7bcbc7c9.jpeg`.

### Phase 2: Double-Entry Accounting & Financial Ledger Engine
- **Deliverables**:
  - Chart of Accounts manager with hierarchical views (1000 Assets, 2000 Liabilities, 3000 Equity, 4000 Revenue, 5000 COGS, 6000 Operating Expenses).
  - General Journal posting interface with client & server-side verification: $\sum \text{Debits} = \sum \text{Credits}$.
  - Trial Balance generator dynamically calculating period balances.
  - Real-time Balance Sheet and Profit & Loss (P&L) statements.
  - UAE 5% VAT report with Box 1 (Standard Rated Supplies) and Box 9 (Recoverable Input Tax).
- **Acceptance Criteria**:
  - Unbalanced entries cannot be submitted.
  - Every sales invoice or inventory purchase atomically triggers the matching journal entry.

### Phase 3: Abaya Model Catalog & Bill of Materials (BOM)
- **Deliverables**:
  - Abaya Model creation form: Model code, name, category, design sketches/photos, size chart (52, 54, 56, 58, 60), color variants.
  - Bill of Materials (BOM) builder: specify required fabrics (Nada, Salona, Chiffon, Silk) and trims (lace, Swarovski crystals, buttons, zippers).
  - Automated Cost Estimator (Material cost + estimated tailor hours = standard unit cost).
- **Acceptance Criteria**:
  - Adding a model records all BOM lines and displays estimated margins against wholesale and retail prices.

### Phase 4: Atelier Manufacturing & 7-Stage Production Tracking
- **Deliverables**:
  - Production Order generator linked to customer orders or stock replenishments.
  - Interactive 7-Stage Atelier Kanban:
    1. *New Order* $\to$ 2. *Cutting* $\to$ 3. *Sewing* $\to$ 4. *Embroidery* $\to$ 5. *Ironing & Packaging* $\to$ 6. *Ready* $\to$ 7. *Delivered*.
  - Raw material consumption issuance: Deducts required fabrics/accessories from warehouse inventory on cutting stage initiation.
  - Rejection and rework recording with tailor notes and defect classification.
- **Acceptance Criteria**:
  - Orders cannot jump backwards or skip mandatory quality stages.
  - Stock is deducted exactly once per production run.

### Phase 5: Sales, POS, Customers & Invoicing
- **Deliverables**:
  - Fast POS Terminal for boutique sales (barcode/code lookup, size selection, custom tailoring measurements).
  - Wholesale Order builder with custom credit terms and customer balance checking.
  - UAE Tax Invoice printing and export with bilingual Arabic/English/French layout, QR code, and TRN display.
  - Customer Accounts Receivable (AR) subledger with statement of account.
- **Acceptance Criteria**:
  - Cash, card, and credit payments correctly update both customer balances and General Ledger cash accounts.

### Phase 6: Warehouse Inventory, Purchasing, Payroll & Executive Polish
- **Deliverables**:
  - Inventory management for fabrics, trims, and finished abayas with weighted average cost calculation.
  - Purchase Orders, Goods Receipt Notes (GRN), and Supplier Accounts Payable (AP).
  - Employee profiles with tailor piece-rate tracking and monthly payroll generation.
  - Executive Dashboard with live operational metrics, cash position, workshop bottlenecks, and stock alerts.
  - Full data backup export (JSON format) and secure restore runner.
- **Acceptance Criteria**:
  - Production labor correctly calculates piece-rate wages based on completed workshop stages.
  - Full end-to-end audit trail verification across all modules.

---

## 6. External Services & Setup Steps Required

1. **Firebase Project Setup**:
   - Call `set_up_firebase` tool to provision Firestore and Auth.
   - Configure `firestore.rules` based on the ABAC security specification.
   - Verify rules via ESLint and security testing.
2. **UAE Localization Packages**:
   - Font loading for Noto Kufi Arabic, Cairo, and Playfair Display via Google Fonts.
   - Lucide icons for atelier tools (Scissors, Needle/Thread, Sparkles, Receipt, Calculator, Users).
