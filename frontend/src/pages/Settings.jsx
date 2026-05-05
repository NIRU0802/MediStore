import { useState, useEffect } from 'react';
import { Database, Download, Upload, Clock, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Settings() {
  const [backups, setBackups] = useState([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await api('/api/backup-list');
      setBackups(data);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const data = await api('/api/backup', { method: 'POST' });
      
      setMessage({ type: 'success', text: 'Backup created successfully!' });
      fetchBackups();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create backup' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Backup System</h2>
              <p className="text-sm text-gray-500">Create and manage database backups</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Create Backup</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create a backup of your entire database. Backups are saved to the backups folder.
              </p>
              <button
                onClick={createBackup}
                disabled={creatingBackup}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creatingBackup ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Create Backup Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Backup History</h2>
              <p className="text-sm text-gray-500">View and manage existing backups</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-auto">
              {backups.map(backup => (
                <div
                  key={backup.path}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{backup.name}</p>
                    <p className="text-sm text-gray-500">{formatDate(backup.date)}</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/backup-file?file=${encodeURIComponent(backup.name)}`);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = backup.name;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Failed to download backup:', err);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-primary-600"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No backups available</p>
          )}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">System Info</h2>
              <p className="text-sm text-gray-500">Application details</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Application</span>
              <span className="font-medium">PharmaDesk</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Database</span>
              <span className="font-medium">SQLite (better-sqlite3)</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Mode</span>
              <span className="font-medium text-green-600">Offline First</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-500">Quick actions in Billing POS</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Cash Payment</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">F1</kbd>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">UPI Payment</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">F2</kbd>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Credit Payment</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">F3</kbd>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Select Customer</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">F4</kbd>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Complete Sale</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Enter</kbd>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Clear Search</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
