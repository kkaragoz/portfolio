"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Treemap, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useRouter } from 'next/navigation';

interface GridData {  
  code: string | null;
  name: string | null;
  symbol_id?: number | null;
  balance:number | null;
  average_cost:number | null;
  current_price:number | null;
  total_cost:number | null;
  market_value:number | null;
  profit_loss:number | null;
  profit_loss_pct : number | null;
}

interface SymbolOption {
  id: number;
  name: string;
  code: string | null;
}

interface PricePoint {
  date: string;
  price: number;
}

type GridSortField = 'code' | 'balance' | 'average_cost' | 'current_price' | 'total_cost' | 'market_value' | 'profit_loss' | 'profit_loss_pct' | 'day1' | 'day5' | 'month1' | 'month3';
type SortDirection = 'asc' | 'desc';

interface PerformanceGridItem {
  code: string;
  name: string;
  symbolId: number;
  latest: number | null;
  day1: number | null;
  day5: number | null;
  month1: number | null;
  month3: number | null;
}

interface CategoryData {
  category: string;
  value: number;
}

interface ExchangeData {
  unit: string;
  value: number;
}

interface Kod3Data {
  kod3: string;
  value: number;
}

interface PortfolioHistory {
  id: number;
  date: string;
  value: number;
  createdAt: string;
  updatedAt: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

export default function ReportsPage() {
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [exchangeData, setExchangeData] = useState<ExchangeData[]>([]);
  const [kod3Data, setKod3Data] = useState<Kod3Data[]>([]);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'TRY'>('USD');
  const [usdTry, setUsdTry] = useState<number | null>(null);
  const router = useRouter();
  const [gridSortField, setGridSortField] = useState<GridSortField>('code');
  const [gridSortDirection, setGridSortDirection] = useState<SortDirection>('asc');
  const [performanceGrid, setPerformanceGrid] = useState<PerformanceGridItem[]>([]);
  const [loadingPerformanceGrid, setLoadingPerformanceGrid] = useState(false);
  const [symbolList, setSymbolList] = useState<SymbolOption[]>([]);
  const [chartSymbolId, setChartSymbolId] = useState<number | null>(null);
  const [priceChartData, setPriceChartData] = useState<PricePoint[]>([]);
  const [loadingPriceChart, setLoadingPriceChart] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/grid').then(r => r.json()),
      fetch('/api/reports/category').then(r => r.json()),
      fetch('/api/reports/exchange').then(r => r.json()),
      fetch('/api/reports/kod3').then(r => r.json()),
      fetch('/api/reports/portfolio-history').then(r => r.json()),
      fetch('/api/symbols').then(r => r.json())
    ]).then(([grid, category, exchange, kod3, history, symbols]) => {
      setGridData(Array.isArray(grid) ? grid : []);
      setCategoryData(Array.isArray(category) ? category : []);
      setExchangeData(Array.isArray(exchange) ? exchange : []);
      setKod3Data(Array.isArray(kod3) ? kod3 : []);
      setPortfolioHistory(Array.isArray(history) ? history : []);
      if (Array.isArray(symbols)) {
        setSymbolList(symbols.map((s: any) => ({ id: s.id, name: s.name, code: s.code })).sort((a: SymbolOption, b: SymbolOption) => (a.code || '').localeCompare(b.code || '')));
      }
      setLoading(false);
    }).catch(err => {
      console.error('Veri yüklenirken hata:', err);
      setLoading(false);
    });
  }, []);

  // Seçilen sembolün fiyat verilerini çek
  useEffect(() => {
    if (!chartSymbolId) {
      setPriceChartData([]);
      return;
    }
    const fetchPriceChart = async () => {
      setLoadingPriceChart(true);
      try {
        const res = await fetch(`/api/reports/price-chart?symbolId=${chartSymbolId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setPriceChartData(data.map((d: any) => ({
            date: new Date(d.date).toLocaleDateString('tr-TR'),
            price: d.price
          })));
        }
      } catch (e) {
        console.error('Fiyat verileri alınamadı:', e);
        setPriceChartData([]);
      } finally {
        setLoadingPriceChart(false);
      }
    };
    fetchPriceChart();
  }, [chartSymbolId]);

  // USD/TRY kurunu dashboard ile aynı kaynaktan çek
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('/api/market/rates');
        const data = await res.json();
        if (typeof data.usdTry === 'number') {
          setUsdTry(data.usdTry);
        }
      } catch (e) {
        console.error('Kur bilgisi alınamadı:', e);
      }
    };
    fetchRates();
  }, []);



  // Tüm semboller için performans verilerini çek
  useEffect(() => {
    const fetchAllPerformance = async () => {
      if (gridData.length === 0) return;
      
      setLoadingPerformanceGrid(true);
      const promises = gridData
        .filter(item => item.symbol_id)
        .map(async (item) => {
          try {
            const res = await fetch(`/api/symbols/${item.symbol_id}/performance`);
            const data = await res.json();
            return {
              code: item.code || '',
              name: item.name || '',
              symbolId: item.symbol_id!,
              latest: data.latest,
              day1: data.day1,
              day5: data.day5,
              month1: data.month1,
              month3: data.month3
            };
          } catch (e) {
            console.error(`${item.code} için performans verisi alınamadı:`, e);
            return null;
          }
        });

      const results = await Promise.all(promises);
      setPerformanceGrid(results.filter(item => item !== null) as PerformanceGridItem[]);
      setLoadingPerformanceGrid(false);
    };

    fetchAllPerformance();
  }, [gridData]);

  const handleRowClick = (item: GridData) => {
    if (item.symbol_id) {
      router.push(`/symbol/${item.symbol_id}`);
    }
  };

  const handleGridSort = (field: GridSortField) => {
    if (gridSortField === field) {
      setGridSortDirection(gridSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setGridSortField(field);
      setGridSortDirection(field === 'code' ? 'asc' : 'desc');
    }
  };

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
      <div>
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-heading)' }}>Raporlar</h1>
          <p className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const treemapData = [...gridData]
    .sort((a, b) => (b.market_value ?? 0) - (a.market_value ?? 0))
    .map(item => ({
      name: item.code || '',
      size: item.market_value ?? 0,
      value: item.market_value ?? 0
    }));

  const categoryChartData = categoryData.map(item => ({
    name: item.category,
    value: item.value
  }));

  const exchangeChartData = exchangeData.map(item => ({
    name: item.unit,
    value: item.value
  }));

  const kod3ChartData = kod3Data.map(item => ({
    name: item.kod3,
    value: item.value
  }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

const formatCurrency2Digits = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };  
  const applyCurrency = (value: number | null) => {
    const v = value ?? 0;
    if (currency === 'TRY' && usdTry) {
      return v * usdTry;
    }
    return v;
  };

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, value } = props;
    if (width < 50 || height < 40) return null;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[Math.floor(Math.random() * COLORS.length)],
            stroke: '#fff',
            strokeWidth: 2,
            opacity: 0.9
          }}
        />
        <text
            x={x + width / 2}
            y={y + height / 2} // Manuel -8 yerine dominantBaseline kullanmak daha dengeli durur
            textAnchor="middle"
            dominantBaseline="middle" // Metni dikeyde tam ortalar
            fill="#ffffff"
            fontSize={14} // İnce fontlarda okunurluğu artırmak için boyutu 1px artırabilirsiniz
            fontWeight="400" // 'bold' yerine '400' (normal) veya '300' (light) kullanın
            fontFamily="Inter, system-ui, sans-serif" // Daha modern ve okunaklı font ailesi
            letterSpacing="0.02em" // Harf arasına çok hafif boşluk eklemek okunurluğu artırır
          >
          {name}
        </text>        
      </g>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>Raporlar</h1>

        {/* 1. Portföy Grid */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>Portföy Detayları</h2>
            <div className="flex items-center gap-3">              
              <div className="inline-flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className="w-16 py-1 text-xs font-medium rounded-l-md transition-colors"
                  style={{ background: currency === 'USD' ? 'var(--accent)' : 'var(--bg-input)', color: currency === 'USD' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >USD</button>
                <button
                  type="button"
                  onClick={() => setCurrency('TRY')}
                  className="w-16 py-1 text-xs font-medium rounded-r-md transition-colors"
                  style={{ background: currency === 'TRY' ? 'var(--accent)' : 'var(--bg-input)', color: currency === 'TRY' ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                >TL</button>
              </div>              
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-table-head)' }}>
                  {([
                    { field: 'code' as GridSortField, label: 'Kod', align: 'text-left' },
                    { field: 'balance' as GridSortField, label: 'Bakiye', align: 'text-right' },
                    { field: 'average_cost' as GridSortField, label: `Ort. Maliyet ${currency === 'TRY' ? '(TL)' : '(USD)'}`, align: 'text-right' },
                    { field: 'current_price' as GridSortField, label: `Güncel Fiyat ${currency === 'TRY' ? '(TL)' : '(USD)'}`, align: 'text-right' },
                    { field: 'total_cost' as GridSortField, label: `Toplam Maliyet ${currency === 'TRY' ? '(TL)' : '(USD)'}`, align: 'text-right' },
                    { field: 'market_value' as GridSortField, label: `Piyasa Değeri ${currency === 'TRY' ? '(TL)' : '(USD)'}`, align: 'text-right' },
                    { field: 'profit_loss' as GridSortField, label: `Kar/Zarar ${currency === 'TRY' ? '(TL)' : '(USD)'}`, align: 'text-right' },
                    { field: 'profit_loss_pct' as GridSortField, label: 'Kar/Zarar %', align: 'text-right' },
                    { field: 'day1' as GridSortField, label: '1 Gün', align: 'text-right' },
                    { field: 'day5' as GridSortField, label: '5 Gün', align: 'text-right' },
                    { field: 'month1' as GridSortField, label: '1 Ay', align: 'text-right' },
                    { field: 'month3' as GridSortField, label: '3 Ay', align: 'text-right' },
                  ]).map(col => (
                    <th
                      key={col.field}
                      className={`px-4 py-3 ${col.align} text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors`}
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleGridSort(col.field)}
                    >
                      <div className={`flex items-center gap-1 ${col.align === 'text-right' ? 'justify-end' : ''}`}>
                        {col.label}
                        {gridSortField === col.field && (<span className="text-[10px]">{gridSortDirection === 'asc' ? '▲' : '▼'}</span>)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...gridData].map(item => ({
                  ...item,
                  _perf: performanceGrid.find(p => p.symbolId === item.symbol_id)
                })).sort((a, b) => {
                  const perfFields = ['day1', 'day5', 'month1', 'month3'] as const;
                  let aVal: any, bVal: any;
                  if (perfFields.includes(gridSortField as any)) {
                    aVal = a._perf?.[gridSortField as 'day1' | 'day5' | 'month1' | 'month3'] ?? null;
                    bVal = b._perf?.[gridSortField as 'day1' | 'day5' | 'month1' | 'month3'] ?? null;
                  } else if (gridSortField === 'code') {
                    aVal = a.code || '';
                    bVal = b.code || '';
                  } else {
                    aVal = a[gridSortField as keyof GridData] ?? null;
                    bVal = b[gridSortField as keyof GridData] ?? null;
                  }
                  if (aVal === null && bVal === null) return 0;
                  if (aVal === null) return 1;
                  if (bVal === null) return -1;
                  if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return gridSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                  }
                  return gridSortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
                }).map((item) => {
                  const perf = item._perf;
                  return (
                  <tr 
                    key={item.code} 
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-light)' }}
                    onClick={() => item.symbol_id && handleRowClick(item)}
                    title={item.name || ''}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-heading)' }}>{item.code}</td>
  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{item.balance}</td>
  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(applyCurrency(item.average_cost))}</td>
  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(applyCurrency(item.current_price))}</td>
  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>{formatCurrency2Digits(applyCurrency(item.total_cost))}</td>
  <td className="px-4 py-3 text-right font-semibold" style={{ color: 'var(--text-heading)' }}>{formatCurrency2Digits(applyCurrency(item.market_value))}</td>
  <td className="px-4 py-3 text-right font-semibold" style={{ color: (item.profit_loss ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
    {formatCurrency2Digits(applyCurrency(item.profit_loss))}
  </td>
  <td className="px-4 py-3 text-right font-semibold" style={{ color: (item.profit_loss_pct ?? 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
    {(item.profit_loss_pct ?? 0) >= 0 ? '+' : ''}
    {(item.profit_loss_pct ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
  </td>
  <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(perf?.day1 ?? null)}>
    {loadingPerformanceGrid ? '...' : formatPercentage(perf?.day1 ?? null)}
  </td>
  <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(perf?.day5 ?? null)}>
    {loadingPerformanceGrid ? '...' : formatPercentage(perf?.day5 ?? null)}
  </td>
  <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(perf?.month1 ?? null)}>
    {loadingPerformanceGrid ? '...' : formatPercentage(perf?.month1 ?? null)}
  </td>
  <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(perf?.month3 ?? null)}>
    {loadingPerformanceGrid ? '...' : formatPercentage(perf?.month3 ?? null)}
  </td>
</tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Treemap - Kod ve Piyasa Değeri */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Portföy Dağılımı</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                stroke="#fff"
                fill="#8884d8"
                content={<CustomTreemapContent />}
              />
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. Kategori Pie Chart */}
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Kategori Dağılımı</h2>
            <div className="h-[350px]">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${((entry.value / categoryChartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </div>

          {/* 4. Birim Pie Chart */}
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Birim Dağılımı</h2>
            <div className="h-[350px]">
              {exchangeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={exchangeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${((entry.value / exchangeChartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {exchangeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </div>

          {/* 5. Kod3 Pie Chart */}
          <div className="card p-5">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Kod-3 Dağılımı</h2>
            <div className="h-[350px]">
              {kod3ChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kod3ChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name} (${((entry.value / kod3ChartData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {kod3ChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. Portföy Değeri Grafiği */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Portföy Değeri Grafiği</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolioHistory.map(item => ({
                date: new Date(item.date).toLocaleDateString('tr-TR'),
                value: item.value
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fill: '#64748b' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  labelStyle={{ color: '#1e293b' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* 7. Fiyat Grafiği */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Fiyat Grafiği</h2>
          <div className="mb-4">
            <select
              value={chartSymbolId ?? ''}
              onChange={(e) => setChartSymbolId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full max-w-sm px-3 py-2 rounded-md text-sm outline-none transition-colors"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="">Sembol seçiniz...</option>
              {symbolList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code ? `${s.code} - ${s.name}` : s.name}
                </option>
              ))}
            </select>
          </div>
          {loadingPriceChart ? (
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
          ) : chartSymbolId ? (
            <div className="text-center py-8">
              <p style={{ color: 'var(--text-muted)' }}>Bu sembol için fiyat verisi bulunamadı.</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: 'var(--text-muted)' }}>Fiyat grafiğini görüntülemek için bir sembol seçiniz.</p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
