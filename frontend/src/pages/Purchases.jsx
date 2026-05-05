import { useState, useEffect } from 'react';
import { Search, Plus, X, Save, Package } from 'lucide-react';
import api from '../utils/api';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    items: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesData, medicinesData, suppliersData] = await Promise.all([
        api('/api/purchases'),
        api('/api/medicines'),
        api('/api/suppliers')
      ]);
      
      setPurchases(purchasesData);
      setMedicines(medicinesData);
      setSuppliers(suppliersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchMedicine = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await api(`/api/medicines/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const addItem = (medicine) => {
    const existing = formData.items.find(item => item.medicine_id === medicine.id);
    if (existing) {
      setFormData({
        ...formData,
        items: formData.items.map(item =>
          item.medicine_id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, {
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          purchase_price: medicine.purchase_price,
          selling_price: medicine.selling_price,
          quantity: 1,
          expiry_date: ''
        }]
      });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (medicineId, field, value) => {
    setFormData({
      ...formData,
      items: formData.items.map(item =>
        item.medicine_id === medicineId ? { ...item, [field]: value } : item
      )
    });
  };

  const removeItem = (medicineId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.medicine_id !== medicineId)
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.purchase_price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await api('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          total_amount: calculateTotal(),
          supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
        })
      });
      
      setShowModal(false);
      setFormData({
        invoice_number: '',
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        items: []
      });
      fetchData();
    } catch (err) {
      console.error('Failed to save purchase:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={18} />
          New Purchase
        </button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Invoice</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Supplier</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Date</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(purchase => (
              <tr key={purchase.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{purchase.invoice_number}</td>
                <td className="px-4 py-3 text-gray-600">{purchase.supplier_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{purchase.purchase_date}</td>
                <td className="px-4 py-3 text-right font-medium">₹{purchase.total_amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {purchases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No purchases found
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Purchase</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                  <input
                    type="text"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add Medicine</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => searchMedicine(e.target.value)}
                    placeholder="Search medicines..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
                      {searchResults.map(med => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => addItem(med)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        >
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-gray-500">Stock: {med.stock}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {formData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 text-sm font-medium">Medicine</th>
                        <th className="text-right px-4 py-2 text-sm font-medium">Purchase Price</th>
                        <th className="text-right px-4 py-2 text-sm font-medium">Selling Price</th>
                        <th className="text-center px-4 py-2 text-sm font-medium">Qty</th>
                        <th className="text-left px-4 py-2 text-sm font-medium">Expiry</th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map(item => (
                        <tr key={item.medicine_id} className="border-t">
                          <td className="px-4 py-2">{item.medicine_name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.purchase_price}
                              onChange={(e) => updateItem(item.medicine_id, 'purchase_price', parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border rounded text-right"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.selling_price}
                              onChange={(e) => updateItem(item.medicine_id, 'selling_price', parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border rounded text-right"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.medicine_id, 'quantity', parseInt(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-center"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) => updateItem(item.medicine_id, 'expiry_date', e.target.value)}
                              className="w-32 px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.medicine_id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-4">
                <div className="text-lg font-semibold">
                  Total: ₹{calculateTotal().toFixed(2)}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save Purchase
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
