# PharmaDesk

Offline-first pharmacy POS and inventory management system designed for medical stores.

## Features

- **Fully Offline Operation** - Works without internet connection
- **Fast Billing** - Quick medicine search and billing process
- **Instant Search** - FTS5-powered medicine search (under 50ms)
- **Local Database** - SQLite with better-sqlite3
- **Automatic Reports** - Daily and monthly PDF reports
- **Organized Reports** - Organized in YYYY/MM-MonthName folder structure
- **PDF Viewer** - View reports inside the application
- **Backup System** - Manual and automatic database backups
- **Credit Management** - Track customer credit and repayments

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Fastify
- **Database**: SQLite (better-sqlite3)
- **Desktop**: Tauri
- **Reports**: PDFKit

## Project Structure

```
pharmadesk/
├── frontend/         # React frontend application
├── backend/          # Fastify API server
├── database/         # SQLite database files
├── desktop/          # Tauri desktop app
├── reports/         # Generated PDF reports
├── backups/         # Database backups
├── scripts/         # Utility scripts
└── docs/            # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Rust (for Tauri)
- (Optional) Tauri CLI: `cargo install tauri-cli`

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd frontend && npm install
```

3. Install backend dependencies:
```bash
cd backend && npm install
```

### Running Development Mode

Start both backend and frontend:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```

### Building

Build frontend:
```bash
npm run build:frontend
```

Build backend:
```bash
npm run build:backend
```

Build both:
```bash
npm run build
```

### Desktop Application

Build desktop app (requires Rust and Tauri CLI):
```bash
npm run package
```

Or manually:
```bash
cd desktop
npm run tauri build
```

## Default Credentials

- **Admin**: admin / admin123
- **Staff**: staff / staff123

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Dashboard statistics

### Medicines
- `GET /api/medicines` - List all medicines
- `GET /api/medicines/search?q=` - Search medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id/history` - Customer purchase history
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Bills
- `GET /api/bills` - List bills
- `GET /api/bills/today` - Today's bills
- `GET /api/bills/:id` - Get bill details
- `POST /api/bills` - Create new bill

### Credit
- `POST /api/credit-repayment` - Record credit repayment
- `GET /api/credit-ledger/:customerId` - Credit history

### Reports
- `GET /api/reports/list` - List all reports
- `GET /api/reports/file/:path` - Get report file
- `POST /api/reports/generate-daily/:date` - Generate daily report
- `POST /api/reports/generate-monthly/:year/:month` - Generate monthly report

### Backup
- `POST /api/backup` - Create backup

## Keyboard Shortcuts (Billing POS)

| Action | Shortcut |
|--------|----------|
| Cash Payment | F1 |
| UPI Payment | F2 |
| Credit Payment | F3 |
| Select Customer | F4 |
| Complete Sale | Enter |
| Clear Search | Esc |

## Report Structure

### Daily Reports
- Location: `reports/YYYY/MM-MonthName/YYYY-MM-DD-daily-sales.pdf`
- Contains: Summary + Bill Log

### Monthly Reports
- Location: `reports/YYYY/MM-MonthName/YYYY-MM-monthly-report.pdf`
- Contains: Daily totals, Top medicines, Low stock, Expiring medicines

## Database Schema

### Tables
- users
- customers
- medicines
- suppliers
- purchases
- purchase_items
- bills
- bill_items
- credit_ledger
- reminders
- notifications_log

## License

MIT
