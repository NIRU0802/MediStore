import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDatabase, getDb, saveDatabase } from '../database/db.js';
import { generateDailyReport, generateMonthlyReport, recoverReports } from '../services/reportService.js';
import { createBackup } from '../services/backupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

await fastify.register(cors, { 
  origin: true,
  credentials: true
});

await initDatabase();

const BASE_DIR = path.join(__dirname, '..', '..');
const REPORTS_DIR = path.join(BASE_DIR, 'reports');
const BACKUPS_DIR = path.join(BASE_DIR, 'backups');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

fastify.get('/api/health', async () => ({ status: 'ok' }));
fastify.get('/health', async () => ({ status: 'ok' }));

fastify.get('/api/debug/users', async () => {
  const db = getDb();
  const users = db.prepare('SELECT * FROM users').all();
  return users;
});

fastify.get('/api/dashboard', async () => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  
  const todaySales = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total,
           COUNT(*) as count
    FROM bills 
    WHERE date(created_at) = ?
  `).get(today);

  const cashSales = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM bills 
    WHERE date(created_at) = ? AND payment_type = 'Cash'
  `).get(today);

  const upiSales = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM bills 
    WHERE date(created_at) = ? AND payment_type = 'UPI'
  `).get(today);

  const creditSales = db.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total
    FROM bills 
    WHERE date(created_at) = ? AND payment_type = 'Credit'
  `).get(today);

  const lowStock = db.prepare(`
    SELECT * FROM medicines 
    WHERE stock <= minimum_stock AND stock > 0
    ORDER BY stock ASC
    LIMIT 10
  `).all();

  const expiringSoon = db.prepare(`
    SELECT * FROM medicines 
    WHERE expiry_date IS NOT NULL 
    AND date(expiry_date) <= date('now', '+60 days')
    AND date(expiry_date) >= date('now')
    ORDER BY expiry_date ASC
    LIMIT 10
  `).all();

  const outOfStock = db.prepare(`
    SELECT * FROM medicines 
    WHERE stock = 0
    ORDER BY name ASC
  `).all();

  return {
    todaySales: todaySales?.total || 0,
    todayBills: todaySales?.count || 0,
    cashSales: cashSales?.total || 0,
    upiSales: upiSales?.total || 0,
    creditSales: creditSales?.total || 0,
    lowStock,
    expiringSoon,
    outOfStock
  };
});

fastify.get('/api/medicines/search', async (request) => {
  const db = getDb();
  const { q } = request.query;
  if (!q || q.length < 2) return [];

  const results = db.prepare(`
    SELECT * FROM medicines 
    WHERE name LIKE ? OR barcode LIKE ?
    LIMIT 20
  `).all(`%${q}%`, `%${q}%`);

  return results;
});

fastify.get('/api/medicines', async () => {
  const db = getDb();
  return db.prepare('SELECT * FROM medicines ORDER BY name ASC').all();
});

fastify.get('/api/medicines/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  return db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
});

fastify.post('/api/medicines', async (request) => {
  const db = getDb();
  const { name, brand, barcode, purchase_price, selling_price, stock, expiry_date, minimum_stock, supplier_id } = request.body;
  
  const result = db.prepare(`
    INSERT INTO medicines (name, brand, barcode, purchase_price, selling_price, stock, expiry_date, minimum_stock, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, brand || null, barcode || null, purchase_price, selling_price, stock || 0, expiry_date || null, minimum_stock || 10, supplier_id || null);

  saveDatabase();
  return { id: result.lastInsertRowid, ...request.body };
});

fastify.put('/api/medicines/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const { name, brand, barcode, purchase_price, selling_price, stock, expiry_date, minimum_stock, supplier_id } = request.body;
  
  db.prepare(`
    UPDATE medicines 
    SET name = ?, brand = ?, barcode = ?, purchase_price = ?, selling_price = ?, 
        stock = ?, expiry_date = ?, minimum_stock = ?, supplier_id = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, brand || null, barcode || null, purchase_price, selling_price, stock, expiry_date || null, minimum_stock || 10, supplier_id || null, id);

  saveDatabase();
  return { id, ...request.body };
});

fastify.delete('/api/medicines/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  db.prepare('DELETE FROM medicines WHERE id = ?').run(id);
  saveDatabase();
  return { success: true };
});

