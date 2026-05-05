import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { getDb, saveDatabase } from '../database/db.js';
import dbWrapper from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..', '..', '..');
const REPORTS_DIR = path.join(BASE_DIR, 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getDailySalesData = (date) => {
  const db = dbWrapper;
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const summary = db.prepare(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as total_sales,
      COUNT(*) as total_bills,
      COALESCE(SUM(CASE WHEN payment_type = 'Cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
      COALESCE(SUM(CASE WHEN payment_type = 'UPI' THEN total_amount ELSE 0 END), 0) as upi_sales,
      COALESCE(SUM(CASE WHEN payment_type = 'Credit' THEN total_amount ELSE 0 END), 0) as credit_sales
    FROM bills 
    WHERE date(created_at) = ?
  `).get(dateStr);

  const bills = db.prepare(`
    SELECT 
      time(b.created_at) as time,
      b.bill_number,
      c.name as customer_name,
      COUNT(bi.id) as item_count,
      b.payment_type,
      b.total_amount
    FROM bills b
    LEFT JOIN customers c ON b.customer_id = c.id
    LEFT JOIN bill_items bi ON b.id = bi.bill_id
    WHERE date(b.created_at) = ?
    GROUP BY b.id
    ORDER BY b.created_at ASC
  `).all(dateStr);

  return { summary, bills };
};

const getMonthlySalesData = (year, month) => {
  const db = dbWrapper;
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date(year, month - 1, 1)), 'yyyy-MM-dd');

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate)
  });

  const dailyTotals = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const data = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as bills
      FROM bills 
      WHERE date(created_at) = ?
    `).get(dayStr);
    
    return {
      date: dayStr,
      total: data?.total || 0,
      bills: data?.bills || 0
    };
  });

  const summary = db.prepare(`
    SELECT 
      COALESCE(SUM(total_amount), 0) as total_sales,
      COUNT(*) as total_bills,
      COALESCE(SUM(CASE WHEN payment_type = 'Cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
      COALESCE(SUM(CASE WHEN payment_type = 'UPI' THEN total_amount ELSE 0 END), 0) as upi_sales,
      COALESCE(SUM(CASE WHEN payment_type = 'Credit' THEN total_amount ELSE 0 END), 0) as credit_sales
    FROM bills 
    WHERE date(created_at) BETWEEN ? AND ?
  `).get(startDate, endDate);

  const topMedicines = db.prepare(`
    SELECT 
      bi.medicine_name,
      SUM(bi.quantity) as total_quantity,
      SUM(bi.total_price) as total_amount
    FROM bill_items bi
    JOIN bills b ON bi.bill_id = b.id
    WHERE date(b.created_at) BETWEEN ? AND ?
    GROUP BY bi.medicine_id
    ORDER BY total_quantity DESC
    LIMIT 10
  `).all(startDate, endDate);

  const lowStock = db.prepare(`
    SELECT * FROM medicines 
    WHERE stock <= minimum_stock
    ORDER BY stock ASC
  `).all();

  const expiringSoon = db.prepare(`
    SELECT * FROM medicines 
    WHERE expiry_date IS NOT NULL 
    AND date(expiry_date) <= date('now', '+60 days')
    AND date(expiry_date) >= date('now')
    ORDER BY expiry_date ASC
  `).all();

  return { summary, dailyTotals, topMedicines, lowStock, expiringSoon };
};

export const generateDailyReport = (date) => {
  const year = format(date, 'yyyy');
  const month = format(date, 'MM');
  const dateStr = format(date, 'yyyy-MM-dd');
  
  const reportDir = path.join(REPORTS_DIR, year, `${month}-month`);
  ensureDirectory(reportDir);

  const reportPath = path.join(reportDir, `${dateStr}-daily-sales.pdf`);
  
  const { summary, bills } = getDailySalesData(date);

  return new Promise((resolve) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(reportPath);
      
      doc.pipe(stream);

      doc.fontSize(20).text('PharmaDesk - Daily Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Date: ${format(date, 'MMMM dd, yyyy')}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Total Sales: ₹${(summary?.total_sales || 0).toFixed(2)}`);
      doc.text(`Total Bills: ${summary?.total_bills || 0}`);
      doc.text(`Cash Sales: ₹${(summary?.cash_sales || 0).toFixed(2)}`);
      doc.text(`UPI Sales: ₹${(summary?.upi_sales || 0).toFixed(2)}`);
      doc.text(`Credit Sales: ₹${(summary?.credit_sales || 0).toFixed(2)}`);
      doc.moveDown(2);

      doc.fontSize(16).text('Bill Log', { underline: true });
      doc.moveDown();

      if (bills && bills.length > 0) {
        doc.fontSize(10);
        doc.text('Time      | Bill No.   | Customer                    | Items | Payment | Amount', { continued: false });
        doc.text('-'.repeat(90));

        bills.forEach(bill => {
          const customerName = bill.customer_name || 'Walk-in';
          const name = customerName.length > 25 ? customerName.substring(0, 22) + '...' : customerName;
          doc.text(`${bill.time}  | ${bill.bill_number}  | ${name.padEnd(25)} | ${String(bill.item_count).padEnd(5)} | ${bill.payment_type.padEnd(7)} | ₹${bill.total_amount.toFixed(2)}`);
        });
      } else {
        doc.text('No bills for this date.');
      }

      doc.moveDown(2);
      doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'right' });

      doc.end();

      stream.on('finish', () => {
        console.log(`Daily report generated: ${reportPath}`);
        resolve(reportPath);
      });
    } catch (e) {
      console.error('Failed to generate daily report:', e);
      resolve(null);
    }
  });
};

