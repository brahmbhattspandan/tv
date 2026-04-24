import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const dailyEntries = sqliteTable("daily_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  symbol: text("symbol").notNull(),
  name: text("name").notNull().default(""),
  date: text("date").notNull(), // YYYY-MM-DD
  price: real("price").notNull(),
  crossing: text("crossing", { enum: ["above", "below"] }).notNull(),
  notes: text("notes").default(""),
  currentPrice: real("current_price"),
  previousHigh: real("previous_high"),
  previousLow: real("previous_low"),
  previousClose: real("previous_close"),
  fiftyTwoWeekHigh: real("fifty_two_week_high"),
  fiftyTwoWeekLow: real("fifty_two_week_low"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type NewDailyEntry = typeof dailyEntries.$inferInsert;
