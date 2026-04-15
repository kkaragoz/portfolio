import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const dynamic = 'force-dynamic';

interface BalanceRow {
  id: number;
  name: string;
  code: string | null;
  code1: string | null;
  code2: string | null;
  code3: string | null;
  note: string | null;
  balance: number;
  last_transaction_date: Date | null;
  market_category: string | null;
}

interface PriceUpdateResult {
  symbol: string;
  code: string;
  oldPrice?: number;
  newPrice?: number;
  success: boolean;
  error?: string;
}

interface PriceUpdateErrorItem {
  symbol: string;
  code: string;
  message: string;
}

interface PriceUpdateSummary {
  total: number;
  processed: number;
  successCount: number;
  failCount: number;
  message: string;
  results: PriceUpdateResult[];
  errors: PriceUpdateErrorItem[];
}

type PriceUpdateEvent =
  | { type: 'start'; total: number; processed: number }
  | { type: 'progress'; total: number; processed: number }
  | { type: 'complete'; total: number; processed: number; message: string; errors: PriceUpdateErrorItem[] }
  | { type: 'error'; message: string };

interface UsdTryRateResult {
  rate: number | null;
  errorMessage?: string;
}

/**
 * USD/TRY kurunu çeker
 */
function stringifyErrorPayload(payload: unknown, maxLength = 300): string | null {
  if (payload === null || payload === undefined) {
    return null;
  }

  if (typeof payload === 'string') {
    return payload.length > maxLength ? `${payload.slice(0, maxLength)}...` : payload;
  }

  if (typeof payload === 'number' || typeof payload === 'boolean') {
    return String(payload);
  }

  try {
    const json = JSON.stringify(payload);
    return json.length > maxLength ? `${json.slice(0, maxLength)}...` : json;
  } catch {
    return null;
  }
}

function getDetailedErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    const responseText = stringifyErrorPayload(error.response?.data);
    const parts = [
      error.message,
      error.response?.status ? `Status: ${error.response.status}` : null,
      responseText ? `Response: ${responseText}` : null,
    ].filter((part): part is string => Boolean(part));

    return parts.length > 0 ? parts.join(' | ') : fallbackMessage;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseLocalizedNumber(value: string): number | null {
  const sanitized = value.replace(/[^\d,.-]/g, '').trim();
  if (!sanitized) {
    return null;
  }

  const normalized = sanitized.includes(',')
    ? sanitized.replace(/\./g, '').replace(',', '.')
    : sanitized;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractBloombergFundPrices(html: string): Map<string, number> {
  const $ = cheerio.load(html);
  const table = $('table').filter((_, element) => {
    const headers = $(element)
      .find('thead th')
      .map((__, th) => normalizeText($(th).text()))
      .get();

    return headers[0] === 'Kod' && headers[2] === 'Fiyat';
  }).first();

  const prices = new Map<string, number>();
  if (!table.length) {
    return prices;
  }

  table.find('tbody tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 3) {
      return;
    }

    const code = normalizeText(
      $(cells[0]).find('.font-bold').first().text() || $(cells[0]).text()
    ).toUpperCase();
    const price = parseLocalizedNumber($(cells[2]).text());

    if (code && price !== null) {
      prices.set(code, price);
    }
  });

  return prices;
}

async function fetchUsdTryRate(): Promise<UsdTryRateResult> {
  try {
    console.log('    → USD/TRY kuru alınıyor...');
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (response.data?.rates?.TRY) {
      const rate = parseFloat(response.data.rates.TRY);
      console.log(`    → USD/TRY: ${rate.toFixed(4)}`);
      return { rate };
    }
    
    console.error('    ✗ USD/TRY kuru alınamadı');
    return {
      rate: null,
      errorMessage: 'USD/TRY kuru yanıt içinde bulunamadı'
    };
  } catch (error) {
    console.error('    ✗ USD/TRY fetch error:', error);
    return {
      rate: null,
      errorMessage: getDetailedErrorMessage(error, 'USD/TRY kuru alınamadı')
    };
  }
}



/**
 * BloombergHT karşılaştırma tablosundan tüm fon fiyatlarını tek seferde çeker
 */
