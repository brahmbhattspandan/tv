import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import yahooFinance from "@/lib/yahoo";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { date } = await request.json();

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.userId ?? null;
  const userCond = userId ? eq(dailyEntries.userId, userId) : isNull(dailyEntries.userId);

  const entries = await db
    .select()
    .from(dailyEntries)
    .where(and(eq(dailyEntries.date, date), userCond));

  let updated = 0;

  for (const entry of entries) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote: any = await yahooFinance.quote(entry.symbol);
      await db
        .update(dailyEntries)
        .set({
          currentPrice: quote.regularMarketPrice ?? null,
          previousHigh: quote.regularMarketDayHigh ?? null,
          previousLow: quote.regularMarketDayLow ?? null,
          previousClose: quote.regularMarketPreviousClose ?? null,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
        })
        .where(eq(dailyEntries.id, entry.id));
      updated++;
    } catch {
      // Skip failed quotes
    }
  }

  return NextResponse.json({ updated });
}
