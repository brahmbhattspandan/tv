import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function getNextWorkingDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 0 || date.getDay() === 6);
  return date.toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  const { fromDate, entryIds } = await request.json();

  if (!fromDate) {
    return NextResponse.json(
      { error: "fromDate is required" },
      { status: 400 }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromDate)) {
    return NextResponse.json(
      { error: "fromDate must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  const session = await getSession();
  const userId = session?.userId ?? null;
  const userCond = userId ? eq(dailyEntries.userId, userId) : isNull(dailyEntries.userId);

  const toDate = getNextWorkingDay(fromDate);

  let sourceEntries;
  if (entryIds && Array.isArray(entryIds) && entryIds.length > 0) {
    sourceEntries = await db
      .select()
      .from(dailyEntries)
      .where(and(eq(dailyEntries.date, fromDate), inArray(dailyEntries.id, entryIds), userCond));
  } else {
    sourceEntries = await db
      .select()
      .from(dailyEntries)
      .where(and(eq(dailyEntries.date, fromDate), userCond));
  }

  if (sourceEntries.length === 0) {
    return NextResponse.json(
      { error: "No entries found to carry forward" },
      { status: 404 }
    );
  }

  let carried = 0;
  let skipped = 0;

  for (const entry of sourceEntries) {
    // Check if already exists on target date
    const existing = await db
      .select()
      .from(dailyEntries)
      .where(
        and(eq(dailyEntries.symbol, entry.symbol), eq(dailyEntries.date, toDate), userCond)
      );

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    await db.insert(dailyEntries).values({
      userId,
      symbol: entry.symbol,
      name: entry.name,
      date: toDate,
      price: entry.price,
      crossing: entry.crossing,
      notes: entry.notes,
      currentPrice: entry.currentPrice,
      previousHigh: entry.previousHigh,
      previousLow: entry.previousLow,
      previousClose: entry.previousClose,
      fiftyTwoWeekHigh: entry.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: entry.fiftyTwoWeekLow,
    });
    carried++;
  }

  return NextResponse.json({ carried, skipped, toDate });
}
