"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Treemap, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface GridData {  
  code: string | null;
  symbol_id?: number | null;
  balance:number | null;
  average_cost:number | null;
  current_price:number | null;
  total_cost:number | null;
  market_value:number | null;
  profit_loss:number | null;
  profit_loss_pct : number | null;
}

interface PerformanceData {
  latest: number | null;
  day1: number | null;
  day5: number | null;
  month1: number | null;
  month3: number | null;
  change_latest: number | null;
}

interface CategoryData {
  category: string;
  value: number;
}

interface ExchangeData {
  unit: string;
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
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<'USD' | 'TRY'>('USD');
  const [usdTry, setUsdTry] = useState<number | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<{ code: string; symbolId: number } | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/reports/grid').then(r => r.json()),
      fetch('/api/reports/category').then(r => r.json()),
      fetch('/api/reports/exchange').then(r => r.json()),
      fetch('/api/reports/portfolio-history').then(r => r.json())
    ]).then(([grid, category, exchange, history]) => {
      setGridData(Array.isArray(grid) ? grid : []);
      setCategoryData(Array.isArray(category) ? category : []);
      setExchangeData(Array.isArray(exchange) ? exchange : []);
      setPortfolioHistory(Array.isArray(history) ? history : []);
      setLoading(false);
    }).catch(err => {
      console.error('Veri yüklenirken hata:', err);
      setLoading(false);
    });
  }, []);

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

  const handleRowClick = async (item: GridData) => {
    if (item.symbol_id) {
      setSelectedSymbol({ code: item.code || '', symbolId: item.symbol_id });
      await fetchPerformance(item.symbol_id);
    }
  };

  const formatPercentage = (value: number | null) => {
    if (value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getColorClass = (value: number | null) => {
    if (value === null) return 'text-gray-500 dark:text-gray-400';
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Raporlar</h1>
          <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
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
    <div className="p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Raporlar</h1>

        {/* 1. Portföy Grid */}
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Portföy Detayları</h2>
            <div className="flex items-center gap-3">              
              <div className="inline-flex rounded-md border border-slate-200 dark:border-slate-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`w-16 py-1 text-sm ${currency === 'USD' ? 'bg-slate-900 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                >USD</button>
                <button
                  type="button"
                  onClick={() => setCurrency('TRY')}
                  className={`w-16 py-1 text-sm ${currency === 'TRY' ? 'bg-slate-900 dark:bg-slate-600 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                >TL</button>
              </div>              
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900 dark:text-gray-100">Kod</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Bakiye</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Ort. Maliyet {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Güncel Fiyat {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Toplam Maliyet {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Piyasa Değeri {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Kar/Zarar {currency === 'TRY' ? '(TL)' : '(USD)'}</th>
                  <th className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">Kar/Zarar %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {[...gridData].sort((a, b) => (a.code || '').localeCompare(b.code || '')).map((item) => {                  
                  return (
                  <tr 
                    key={item.code} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                    onClick={() => item.symbol_id && handleRowClick(item)}
                  >
  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.code}</td>
  
  {/* Bakiye için formatCurrency kullanımı tutarlılık sağlar */}
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{item.balance}</td>
  
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(applyCurrency(item.average_cost))}</td>
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(applyCurrency(item.current_price))}</td>
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency2Digits(applyCurrency(item.total_cost))}</td>
  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency2Digits(applyCurrency(item.market_value))}</td>
  
  {/* Kar/Zarar Tutarı - Boş olan hücre düzeltildi */}
  <td className={`px-4 py-3 text-right font-semibold ${
    (item.profit_loss ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }`}>
    {formatCurrency2Digits(applyCurrency(item.profit_loss))}
  </td>

  {/* Kar/Zarar Oranı (%) */}
  <td className={`px-4 py-3 text-right font-semibold ${
    (item.profit_loss_pct ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  }`}>
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
        <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Portföy Dağılımı</h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3. Kategori Pie Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Kategori Dağılımı</h2>
            <div className="h-[350px]">
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
            </div>
          </div>

          {/* 4. Borsa Pie Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Birim Dağılımı</h2>
            <div className="h-[350px]">
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
            </div>
          </div>
        </div>

        {/* 5. Portföy Değeri Grafiği */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Portföy Değeri Grafiği</h2>
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
      </div>

      {/* Performance Popup */}
      {selectedSymbol && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSymbol(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedSymbol.code} Performans
              </h3>
              <button
                onClick={() => setSelectedSymbol(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingPerformance ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Yükleniyor...</p>
                </div>
              ) : performanceData ? (
                <div className="space-y-4">
                  {/* Son Gün */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      {performanceData.day1 !== null && performanceData.day1 >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Son Gün</span>
                    </div>
                    <span className={`text-lg font-bold ${getColorClass(performanceData.day1)}`}>
                      {formatPercentage(performanceData.day1)}
                    </span>
                  </div>

                  {/* Son 5 Gün */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      {performanceData.day5 !== null && performanceData.day5 >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Son 5 Gün</span>
                    </div>
                    <span className={`text-lg font-bold ${getColorClass(performanceData.day5)}`}>
                      {formatPercentage(performanceData.day5)}
                    </span>
                  </div>

                  {/* Son 1 Ay */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      {performanceData.month1 !== null && performanceData.month1 >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Son 1 Ay</span>
                    </div>
                    <span className={`text-lg font-bold ${getColorClass(performanceData.month1)}`}>
                      {formatPercentage(performanceData.month1)}
                    </span>
                  </div>

                  {/* Son 3 Ay */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      {performanceData.month3 !== null && performanceData.month3 >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Son 3 Ay</span>
                    </div>
                    <span className={`text-lg font-bold ${getColorClass(performanceData.month3)}`}>
                      {formatPercentage(performanceData.month3)}
                    </span>
                  </div>

                  {/* Güncel Fiyat */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Güncel Fiyat</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {performanceData.latest !== null ? `$${performanceData.latest.toFixed(2)}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Performans verisi bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
