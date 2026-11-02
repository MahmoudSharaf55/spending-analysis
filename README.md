# BankIQ – AI-Powered Financial Intelligence & Wealth Platform

A specialized, resilient fintech single-page application built with **Node.js + Express + TypeScript** (backend) and **React + Vite + TypeScript + Recharts** (frontend).

This POC was engineered specifically to handle multi-account, multi-page, multi-table bank statements — validated against the 10-page test fixture `Testing bank statements.pdf`.

---

## 1. Test Statement Structure & Validation

The test fixture (`Testing bank statements.pdf`) contains:
- **10 Pages** covering a full 12-month period: **August 2025 to July 2026**.
- **Currency**: Egyptian Pound (`EGP`).
- **Three Financial Accounts**:
  1. **Current Account** (`10004472183-01`):
     - Beginning Balance: `42,500.00 EGP`
     - Ending Balance: `136,835.00 EGP`
     - Columns: `WITHDRAWAL` (Money Out) | `DEPOSIT` (Money In) | `BALANCE`
     - Transactions: 257 rows
     - **Reconciliation**: 100% reconciled ($42,500.00 + 434,830.00 - 340,495.00 = 136,835.00$)
  2. **Savings Account** (`10004472183-02`):
     - Beginning Balance: `18,000.00 EGP`
     - Ending Balance: `60,058.94 EGP`
     - Columns: `WITHDRAWAL` | `DEPOSIT` | `BALANCE`
     - Transactions: 27 rows
     - **Reconciliation**: 100% reconciled ($18,000.00 + 56,258.94 - 14,200.00 = 60,058.94$)
  3. **Credit Card Account** (`45871129604-03`):
     - Beginning Balance: `3,124.50 EGP` (Debt liability)
     - Ending Balance: `12,253.00 EGP` (Debt liability)
     - Columns: `DEBIT` (Autopay/Payments received: reduces liability) | `CREDIT` (Merchant purchases & interest: increases liability) | `BALANCE`
     - Transactions: 101 rows
     - **Reconciliation**: 100% reconciled ($3,124.50 + 98,853.50 - 89,725.00 = 12,253.00$)
- **Total Transactions Extracted**: **385 transactions** with **zero duplicates** and **zero balance mismatches**.

---

## 2. Key Financial Domain Interpretations

### Multi-Account Debit / Credit Semantics
| Account Type | Column 1 (col1) | Column 2 (col2) | Financial Meaning |
|---|---|---|---|
| **Current Account** | WITHDRAWAL | DEPOSIT | Money leaving (-) vs Money entering (+) |
| **Savings Account** | WITHDRAWAL | DEPOSIT | Transfer to Current (-) vs Transfers in & Credit Interest (+) |
| **Credit Card Account** | DEBIT | CREDIT | Autopay debt settlement (-) vs Purchases & Interest charges (+) |

### Flow Classification (Independent of AI)
- `INCOME`: Salary credits (`SALARY CREDIT - NILE TECH LLC`, 28,500/mo) and Freelance income (`FREELANCE TRANSFER - UPWORK ESCROW`).
- `EXPENSE`: Everyday spending from current account and credit card merchant purchases (Gourmet, Talabat, Uber, B.Tech, etc.).
- `INTERNAL_TRANSFER`: Transfers between Current (`...83-01`) and Savings (`...83-02`). Excluded from spending and income calculations to prevent double-counting.
- `DEBT_PAYMENT`: Credit card autopay settlements (`AUTOPAY RECEIVED - THANK YOU`). Excluded from spending calculations because the individual purchases were already captured.
- `INTEREST_INCOME`: Credit interest earned on savings deposits (`CREDIT INTEREST EARNED`).
- `INTEREST_EXPENSE`: Credit card finance charges (`INTEREST CHARGED ON PURCHASES`). Counted as actual expenses.

---

## 3. Architecture & Service Breakdown

The backend is cleanly structured into decoupled services under `express-app/src/services/`:

1. `statementParser.service.ts`:
   - Extracts structured layout text using layout-aware parsing (`pdftotext -layout` with fallback to `pdf-parse`).
   - Tracks dynamic column positions (`WITHDRAWAL`, `DEPOSIT`, `DEBIT`, `CREDIT`, `BALANCE`) per section header across page breaks.
   - Cross-validates direction using mathematical running balances.
   - Also supports standard bank CSV export parsing.
2. `accountDetector.service.ts`:
   - Detects statement metadata (period, currency) and account section headers.
   - Extracts the statement ending summary table for balance reconciliation.
3. `transactionNormalizer.service.ts`:
   - Normalizes raw extracted rows into canonical `Transaction` objects with unique IDs and validated dates/amounts.
4. `transactionClassifier.service.ts`:
   - Classifies transactions into financial flow types (`INCOME`, `EXPENSE`, `INTERNAL_TRANSFER`, `DEBT_PAYMENT`, `INTEREST_INCOME`, `INTEREST_EXPENSE`).
5. `openRouter.service.ts`:
   - OpenRouter API client for chat completions (`https://openrouter.ai/api/v1`).
   - Privacy-first: Strips account numbers, names, addresses, and balances; sends only transaction description, amount, and flow type in optimized batches.
6. `transactionCategorizer.service.ts`:
   - 3-tier categorization pipeline:
     1. Deterministic rules (transfers, salary, rent, debt payments, interest).
     2. OpenRouter LLM batching with confidence score.
     3. Keyword fallback if OpenRouter is unconfigured or unavailable.
7. `financialAnalysis.service.ts`:
   - Calculates overall summary, spending category breakdown, monthly trends, cash flow, recurring commitments, largest expenses, and account reconciliations.
8. `insightsGenerator.service.ts`:
   - Generates natural language observations and recommendations using OpenRouter (with fallback to analytical heuristics).

---

## 4. Getting Started & Running Locally

### Prerequisites
- Node.js v18+ (tested on Node v22)
- npm

### 1. Install Dependencies
```bash
# Backend dependencies
cd express-app
npm install

# Frontend dependencies
cd ../react-app
npm install
cd ..
```

### 2. Configure Environment (Optional)
In `express-app/.env`:
```env
PORT=5001
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=google/gemini-2.0-flash-001
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```
> **Note**: If `OPENROUTER_API_KEY` is not provided, the application automatically uses deterministic rules and keyword-based fallback with 100% functionality.

### 3. Run Backend & Frontend

#### Terminal 1: Start Backend Server
```bash
cd express-app
npm run dev
# Running on http://localhost:5001
```

#### Terminal 2: Start Frontend App
```bash
cd react-app
npm run dev
# Running on http://localhost:3000
```

### 4. Running the Verification Test
You can run the full end-to-end extraction and reconciliation test directly from the command line:
```bash
cd express-app
npm run test:parse
```

---

## 5. Security & Privacy
- Temporary uploaded files are stored in `os.tmpdir()` and automatically deleted immediately after analysis.
- Bank statement PDFs are never stored on disk permanently.
- No PII (names, account numbers, addresses, balances) is ever transmitted to OpenRouter.
- OpenRouter credentials remain securely on the backend.