export const generateMonthlyReport = (year, month) => {
  const monthName = format(new Date(year, month - 1), 'MMMM');
  const reportDir = path.join(REPORTS_DIR, String(year), `${String(month).padStart(2, '0')}-month`);
  ensureDirectory(reportDir);

  const reportPath = path.join(reportDir, `${year}-${String(month).padStart(2, '0')}-monthly-report.pdf`);
  
  const { summary, dailyTotals, topMedicines, lowStock, expiringSoon } = getMonthlySalesData(year, month);

  return new Promise((resolve) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(reportPath);
      
      doc.pipe(stream);

      doc.fontSize(20).text('PharmaDesk - Monthly Sales Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Month: ${monthName} ${year}`, { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(16).text('Monthly Summary', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12);
      doc.text(`Total Monthly Revenue: ₹${(summary?.total_sales || 0).toFixed(2)}`);
      doc.text(`Total Bills: ${summary?.total_bills || 0}`);
      doc.text(`Cash Sales: ₹${(summary?.cash_sales || 0).toFixed(2)}`);
      doc.text(`UPI Sales: ₹${(summary?.upi_sales || 0).toFixed(2)}`);
      doc.text(`Credit Sales: ₹${(summary?.credit_sales || 0).toFixed(2)}`);
      doc.moveDown(2);

      doc.fontSize(16).text('Daily Totals', { underline: true });
      doc.moveDown();

      doc.fontSize(10);
      doc.text('Date         | Bills | Amount', { continued: false });
      doc.text('-'.repeat(50));

      dailyTotals.forEach(day => {
        if (day.bills > 0) {
          doc.text(`${day.date}  | ${String(day.bills).padEnd(5)} | ₹${day.total.toFixed(2)}`);
        }
      });

      doc.moveDown(2);
      doc.fontSize(16).text('Top Medicines', { underline: true });
      doc.moveDown();

      if (topMedicines && topMedicines.length > 0) {
        doc.fontSize(10);
        doc.text('Medicine Name             | Qty Sold | Revenue', { continued: false });
        doc.text('-'.repeat(55));

        topMedicines.forEach(med => {
          const name = med.medicine_name.length > 25 ? med.medicine_name.substring(0, 22) + '...' : med.medicine_name;
          doc.text(`${name.padEnd(25)} | ${String(med.total_quantity).padEnd(8)} | ₹${med.total_amount.toFixed(2)}`);
        });
      } else {
        doc.text('No medicine sales data.');
      }

      doc.moveDown(2);
      doc.fontSize(16).text('Low Stock Medicines', { underline: true });
      doc.moveDown();

      if (lowStock && lowStock.length > 0) {
        doc.fontSize(10);
        doc.text('Medicine Name             | Stock | Min Stock', { continued: false });
        doc.text('-'.repeat(55));

        lowStock.slice(0, 10).forEach(med => {
          const name = med.name.length > 25 ? med.name.substring(0, 22) + '...' : med.name;
          doc.text(`${name.padEnd(25)} | ${String(med.stock).padEnd(6)} | ${med.minimum_stock}`);
        });
      } else {
        doc.text('No low stock medicines.');
      }

      doc.moveDown(2);
      doc.fontSize(16).text('Expiring Soon (Next 60 Days)', { underline: true });
      doc.moveDown();

      if (expiringSoon && expiringSoon.length > 0) {
        doc.fontSize(10);
        doc.text('Medicine Name             | Expiry Date', { continued: false });
        doc.text('-'.repeat(50));

        expiringSoon.slice(0, 10).forEach(med => {
          const name = med.name.length > 25 ? med.name.substring(0, 22) + '...' : med.name;
          doc.text(`${name.padEnd(25)} | ${med.expiry_date}`);
        });
      } else {
        doc.text('No medicines expiring soon.');
      }

      doc.moveDown(2);
      doc.fontSize(10).text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, { align: 'right' });

      doc.end();

      stream.on('finish', () => {
        console.log(`Monthly report generated: ${reportPath}`);
        resolve(reportPath);
      });
    } catch (e) {
      console.error('Failed to generate monthly report:', e);
      resolve(null);
    }
  });
};

