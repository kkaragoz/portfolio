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
  RefreshCw,
  HardDrive,
  AlertTriangle,
  X
} from "lucide-react";

interface Stats {
  totalSymbols: number;
  totalTransactions: number;
  totalBuyTransactions: number;
  totalSellTransactions: number;
}

interface DashboardTransaction {
  type: string;
}

interface MarketRates {
  usdTry: number | null;
  btcUsd: number | null;
}

interface PortfolioSummary {
  portfolio_cost: number;
  portfolio_value: number;
}

interface PriceUpdateErrorItem {
  symbol: string;
  code: string;
  message: string;
}

type PriceUpdateStreamEvent =
  | { type: 'start'; total: number; processed: number }
  | { type: 'progress'; total: number; processed: number }
  | { type: 'complete'; total: number; processed: number; message: string; errors?: PriceUpdateErrorItem[] }
  | { type: 'error'; message: string };

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
  const [priceUpdateErrors, setPriceUpdateErrors] = useState<PriceUpdateErrorItem[]>([]);
  const [showPriceUpdateErrors, setShowPriceUpdateErrors] = useState(false);
  const [marketRates, setMarketRates] = useState<MarketRates>({
    usdTry: null,
    btcUsd: null,
  });
  const [marketRatesLoading, setMarketRatesLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    portfolio_cost: 0,
    portfolio_value: 0,
  });
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchMarketRates();
    fetchPortfolioSummary();
    setIsLocalhost(['localhost', '127.0.0.1'].includes(window.location.hostname));
  }, []);

  const fetchStats = async () => {
    try {
      const [symbolsRes, transactionsRes] = await Promise.all([
        fetch('/api/symbols'),
        fetch('/api/transactions'),
      ]);
      
      const symbols = await symbolsRes.json() as unknown[];
      const transactions = await transactionsRes.json() as DashboardTransaction[];

      const buyCount = transactions.filter((transaction) => transaction.type === 'B').length;
      const sellCount = transactions.filter((transaction) => transaction.type === 'S').length;

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

  const fetchPortfolioSummary = async () => {
    try {
      const response = await fetch('/api/reports/summary');
      const data = await response.json();
      
      setPortfolioSummary({
        portfolio_cost: data.portfolio_cost || 0,
        portfolio_value: data.portfolio_value || 0,
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const updatePrices = async () => {
    setPriceUpdateLoading(true);
    setPriceUpdateResult(null);
    setPriceUpdateErrors([]);
    setShowPriceUpdateErrors(false);
    
    try {
      const response = await fetch('/api/prices/update', {
        method: 'POST',
      });

      if (!response.ok) {
        let errorMessage = 'Fiyatlar güncellenirken hata oluştu';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // JSON olmayan hata yanıtlarında varsayılan mesajı koru.
        }

        throw new Error(errorMessage);
      }
      
      if (!response.body) {
        throw new Error('Yanıt gövdesi alınamadı');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let lastMessage = '';
      let collectedErrors: PriceUpdateErrorItem[] = [];

      const processStreamEvent = (rawEvent: string) => {
        const dataLine = rawEvent
          .split('\n')
          .find((line) => line.startsWith('data: '));

        if (!dataLine) {
          return;
        }

        try {
          const event = JSON.parse(dataLine.slice(6)) as PriceUpdateStreamEvent;

          if (event.type === 'complete') {
            lastMessage = event.message || 'Fiyatlar güncellendi';
            collectedErrors = Array.isArray(event.errors) ? event.errors : [];
          } else if (event.type === 'error') {
            lastMessage = `Hata: ${event.message}`;
          } else if (event.type === 'progress') {
            lastMessage = `${event.processed}/${event.total} işleniyor...`;
          }
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();

        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const rawEvents = buffer.split('\n\n');
        buffer = rawEvents.pop() || '';

        for (const rawEvent of rawEvents) {
          processStreamEvent(rawEvent);
        }

        if (done) {
          break;
        }
      }

      if (buffer.trim()) {
        processStreamEvent(buffer);
      }

      setPriceUpdateResult(lastMessage || 'Fiyatlar güncellendi');

      if (collectedErrors.length > 0) {
        setPriceUpdateErrors(collectedErrors);
        setShowPriceUpdateErrors(true);
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      setPriceUpdateResult(error instanceof Error ? `Hata: ${error.message}` : 'Fiyatlar güncellenirken hata oluştu');
    } finally {
      setPriceUpdateLoading(false);
      
      setTimeout(() => {
        setPriceUpdateResult(null);
      }, 5000);
    }
  };

  const backupDatabase = async () => {
    setBackupLoading(true);
    setBackupResult(null);

    try {
      const response = await fetch('/api/backup', { method: 'POST' });
      const data = await response.json();

      if (data.ok) {
        setBackupResult(`${data.message}: ${data.path}`);
      } else {
        setBackupResult(`Hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Backup error:', error);
      setBackupResult('Yedek alınırken hata oluştu');
    } finally {
      setBackupLoading(false);
      setTimeout(() => {
        setBackupResult(null);
      }, 5000);
    }
  };

  const statCards = [
    {
      title: "Toplam Sembol",
      value: stats.totalSymbols,
      icon: Tag,
      color: "#696cff",
      softBg: "var(--accent-soft)",
      link: "/symbols"
    },
    {
      title: "Toplam İşlem",
      value: stats.totalTransactions,
      icon: ArrowLeftRight,
      color: "#00bad1",
      softBg: "var(--info-soft)",
      link: "/transactions"
    },
    {
      title: "Alış İşlemi",
      value: stats.totalBuyTransactions,
      icon: TrendingUp,
      color: "#28c76f",
      softBg: "var(--success-soft)",
      link: "/transactions"
    },
    {
      title: "Satış İşlemi",
      value: stats.totalSellTransactions,
      icon: TrendingDown,
      color: "#ea5455",
      softBg: "var(--danger-soft)",
      link: "/transactions"
    },
  ];

  const quickActions = [
    {
      title: "Sembol Ekle",
      description: "Yeni bir finansal sembol ekleyin",
      icon: Tag,
      href: "/symbols",
      color: "#696cff",
      softBg: "var(--accent-soft)",
    },
    {
      title: "İşlem Kaydet",
      description: "Alım veya satım işlemi ekleyin",
      icon: ArrowLeftRight,
      href: "/transactions",
      color: "#00bad1",
      softBg: "var(--info-soft)",
    },
    {
      title: "Rapor Görüntüle",
      description: "Detaylı analiz ve raporlar",
      icon: BarChart3,
      href: "/reports",
      color: "#28c76f",
      softBg: "var(--success-soft)",
    },
  ];

  const profitLoss = portfolioSummary.portfolio_value - portfolioSummary.portfolio_cost;
  const profitLossPct = portfolioSummary.portfolio_cost > 0
    ? (profitLoss / portfolioSummary.portfolio_cost) * 100
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Portföy yönetim sisteminize hoş geldiniz
        </p>        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link key={index} href={card.link} className="card p-5 group">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: card.softBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <span
                  className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  Detay →
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{card.title}</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-heading)' }}>
                {loading ? "..." : card.value}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Market Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#28c76f' }}>
                Döviz Kuru
              </p>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-heading)' }}>USD/TRY</h3>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--success-soft)' }}>
              <DollarSign className="w-5 h-5" style={{ color: '#28c76f' }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>
            {marketRatesLoading ? (
              <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>...</span>
            ) : marketRates.usdTry ? (
              `₺${marketRates.usdTry.toFixed(2)}`
            ) : (
              <span className="text-lg" style={{ color: 'var(--text-muted)' }}>Veri yok</span>
            )}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Anlık döviz kuru bilgisi</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ff9f43' }}>
                Kripto Para
              </p>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-heading)' }}>BTC/USD</h3>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--warning-soft)' }}>
              <TrendingUp className="w-5 h-5" style={{ color: '#ff9f43' }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>
            {marketRatesLoading ? (
              <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>...</span>
            ) : marketRates.btcUsd ? (
              `$${marketRates.btcUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
            ) : (
              <span className="text-lg" style={{ color: 'var(--text-muted)' }}>Veri yok</span>
            )}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Bitcoin anlık fiyatı</p>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#696cff' }}>Portföy</p>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-heading)' }}>Toplam Maliyet</h3>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
              <Package className="w-5 h-5" style={{ color: '#696cff' }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>
            {portfolioLoading ? (
              <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>...</span>
            ) : (
              `$${portfolioSummary.portfolio_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Portföy toplam alış maliyeti</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00bad1' }}>Portföy</p>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-heading)' }}>Piyasa Değeri</h3>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--info-soft)' }}>
              <Activity className="w-5 h-5" style={{ color: '#00bad1' }} />
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: 'var(--text-heading)' }}>
            {portfolioLoading ? (
              <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>...</span>
            ) : (
              `$${portfolioSummary.portfolio_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Portföy güncel piyasa değeri</p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: profitLoss >= 0 ? '#28c76f' : '#ea5455' }}>
                Portföy
              </p>
              <h3 className="text-lg font-bold mt-1" style={{ color: 'var(--text-heading)' }}>Kar / Zarar</h3>
            </div>
            <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: profitLoss >= 0 ? 'var(--success-soft)' : 'var(--danger-soft)' }}>
              {profitLoss >= 0 ? (
                <TrendingUp className="w-5 h-5" style={{ color: '#28c76f' }} />
              ) : (
                <TrendingDown className="w-5 h-5" style={{ color: '#ea5455' }} />
              )}
            </div>
          </div>
          <p className="text-3xl font-bold" style={{ color: profitLoss >= 0 ? '#28c76f' : '#ea5455' }}>
            {portfolioLoading ? (
              <span className="animate-pulse" style={{ color: 'var(--text-muted)' }}>...</span>
            ) : (
              `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </p>
          {!portfolioLoading && (
            <p className="text-xs font-semibold mt-2" style={{ color: profitLoss >= 0 ? '#28c76f' : '#ea5455' }}>
              {profitLossPct >= 0 ? '+' : ''}{profitLossPct.toFixed(2)}%
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-heading)' }}>
          Hızlı İşlemler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href} className="card p-5 group">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center mb-3"
                  style={{ background: action.softBg }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <h3
                  className="text-sm font-semibold mb-1 group-hover:underline"
                  style={{ color: 'var(--text-heading)' }}
                >
                  {action.title}
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {action.description}
                </p>
              </Link>
            );
          })}

          {/* Backup — only on localhost */}
          {isLocalhost && (
            <div className="card p-5">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center mb-3"
                style={{ background: 'var(--danger-soft)' }}
              >
                <HardDrive className="w-5 h-5" style={{ color: '#ea5455' }} />
              </div>
              <h3
                className="text-sm font-semibold mb-1"
                style={{ color: 'var(--text-heading)' }}
              >
                Veritabanı Yedeği
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                PostgreSQL veritabanının yedeğini alın
              </p>
              <button
                onClick={backupDatabase}
                disabled={backupLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#ea5455' }}
                onMouseEnter={(e) => { if (!backupLoading) e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <HardDrive className={`w-3.5 h-3.5 ${backupLoading ? 'animate-pulse' : ''}`} />
                {backupLoading ? 'Yedekleniyor...' : 'Yedek Al'}
              </button>
              {backupResult && (
                <div className="mt-2 p-2 rounded text-xs" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
                  {backupResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Price Update */}
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
              Fiyat Güncellemeleri
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Portföyünüzdeki varlıkların güncel fiyatlarını alın
            </p>
          </div>
          <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: 'var(--warning-soft)' }}>
            <DollarSign className="w-5 h-5" style={{ color: '#ff9f43' }} />
          </div>
        </div>
        
        <button
          onClick={updatePrices}
          disabled={priceUpdateLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#ff9f43' }}
          onMouseEnter={(e) => { if (!priceUpdateLoading) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <RefreshCw className={`w-4 h-4 ${priceUpdateLoading ? 'animate-spin' : ''}`} />
          {priceUpdateLoading ? 'Güncelleniyor...' : 'Güncel Fiyatları Getir'}
        </button>

        {priceUpdateResult && (
          <div className="mt-3 p-3 rounded-md text-sm" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)' }}>
            {priceUpdateResult}
          </div>
        )}

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Kaynak: BIST (Borsa İstanbul), TEFAS, ve Kripto Para Borsaları
          </p>
        </div>
      </div>

      {showPriceUpdateErrors && priceUpdateErrors.length > 0 && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPriceUpdateErrors(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="price-update-errors-title"
            className="card w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ background: 'var(--danger-soft)' }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: '#ea5455' }} />
                </div>
                <div>
                  <h3 id="price-update-errors-title" className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                    Fiyat Güncelleme Hataları
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {priceUpdateErrors.length} kayıt işlenemedi. Detaylar aşağıda listeleniyor.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPriceUpdateErrors(false)}
                className="p-1.5 rounded-md transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {priceUpdateErrors.map((errorItem, index) => (
                <div
                  key={`${errorItem.code}-${index}`}
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>
                        {errorItem.symbol}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Kod: {errorItem.code}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-[11px] font-semibold"
                      style={{ background: 'var(--danger-soft)', color: '#ea5455' }}
                    >
                      Hata
                    </span>
                  </div>

                  <p className="text-sm mt-3 whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                    {errorItem.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end p-5" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setShowPriceUpdateErrors(false)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white transition-all"
                style={{ background: '#ea5455' }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
