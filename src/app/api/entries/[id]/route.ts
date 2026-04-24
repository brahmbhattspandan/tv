import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyEntries } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth";

function userCond(userId: number | null) {
  return userId ? eq(dailyEntries.userId, userId) : isNull(dailyEntries.userId);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.userId ?? null;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.crossing !== undefined) {
    if (body.crossing !== "above" && body.crossing !== "below") {
      return NextResponse.json({ error: "crossing must be 'above' or 'below'" }, { status: 400 });
    }
    updates.crossing = body.crossing;
  }
  if (body.notes !== undefined) updates.notes = body.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(dailyEntries)
    .set(updates)
    .where(and(eq(dailyEntries.id, numId), userCond(userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.userId ?? null;

  await db.delete(dailyEntries).where(and(eq(dailyEntries.id, numId), userCond(userId)));
  return NextResponse.json({ success: true });
}
