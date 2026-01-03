import { NextResponse } from 'next/server';
import axios from 'axios';

interface MarketRatesResponse {
  usdTry: number | null;
  btcUsd: number | null;
  error?: string;
}

/**
 * USD/TL kurunu çeker (TCMB veya alternatif API)
 */
async function fetchUsdTryRate(): Promise<number | null> {
  try {
    // Exchangerate API kullanıyoruz (ücretsiz)
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (response.data?.rates?.TRY) {
      return parseFloat(response.data.rates.TRY);
    }
    
    return null;
  } catch (error) {
    console.error('USD/TRY fetch error:', error);
    return null;
  }
}

/**
 * BTC/USD fiyatını çeker
 */
async function fetchBtcUsdRate(): Promise<number | null> {
  try {
    // BTCTURK API'den BTC/USDT paritesini çek
    const response = await axios.get('https://api.btcturk.com/api/v2/ticker?pairSymbol=BTCUSDT');
    
    if (response.data?.success && response.data?.data && response.data.data.length > 0) {
      const ticker = response.data.data[0];
      return parseFloat(ticker.last);
    }
    
    return null;
  } catch (error) {
    console.error('BTC/USD fetch error:', error);
    return null;
  }
}

export async function GET() {
  try {
    const [usdTry, btcUsd] = await Promise.all([
      fetchUsdTryRate(),
      fetchBtcUsdRate(),
    ]);

    const response: MarketRatesResponse = {
      usdTry,
      btcUsd,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Market rates error:', error);
    return NextResponse.json(
      { 
        usdTry: null,
        btcUsd: null,
        error: 'Piyasa verileri alınırken hata oluştu' 
      },
      { status: 500 }
    );
  }
}
