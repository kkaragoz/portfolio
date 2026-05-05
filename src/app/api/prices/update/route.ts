import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

interface TefasFundInfoItem {
  fundCode: string;
  date: string;
  value: number;
  createdAt: string;
  updatedAt: string;
}

interface TefasFundInfoResponse {
  data?: TefasFundInfoItem[];
  success?: boolean;
  message?: string;
}

interface PendingFundRow {
  row: BalanceRow;
  normalizedCode: string;
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

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function formatDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
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
 * TEFAS API üzerinden fon fiyatlarını toplu olarak çeker
 */
async function fetchTefasFundPrices(codes: string[], date: string): Promise<Map<string, number>> {
  const apiKey = process.env.TEFAS_RAPIDAPI_KEY ?? process.env.RAPIDAPI_KEY;
  const apiHost = process.env.TEFAS_RAPIDAPI_HOST ?? 'tefas-api.p.rapidapi.com';

  if (!apiKey) {
    throw new Error('TEFAS_RAPIDAPI_KEY tanımlı değil');
  }

  const uniqueCodes = Array.from(new Set(codes.map(normalizeCode).filter(Boolean)));
  const prices = new Map<string, number>();

  if (uniqueCodes.length === 0) {
    return prices;
  }

  try {
    for (let index = 0; index < uniqueCodes.length; index += 50) {
      const batch = uniqueCodes.slice(index, index + 50);
      const query = new URLSearchParams({
        offset: '0',
        limit: String(batch.length),
        fundCodes: batch.join(','),
        page: '1',
        date,
        sortBy: 'value',
        sortOrder: 'asc'
      });
      const url = `https://${apiHost}/api/v1/fund-info/by-date?${query.toString()}`;

      console.log(`    → TEFAS URL: ${url}`);

      const response = await axios.get<TefasFundInfoResponse>(url, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
          'x-rapidapi-host': apiHost,
          'x-rapidapi-key': apiKey,
        },
      });

      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data?.message || 'TEFAS API geçersiz yanıt döndürdü');
      }

      console.log(`    → TEFAS batch sonucu: ${response.data.data.length} kayıt`);

      for (const item of response.data.data) {
        const code = typeof item.fundCode === 'string' ? normalizeCode(item.fundCode) : '';
        const value = Number(item.value);

        if (code && Number.isFinite(value) && value > 0) {
          prices.set(code, value);
        }
      }
    }

    console.log(`    → Parse edilen TEFAS fon fiyatı sayısı: ${prices.size}`);

    return prices;
  } catch (error) {
    const errorMessage = getDetailedErrorMessage(error, 'TEFAS fon fiyatları alınamadı');
    console.error(`    ✗ TEFAS fon fiyatı hatası: ${errorMessage}`);
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

function pushFailedPriceUpdate(
  results: PriceUpdateResult[],
  errors: PriceUpdateErrorItem[],
  row: BalanceRow,
  message: string
) {
  results.push({
    symbol: row.name,
    code: row.code ?? 'N/A',
    success: false,
    error: message
  });

  pushPriceUpdateError(errors, row.name, row.code, message);
}

function pushSuccessfulPriceUpdate(
  results: PriceUpdateResult[],
  row: BalanceRow,
  oldPrice: number | undefined,
  newPrice: number
) {
  results.push({
    symbol: row.name,
    code: row.code ?? 'N/A',
    oldPrice,
    newPrice,
    success: true
  });
}

async function upsertDailyPrice(row: BalanceRow, priceToSave: number, today: Date) {
  const lastTransaction = await prisma.transaction.findFirst({
    where: { symbolId: row.id },
    orderBy: { date: 'desc' }
  });

  console.log('  💾 Veritabanına kaydediliyor...');
  console.log(`  📅 Kayıt Tarihi: ${formatDateOnly(today)}`);

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

  return lastTransaction?.price;
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

  const today = getUtcDateOnly();
  const priceDate = formatDateOnly(today);

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

  const results: PriceUpdateResult[] = [];
  const errors: PriceUpdateErrorItem[] = [];
  const pendingFundRows: PendingFundRow[] = [];
  let processedCount = 0;

  for (let i = 0; i < balanceData.length; i++) {
    const row = balanceData[i];
    console.log(`\n[${i + 1}/${balanceData.length}] İşleniyor: ${row.name} (${row.code || 'KOD YOK'})`);
    let deferredFundProcessing = false;

    try {
      if (!row.code) {
        const errorMessage = 'Kod bilgisi eksik';
        console.error(`❌ ${row.name}: ${errorMessage}`);
        pushFailedPriceUpdate(results, errors, row, errorMessage);
        continue;
      }

      let newPrice: number | null = null;
      let requiresUsdConversion = false;
      const marketCategory = row.market_category ?? 'F';
      const isFundLikeMarket = marketCategory !== 'B' && marketCategory !== 'K' && marketCategory !== 'E';

      console.log(`  Market Category: ${row.market_category || 'Belirtilmemiş'}`);

      if (isFundLikeMarket) {
        deferredFundProcessing = true;
        pendingFundRows.push({
          row,
          normalizedCode: normalizeCode(row.code)
        });
        console.log('  → Fon işleme listesine eklendi; TEFAS toplu çağrısından sonra kaydedilecek.');
        continue;
      }

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
      } else if (marketCategory === 'E') {
        console.log('  → YAHOO API kullanılıyor...');
        newPrice = await fetchYAHOOPrice(row.code);
      } else {
        throw new Error(`Desteklenmeyen market category: ${marketCategory}`);
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
        const oldPrice = await upsertDailyPrice(row, priceToSave, today);
        pushSuccessfulPriceUpdate(results, row, oldPrice, priceToSave);
      } else {
        const errorMessage = `${row.code} için fiyat bilgisi boş döndü`;
        console.error(`  ❌ ${errorMessage}`);
        pushFailedPriceUpdate(results, errors, row, errorMessage);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(`  ❌ ${row.name} işlenirken hata oluştu:`, error);
      pushFailedPriceUpdate(results, errors, row, errorMessage);
    } finally {
      if (!deferredFundProcessing) {
        processedCount += 1;
        onEvent?.({ type: 'progress', processed: processedCount, total });
      }
    }
  }

  if (pendingFundRows.length > 0) {
    console.log(`\n=== TEFAS Fon Fiyatları İşleniyor (${pendingFundRows.length}) ===`);

    if (!usdTryRate) {
      const errorMessage = usdTryErrorMessage || 'USD/TRY kuru alınamadığı için TEFAS fon fiyatları kaydedilemedi';
      console.error(`⚠️ ${errorMessage}`);

      for (const pendingFund of pendingFundRows) {
        pushFailedPriceUpdate(results, errors, pendingFund.row, errorMessage);
        processedCount += 1;
        onEvent?.({ type: 'progress', processed: processedCount, total });
      }
    } else {
      try {
        const tefasFundPrices = await fetchTefasFundPrices(
          pendingFundRows.map((pendingFund) => pendingFund.normalizedCode),
          priceDate
        );

        for (const pendingFund of pendingFundRows) {
          const { row, normalizedCode } = pendingFund;
          console.log(`\n[FON] İşleniyor: ${row.name} (${row.code || 'KOD YOK'})`);

          try {
            const tefasPrice = tefasFundPrices.get(normalizedCode);

            if (!tefasPrice || tefasPrice <= 0) {
              throw new Error(`TEFAS yanıtında fon fiyatı bulunamadı: ${row.code}`);
            }

            console.log(`  TEFAS Sonucu: ${tefasPrice.toFixed(6)} TRY`);

            const priceToSave = tefasPrice / usdTryRate;
            console.log(`  💱 TRY → USD dönüşümü: ${tefasPrice.toFixed(6)} TRY = ${priceToSave.toFixed(6)} USD`);

            const oldPrice = await upsertDailyPrice(row, priceToSave, today);
            pushSuccessfulPriceUpdate(results, row, oldPrice, priceToSave);
          } catch (error) {
            const errorMessage = getErrorMessage(error);
            console.error(`  ❌ ${row.name} fonu işlenirken hata oluştu:`, error);
            pushFailedPriceUpdate(results, errors, row, errorMessage);
          } finally {
            processedCount += 1;
            onEvent?.({ type: 'progress', processed: processedCount, total });
          }
        }
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        console.error(`⚠️ TEFAS fon fiyatları alınamadı: ${errorMessage}`);

        for (const pendingFund of pendingFundRows) {
          pushFailedPriceUpdate(results, errors, pendingFund.row, errorMessage);
          processedCount += 1;
          onEvent?.({ type: 'progress', processed: processedCount, total });
        }
      }
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
    processed: processedCount,
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
