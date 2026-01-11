"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Treemap, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface GridData {  
  code: string | null;
  balance:number | null;
  average_cost:number | null;
  current_price:number | null;
  total_cost:number | null;
  market_value:number | null;
  profit_loss:number | null;
  profit_loss_pct : number | null;
}

interface CategoryData {
  code2:string;
  value: number;
}

interface ExchangeData {
  code1:string;
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
    name: item.code2,
    value: item.value
  }));

  const exchangeChartData = exchangeData.map(item => ({
    name: item.code1,
    value: item.value
  }));

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
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
                  <tr key={item.code} className="hover:bg-slate-50 dark:hover:bg-slate-700">
  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.code}</td>
  
  {/* Bakiye için formatCurrency kullanımı tutarlılık sağlar */}
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(item.balance ?? 0)}</td>
  
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(applyCurrency(item.average_cost))}</td>
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(applyCurrency(item.current_price))}</td>
  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(applyCurrency(item.total_cost))}</td>
  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(applyCurrency(item.market_value))}</td>
  
  {/* Kar/Zarar Tutarı - Boş olan hücre düzeltildi */}
  <td className={`px-4 py-3 text-right font-semibold ${
    (item.profit_loss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
  }`}>
    {formatCurrency(applyCurrency(item.profit_loss))}
  </td>

  {/* Kar/Zarar Oranı (%) */}
  <td className={`px-4 py-3 text-right font-semibold ${
    (item.profit_loss_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Borsa Dağılımı</h2>
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
    </div>
  );
}
