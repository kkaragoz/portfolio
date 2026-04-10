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

interface PriceUpdateSummary {
  total: number;
  processed: number;
  successCount: number;
  failCount: number;
  message: string;
  results: PriceUpdateResult[];
}

type PriceUpdateEvent =
  | { type: 'start'; total: number; processed: number }
  | { type: 'progress'; total: number; processed: number }
  | { type: 'complete'; total: number; processed: number; message: string }
  | { type: 'error'; message: string };

/**
 * USD/TRY kurunu çeker
 */
async function fetchUsdTryRate(): Promise<number | null> {
  try {
    console.log('    → USD/TRY kuru alınıyor...');
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (response.data?.rates?.TRY) {
      const rate = parseFloat(response.data.rates.TRY);
      console.log(`    → USD/TRY: ${rate.toFixed(4)}`);
      return rate;
    }
    
    console.error('    ✗ USD/TRY kuru alınamadı');
    return null;
  } catch (error) {
    console.error('    ✗ USD/TRY fetch error:', error);
    return null;
  }
}



/**
 * Tefas fonlarının güncel fiyatlarını çeker (Web Scraping)
 */
async function fetchTefasPrice(code: string): Promise<number | null> {
  try {
    // Tefas FonAnaliz sayfasından fiyat bilgisini çek
    const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${code}`;
    
    console.log(`    → Tefas URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    // top-list sınıfındaki "Son Fiyat (TL)" bilgisini bul
    let price: number | null = null;
    
    $('.top-list li').each((_, element) => {
      const $li = $(element);
      const liText = $li.text().trim();
      
      // "Son Fiyat" içeren li elemanını bul
      if (liText.includes('Son Fiyat')) {
        const $span = $li.find('span');
        if ($span.length > 0) {
          const priceText = $span.text().trim();
          console.log(`    → Bulunan fiyat metni: "${priceText}"`);
          
          // Nokta binlik ayracı, virgül ondalık ayraç
          // "1.441.371,12" formatını "1441371.12" yapalım
          const cleanPrice = priceText
            .replace(/\./g, '')  // Noktaları kaldır (binlik ayraç)
            .replace(',', '.');  // Virgülü noktaya çevir (ondalık)
          
          price = parseFloat(cleanPrice);
          
          if (isNaN(price)) {
            console.error(`    ✗ Fiyat parse edilemedi: "${priceText}"`);
            price = null;
          } else {
            console.log(`    → Parse edilen fiyat: ${price}`);
          }
        }
      }
    });

    if (price === null) {
      console.error(`    ✗ Tefas fiyat bilgisi bulunamadı: ${code}`);
      // Debug için HTML'in bir kısmını logla
      console.log(`    → HTML uzunluğu: ${html.length} karakter`);
      console.log(`    → .top-list elemanları: ${$('.top-list').length}`);
      console.log(`    → .top-list li elemanları: ${$('.top-list li').length}`);
    }

    return price;
  } catch (error) {
    console.error(`    ✗ Tefas scraping hatası (${code}):`, error);
    if (axios.isAxiosError(error)) {
      console.error(`    ✗ Status: ${error.response?.status}`);
      console.error(`    ✗ Response length: ${error.response?.data?.length || 0} karakter`);
    }
    return null;
  }
}

/**
 * Borsa Istanbul (BIST) hisse fiyatlarını çeker
 */
async function fetchBISTPrice(code: string): Promise<number | null> {
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

    console.error(`    ✗ BIST fiyat bilgisi bulunamadı: ${code}`);
    return null;
  } catch (error) {
    console.error(`    ✗ BIST exception for ${code}:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`    ✗ Status: ${error.response?.status}`);
      console.error(`    ✗ Response: ${JSON.stringify(error.response?.data).substring(0, 200)}`);
    }
    return null;
  }
}

/**
 * Kripto para fiyatlarını çeker (BTCTURK API)
 */
async function fetchCryptoPrice(code: string): Promise<number | null> {
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
        return null;
      }
      
      return price;
    } else {
      console.error(`    ✗ BTCTURK API'den geçersiz yanıt`);
      console.error(`    ✗ Success: ${response.data?.success}`);
      console.error(`    ✗ Data length: ${response.data?.data?.length || 0}`);
      return null;
    }
  } catch (error) {
    console.error(`    ✗ BTCTURK exception for ${code}:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`    ✗ Status: ${error.response?.status}`);
      console.error(`    ✗ Response:`, error.response?.data);
      console.error(`    ✗ Message: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`    ✗ Error message: ${error.message}`);
      console.error(`    ✗ Error stack: ${error.stack}`);
    }
    return null;
  }
}


