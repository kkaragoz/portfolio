"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SymbolDetail {
  id: number;
  name: string;
  code: string | null;
  code1: string | null;
  code2: string | null;
  code3: string | null;
  note: string | null;
  url: string | null;
}

interface GridData {
  code: string | null;
  name: string | null;
  symbol_id?: number | null;
  balance: number | null;
  average_cost: number | null;
  current_price: number | null;
  total_cost: number | null;
  market_value: number | null;
  profit_loss: number | null;
  profit_loss_pct: number | null;
}

interface PerformanceData {
  latest: number | null;
  day1: number | null;
  day5: number | null;
  month1: number | null;
  month3: number | null;
  change_latest: number | null;
}

interface PricePoint {
  date: string;
  price: number;
}

export default function SymbolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbolId = Number(params.id);

  const [symbol, setSymbol] = useState<SymbolDetail | null>(null);
  const [gridItem, setGridItem] = useState<GridData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [priceChartData, setPriceChartData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    if (isNaN(symbolId)) return;

    Promise.all([
      fetch(`/api/symbols/${symbolId}`).then(r => r.json()),
      fetch('/api/reports/grid').then(r => r.json()),
      fetch(`/api/symbols/${symbolId}/performance`).then(r => r.json()),
    ]).then(([symbolData, gridData, perfData]) => {
      setSymbol(symbolData);
      if (Array.isArray(gridData)) {
        const item = gridData.find((g: GridData) => g.symbol_id === symbolId);
        setGridItem(item || null);
      }
      setPerformance(perfData);
      setLoading(false);
    }).catch(err => {
      console.error('Veri yüklenirken hata:', err);
      setLoading(false);
    });

    // Fiyat grafiği ayrıca yüklenir
    const fetchChart = async () => {
      setLoadingChart(true);
      try {
        const res = await fetch(`/api/reports/price-chart?symbolId=${symbolId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setPriceChartData(data.map((d: any) => ({
            date: new Date(d.date).toLocaleDateString('tr-TR'),
            price: d.price,
          })));
        }
      } catch {
        setPriceChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };
    fetchChart();
  }, [symbolId]);

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

  const formatCurrency2 = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getColorStyle = (value: number | null): React.CSSProperties => {
    if (value === null) return { color: 'var(--text-muted)' };
    return { color: value >= 0 ? 'var(--success)' : 'var(--danger)' };
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-[1000px] mx-auto">
          <p className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!symbol) {
    return (
      <div className="animate-fade-in">
        <div className="max-w-[1000px] mx-auto text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>Sembol bulunamadı.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-[1000px] mx-auto space-y-6">
        {/* Üst bar: Geri butonu + Sembol başlık */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            title="Geri"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
              {symbol.code || symbol.name}
            </h1>
            {symbol.code && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{symbol.name}</p>
            )}
          </div>
          {symbol.url && (
            <a
              href={symbol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <ExternalLink className="w-4 h-4" />
              Web Sayfası
            </a>
          )}
        </div>

        {/* Sembol Bilgi Kartı */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Sembol Bilgileri</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Kod</span>
              <span style={{ color: 'var(--text-primary)' }}>{symbol.code || '-'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Ad</span>
              <span style={{ color: 'var(--text-primary)' }}>{symbol.name}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Birim</span>
              <span style={{ color: 'var(--text-primary)' }}>{symbol.code1 || '-'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Tür</span>
              <span style={{ color: 'var(--text-primary)' }}>{symbol.code2 || '-'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Kod-3</span>
              <span style={{ color: 'var(--text-primary)' }}>{symbol.code3 || '-'}</span>
            </div>
            {symbol.note && (
              <div className="col-span-2 sm:col-span-3">
                <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>Not</span>
                <span className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{symbol.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Portföy Verileri */}
        {gridItem && (
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Portföy Verileri</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    {['Bakiye', 'Ort. Maliyet', 'Güncel Fiyat', 'Toplam Maliyet', 'Piyasa Değeri', 'Kar/Zarar', 'Kar/Zarar %'].map(label => (
                      <th
                        key={label}
                        className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{gridItem.balance}</td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(gridItem.average_cost ?? 0)}</td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(gridItem.current_price ?? 0)}</td>
                    <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency2(gridItem.total_cost ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>{formatCurrency2(gridItem.market_value ?? 0)}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: (gridItem.profit_loss ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {formatCurrency2(gridItem.profit_loss ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: (gridItem.profit_loss_pct ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {(gridItem.profit_loss_pct ?? 0) >= 0 ? '+' : ''}
                      {(gridItem.profit_loss_pct ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performans */}
        {performance && (
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Performans</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {([
                { label: '1 Gün', value: performance.day1 },
                { label: '5 Gün', value: performance.day5 },
                { label: '1 Ay', value: performance.month1 },
                { label: '3 Ay', value: performance.month3 },
              ]).map(item => (
                <div key={item.label} className="text-center p-3 rounded-md" style={{ background: 'var(--bg-input)' }}>
                  <span className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span className="text-lg font-bold" style={getColorStyle(item.value)}>
                    {formatPercentage(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fiyat Grafiği */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Fiyat Grafiği</h2>
          {loadingChart ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Fiyat verileri yükleniyor...</p>
            </div>
          ) : priceChartData.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={Math.max(0, Math.floor(priceChartData.length / 15))}
                  />
                  <YAxis
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value: any) => [Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }), 'Fiyat']}
                    labelStyle={{ color: '#1e293b' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884D8"
                    strokeWidth={2}
                    dot={priceChartData.length <= 60 ? { fill: '#8884D8', r: 3 } : false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: 'var(--text-muted)' }}>Bu sembol için fiyat verisi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
