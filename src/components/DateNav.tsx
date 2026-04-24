"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function DateNav({ currentDate }: { currentDate: string }) {
  const router = useRouter();

  const goTo = useCallback(
    (date: string) => {
      router.push(`/${date}`);
    },
    [router]
  );

  const isToday = currentDate === todayStr();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
      <button
        onClick={() => goTo(addDays(currentDate, -1))}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-medium"
      >
        ← Prev
      </button>

      <div className="flex items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          {formatDisplayDate(currentDate)}
        </h2>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && goTo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm [color-scheme:dark]"
        />
      </div>

      <button
        onClick={() => goTo(addDays(currentDate, 1))}
        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-medium"
      >
        Next →
      </button>

      {!isToday && (
        <button
          onClick={() => goTo(todayStr())}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors font-medium text-sm"
        >
          Today
        </button>
      )}
    </div>
  );
}
