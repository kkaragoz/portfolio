"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Treemap, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

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

interface PerformanceData {
  latest: number | null;
  day1: number | null;
  day5: number | null;
  month1: number | null;
  month3: number | null;
  change_latest: number | null;
}

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

type SortField = 'code' | 'latest' | 'day1' | 'day5' | 'month1' | 'month3';
type SortDirection = 'asc' | 'desc';

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
  const [selectedSymbol, setSelectedSymbol] = useState<{ code: string; name: string; symbolId: number } | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [performanceGrid, setPerformanceGrid] = useState<PerformanceGridItem[]>([]);
  const [loadingPerformanceGrid, setLoadingPerformanceGrid] = useState(false);
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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

  // Performans verilerini çek
  const fetchPerformance = async (symbolId: number) => {
    setLoadingPerformance(true);
    try {
      const res = await fetch(`/api/symbols/${symbolId}/performance`);
      const data = await res.json();
      setPerformanceData(data);
    } catch (e) {
      console.error('Performans verileri alınamadı:', e);
      setPerformanceData(null);
    } finally {
      setLoadingPerformance(false);
    }
  };

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
            const data: PerformanceData = await res.json();
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

  const handleRowClick = async (item: GridData) => {
    if (item.symbol_id) {
      setSelectedSymbol({ code: item.code || '', name: item.name || '', symbolId: item.symbol_id });
      await fetchPerformance(item.symbol_id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPerformanceGrid = [...performanceGrid].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Kod</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Bakiye</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Ort. Maliyet {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Güncel Fiyat {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Toplam Maliyet {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Piyasa Değeri {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Kar/Zarar {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Kar/Zarar %</th>
                </tr>
              </thead>
              <tbody>
                {[...gridData].sort((a, b) => (a.code || '').localeCompare(b.code || '')).map((item) => {                  
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

        {/* 6. Performans Raporu */}
        <div className="card p-5">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-heading)' }}>Performans Raporu</h2>
          {loadingPerformanceGrid ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Performans verileri yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--bg-table-head)' }}>
                    <th 
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center gap-2">
                        Kod
                        {sortField === 'code' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>Ad</th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('latest')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Güncel Fiyat
                        {sortField === 'latest' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('day1')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        1 Gün
                        {sortField === 'day1' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('day5')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        5 Gün
                        {sortField === 'day5' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('month1')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        1 Ay
                        {sortField === 'month1' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                      style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}
                      onClick={() => handleSort('month3')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        3 Ay
                        {sortField === 'month3' && (<span>{sortDirection === 'asc' ? '↑' : '↓'}</span>)}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPerformanceGrid.map((item) => (
                    <tr 
                      key={item.symbolId}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-heading)' }}>{item.code}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{item.name}</td>
                      <td className="px-4 py-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {item.latest !== null ? `$${item.latest.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(item.day1)}>
                        {formatPercentage(item.day1)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(item.day5)}>
                        {formatPercentage(item.day5)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(item.month1)}>
                        {formatPercentage(item.month1)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold" style={getColorStyle(item.month3)}>
                        {formatPercentage(item.month3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Performance Popup */}
      {selectedSymbol && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSymbol(null)}
        >
          <div 
            className="card max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                  {selectedSymbol.code}
                </h3>
                {selectedSymbol.name && (
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedSymbol.name}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedSymbol(null)}
                className="p-1.5 rounded-md transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {loadingPerformance ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--accent)' }}></div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
                </div>
              ) : performanceData ? (
                <div className="space-y-4">
                  {/* Son Gün */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-2">
                      {performanceData.day1 !== null && performanceData.day1 >= 0 ? (
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Son Gün</span>
                    </div>
                    <span className="text-lg font-bold" style={getColorStyle(performanceData.day1)}>
                      {formatPercentage(performanceData.day1)}
                    </span>
                  </div>

                  {/* Son 5 Gün */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-2">
                      {performanceData.day5 !== null && performanceData.day5 >= 0 ? (
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Son 5 Gün</span>
                    </div>
                    <span className="text-lg font-bold" style={getColorStyle(performanceData.day5)}>
                      {formatPercentage(performanceData.day5)}
                    </span>
                  </div>

                  {/* Son 1 Ay */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-2">
                      {performanceData.month1 !== null && performanceData.month1 >= 0 ? (
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Son 1 Ay</span>
                    </div>
                    <span className="text-lg font-bold" style={getColorStyle(performanceData.month1)}>
                      {formatPercentage(performanceData.month1)}
                    </span>
                  </div>

                  {/* Son 3 Ay */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
                    <div className="flex items-center gap-2">
                      {performanceData.month3 !== null && performanceData.month3 >= 0 ? (
                        <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Son 3 Ay</span>
                    </div>
                    <span className="text-lg font-bold" style={getColorStyle(performanceData.month3)}>
                      {formatPercentage(performanceData.month3)}
                    </span>
                  </div>

                  {/* Güncel Fiyat */}
                  <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Güncel Fiyat</span>
                      <span className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                        {performanceData.latest !== null ? `$${performanceData.latest.toFixed(2)}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: 'var(--text-muted)' }}>Performans verisi bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
