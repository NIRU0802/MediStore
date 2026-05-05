import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '', brand: '', barcode: '', purchase_price: '', selling_price: '',
    stock: '', expiry_date: '', minimum_stock: '10', supplier_id: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicines();
    fetchSuppliers();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await api('/api/medicines');
      setMedicines(data);
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await api('/api/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.barcode?.includes(searchQuery)
  );

  const openModal = (medicine = null) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        name: medicine.name,
        brand: medicine.brand || '',
        barcode: medicine.barcode || '',
        purchase_price: medicine.purchase_price,
        selling_price: medicine.selling_price,
        stock: medicine.stock,
        expiry_date: medicine.expiry_date || '',
        minimum_stock: medicine.minimum_stock,
        supplier_id: medicine.supplier_id || ''
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        name: '', brand: '', barcode: '', purchase_price: '', selling_price: '',
        stock: '', expiry_date: '', minimum_stock: '10', supplier_id: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      purchase_price: parseFloat(formData.purchase_price),
      selling_price: parseFloat(formData.selling_price),
      stock: parseInt(formData.stock),
      minimum_stock: parseInt(formData.minimum_stock),
      supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
    };

    try {
      if (editingMedicine) {
        await api(`/api/medicines/${editingMedicine.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await api('/api/medicines', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      
      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      console.error('Failed to save medicine:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;
    
    try {
      await api(`/api/medicines/${id}`, { method: 'DELETE' });
      fetchMedicines();
    } catch (err) {
      console.error('Failed to delete medicine:', err);
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
        <h1 className="text-2xl font-bold text-gray-800">Medicines</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus size={18} />
          Add Medicine
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medicines..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Brand</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Barcode</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Purchase</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Selling</th>
              <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Expiry</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.map(medicine => (
              <tr key={medicine.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{medicine.name}</td>
                <td className="px-4 py-3 text-gray-600">{medicine.brand}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-sm">{medicine.barcode || '-'}</td>
                <td className="px-4 py-3 text-right">₹{medicine.purchase_price}</td>
                <td className="px-4 py-3 text-right">₹{medicine.selling_price}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${
                    medicine.stock === 0 ? 'text-red-600' :
                    medicine.stock <= medicine.minimum_stock ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {medicine.stock}
                    {medicine.stock <= medicine.minimum_stock && (
                      <AlertTriangle size={14} className="inline ml-1" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {medicine.expiry_date ? (
                    <span className={new Date(medicine.expiry_date) <= new Date(Date.now() + 60*24*60*60*1000) ? 'text-red-600' : ''}>
                      {medicine.expiry_date}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openModal(medicine)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMedicines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No medicines found
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingMedicine ? 'Edit Medicine' : 'Add Medicine'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({...formData, minimum_stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
