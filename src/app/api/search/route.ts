import { NextRequest, NextResponse } from "next/server";
import yahooFinance from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any = await yahooFinance.search(query, {
      quotesCount: 8,
      newsCount: 0,
    });

    const quotes = (results.quotes || [])
      .filter(
        (q: Record<string, unknown>) =>
          q.quoteType === "EQUITY" && q.symbol && q.shortname
      )
      .map((q: Record<string, unknown>) => ({
        symbol: q.symbol as string,
        name: (q.shortname || q.longname || "") as string,
      }));

    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json([]);
  }
}
