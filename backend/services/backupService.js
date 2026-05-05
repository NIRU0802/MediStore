import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..', '..');
const BACKUPS_DIR = path.join(BASE_DIR, '..', 'backups');
const DB_PATH = path.join(__dirname, '..', 'database', 'pharmadesk.db');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export const createBackup = () => {
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  const backupPath = path.join(BACKUPS_DIR, `pharmadesk-${timestamp}.db`);
  
  if (fs.existsSync(DB_PATH)) {
    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`Backup created: ${backupPath}`);
  }
  
  return backupPath;
};

export const restoreBackup = (backupPath) => {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`Backup restored from: ${backupPath}`);
    return true;
  }
  return false;
};

export const getBackupList = () => {
  if (!fs.existsSync(BACKUPS_DIR)) {
    return [];
  }
  
  return fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => ({
      name: f,
      path: path.join(BACKUPS_DIR, f),
      date: f.replace('pharmadesk-', '').replace('.db', '')
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
};

export default { createBackup, restoreBackup, getBackupList };
