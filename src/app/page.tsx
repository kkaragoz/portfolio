"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  TrendingDown, 
  Tag, 
  ArrowLeftRight, 
  BarChart3,
  Activity,
  DollarSign,
  Package,
  RefreshCw
} from "lucide-react";

interface Stats {
  totalSymbols: number;
  totalTransactions: number;
  totalBuyTransactions: number;
  totalSellTransactions: number;
}

interface MarketRates {
  usdTry: number | null;
  btcUsd: number | null;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    totalSymbols: 0,
    totalTransactions: 0,
    totalBuyTransactions: 0,
    totalSellTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [priceUpdateLoading, setPriceUpdateLoading] = useState(false);
  const [priceUpdateResult, setPriceUpdateResult] = useState<string | null>(null);
  const [marketRates, setMarketRates] = useState<MarketRates>({
    usdTry: null,
    btcUsd: null,
  });
  const [marketRatesLoading, setMarketRatesLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchMarketRates();
  }, []);

  const fetchStats = async () => {
    try {
      const [symbolsRes, transactionsRes] = await Promise.all([
        fetch('/api/symbols'),
        fetch('/api/transactions'),
      ]);
      
      const symbols = await symbolsRes.json();
      const transactions = await transactionsRes.json();

      const buyCount = transactions.filter((t: any) => t.type === 'B').length;
      const sellCount = transactions.filter((t: any) => t.type === 'S').length;

      setStats({
        totalSymbols: symbols.length,
        totalTransactions: transactions.length,
        totalBuyTransactions: buyCount,
        totalSellTransactions: sellCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketRates = async () => {
    try {
      const response = await fetch('/api/market/rates');
      const data = await response.json();
      
      setMarketRates({
        usdTry: data.usdTry,
        btcUsd: data.btcUsd,
      });
    } catch (error) {
      console.error('Error fetching market rates:', error);
    } finally {
      setMarketRatesLoading(false);
    }
  };

  const updatePrices = async () => {
    setPriceUpdateLoading(true);
    setPriceUpdateResult(null);
    
    try {
      const response = await fetch('/api/prices/update', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPriceUpdateResult(data.message || 'Fiyatlar güncellendi');
      } else {
        setPriceUpdateResult(data.error || 'Hata oluştu');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      setPriceUpdateResult('Fiyatlar güncellenirken hata oluştu');
    } finally {
      setPriceUpdateLoading(false);
      
      // 5 saniye sonra mesajı temizle
      setTimeout(() => {
        setPriceUpdateResult(null);
      }, 5000);
    }
  };

  const statCards = [
    {
      title: "Toplam Sembol",
      value: stats.totalSymbols,
      icon: Tag,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      link: "/symbols"
    },
    {
      title: "Toplam İşlem",
      value: stats.totalTransactions,
      icon: ArrowLeftRight,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      link: "/transactions"
    },
    {
      title: "Alış İşlemi",
      value: stats.totalBuyTransactions,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      link: "/transactions"
    },
    {
      title: "Satış İşlemi",
      value: stats.totalSellTransactions,
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      iconColor: "text-red-600 dark:text-red-400",
      link: "/transactions"
    },
  ];

  const quickActions = [
    {
      title: "Sembol Ekle",
      description: "Yeni bir finansal sembol ekleyin",
      icon: Tag,
      href: "/symbols",
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "İşlem Kaydet",
      description: "Alım veya satım işlemi ekleyin",
      icon: ArrowLeftRight,
      href: "/transactions",
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Rapor Görüntüle",
      description: "Detaylı analiz ve raporlar",
      icon: BarChart3,
      href: "/reports",
      color: "from-green-500 to-green-600"
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Portföy yönetim sisteminize hoş geldiniz
        </p>        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              href={card.link}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Detay →
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? "..." : card.value}
                  </p>
                </div>
              </div>
              <div className={`h-1 bg-gradient-to-r ${card.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
            </Link>
          );
        })}
      </div>

      {/* Market Rates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USD/TRY Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl shadow-sm p-6 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                Döviz Kuru
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                USD/TRY
              </h3>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
              <DollarSign className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {marketRatesLoading ? (
                <span className="animate-pulse">...</span>
              ) : marketRates.usdTry ? (
                `₺${marketRates.usdTry.toFixed(2)}`
              ) : (
                <span className="text-2xl text-gray-400">Veri yok</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anlık döviz kuru bilgisi
            </p>
          </div>
        </div>

        {/* BTC/USD Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl shadow-sm p-6 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                Kripto Para
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                BTC/USD
              </h3>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
              <TrendingUp className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {marketRatesLoading ? (
                <span className="animate-pulse">...</span>
              ) : marketRates.btcUsd ? (
                `$${marketRates.btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              ) : (
                <span className="text-2xl text-gray-400">Veri yok</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Bitcoin anlık fiyatı
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={index}
                href={action.href}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Price Update Card */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl shadow-sm p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Fiyat Güncellemeleri
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Portföyünüzdeki varlıkların güncel fiyatlarını alın
            </p>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        
        <button
          onClick={updatePrices}
          disabled={priceUpdateLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          <RefreshCw className={`w-5 h-5 ${priceUpdateLoading ? 'animate-spin' : ''}`} />
          {priceUpdateLoading ? 'Güncelleniyor...' : 'Güncel Fiyatları Getir'}
        </button>

        {priceUpdateResult && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {priceUpdateResult}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kaynak: BIST (Borsa İstanbul), TEFAS, ve Kripto Para Borsaları
          </p>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Son Aktiviteler
          </h2>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz aktivite bulunmuyor</p>
        </div>
      </div>
    </div>
  );
}
