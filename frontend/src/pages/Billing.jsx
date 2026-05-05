import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, Save, X, User } from 'lucide-react';
import api from '../utils/api';

export default function Billing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    fetchCustomers();
    searchRef.current?.focus();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api('/api/customers');
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
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

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.medicine_id === medicine.id);
    if (existing) {
      if (existing.quantity < medicine.stock) {
        setCart(cart.map(item => 
          item.medicine_id === medicine.id 
            ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
            : item
        ));
      }
    } else {
      if (medicine.stock > 0) {
        setCart([...cart, {
          medicine_id: medicine.id,
          medicine_name: medicine.name,
          medicine_brand: medicine.brand,
          unit_price: medicine.selling_price,
          quantity: 1,
          total_price: medicine.selling_price,
          stock: medicine.stock
        }]);
      }
    }
    setSearchQuery('');
    setSearchResults([]);
    searchRef.current?.focus();
  };

  const updateQuantity = (medicineId, delta) => {
    setCart(cart.map(item => {
      if (item.medicine_id === medicineId) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, quantity: newQty, total_price: newQty * item.unit_price };
        }
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (medicineId) => {
    setCart(cart.filter(item => item.medicine_id !== medicineId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setSaving(true);
    try {
      const data = await api('/api/bills', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          total_amount: calculateTotal(),
          payment_type: paymentType,
          items: cart
        })
      });
      
      setCart([]);
      setSelectedCustomer(null);
      setPaymentType('Cash');
      setSuccessMessage(`Bill #${data.bill_number} saved successfully!`);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save bill:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'F1') {
      setPaymentType('Cash');
    } else if (e.key === 'F2') {
      setPaymentType('UPI');
    } else if (e.key === 'F3') {
      setPaymentType('Credit');
    } else if (e.key === 'F4') {
      setShowCustomerSelect(true);
    } else if (e.key === 'Enter' && cart.length > 0 && !saving) {
      handleCheckout();
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentType, selectedCustomer, saving]);

  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Billing POS</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCustomerSelect(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <User size={18} />
              {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => searchMedicine(e.target.value)}
            placeholder="Search medicines by name or barcode... (Esc to clear)"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
          />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-auto z-10">
              {searchResults.map(med => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{med.name}</p>
                    <p className="text-sm text-gray-500">{med.brand} | {med.barcode || 'No barcode'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary-600">₹{med.selling_price}</p>
                    <p className={`text-sm ${med.stock <= med.minimum_stock ? 'text-red-600' : 'text-green-600'}`}>
                      Stock: {med.stock}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto bg-white rounded-lg border">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Search size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Search and add medicines to cart</p>
                <p className="text-sm mt-1">Press Esc to clear search</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Medicine</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Price</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.medicine_name}</p>
                      <p className="text-sm text-gray-500">{item.medicine_brand}</p>
                    </td>
                    <td className="px-4 py-3 text-center">₹{item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.medicine_id, -1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.medicine_id, 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">₹{item.total_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="w-80 bg-white border-l p-6 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            {['Cash', 'UPI', 'Credit'].map(type => (
              <button
                key={type}
                onClick={() => setPaymentType(type)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  paymentType === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">F1: Cash | F2: UPI | F3: Credit</p>
        </div>

        <div className="flex-1">
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Items:</span>
              <span className="font-medium">{cart.length}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total Quantity:</span>
              <span className="font-medium">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary-600">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || saving}
          className="w-full bg-primary-600 text-white py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Complete Sale (Enter)'}
        </button>
      </div>

      {showCustomerSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Customer</h3>
              <button onClick={() => setShowCustomerSelect(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-80 overflow-auto space-y-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerSelect(false);
                }}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border"
              >
                <p className="font-medium">Walk-in Customer</p>
                <p className="text-sm text-gray-500">No customer selected</p>
              </button>
              
              {customers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerSelect(false);
                  }}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border"
                >
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.phone || 'No phone'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
