import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const symbolId = parseInt(id);

    if (isNaN(symbolId)) {
      return NextResponse.json({ error: 'Geçersiz sembol ID' }, { status: 400 });
    }

    // Sembole ait tüm fiyatları getir (tarihe göre sıralı)
    const prices = await prisma.price.findMany({
      where: { symbolId },
      orderBy: { date: 'desc' },
      take: 100, // Son 100 günü al (3 ay için yeterli)
    });

    if (prices.length === 0) {
      return NextResponse.json({
        latest: null,
        day1: null,
        day5: null,
        month1: null,
        month3: null,
        change_latest: null,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // En son fiyat
    const latestPrice = prices[0];
    
    // İlk günü bul (bugünden küçük ilk tarih)
    const firstPrice = prices.length > 0 ? prices[prices.length - 1] : null;

    // Performans hesaplamaları için tarihleri belirle
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // En yakın fiyatları bul
    const findClosestPrice = (targetDate: Date) => {
      let closest = null;
      let minDiff = Infinity;

      for (const price of prices) {
        const priceDate = new Date(price.date);
        priceDate.setHours(0, 0, 0, 0);
        
        if (priceDate <= targetDate) {
          const diff = Math.abs(targetDate.getTime() - priceDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closest = price;
          }
        }
      }

      return closest;
    };

    const price1Day = findClosestPrice(oneDayAgo);
    const price5Day = findClosestPrice(fiveDaysAgo);
    const price1Month = findClosestPrice(oneMonthAgo);
    const price3Month = findClosestPrice(threeMonthsAgo);

    // Değişim yüzdelerini hesapla
    const calculateChange = (oldPrice: number | null, newPrice: number) => {
      if (!oldPrice || oldPrice === 0) return null;
      return ((newPrice - oldPrice) / oldPrice) * 100;
    };

    const currentPrice = latestPrice.price;

    return NextResponse.json({
      latest: currentPrice,
      day1: price1Day ? calculateChange(price1Day.price, currentPrice) : null,
      day5: price5Day ? calculateChange(price5Day.price, currentPrice) : null,
      month1: price1Month ? calculateChange(price1Month.price, currentPrice) : null,
      month3: price3Month ? calculateChange(price3Month.price, currentPrice) : null,
      change_latest: firstPrice ? calculateChange(firstPrice.price, currentPrice) : null,
    });
  } catch (error) {
    console.error('Performance fetch error:', error);
    return NextResponse.json(
      { error: 'Performans verileri getirilemedi' },
      { status: 500 }
    );
  }
}