async function fetchBloombergFundPrices(): Promise<Map<string, number>> {
  try {
    const url = 'https://www.bloomberght.com/yatirim-fonlari/fon-karsilastirma';
    
    console.log(`    → BloombergHT URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const html = typeof response.data === 'string' ? response.data : String(response.data);
    const prices = extractBloombergFundPrices(html);

    if (prices.size === 0) {
      const errorMessage = `BloombergHT fon fiyat tablosu parse edilemedi. HTML uzunluğu: ${html.length}`;
      console.error(`    ✗ ${errorMessage}`);
      console.log(`    → HTML uzunluğu: ${html.length} karakter`);
      throw new Error(errorMessage);
    }

    console.log(`    → Parse edilen BloombergHT fon fiyatı sayısı: ${prices.size}`);

    return prices;
  } catch (error) {
    const errorMessage = getDetailedErrorMessage(error, 'BloombergHT fon tablosu alınamadı');
    console.error(`    ✗ BloombergHT fon tablosu hatası: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Borsa Istanbul (BIST) hisse fiyatlarını çeker
 */
async function fetchBISTPrice(code: string): Promise<number> {
  try {
    // Borsa Istanbul için ücretsiz API servisleri:
    // 1. Investing.com (Web scraping gerektirir)
    // 2. Yahoo Finance API
    // 3. Alpha Vantage (API key gerektirir)
    
    // Yahoo Finance üzerinden çekelim
    const symbol = code.endsWith('.IS') ? code : `${code}.IS`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    console.log(`    → BIST URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const data = response.data;
    
    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const price = parseFloat(data.chart.result[0].meta.regularMarketPrice);
      console.log(`    → BIST fiyatı: ${price}`);
      return price;
    }

    if (data?.chart?.error) {
      throw new Error(`Yahoo Finance: ${data.chart.error.description || data.chart.error.code || 'Bilinmeyen hata'}`);
    }

    throw new Error(`BIST fiyat bilgisi bulunamadı: ${code}`);
  } catch (error) {
    const errorMessage = getDetailedErrorMessage(error, `BIST fiyatı alınamadı: ${code}`);
    console.error(`    ✗ BIST exception for ${code}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

/**
 * Kripto para fiyatlarını çeker (BTCTURK API)
 */
async function fetchCryptoPrice(code: string): Promise<number> {
  try {
    console.log(`    → BTCTURK: ${code} için fiyat aranıyor...`);
    
    const url = `https://api.btcturk.com/api/v2/ticker?pairSymbol=${code}`;
    console.log(`    → URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0'
      }
    });

    console.log(`    → API Response:`, JSON.stringify(response.data, null, 2));
    
    // Response yapısı: { data: [...], success: true, message: null, code: 0 }
    if (response.data?.success && response.data?.data && response.data.data.length > 0) {
      const ticker = response.data.data[0];
      const price = parseFloat(ticker.last); // Son işlem fiyatı
      
      console.log(`    → Pair: ${ticker.pair}`);
      console.log(`    → Last: ${ticker.last}`);
      console.log(`    → Bid: ${ticker.bid}`);
      console.log(`    → Ask: ${ticker.ask}`);
      console.log(`    → Seçilen fiyat: ${price}`);
      
      if (isNaN(price)) {
        console.error(`    ✗ Fiyat parse edilemedi: ${ticker.last}`);
        throw new Error(`BTCTURK fiyat parse edilemedi: ${ticker.last}`);
      }
      
      return price;
    } else {
      const errorMessage = `BTCTURK API'den geçersiz yanıt. Success: ${response.data?.success}, Data length: ${response.data?.data?.length || 0}, Message: ${response.data?.message ?? 'Yok'}`;
      console.error(`    ✗ ${errorMessage}`);
      throw new Error(errorMessage);
    }
  } catch (error) {
    const errorMessage = getDetailedErrorMessage(error, `BTCTURK fiyatı alınamadı: ${code}`);
    console.error(`    ✗ BTCTURK exception for ${code}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}


/**
 * YAHOO Finance fiyatlarını çeker
 */
async function fetchYAHOOPrice(code: string): Promise<number> {
  try {
    // Borsa Istanbul için ücretsiz API servisleri:
    // 1. Investing.com (Web scraping gerektirir)
    // 2. Yahoo Finance API
    // 3. Alpha Vantage (API key gerektirir)
    
    // Yahoo Finance üzerinden çekelim
    const symbol = code;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    
    console.log(`    → YAHOO URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const data = response.data;
    
    if (data?.chart?.result?.[0]?.meta?.regularMarketPrice) {
      const price = parseFloat(data.chart.result[0].meta.regularMarketPrice);
      console.log(`    → YAHOO fiyatı: ${price}`);
      return price;
    }

    if (data?.chart?.error) {
      throw new Error(`Yahoo Finance: ${data.chart.error.description || data.chart.error.code || 'Bilinmeyen hata'}`);
    }

    throw new Error(`YAHOO fiyat bilgisi bulunamadı: ${code}`);
  } catch (error) {
    const errorMessage = getDetailedErrorMessage(error, `YAHOO fiyatı alınamadı: ${code}`);
    console.error(`    ✗ YAHOO exception for ${code}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

function getUtcDateOnly(date = new Date()) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Bilinmeyen hata';
}

function pushPriceUpdateError(
  errors: PriceUpdateErrorItem[],
  symbol: string,
  code: string | null,
  message: string
) {
  errors.push({
    symbol,
    code: code ?? 'N/A',
    message
  });
}

async function savePortfolioSnapshot() {
  try {
    console.log('\n=== Portföy Değeri Hesaplanıyor ===');
    const portfolioResult = await prisma.$queryRaw<[{ portfolio_value: number }]>`
      SELECT SUM(market_value) AS portfolio_value FROM rep_grid
    `;

    const portfolioValue = portfolioResult[0]?.portfolio_value ?? 0;
    console.log(`💰 Toplam Portföy Değeri: ${portfolioValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`);

    const today = getUtcDateOnly();
    console.log(`📅 Snapshot Tarihi: ${today.toISOString().split('T')[0]}`);

    const snapshot = await prisma.portfolioSnapshot.upsert({
      where: { date: today },
      update: {
        value: portfolioValue,
        updatedAt: new Date()
      },
      create: {
        date: today,
        value: portfolioValue
      }
    });

    console.log(`✅ Portföy değeri kaydedildi (ID: ${snapshot.id})`);
  } catch (snapshotError) {
    console.error('⚠️ Portföy değeri kaydedilemedi:', snapshotError);
    if (snapshotError instanceof Error) {
      console.error('   Hata detayı:', snapshotError.message);
      console.error('   Stack:', snapshotError.stack);
    }
  }
}

async function runPriceUpdate(onEvent?: (event: PriceUpdateEvent) => void): Promise<PriceUpdateSummary> {
  console.log('=== Fiyat Güncelleme İşlemi Başladı ===');
  console.log('Tarih:', new Date().toISOString());

  const { rate: usdTryRate, errorMessage: usdTryErrorMessage } = await fetchUsdTryRate();
  if (!usdTryRate) {
    console.warn(`⚠️ ${usdTryErrorMessage || 'USD/TRY kuru alınamadı. TRY bazlı varlıklar atlanacak.'}`);
  }

  if (usdTryRate) {
    console.log(`\n💱 Dönüşüm Kuru: 1 USD = ${usdTryRate.toFixed(4)} TRY\n`);
  }

  const balanceData = await prisma.$queryRaw<BalanceRow[]>`
    SELECT * FROM vw_balance
  `;

  const total = balanceData.length;
  console.log(`Toplam ${total} sembol bulundu`);

  onEvent?.({ type: 'start', total, processed: 0 });

  if (!balanceData || total === 0) {
    console.warn('⚠️ Güncellenecek kayıt bulunamadı');
    return {
      total: 0,
      processed: 0,
      successCount: 0,
      failCount: 0,
      message: 'Güncellenecek kayıt bulunamadı',
      results: [],
      errors: []
    };
  }

  const needsFundPriceTable = balanceData.some((row) => {
    if (!row.code) {
      return false;
    }

    const marketCategory = row.market_category ?? 'F';
    return marketCategory !== 'B' && marketCategory !== 'K' && marketCategory !== 'E';
  });

  let bloombergFundPrices: Map<string, number> | null = null;
  let bloombergFundPricesError: string | null = null;

  if (needsFundPriceTable) {
    try {
      bloombergFundPrices = await fetchBloombergFundPrices();
    } catch (error) {
      bloombergFundPricesError = getErrorMessage(error);
      console.error(`⚠️ BloombergHT fon tablosu alınamadı: ${bloombergFundPricesError}`);
    }
  }

  const results: PriceUpdateResult[] = [];
  const errors: PriceUpdateErrorItem[] = [];

  for (let i = 0; i < balanceData.length; i++) {
    const row = balanceData[i];
    console.log(`\n[${i + 1}/${balanceData.length}] İşleniyor: ${row.name} (${row.code || 'KOD YOK'})`);

    try {
      if (!row.code) {
        const errorMessage = 'Kod bilgisi eksik';
        console.error(`❌ ${row.name}: ${errorMessage}`);
        results.push({
          symbol: row.name,
          code: 'N/A',
          success: false,
          error: errorMessage
        });
        pushPriceUpdateError(errors, row.name, row.code, errorMessage);
        continue;
      }

      let newPrice: number | null = null;
      let requiresUsdConversion = false;
      const marketCategory = row.market_category ?? 'F';

      console.log(`  Market Category: ${row.market_category || 'Belirtilmemiş'}`);

      if (marketCategory === 'B') {
        requiresUsdConversion = true;
        if (!usdTryRate) {
          throw new Error(usdTryErrorMessage || 'USD/TRY kuru alınamadığı için BIST fiyatı kaydedilemedi');
        }
        console.log('  → BIST API kullanılıyor...');
        newPrice = await fetchBISTPrice(row.code);
      } else if (marketCategory === 'K') {
        if (row.code === 'USDT' || row.code === 'TETHER' || row.code === 'USDC') {
          newPrice = 1;
          console.log('  → TETHER stablecoin olarak 1 USD kabul edildi');
        } else {
          console.log('  → BTCTURK API kullanılıyor...');
          newPrice = await fetchCryptoPrice(row.code);
        }
      } else if (marketCategory === 'F') {
        requiresUsdConversion = true;
        if (!usdTryRate) {
          throw new Error(usdTryErrorMessage || 'USD/TRY kuru alınamadığı için BloombergHT fon fiyatı kaydedilemedi');
        }
        if (!bloombergFundPrices) {
          throw new Error(bloombergFundPricesError || 'BloombergHT fon tablosu yüklenemedi');
        }
        console.log('  → BloombergHT fon tablosu kullanılıyor...');
        newPrice = bloombergFundPrices.get(row.code.trim().toUpperCase()) ?? null;
        if (newPrice === null) {
          throw new Error(`BloombergHT fon tablosunda kod bulunamadı: ${row.code}`);
        }
      } else if (marketCategory === 'E') {
        console.log('  → YAHOO API kullanılıyor...');
        newPrice = await fetchYAHOOPrice(row.code);
      } else {
        requiresUsdConversion = true;
        if (!usdTryRate) {
          throw new Error(usdTryErrorMessage || 'USD/TRY kuru alınamadığı için varsayılan kaynak fiyatı kaydedilemedi');
        }
        if (!bloombergFundPrices) {
          throw new Error(bloombergFundPricesError || 'BloombergHT fon tablosu yüklenemedi');
        }
        console.log('  → Varsayılan: BloombergHT fon tablosu kullanılıyor...');
        newPrice = bloombergFundPrices.get(row.code.trim().toUpperCase()) ?? null;
        if (newPrice === null) {
          throw new Error(`BloombergHT fon tablosunda kod bulunamadı: ${row.code}`);
        }
      }

      console.log(`  API Sonucu: ${newPrice !== null ? newPrice.toFixed(4) : 'BAŞARISIZ'}`);

      if (newPrice !== null && newPrice > 0) {
        let priceToSave = newPrice;

        if (requiresUsdConversion && usdTryRate) {
          priceToSave = newPrice / usdTryRate;
          console.log(`  💱 TRY → USD dönüşümü: ${newPrice.toFixed(4)} TRY = ${priceToSave.toFixed(4)} USD`);
        } else if (marketCategory === 'K') {
          console.log(`  💵 Kripto zaten USD cinsinden: ${priceToSave.toFixed(4)} USD`);
        }

        const lastTransaction = await prisma.transaction.findFirst({
          where: { symbolId: row.id },
          orderBy: { date: 'desc' }
        });

        const today = getUtcDateOnly();

        console.log('  💾 Veritabanına kaydediliyor...');
        console.log(`  📅 Kayıt Tarihi: ${today.toISOString().split('T')[0]}`);
        if (lastTransaction?.price) {
          const change = parseFloat((((priceToSave - lastTransaction.price) / lastTransaction.price * 100).toFixed(2)));
          console.log(`  Son Fiyat: ${lastTransaction.price.toFixed(4)} USD → Yeni Fiyat: ${priceToSave.toFixed(4)} USD (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`);
        }

        await prisma.price.upsert({
          where: {
            symbolId_date: {
              symbolId: row.id,
              date: today
            }
          },
          update: {
            price: priceToSave
          },
          create: {
            symbolId: row.id,
            date: today,
            price: priceToSave
          }
        });

        console.log('  ✅ Başarıyla kaydedildi');

        results.push({
          symbol: row.name,
          code: row.code,
          oldPrice: lastTransaction?.price,
          newPrice: priceToSave,
          success: true
        });
      } else {
        const errorMessage = `${row.code} için fiyat bilgisi boş döndü`;
        console.error(`  ❌ ${errorMessage}`);
        results.push({
          symbol: row.name,
          code: row.code,
          success: false,
          error: errorMessage
        });
        pushPriceUpdateError(errors, row.name, row.code, errorMessage);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(`  ❌ ${row.name} işlenirken hata oluştu:`, error);
      results.push({
        symbol: row.name,
        code: row.code ?? 'N/A',
        success: false,
        error: errorMessage
      });
      pushPriceUpdateError(errors, row.name, row.code, errorMessage);
    } finally {
      onEvent?.({ type: 'progress', processed: i + 1, total });
    }
  }

  const successCount = results.filter((result) => result.success).length;
  const failCount = results.length - successCount;

  console.log('\n=== Fiyat Güncelleme İşlemi Tamamlandı ===');
  console.log(`✅ Başarılı: ${successCount}`);
  console.log(`❌ Başarısız: ${failCount}`);
  console.log(`📊 Toplam: ${results.length}`);

  if (failCount > 0) {
    console.log('\n⚠️ Başarısız işlemler:');
    results.filter((result) => !result.success).forEach((result) => {
      console.log(`  - ${result.symbol} (${result.code}): ${result.error}`);
    });
  }

  if (errors.length > 0) {
    console.log('\n🧾 Hata Listesi:');
    errors.forEach((errorItem) => {
      console.log(`  - ${errorItem.symbol} (${errorItem.code}): ${errorItem.message}`);
    });
  }

  await savePortfolioSnapshot();

  return {
    total: results.length,
    processed: results.length,
    successCount,
    failCount,
    message: `${successCount} / ${results.length} fiyat başarıyla güncellendi`,
    results,
    errors
  };
}

function buildErrorResponse(error: unknown, message: string, status = 500) {
  const errorMessage = getErrorMessage(error);

  return NextResponse.json(
    {
      error: message,
      message: errorMessage
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET tanımlı değil' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Yetkisiz istek' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  try {
    const summary = await runPriceUpdate();

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('\n🚨 HATA: Cron fiyat güncelleme işlemi başarısız oldu!');
    console.error('Hata Detayı:', error);
    return buildErrorResponse(error, 'Fiyat güncellenirken hata oluştu');
  }
}

export async function POST() {
  try {
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: PriceUpdateEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          const summary = await runPriceUpdate(sendEvent);
          sendEvent({
            type: 'complete',
            total: summary.total,
            processed: summary.processed,
            message: summary.message,
            errors: summary.errors
          });
        } catch (error) {
          console.error('\n🚨 HATA: Fiyat güncelleme işlemi başarısız oldu!');
          console.error('Hata Detayı:', error);

          const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
          sendEvent({ type: 'error', message: errorMessage });
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error) {
    console.error('\n🚨 HATA: Streaming başlatılamadı!');
    console.error('Hata Detayı:', error);

    return buildErrorResponse(error, 'Fiyat güncellenirken hata oluştu');
  }
}
