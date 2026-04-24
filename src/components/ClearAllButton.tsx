"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearAllButton() {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    setClearing(true);
    try {
      await fetch("/api/entries/clear-all", { method: "DELETE" });
      setConfirming(false);
      router.refresh();
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-rose-400">Delete all symbols from all dates?</span>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {clearing ? "Clearing..." : "Yes, Clear All"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
    >
      🗑 Clear All
    </button>
  );
}
