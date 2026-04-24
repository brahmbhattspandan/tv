import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function DELETE() {
  const session = await getSession();
  const userId = session?.userId ?? null;
  const userCond = userId ? eq(dailyEntries.userId, userId) : isNull(dailyEntries.userId);

  await db.delete(dailyEntries).where(userCond);
  return NextResponse.json({ success: true });
}
