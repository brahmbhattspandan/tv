"use client";

import { useState, useEffect, useCallback } from "react";
import DateNav from "@/components/DateNav";
import AddStockForm from "@/components/AddStockForm";
import StockList from "@/components/StockList";
import type { DailyEntry } from "@/db/schema";

export default function DatePage({ date }: { date: string }) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?date=${date}`);
      const data = await res.json();
      setEntries(data);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <>
      <DateNav currentDate={date} />
      <AddStockForm currentDate={date} onAdded={fetchEntries} />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-pulse"
            >
              <div className="h-6 bg-white/10 rounded w-24 mb-3" />
              <div className="h-4 bg-white/10 rounded w-48 mb-4" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-12 bg-white/5 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StockList
          entries={entries}
          onDeleted={fetchEntries}
          onRefreshed={fetchEntries}
          currentDate={date}
        />
      )}
    </>
  );
}
