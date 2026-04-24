import { NextResponse } from "next/server";
import yahooFinance from "@/lib/yahoo";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yahooFinance.quote(symbol);
    return NextResponse.json({
      currentPrice: quote.regularMarketPrice ?? null,
      previousHigh: quote.regularMarketDayHigh ?? null,
      previousLow: quote.regularMarketDayLow ?? null,
      previousClose: quote.regularMarketPreviousClose ?? null,
    });
  } catch {
    return NextResponse.json(
      { currentPrice: null, previousHigh: null, previousLow: null, previousClose: null },
    );
  }
}