/**
 * YAHOO Finance fiyatlarını çeker
 */
async function fetchYAHOOPrice(code: string): Promise<number | null> {
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

    console.error(`    ✗ YAHOO fiyat bilgisi bulunamadı: ${code}`);
    return null;
  } catch (error) {
    console.error(`    ✗ YAHOO exception for ${code}:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`    ✗ Status: ${error.response?.status}`);
      console.error(`    ✗ Response: ${JSON.stringify(error.response?.data).substring(0, 200)}`);
    }
    return null;
  }
}

function getUtcDateOnly(date = new Date()) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
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

  const usdTryRate = await fetchUsdTryRate();
  if (!usdTryRate) {
    throw new Error('USD/TRY kuru alınamadı');
  }

  console.log(`\n💱 Dönüşüm Kuru: 1 USD = ${usdTryRate.toFixed(4)} TRY\n`);

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
      results: []
    };
  }

  const results: PriceUpdateResult[] = [];

  for (let i = 0; i < balanceData.length; i++) {
    const row = balanceData[i];
    console.log(`\n[${i + 1}/${balanceData.length}] İşleniyor: ${row.name} (${row.code || 'KOD YOK'})`);

    if (!row.code) {
      console.error(`❌ ${row.name}: Kod bilgisi eksik`);
      results.push({
        symbol: row.name,
        code: 'N/A',
        success: false,
        error: 'Kod bilgisi eksik'
      });
      onEvent?.({ type: 'progress', processed: i + 1, total });
      continue;
    }

    let newPrice: number | null = null;
    console.log(`  Market Category: ${row.market_category || 'Belirtilmemiş'}`);

    if (row.market_category === 'B') {
      console.log('  → BIST API kullanılıyor...');
      newPrice = await fetchBISTPrice(row.code);
    } else if (row.market_category === 'K') {
      if (row.code === 'USDT' || row.code === 'TETHER' || row.code === 'USDC') {
        newPrice = 1;
        console.log('  → TETHER stablecoin olarak 1 USD kabul edildi');
      } else {
        console.log('  → BTCTURK API kullanılıyor...');
        newPrice = await fetchCryptoPrice(row.code);
      }
    } else if (row.market_category === 'F') {
      console.log('  → Tefas API kullanılıyor...');
      newPrice = await fetchTefasPrice(row.code);
    } else if (row.market_category === 'E') {
      console.log('  → YAHOO API kullanılıyor...');
      newPrice = await fetchYAHOOPrice(row.code);
    } else {
      console.log('  → Varsayılan: Tefas API kullanılıyor...');
      newPrice = await fetchTefasPrice(row.code);
    }

    console.log(`  API Sonucu: ${newPrice !== null ? newPrice.toFixed(4) : 'BAŞARISIZ'}`);

    if (newPrice !== null && newPrice > 0) {
      let priceToSave = newPrice;
      if (row.market_category === 'B' || row.market_category === 'F') {
        priceToSave = newPrice / usdTryRate;
        console.log(`  💱 TRY → USD dönüşümü: ${newPrice.toFixed(4)} TRY = ${priceToSave.toFixed(4)} USD`);
      } else if (row.market_category === 'K') {
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
      console.error('  ❌ Fiyat bilgisi alınamadı');
      results.push({
        symbol: row.name,
        code: row.code,
        success: false,
        error: 'Fiyat bilgisi alınamadı'
      });
    }

    onEvent?.({ type: 'progress', processed: i + 1, total });
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

  await savePortfolioSnapshot();

  return {
    total: results.length,
    processed: results.length,
    successCount,
    failCount,
    message: `${successCount} / ${results.length} fiyat başarıyla güncellendi`,
    results
  };
}

function buildErrorResponse(error: unknown, message: string, status = 500) {
  const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';

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
            message: summary.message
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
