# 🏥 MediStore - Pharmacy Management System

<div align="center">

![MediStore Logo](https://img.shields.io/badge/MediStore-Pharmacy%20Management-blue?style=for-the-badge&logo=medical)
[![GitHub stars](https://img.shields.io/github/stars/NIRU0802/MediStore?style=for-the-badge&logo=github)](https://github.com/NIRU0802/MediStore/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/NIRU0802/MediStore?style=for-the-badge&logo=github)](https://github.com/NIRU0802/MediStore/network)
[![GitHub issues](https://img.shields.io/github/issues/NIRU0802/MediStore?style=for-the-badge&logo=github)](https://github.com/NIRU0802/MediStore/issues)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative)](LICENSE)

**A modern, offline-first pharmacy POS and inventory management system designed for medical stores**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 🌟 Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 🚀 **Offline-First** | Works completely without internet connection |
| ⚡ **Lightning Fast** | FTS5-powered medicine search (under 50ms) |
| 💳 **Smart Billing** | Quick billing with keyboard shortcuts |
| 📊 **Auto Reports** | Daily & monthly PDF reports generation |
| 💾 **Backup System** | Automatic & manual database backups |
| 👥 **Credit Management** | Track customer credit and repayments |
| 📦 **Inventory Tracking** | Real-time stock management |
| 🖥️ **Desktop App** | Cross-platform desktop application |

</div>

### ✨ Key Highlights

- **🎯 Full Offline Operation** - No internet required, perfect for areas with unreliable connectivity
- **🔍 Instant Search** - Find medicines instantly with advanced FTS5 search technology
- **📱 Modern UI** - Clean, intuitive interface built with React and TailwindCSS
- **🛡️ Data Security** - Local SQLite database with better-sqlite3 for reliability
- **📄 PDF Integration** - Built-in PDF viewer and report generator
- **⌨️ Keyboard Shortcuts** - Speed up billing with F1-F4 shortcuts

---

## 🛠️ Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)
![PDFKit](https://img.shields.io/badge/PDFKit-FF0000?style=for-the-badge&logo=pdf&logoColor=white)

</div>

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MediStore Application                    │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React + Vite + TailwindCSS)                      │
│  ↕ API Calls                                                │
│  Backend (Node.js + Fastify)                                │
│  ↕ Database Operations                                       │
│  Database (SQLite + better-sqlite3)                         │
├─────────────────────────────────────────────────────────────┤
│  Desktop Layer (Tauri + Rust)                               │
│  - Cross-platform desktop application                       │
│  - Native performance                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
medistore/
├── 📂 frontend/          # React frontend application
├── 📂 backend/           # Fastify API server
├── 📂 desktop/           # Tauri desktop app
├── 📂 database/          # SQLite database files
├── 📂 reports/           # Generated PDF reports
├── 📂 backups/           # Database backups
├── 📂 scripts/           # Utility scripts
├── 📂 docs/              # Documentation
└── 📄 README.md          # This file
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Rust** (for Tauri desktop app) - [Install](https://www.rust-lang.org/tools/install)
- **Tauri CLI** (optional): `cargo install tauri-cli`

### Quick Start

```bash
# Clone the repository
git clone https://github.com/NIRU0802/MediStore.git
cd MediStore

# Install all dependencies (root, frontend, backend)
npm run install:all

# Start development servers (backend + frontend)
npm run dev
```

### Manual Installation

```bash
# 1. Install root dependencies
npm install

# 2. Install frontend dependencies
cd frontend && npm install && cd ..

# 3. Install backend dependencies
cd backend && npm install && cd ..
```

---

## 💻 Usage

### Development Mode

```bash
# Start both backend and frontend concurrently
npm run dev

# Or run them separately:
npm run dev:backend   # Backend on port 3001
npm run dev:frontend  # Frontend on port 5173
```

### Production Build

```bash
# Build frontend
npm run build:frontend

# Build backend
npm run build:backend

# Build both
npm run build

# Create desktop application (requires Rust)
npm run package
```

### Desktop Application

```bash
# Navigate to desktop directory
cd desktop

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| 🔑 Admin | `admin` | `admin123` |
| 👤 Staff | `staff` | `staff123` |

> ⚠️ **Security Note**: Change these credentials after first login!

---

## ⌨️ Keyboard Shortcuts (Billing POS)

| Action | Shortcut | Description |
|--------|----------|-------------|
| 💵 Cash Payment | `F1` | Process cash payment |
| 📱 UPI Payment | `F2` | Process UPI payment |
| 💳 Credit Payment | `F3` | Process credit payment |
| 👥 Select Customer | `F4` | Open customer selection |
| ✅ Complete Sale | `Enter` | Complete the current sale |
| 🧹 Clear Search | `Esc` | Clear medicine search |

---

## 🌐 API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

### Medicines
- `GET /api/medicines` - List all medicines
- `GET /api/medicines/search?q=` - Search medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create new medicine
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

### Credit Management
- `POST /api/credit-repayment` - Record credit repayment
- `GET /api/credit-ledger/:customerId` - View credit history

### Reports
- `GET /api/reports/list` - List all reports
- `GET /api/reports/file/:path` - Get report file
- `POST /api/reports/generate-daily/:date` - Generate daily report
- `POST /api/reports/generate-monthly/:year/:month` - Generate monthly report

### Backup
- `POST /api/backup` - Create database backup

---

## 📊 Database Schema

```
┌──────────────┐
│    Users     │──┐
└──────────────┘  │
                  │
┌──────────────┐  │    ┌─────────────┐
│  Customers   │──┼────│    Bills    │
└──────────────┘  │    └──────┬──────┘
                  │           │
┌──────────────┐  │    ┌──────┴──────┐
│   Medicines  │──┼────│ Bill Items  │
└──────────────┘  │    └─────────────┘
                  │
┌──────────────┐  │    ┌─────────────┐
│  Suppliers   │──┼────│  Purchases  │
└──────────────┘  │    └──────┬──────┘
                  │           │
┌──────────────┐  │    ┌──────┴──────┐
│ Credit Ledger│──┘    │Purchase Items│
└──────────────┘       └─────────────┘
```

### Tables
- **users** - Admin and staff accounts
- **customers** - Customer information
- **medicines** - Medicine inventory
- **suppliers** - Medicine suppliers
- **purchases** - Purchase records
- **purchase_items** - Items in each purchase
- **bills** - Billing records
- **bill_items** - Items in each bill
- **credit_ledger** - Customer credit tracking
- **reminders** - Appointment reminders
- **notifications_log** - System notifications

---

## 📄 Report Structure

### Daily Reports
```
reports/YYYY/MM-MonthName/YYYY-MM-DD-daily-sales.pdf
```
**Contains**: Summary + Bill Log

### Monthly Reports
```
reports/YYYY/MM-MonthName/YYYY-MM-monthly-report.pdf
```
**Contains**: Daily totals, Top medicines, Low stock alerts, Expiring medicines

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write clear, descriptive commit messages
- Update documentation as needed
- Test your changes thoroughly

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**NIRU0802**

- GitHub: [@NIRU0802](https://github.com/NIRU0802)
- Project Link: [https://github.com/NIRU0802/MediStore](https://github.com/NIRU0802/MediStore)

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

## 📞 Contact

For questions, suggestions, or collaborations, please open an issue or contact the author.

---

<div align="center">

**Built with ❤️ for pharmacy owners everywhere**

[⬆ Back to Top](#-medistore---pharmacy-management-system)

</div>
