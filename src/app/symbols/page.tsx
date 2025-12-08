'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface Symbol {
  id: number;
  name: string;
  code1: string | null;
  code2: string | null;
  code3: string | null;
  note: string | null;
}

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code1: '',
    code2: '',
    code3: '',
    note: '',
  });

  useEffect(() => {
    fetchSymbols();
  }, []);

  const fetchSymbols = async () => {
    try {
      const response = await fetch('/api/symbols');
      const data = await response.json();
      setSymbols(data);
    } catch (error) {
      console.error('Error fetching symbols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const response = await fetch(`/api/symbols/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          fetchSymbols();
          setEditingId(null);
        }
      } else {
        const response = await fetch('/api/symbols', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          fetchSymbols();
        }
      }

      setFormData({ name: '', code1: '', code2: '', code3: '', note: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (symbol: Symbol) => {
    setEditingId(symbol.id);
    setFormData({
      name: symbol.name,
      code1: symbol.code1 || '',
      code2: symbol.code2 || '',
      code3: symbol.code3 || '',
      note: symbol.note || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu sembolü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/symbols/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchSymbols();
        }
      } catch (error) {
        console.error('Error deleting symbol:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', code1: '', code2: '', code3: '', note: '' });
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
          <h1 className="text-3xl font-bold">Sembol Tanımları</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', code1: '', code2: '', code3: '', note: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Yeni Sembol
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Sembolü Düzenle' : 'Yeni Sembol Ekle'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sembol Adı *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Kod 1
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.code1}
                  onChange={(e) =>
                    setFormData({ ...formData, code1: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1-2-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Kod 2
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.code2}
                  onChange={(e) =>
                    setFormData({ ...formData, code2: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1-2-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Kod 3
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={formData.code3}
                  onChange={(e) =>
                    setFormData({ ...formData, code3: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1-2-3"
                />
              </div>

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
                <th className="px-4 py-3 text-left font-semibold">Adı</th>
                <th className="px-4 py-3 text-left font-semibold">Kod 1</th>
                <th className="px-4 py-3 text-left font-semibold">Kod 2</th>
                <th className="px-4 py-3 text-left font-semibold">Kod 3</th>
                <th className="px-4 py-3 text-left font-semibold">Not</th>
                <th className="px-4 py-3 text-left font-semibold">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Henüz sembol eklenmemiş
                  </td>
                </tr>
              ) : (
                symbols.map((symbol) => (
                  <tr
                    key={symbol.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 font-medium">{symbol.name}</td>
                    <td className="px-4 py-3">{symbol.code1 || '-'}</td>
                    <td className="px-4 py-3">{symbol.code2 || '-'}</td>
                    <td className="px-4 py-3">{symbol.code3 || '-'}</td>
                    <td className="px-4 py-3">{symbol.note || '-'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(symbol)}
                        className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(symbol.id)}
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
