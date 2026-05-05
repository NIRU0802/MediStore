import { useState, useEffect } from 'react';
import { DollarSign, FileText, CreditCard, AlertTriangle, Clock, Package } from 'lucide-react';
import api from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayBills: 0,
    cashSales: 0,
    upiSales: 0,
    creditSales: 0,
    lowStock: [],
    expiringSoon: [],
    outOfStock: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const data = await api('/api/dashboard', { timeout: 15000 });
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.todaySales)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{stats.todayBills} bills today</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Cash Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.cashSales)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">UPI Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.upiSales)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Credit Sales</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.creditSales)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Low Stock Medicines</h2>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">
              {stats.lowStock.length + stats.outOfStock.length}
            </span>
          </div>
          
          {stats.outOfStock.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-600 mb-2">Out of Stock</p>
              <div className="space-y-2">
                {stats.outOfStock.slice(0, 5).map(med => (
                  <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.brand}</p>
                    </div>
                    <span className="text-red-600 font-semibold">0</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.lowStock.length > 0 && (
            <div>
              <p className="text-sm font-medium text-orange-600 mb-2">Low Stock</p>
              <div className="space-y-2">
                {stats.lowStock.slice(0, 5).map(med => (
                  <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.brand}</p>
                    </div>
                    <span className="text-orange-600 font-semibold">{med.stock}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.lowStock.length === 0 && stats.outOfStock.length === 0 && (
            <p className="text-gray-500 text-center py-4">No stock issues</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Expiring Soon</h2>
            <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-sm">
              {stats.expiringSoon.length}
            </span>
          </div>
          
          {stats.expiringSoon.length > 0 ? (
            <div className="space-y-2">
              {stats.expiringSoon.slice(0, 8).map(med => {
                const daysLeft = Math.ceil((new Date(med.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.brand}</p>
                    </div>
                    <span className={`text-sm font-semibold ${daysLeft <= 30 ? 'text-red-600' : 'text-yellow-600'}`}>
                      {daysLeft} days
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No medicines expiring soon</p>
          )}
        </div>
      </div>
    </div>
  );
}
