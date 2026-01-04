'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, X, SquareSigma, ArrowLeftRight, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { ExecFifo } from '@/lib/fifo';

interface Symbol {
  id: number;
  name: string;
  code: string | null;
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
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
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

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(t => t.type === filterType));
    }
  }, [filterType, transactions]);

  const fetchData = async () => {
    try {
      const [transRes, symRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/symbols'),
      ]);
      const transData = await transRes.json();
      const symData = await symRes.json();
      setTransactions(transData);
      setFilteredTransactions(transData);
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
      if (editingId !== null) {
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
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: err?.error || 'İşlem güncellenemedi',
            confirmButtonText: 'Tamam'
          });
          return;
        }
        await fetchData();
        setEditingId(null);
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
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: err?.error || 'İşlem eklenemedi',
            confirmButtonText: 'Tamam'
          });
          return;
        }
        await fetchData();
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
      Swal.fire({
        icon: 'error',
        title: 'Hata',
        text: 'Bir hata oluştu. Lütfen tekrar deneyin.',
        confirmButtonText: 'Tamam'
      });
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
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Emin misiniz?',
      text: 'Bu işlemi silmek istediğinizden emin misiniz?',
      showCancelButton: true,
      confirmButtonText: 'Evet, Sil',
      cancelButtonText: 'İptal',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchData();
          Swal.fire({
            icon: 'success',
            title: 'Silindi',
            text: 'İşlem başarıyla silindi.',
            timer: 1500,
            showConfirmButton: false
          });
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  const stats = {
    total: transactions.length,
    buy: transactions.filter(t => t.type === 'B').length,
    sell: transactions.filter(t => t.type === 'S').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            İşlem Kayıtları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Toplam {stats.total} işlem ({stats.buy} alış, {stats.sell} satış)
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              try {
                Swal.fire({ title: 'FIFO çalıştırılıyor...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
                await ExecFifo();
                await fetchData();
                Swal.close();
                await Swal.fire({ icon: 'success', title: 'FIFO tamamlandı', timer: 1500, showConfirmButton: false });
              } catch (err) {
                Swal.close();
                await Swal.fire({ icon: 'error', title: 'FIFO hatası', text: (err as Error).message || 'İşlem başarısız' });
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/30"
          >
            <SquareSigma size={20} />
            FIFO
          </button>
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
             className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} />
            Yeni İşlem
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Tümü ({stats.total})
        </button>
        <button
          onClick={() => setFilterType('B')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filterType === 'B'
              ? 'bg-green-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Alış ({stats.buy})
        </button>
        <button
          onClick={() => setFilterType('S')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filterType === 'S'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Satış ({stats.sell})
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingId ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sembol *
              </label>
              <select
                required
                value={formData.symbolId}
                onChange={(e) => setFormData({ ...formData, symbolId: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              >
                <option value="">Sembol seçin</option>
                {symbols.map((symbol) => (
                  <option key={symbol.id} value={symbol.id}>
                    {symbol.code || symbol.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tarih *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                İşlem Türü *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              >
                <option value="B">Alım (B)</option>
                <option value="S">Satım (S)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fiyat *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Miktar *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            {formData.type === 'B' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bakiye (Alım için)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Not
              </label>
              <textarea
                maxLength={255}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                {editingId ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Sembol
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Miktar
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Not
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Henüz işlem eklenmemiş</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {transaction.symbol.code || transaction.symbol.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.type === 'B'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}
                      >
                        {transaction.type === 'B' ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            Alım
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            Satım
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300 font-mono">
                      {transaction.price.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300 font-mono">
                      {transaction.quantity.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-xs truncate">
                      {transaction.note || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
