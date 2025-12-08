'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface Symbol {
  id: number;
  name: string;
}

interface Transaction {
  id: number;
  symbolId: number;
  symbol: Symbol;
  date: string;
  type: string;
  price: number;
  quantity: number;
  balance: number | null;
  note: string | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    symbolId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'B',
    price: '',
    quantity: '',
    balance: '',
    note: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, symRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/symbols'),
      ]);
      const transData = await transRes.json();
      const symData = await symRes.json();
      setTransactions(transData);
      setSymbols(symData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const response = await fetch(`/api/transactions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            symbolId: parseInt(formData.symbolId),
            price: parseFloat(formData.price),
            quantity: parseFloat(formData.quantity),
            balance: formData.type === 'B' ? parseFloat(formData.balance || '0') : null,
          }),
        });
        if (response.ok) {
          fetchData();
          setEditingId(null);
        }
      } else {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            symbolId: parseInt(formData.symbolId),
            price: parseFloat(formData.price),
            quantity: parseFloat(formData.quantity),
            balance: formData.type === 'B' ? parseFloat(formData.balance || '0') : null,
          }),
        });
        if (response.ok) {
          fetchData();
        }
      }

      setFormData({
        symbolId: '',
        date: new Date().toISOString().split('T')[0],
        type: 'B',
        price: '',
        quantity: '',
        balance: '',
        note: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      symbolId: transaction.symbolId.toString(),
      date: new Date(transaction.date).toISOString().split('T')[0],
      type: transaction.type,
      price: transaction.price.toString(),
      quantity: transaction.quantity.toString(),
      balance: transaction.balance?.toString() || '',
      note: transaction.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      symbolId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'B',
      price: '',
      quantity: '',
      balance: '',
      note: '',
    });
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center text-slate-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">İşlem Kayıtları</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                symbolId: '',
                date: new Date().toISOString().split('T')[0],
                type: 'B',
                price: '',
                quantity: '',
                balance: '',
                note: '',
              });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Yeni İşlem
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sembol *
                </label>
                <select
                  required
                  value={formData.symbolId}
                  onChange={(e) =>
                    setFormData({ ...formData, symbolId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sembol seçin</option>
                  {symbols.map((symbol) => (
                    <option key={symbol.id} value={symbol.id}>
                      {symbol.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tarih *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  İşlem Türü *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="B">Alım (B)</option>
                  <option value="S">Satım (S)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Fiyat *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Miktar *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formData.type === 'B' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bakiye (Alım için)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) =>
                      setFormData({ ...formData, balance: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Not
                </label>
                <textarea
                  maxLength={255}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  {editingId ? 'Güncelle' : 'Ekle'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-slate-400 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Sembol</th>
                <th className="px-4 py-3 text-left font-semibold">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold">Tür</th>
                <th className="px-4 py-3 text-right font-semibold">Fiyat</th>
                <th className="px-4 py-3 text-right font-semibold">Miktar</th>
                <th className="px-4 py-3 text-right font-semibold">Bakiye</th>
                <th className="px-4 py-3 text-left font-semibold">Not</th>
                <th className="px-4 py-3 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Henüz işlem eklenmemiş
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium">{transaction.symbol.name}</td>
                    <td className="px-4 py-3">
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          transaction.type === 'B'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'B' ? 'Alım' : 'Satım'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{transaction.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">{transaction.quantity.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      {transaction.balance
                        ? transaction.balance.toFixed(2)
                        : '-'}
                    </td>
                    <td className="px-4 py-3">{transaction.note || '-'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