fastify.get('/api/customers', async () => {
  const db = getDb();
  return db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
});

fastify.get('/api/customers/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
});

fastify.post('/api/customers', async (request) => {
  const db = getDb();
  const { name, phone, email, address } = request.body;
  
  const result = db.prepare(`
    INSERT INTO customers (name, phone, email, address)
    VALUES (?, ?, ?, ?)
  `).run(name, phone || null, email || null, address || null);

  saveDatabase();
  return { id: result.lastInsertRowid, ...request.body };
});

fastify.put('/api/customers/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const { name, phone, email, address } = request.body;
  
  db.prepare(`
    UPDATE customers SET name = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
  `).run(name, phone || null, email || null, address || null, id);

  saveDatabase();
  return { id, ...request.body };
});

fastify.delete('/api/customers/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  saveDatabase();
  return { success: true };
});

fastify.get('/api/customers/:id/history', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const bills = db.prepare(`
    SELECT b.*, COUNT(bi.id) as item_count
    FROM bills b
    LEFT JOIN bill_items bi ON b.id = bi.bill_id
    WHERE b.customer_id = ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all(id);

  return bills;
});

fastify.get('/api/suppliers', async () => {
  const db = getDb();
  return db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
});

fastify.post('/api/suppliers', async (request) => {
  const db = getDb();
  const { name, phone, email, address } = request.body;
  
  const result = db.prepare(`
    INSERT INTO suppliers (name, phone, email, address)
    VALUES (?, ?, ?, ?)
  `).run(name, phone || null, email || null, address || null);

  saveDatabase();
  return { id: result.lastInsertRowid, ...request.body };
});

fastify.put('/api/suppliers/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const { name, phone, email, address } = request.body;
  
  db.prepare(`
    UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?
    WHERE id = ?
  `).run(name, phone || null, email || null, address || null, id);

  saveDatabase();
  return { id, ...request.body };
});

fastify.delete('/api/suppliers/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  saveDatabase();
  return { success: true };
});

fastify.get('/api/purchases', async () => {
  const db = getDb();
  return db.prepare(`
    SELECT p.*, s.name as supplier_name
    FROM purchases p
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    ORDER BY p.created_at DESC
  `).all();
});

fastify.post('/api/purchases', async (request) => {
  const db = getDb();
  const { invoice_number, supplier_id, total_amount, purchase_date, items } = request.body;
  
  const purchaseResult = db.prepare(`
    INSERT INTO purchases (invoice_number, supplier_id, total_amount, purchase_date)
    VALUES (?, ?, ?, ?)
  `).run(invoice_number, supplier_id || null, total_amount, purchase_date);

  const purchaseId = purchaseResult.lastInsertRowid;

  for (const item of items) {
    db.prepare(`
      INSERT INTO purchase_items (purchase_id, medicine_id, quantity, purchase_price, selling_price, expiry_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(purchaseId, item.medicine_id, item.quantity, item.purchase_price, item.selling_price, item.expiry_date || null);

    const med = db.prepare('SELECT stock FROM medicines WHERE id = ?').get(item.medicine_id);
    db.prepare(`
      UPDATE medicines SET stock = ?, selling_price = ?, expiry_date = ?
      WHERE id = ?
    `).run((med?.stock || 0) + item.quantity, item.selling_price, item.expiry_date || null, item.medicine_id);
  }

  saveDatabase();
  return { id: purchaseId };
});

fastify.get('/api/bills/today', async () => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare(`
    SELECT b.*, c.name as customer_name, COUNT(bi.id) as item_count
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN bill_items bi ON b.id = bi.bill_id
    WHERE date(b.created_at) = ?
    GROUP BY b.id
    ORDER BY b.created_at DESC
  `).all(today);
});

fastify.get('/api/bills', async (request) => {
  const db = getDb();
  const { startDate, endDate } = request.query;
  
  let query = `
    SELECT b.*, c.name as customer_name, COUNT(bi.id) as item_count
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN bill_items bi ON b.id = bi.bill_id
  `;
  
  const params = [];
  if (startDate && endDate) {
    query += ' WHERE date(b.created_at) BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' GROUP BY b.id ORDER BY b.created_at DESC';
  
  return db.prepare(query).all(...params);
});

fastify.get('/api/bills/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const bill = db.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).get(id);

  if (bill) {
    bill.items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(id);
  }

  return bill;
});

