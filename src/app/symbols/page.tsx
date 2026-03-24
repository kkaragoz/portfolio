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

const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none transition-colors";

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
          Swal.fire({ icon: 'error', title: 'Hata', text: err?.error || 'Sembol güncellenemedi', confirmButtonText: 'Tamam' });
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
          Swal.fire({ icon: 'error', title: 'Hata', text: err?.error || 'Sembol eklenemedi', confirmButtonText: 'Tamam' });
          return;
        }
        await fetchSymbols();
      }

      setFormData({ code: '', name: '', code1: '', code2: '', code3: '', note: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({ icon: 'error', title: 'Hata', text: 'Bir hata oluştu. Lütfen tekrar deneyin.', confirmButtonText: 'Tamam' });
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
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bu sembolü silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/symbols/${id}`, { method: 'DELETE' });
        if (response.ok) fetchSymbols();
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
        <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Form Panel */}
      {showForm && (
        <div className="card sticky top-0 z-30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
              {editingId ? 'Sembolü Düzenle' : 'Yeni Sembol Ekle'}
            </h2>
            <button onClick={handleCancel} className="p-1.5 rounded-md transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kod</label>
              <input type="text" maxLength={10} value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className={inputClass} placeholder="Örn: AAPL"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sembol Adı *</label>
              <input type="text" maxLength={255} required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Birim</label>
              <select value={formData.code1} onChange={(e) => setFormData({ ...formData, code1: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="">Seçiniz</option>
                <option value="TL">TL</option>
                <option value="Doviz">Döviz</option>
                <option value="Karma">Karma</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tür</label>
              <select value={formData.code2} onChange={(e) => setFormData({ ...formData, code2: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
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
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Kod 3</label>
              <input type="text" maxLength={5} value={formData.code3}
                onChange={(e) => setFormData({ ...formData, code3: e.target.value })}
                className={inputClass} placeholder="1-2-3"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Not</label>
              <textarea maxLength={255} value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className={`${inputClass} resize-none`} rows={2}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-5 py-2 text-white text-sm font-medium rounded-md transition-opacity"
                style={{ background: 'var(--success)' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {editingId ? 'Güncelle' : 'Ekle'}
              </button>
              <button type="button" onClick={handleCancel}
                className="px-5 py-2 text-sm font-medium rounded-md transition-colors"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Sembol Tanımları</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Toplam {symbols.length} sembol</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setFormData({ code: '', name: '', code1: '', code2: '', code3: '', note: '' }); }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-md transition-opacity"
          style={{ background: 'var(--accent)' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <Plus size={18} />
          Yeni Sembol
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-table-head)' }}>
                {['Kod', 'Adı', 'Birim', 'Tür', 'Kod 3', 'Not', 'İşlemler'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                    <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Henüz sembol eklenmemiş</p>
                  </td>
                </tr>
              ) : (
                symbols.map((symbol) => (
                  <tr
                    key={symbol.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onClick={() => setSelectedSymbol(symbol)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{symbol.code || '-'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-heading)' }}>{symbol.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{symbol.code1 ? birimLabels[symbol.code1] : '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{symbol.code2 ? turLabels[symbol.code2] : '-'}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{symbol.code3 || '-'}</td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>{symbol.note || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(symbol); }}
                          className="p-1.5 rounded-md transition-colors" title="Düzenle"
                          style={{ color: 'var(--accent)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(symbol.id); }}
                          className="p-1.5 rounded-md transition-colors" title="Sil"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-soft)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Trash2 size={15} />
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
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>
                {selectedSymbol.code ? `${selectedSymbol.code} – ${selectedSymbol.name}` : selectedSymbol.name}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Kodlar: {selectedSymbol.code || '-'} / {selectedSymbol.code1 ? birimLabels[selectedSymbol.code1] : '-'} / {selectedSymbol.code2 ? turLabels[selectedSymbol.code2] : '-'} / {selectedSymbol.code3 || '-'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEdit(selectedSymbol)}
                className="px-3 py-1.5 text-white text-sm font-medium rounded-md"
                style={{ background: 'var(--accent)' }}
              >Düzenle</button>
              <button onClick={() => setSelectedSymbol(null)}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {selectedSymbol.note && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Not:</h4>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{selectedSymbol.note}</p>
            </div>
          )}
          <div className="text-xs space-y-0.5" style={{ color: 'var(--text-muted)' }}>
            <div>Oluşturuldu: {selectedSymbol.createdAt ? new Date(selectedSymbol.createdAt).toLocaleString('tr-TR') : '-'}</div>
            <div>Güncellendi: {selectedSymbol.updatedAt ? new Date(selectedSymbol.updatedAt).toLocaleString('tr-TR') : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