export const recoverReports = () => {
  console.log('Running report recovery...');
  
  try {
    const db = dbWrapper;
    const existingBills = db.prepare(`
      SELECT DISTINCT date(created_at) as date 
      FROM bills 
      ORDER BY date DESC
    `).all();

    if (!fs.existsSync(REPORTS_DIR)) {
      return;
    }

    existingBills.forEach(({ date }) => {
      const year = date.substring(0, 4);
      const month = date.substring(5, 7);
      const reportDir = path.join(REPORTS_DIR, year, `${month}-month`);
      const reportPath = path.join(reportDir, `${date}-daily-sales.pdf`);

      if (!fs.existsSync(reportPath)) {
        console.log(`Recovering missing daily report: ${date}`);
        generateDailyReport(parseISO(date));
      }
    });

    let years = [];
    try {
      years = fs.existsSync(REPORTS_DIR) ? fs.readdirSync(REPORTS_DIR).filter(f => /^\d{4}$/.test(f)) : [];
    } catch (e) {
      years = [];
    }
    
    years.forEach(year => {
      const yearPath = path.join(REPORTS_DIR, year);
      let months = [];
      try {
        months = fs.existsSync(yearPath) ? fs.readdirSync(yearPath).filter(f => /^\d{2}-month$/.test(f)) : [];
      } catch (e) {
        months = [];
      }
      
      months.forEach(month => {
        const monthPath = path.join(yearPath, month);
        let files = [];
        try {
          files = fs.readdirSync(monthPath);
        } catch (e) {
          files = [];
        }
        const monthlyReport = files.find(f => f.includes('monthly'));
        
        if (!monthlyReport) {
          console.log(`Recovering missing monthly report: ${year}/${month}`);
          generateMonthlyReport(parseInt(year), parseInt(month));
        }
      });
    });
  } catch (e) {
    console.error('Report recovery error:', e);
  }
};

export default { generateDailyReport, generateMonthlyReport, recoverReports };
