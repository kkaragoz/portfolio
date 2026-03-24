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

const inputClass = "w-full px-3 py-2 rounded-md text-sm outline-none transition-colors";

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

  useEffect(() => { fetchData(); }, []);

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
          Swal.fire({ icon: 'error', title: 'Hata', text: err?.error || 'İşlem güncellenemedi', confirmButtonText: 'Tamam' });
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
          Swal.fire({ icon: 'error', title: 'Hata', text: err?.error || 'İşlem eklenemedi', confirmButtonText: 'Tamam' });
          return;
        }
        await fetchData();
      }
      setFormData({ symbolId: '', date: new Date().toISOString().split('T')[0], type: 'B', price: '', quantity: '', balance: '', note: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      Swal.fire({ icon: 'error', title: 'Hata', text: 'Bir hata oluştu. Lütfen tekrar deneyin.', confirmButtonText: 'Tamam' });
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
      icon: 'warning', title: 'Emin misiniz?',
      text: 'Bu işlemi silmek istediğinizden emin misiniz?',
      showCancelButton: true, confirmButtonText: 'Evet, Sil', cancelButtonText: 'İptal',
      confirmButtonColor: '#ea5455', cancelButtonColor: '#6b7280'
    });
    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchData();
          Swal.fire({ icon: 'success', title: 'Silindi', text: 'İşlem başarıyla silindi.', timer: 1500, showConfirmButton: false });
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ symbolId: '', date: new Date().toISOString().split('T')[0], type: 'B', price: '', quantity: '', balance: '', note: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</div>
      </div>
    );
  }

  const stats = {
    total: transactions.length,
    buy: transactions.filter(t => t.type === 'B').length,
    sell: transactions.filter(t => t.type === 'S').length,
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>İşlem Kayıtları</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Toplam {stats.total} işlem ({stats.buy} alış, {stats.sell} satış)
          </p>
        </div>
        <div className="flex gap-2">
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
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-md transition-opacity"
            style={{ background: 'var(--success)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <SquareSigma size={18} />
            FIFO
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm); setEditingId(null);
              setFormData({ symbolId: '', date: new Date().toISOString().split('T')[0], type: 'B', price: '', quantity: '', balance: '', note: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-md transition-opacity"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            <Plus size={18} />
            Yeni İşlem
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        {[
          { key: 'all', label: `Tümü (${stats.total})`, color: 'var(--accent)', soft: 'var(--accent-soft)' },
          { key: 'B', label: `Alış (${stats.buy})`, color: 'var(--success)', soft: 'var(--success-soft)', icon: TrendingUp },
          { key: 'S', label: `Satış (${stats.sell})`, color: 'var(--danger)', soft: 'var(--danger-soft)', icon: TrendingDown },
        ].map((f) => {
          const active = filterType === f.key;
          const Icon = 'icon' in f ? f.icon : null;
          return (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: active ? f.color : f.soft,
                color: active ? '#fff' : f.color,
              }}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
              {editingId ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
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
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Sembol *</label>
              <select required value={formData.symbolId}
                onChange={(e) => setFormData({ ...formData, symbolId: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="">Sembol seçin</option>
                {symbols.map((s) => (<option key={s.id} value={s.id}>{s.code || s.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tarih *</label>
              <input type="date" required value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>İşlem Türü *</label>
              <select required value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="B">Alım (B)</option>
                <option value="S">Satım (S)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Fiyat *</label>
              <input type="number" step="0.01" required value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Miktar *</label>
              <input type="number" step="0.01" required value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={inputClass}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            {formData.type === 'B' && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Bakiye</label>
                <input type="number" step="0.01" value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className={inputClass}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            )}
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
              >{editingId ? 'Güncelle' : 'Ekle'}</button>
              <button type="button" onClick={handleCancel}
                className="px-5 py-2 text-sm font-medium rounded-md transition-colors"
                style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
              >İptal</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-table-head)' }}>
                {['Sembol', 'Tarih', 'Tür', 'Fiyat', 'Miktar', 'Not', 'İşlemler'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${[3,4].includes(i) ? 'text-right' : i === 6 ? 'text-right' : 'text-left'}`}
                    style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                  >{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Henüz işlem eklenmemiş</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-heading)' }}>
                      {transaction.symbol.code || transaction.symbol.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{
                          background: transaction.type === 'B' ? 'var(--success-soft)' : 'var(--danger-soft)',
                          color: transaction.type === 'B' ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {transaction.type === 'B' ? (<><TrendingUp className="w-3 h-3" />Alım</>) : (<><TrendingDown className="w-3 h-3" />Satım</>)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {transaction.price.toFixed(6)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {transaction.quantity.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {transaction.note || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEdit(transaction)}
                          className="p-1.5 rounded-md transition-colors" title="Düzenle"
                          style={{ color: 'var(--accent)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-soft)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        ><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(transaction.id)}
                          className="p-1.5 rounded-md transition-colors" title="Sil"
                          style={{ color: 'var(--danger)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger-soft)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        ><Trash2 size={15} /></button>
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
