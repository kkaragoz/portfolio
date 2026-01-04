'use client';

import { useState, useEffect } from 'react';
import { Trash2, Plus, Edit2, X, Tag } from 'lucide-react';
import Swal from 'sweetalert2';

type Birim = 'TL' | 'Doviz' | 'Karma';
type Tur = 'BIST' | 'YABANCI_BORSA' | 'KIYMETLI_METAL' | 'EMTIA' | 'PARA_PIYASASI' | 'EUROBOND' | 'KARMA' | 'COIN';

interface Symbol {
  id: number;
  name: string;
  code: string | null;
  code1: Birim | null;
  code2: Tur | null;
  code3: string | null;
  note: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const birimLabels: Record<Birim, string> = {
  TL: 'TL',
  Doviz: 'Döviz',
  Karma: 'Karma',
};

const turLabels: Record<Tur, string> = {
  BIST: 'BIST',
  YABANCI_BORSA: 'Yabancı Borsa',
  KIYMETLI_METAL: 'Kıymetli Metal',
  EMTIA: 'Emtia',
  PARA_PIYASASI: 'Para Piyasası',
  EUROBOND: 'Eurobond',
  KARMA: 'Karma',
  COIN: 'Coin',
};

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<Symbol | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    code1: '',
    code2: '',
    code3: '',
    note: '',
  });

  useEffect(() => {
    fetchSymbols();

    const onOpenSymbol = (e: any) => {
      const symbol: Symbol = e.detail;
      if (symbol) {
        setSelectedSymbol(symbol);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('openSymbol', onOpenSymbol);
    return () => window.removeEventListener('openSymbol', onOpenSymbol);
  }, []);

  // No search/filtering: always show full list

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
      if (editingId !== null) {
        const response = await fetch(`/api/symbols/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: err?.error || 'Sembol güncellenemedi',
            confirmButtonText: 'Tamam'
          });
          return;
        }
        await fetchSymbols();
        setEditingId(null);
      } else {
        const response = await fetch('/api/symbols', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: err?.error || 'Sembol eklenemedi',
            confirmButtonText: 'Tamam'
          });
          return;
        }
        await fetchSymbols();
      }

      setFormData({ code: '', name: '', code1: '', code2: '', code3: '', note: '' });
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

  const handleEdit = (symbol: Symbol) => {
    setEditingId(symbol.id);
    setFormData({
      code: symbol.code || '',
      name: symbol.name,
      code1: symbol.code1 || '',
      code2: symbol.code2 || '',
      code3: symbol.code3 || '',
      note: symbol.note || '',
    });
    setShowForm(true);
    setSelectedSymbol(null);
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
    setFormData({ code: '', name: '', code1: '', code2: '', code3: '', note: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sembol Tanımları
          </h1>
          <p className="text-gray-600 text-sm">
            Toplam {symbols.length} sembol
          </p>
        </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ code: '', name: '', code1: '', code2: '', code3: '', note: '' });
            }}           
            className="-translate-x-3 flex items-center gap-2 px-2 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30">            
            <Plus size={20} />            
            Yeni Sembol
          </button>
      </div>

      {/* Search removed */}

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Sembolü Düzenle' : 'Yeni Sembol Ekle'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod
              </label>
              <input
                type="text"
                maxLength={10}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Örn: AAPL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sembol Adı *
              </label>
              <input
                type="text"
                maxLength={255}
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Birim
              </label>
              <select
                value={formData.code1}
                onChange={(e) => setFormData({ ...formData, code1: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Seçiniz</option>
                <option value="TL">TL</option>
                <option value="Doviz">Döviz</option>
                <option value="Karma">Karma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tür
              </label>
              <select
                value={formData.code2}
                onChange={(e) => setFormData({ ...formData, code2: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Seçiniz</option>
                <option value="BIST">BIST</option>
                <option value="YABANCI_BORSA">Yabancı Borsa</option>
                <option value="KIYMETLI_METAL">Kıymetli Metal</option>
                <option value="EMTIA">Emtia</option>
                <option value="PARA_PIYASASI">Para Piyasası</option>
                <option value="EUROBOND">Eurobond</option>
                <option value="KARMA">Karma</option>
                <option value="COIN">Coin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kod 3
              </label>
              <input
                type="text"
                maxLength={5}
                value={formData.code3}
                onChange={(e) => setFormData({ ...formData, code3: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="1-2-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Not
              </label>
              <textarea
                maxLength={255}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Kod
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Adı
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Birim
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Kod 3
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Not
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Henüz sembol eklenmemiş</p>
                  </td>
                </tr>
              ) : (
                symbols.map((symbol) => (
                  <tr
                    key={symbol.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedSymbol(symbol)}
                  >
                    <td className="px-6 py-4 text-gray-700">
                      {symbol.code || '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {symbol.name}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {symbol.code1 ? birimLabels[symbol.code1] : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {symbol.code2 ? turLabels[symbol.code2] : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {symbol.code3 || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">
                      {symbol.note || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(symbol); }}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(symbol.id); }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
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

      {/* Detail Panel */}
      {selectedSymbol && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedSymbol.code ? `${selectedSymbol.code} – ${selectedSymbol.name}` : selectedSymbol.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Kodlar: {selectedSymbol.code || '-'} / {selectedSymbol.code1 ? birimLabels[selectedSymbol.code1] : '-'} / {selectedSymbol.code2 ? turLabels[selectedSymbol.code2] : '-'} / {selectedSymbol.code3 || '-'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(selectedSymbol)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Düzenle
              </button>
              <button
                onClick={() => setSelectedSymbol(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {selectedSymbol.note && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Not:</h4>
              <p className="text-sm text-gray-600">{selectedSymbol.note}</p>
            </div>
          )}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Oluşturuldu: {selectedSymbol.createdAt ? new Date(selectedSymbol.createdAt).toLocaleString('tr-TR') : '-'}</div>
            <div>Güncellendi: {selectedSymbol.updatedAt ? new Date(selectedSymbol.updatedAt).toLocaleString('tr-TR') : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