fastify.post('/api/bills', async (request) => {
  const db = getDb();
  const { customer_id, total_amount, payment_type, discount, items } = request.body;

  const lastBill = db.prepare('SELECT bill_number FROM bills ORDER BY id DESC LIMIT 1').get();
  const billNumber = lastBill?.bill_number ? `B${String(parseInt(lastBill.bill_number.replace('B', '')) + 1).padStart(5, '0')}` : 'B00001';

  const result = db.prepare(`
    INSERT INTO bills (bill_number, customer_id, total_amount, payment_type, discount)
    VALUES (?, ?, ?, ?, ?)
  `).run(billNumber, customer_id || null, total_amount, payment_type, discount || 0);

  const billId = result.lastInsertRowid;

  for (const item of items) {
    db.prepare(`
      INSERT INTO bill_items (bill_id, medicine_id, medicine_name, quantity, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(billId, item.medicine_id, item.medicine_name, item.quantity, item.unit_price, item.total_price);

    const med = db.prepare('SELECT stock FROM medicines WHERE id = ?').get(item.medicine_id);
    db.prepare(`
      UPDATE medicines SET stock = ? WHERE id = ?
    `).run((med?.stock || 0) - item.quantity, item.medicine_id);
  }

  if (payment_type === 'Credit' && customer_id) {
    const cust = db.prepare('SELECT credit_balance FROM customers WHERE id = ?').get(customer_id);
    db.prepare(`
      UPDATE customers SET credit_balance = ? WHERE id = ?
    `).run((cust?.credit_balance || 0) + total_amount, customer_id);

    db.prepare(`
      INSERT INTO credit_ledger (customer_id, bill_id, amount, type, description)
      VALUES (?, ?, ?, 'debit', 'Bill purchase')
    `).run(customer_id, billId, total_amount);
  }

  saveDatabase();
  
  try {
    generateDailyReport(new Date());
  } catch (e) {
    console.error('Failed to generate daily report:', e);
  }
  
  return { id: billId, bill_number: billNumber };
});

fastify.get('/api/credit-ledger/:customerId', async (request) => {
  const db = getDb();
  const { customerId } = request.params;
  return db.prepare(`
    SELECT cl.*, b.bill_number
    FROM credit_ledger cl
    LEFT JOIN bills b ON cl.bill_id = b.id
    WHERE cl.customer_id = ?
    ORDER BY cl.created_at DESC
  `).all(customerId);
});

fastify.post('/api/credit-repayment', async (request) => {
  const db = getDb();
  const { customer_id, amount, description } = request.body;

  const cust = db.prepare('SELECT credit_balance FROM customers WHERE id = ?').get(customer_id);
  db.prepare(`
    UPDATE customers SET credit_balance = ? WHERE id = ?
  `).run((cust?.credit_balance || 0) - amount, customer_id);

  db.prepare(`
    INSERT INTO credit_ledger (customer_id, amount, type, description)
    VALUES (?, ?, 'credit', ?)
  `).run(customer_id, amount, description || 'Payment received');

  saveDatabase();
  return { success: true };
});

fastify.get('/api/reports/daily/:date', async (request) => {
  const { date } = request.params;
  const reportPath = path.join(REPORTS_DIR, date.substring(0, 4), `${date.substring(5, 7)}-month`);
  
  if (!fs.existsSync(reportPath)) {
    return { error: 'Report not found' };
  }

  const files = fs.readdirSync(reportPath).filter(f => f.includes(date) && f.includes('daily'));
  if (files.length === 0) {
    return { error: 'Report not found' };
  }

  return { path: path.join(reportPath, files[0]) };
});

fastify.get('/api/reports/monthly/:year/:month', async (request) => {
  const { year, month } = request.params;
  const reportPath = path.join(REPORTS_DIR, year, `${month}-month`);
  
  if (!fs.existsSync(reportPath)) {
    return { error: 'Report not found' };
  }

  const files = fs.readdirSync(reportPath).filter(f => f.includes('monthly'));
  if (files.length === 0) {
    return { error: 'Report not found' };
  }

  return { path: path.join(reportPath, files[0]) };
});

fastify.get('/api/reports/list', async () => {
  const reports = { years: [] };
  
  if (!fs.existsSync(REPORTS_DIR)) {
    return reports;
  }

  const years = fs.readdirSync(REPORTS_DIR).filter(f => /^\d{4}$/.test(f));
  
  for (const year of years) {
    const yearPath = path.join(REPORTS_DIR, year);
    const months = fs.readdirSync(yearPath).filter(f => /^\d{2}-month$/.test(f));
    
    const yearData = { months: [] };
    
    for (const month of months) {
      const monthPath = path.join(yearPath, month);
      const files = fs.readdirSync(monthPath);
      
      const dailyReports = files.filter(f => f.includes('daily')).sort().reverse();
      const monthlyReport = files.find(f => f.includes('monthly'));
      
      yearData.months.push({
        name: month,
        dailyReports: dailyReports.map(f => ({
          name: f,
          path: path.join(monthPath, f)
        })),
        monthlyReport: monthlyReport ? {
          name: monthlyReport,
          path: path.join(monthPath, monthlyReport)
        } : null
      });
    }
    
    yearData.months.sort((a, b) => b.name.localeCompare(a.name));
    reports.years.push({ name: year, ...yearData });
  }

  reports.years.sort((a, b) => b.name.localeCompare(a.name));
  return reports;
});

fastify.get('/api/reports/file', async (request) => {
  const { path: encodedPath } = request.query;
  if (!encodedPath) {
    return { error: 'Path is required' };
  }
  const filePath = path.join(REPORTS_DIR, encodedPath);
  
  if (!fs.existsSync(filePath)) {
    return { error: 'File not found' };
  }

  const buffer = fs.readFileSync(filePath);
  return buffer;
});

fastify.post('/api/reports/generate-daily/:date', async (request) => {
  const { date } = request.params;
  generateDailyReport(new Date(date));
  return { success: true };
});

fastify.post('/api/reports/generate-monthly/:year/:month', async (request) => {
  const { year, month } = request.params;
  generateMonthlyReport(parseInt(year), parseInt(month));
  return { success: true };
});

fastify.post('/api/backup', async () => {
  const db = getDb();
  saveDatabase();
  const backupPath = createBackup();
  return { path: backupPath };
});

fastify.get('/api/backup-list', async () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUPS_DIR, f),
      date: f.replace('pharmadesk-', '').replace('.db', '')
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
  
  return files;
});

fastify.get('/api/backup-file', async (request) => {
  const { file } = request.query;
  const filePath = path.join(BACKUPS_DIR, file);
  
  if (!fs.existsSync(filePath)) {
    return { error: 'File not found' };
  }

  const buffer = fs.readFileSync(filePath);
  return buffer;
});

fastify.get('/api/notifications', async () => {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM notifications_log 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();
});

fastify.post('/api/notifications/:id/read', async (request) => {
  const db = getDb();
  const { id } = request.params;
  db.prepare('UPDATE notifications_log SET is_read = 1 WHERE id = ?').run(id);
  saveDatabase();
  return { success: true };
});

fastify.get('/api/reminders', async () => {
  const db = getDb();
  return db.prepare('SELECT * FROM reminders ORDER BY reminder_date ASC').all();
});

fastify.post('/api/reminders', async (request) => {
  const db = getDb();
  const { title, description, reminder_date } = request.body;
  const result = db.prepare(`
    INSERT INTO reminders (title, description, reminder_date)
    VALUES (?, ?, ?)
  `).run(title, description || null, reminder_date);
  saveDatabase();
  return { id: result.lastInsertRowid };
});

fastify.put('/api/reminders/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  const { is_completed } = request.body;
  db.prepare('UPDATE reminders SET is_completed = ? WHERE id = ?').run(is_completed ? 1 : 0, id);
  saveDatabase();
  return { success: true };
});

fastify.delete('/api/reminders/:id', async (request) => {
  const db = getDb();
  const { id } = request.params;
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
  saveDatabase();
  return { success: true };
});

fastify.post('/api/login', async (request) => {
  const db = getDb();
  const { username, password } = request.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  
  if (!user) {
    return { error: 'Invalid credentials' };
  }
  
  return { id: user.id, username: user.username, name: user.name, role: user.role };
});

setTimeout(() => {
  try {
    recoverReports();
  } catch (e) {
    console.error('Report recovery failed:', e);
  }
}, 2000);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://127.0.0.1:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
