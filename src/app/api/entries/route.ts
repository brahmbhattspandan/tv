import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import yahooFinance from "@/lib/yahoo";
import { getSession } from "@/lib/auth";

function userFilter(userId: number | null) {
  return userId ? eq(dailyEntries.userId, userId) : isNull(dailyEntries.userId);
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date param required" }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.userId ?? null;

  const entries = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.date, date), userFilter(userId)))
    .orderBy(dailyEntries.createdAt);

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { symbol, name, date, price, crossing, notes } = body;

  if (!symbol || !date || price === undefined || !crossing) {
    return NextResponse.json(
      { error: "symbol, date, price, and crossing are required" },
      { status: 400 }
    );
  }

  const session = await getSession();
  const userId = session?.userId ?? null;

  // Check for duplicate
  const existing = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.symbol, symbol), eq(dailyEntries.date, date), userFilter(userId)));

  if (existing.length > 0) {
    return NextResponse.json(
      { error: `${symbol} already exists for ${date}` },
      { status: 409 }
    );
  }

  // Fetch live quote data
  let quoteData = {
    currentPrice: null as number | null,
    previousHigh: null as number | null,
    previousLow: null as number | null,
    previousClose: null as number | null,
    fiftyTwoWeekHigh: null as number | null,
    fiftyTwoWeekLow: null as number | null,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote: any = await yahooFinance.quote(symbol);
    quoteData = {
      currentPrice: quote.regularMarketPrice ?? null,
      previousHigh: quote.regularMarketDayHigh ?? null,
      previousLow: quote.regularMarketDayLow ?? null,
      previousClose: quote.regularMarketPreviousClose ?? null,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
    };
  } catch {
    // Continue without quote data
  }

  const [entry] = await db
    .insert(dailyEntries)
    .values({
      userId,
      symbol: symbol.toUpperCase(),
      name: name || "",
      date,
      price: Number(price),
      crossing,
      notes: notes || "",
      currentPrice: quoteData.currentPrice,
      previousHigh: quoteData.previousHigh,
      previousLow: quoteData.previousLow,
      previousClose: quoteData.previousClose,
      fiftyTwoWeekHigh: quoteData.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quoteData.fiftyTwoWeekLow,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
