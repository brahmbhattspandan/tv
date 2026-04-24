"use client";

import { useState, useMemo, useEffect } from "react";
import type { DailyEntry } from "@/db/schema";

interface StockListProps {
  entries: DailyEntry[];
  onDeleted: () => void;
  onRefreshed: () => void;
  currentDate: string;
}

type SortKey = "symbol" | "change" | "proximity" | "crossed";
type FilterKey = "all" | "crossed" | "not-crossed" | "near-target";
type ViewMode = "simple" | "advanced";

const VIEW_MODE_KEY = "stock-scanner-view-mode";

function PriceCell({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-300">
        {value !== null ? `$${value.toFixed(2)}` : "—"}
      </div>
    </div>
  );
}

function getPercentChange(current: number | null, prevClose: number | null): number | null {
  if (current === null || prevClose === null || prevClose === 0) return null;
  return ((current - prevClose) / prevClose) * 100;
}

function getProximity(entry: DailyEntry): number | null {
  if (entry.currentPrice === null || entry.price === 0) return null;
  return ((entry.currentPrice - entry.price) / entry.price) * 100;
}

function isCrossed(entry: DailyEntry): boolean {
  return (
    entry.currentPrice !== null &&
    ((entry.crossing === "above" && entry.currentPrice > entry.price) ||
      (entry.crossing === "below" && entry.currentPrice < entry.price))
  );
}

function getProximityColor(entry: DailyEntry): string {
  const prox = getProximity(entry);
  if (prox === null) return "text-gray-400";
  const absDist = Math.abs(prox);
  if (isCrossed(entry)) return "text-emerald-400";
  if (absDist <= 2) return "text-amber-300 animate-pulse";
  if (absDist <= 5) return "text-amber-400";
  return "text-gray-400";
}

function getProximityBadge(entry: DailyEntry): string | null {
  if (isCrossed(entry)) return null;
  const prox = getProximity(entry);
  if (prox === null) return null;
  const absDist = Math.abs(prox);
  if (absDist <= 2) return "NEAR TARGET";
  if (absDist <= 5) return "APPROACHING";
  return null;
}

function exportToCSV(entries: DailyEntry[], date: string) {
  const headers = ["Symbol", "Name", "Target Price", "Crossing", "Current Price", "% Change", "% to Target", "Prev Close", "High", "Low", "52W High", "52W Low", "Crossed", "Notes"];
  const rows = entries.map((e) => {
    const pctChange = getPercentChange(e.currentPrice, e.previousClose);
    const proximity = getProximity(e);
    return [
      e.symbol,
      e.name,
      e.price.toFixed(2),
      e.crossing.toUpperCase(),
      e.currentPrice?.toFixed(2) ?? "",
      pctChange !== null ? pctChange.toFixed(2) + "%" : "",
      proximity !== null ? proximity.toFixed(2) + "%" : "",
      e.previousClose?.toFixed(2) ?? "",
      e.previousHigh?.toFixed(2) ?? "",
      e.previousLow?.toFixed(2) ?? "",
      e.fiftyTwoWeekHigh?.toFixed(2) ?? "",
      e.fiftyTwoWeekLow?.toFixed(2) ?? "",
      isCrossed(e) ? "YES" : "NO",
      e.notes ?? "",
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stock-scanner-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StockList({ entries, onDeleted, onRefreshed, currentDate }: StockListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [carryingForward, setCarryingForward] = useState(false);
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<SortKey>("symbol");
  const [filterBy, setFilterBy] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editCrossing, setEditCrossing] = useState<"above" | "below">("above");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("simple");

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === "simple" || saved === "advanced") {
      setViewMode(saved);
    }
  }, []);

  const toggleViewMode = () => {
    const next: ViewMode = viewMode === "simple" ? "advanced" : "simple";
    setViewMode(next);
    localStorage.setItem(VIEW_MODE_KEY, next);
  };

  const isAdvanced = viewMode === "advanced";

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((e) => e.id)));
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const startEdit = (entry: DailyEntry) => {
    setEditingId(entry.id);
    setEditPrice(entry.price.toString());
    setEditCrossing(entry.crossing);
    setEditNotes(entry.notes || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(editPrice),
          crossing: editCrossing,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        onRefreshed();
        showToast("Entry updated");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to update");
      }
    } catch {
      showToast("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/entries/${id}`, { method: "DELETE" });
      onDeleted();
      showToast("Entry deleted");
    } catch {
      showToast("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/entries/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentDate }),
      });
      const data = await res.json();
      showToast(`Refreshed ${data.updated} price(s)`);
      onRefreshed();
    } catch {
      showToast("Failed to refresh prices");
    } finally {
      setRefreshing(false);
    }
  };

  const handleCarryForward = async () => {
    setCarryingForward(true);

    try {
      const res = await fetch("/api/entries/carry-forward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDate: currentDate,
          entryIds: selected.size > 0 ? Array.from(selected) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Carried ${data.carried} symbol(s) to ${data.toDate}${data.skipped ? `, ${data.skipped} skipped` : ""}`);
        setSelected(new Set());
      } else {
        showToast(data.error || "Failed to carry forward");
      }
    } catch {
      showToast("Failed to carry forward");
    } finally {
      setCarryingForward(false);
    }
  };

  // Sort & filter logic
  const processedEntries = useMemo(() => {
    let filtered = [...entries];

    // Filter
    if (filterBy === "crossed") filtered = filtered.filter(isCrossed);
    else if (filterBy === "not-crossed") filtered = filtered.filter((e) => !isCrossed(e));
    else if (filterBy === "near-target") {
      filtered = filtered.filter((e) => {
        const prox = getProximity(e);
        return prox !== null && Math.abs(prox) <= 5 && !isCrossed(e);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "change") {
        const ca = getPercentChange(a.currentPrice, a.previousClose) ?? -Infinity;
        const cb = getPercentChange(b.currentPrice, b.previousClose) ?? -Infinity;
        return cb - ca;
      }
      if (sortBy === "proximity") {
        const pa = getProximity(a);
        const pb = getProximity(b);
        if (pa === null) return 1;
        if (pb === null) return -1;
        return Math.abs(pa) - Math.abs(pb);
      }
      if (sortBy === "crossed") {
        const ca = isCrossed(a) ? 0 : 1;
        const cb = isCrossed(b) ? 0 : 1;
        return ca - cb;
      }
      return 0;
    });

    return filtered;
  }, [entries, sortBy, filterBy]);

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-400 text-lg">No stocks tracked for this date</p>
        <p className="text-gray-600 text-sm mt-1">Add a stock above to get started</p>
      </div>
    );
  }

  return (
    <div>
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 font-medium text-sm transition-all disabled:opacity-50"
        >
          {refreshing ? "Refreshing..." : "🔄 Refresh Prices"}
        </button>
        {isAdvanced && (
          <>
            <button
              onClick={toggleAll}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20 font-medium text-sm transition-all"
            >
              {selected.size === entries.length ? "☑ Deselect All" : "☐ Select All"}
            </button>
            <button
              onClick={handleCarryForward}
              disabled={carryingForward}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-medium text-sm transition-all disabled:opacity-50"
            >
              {carryingForward
                ? "Carrying..."
                : selected.size > 0
                  ? `📋 Carry Forward ${selected.size} Selected →`
                  : "📋 Carry Forward All →"}
            </button>
            <button
              onClick={() => exportToCSV(entries, currentDate)}
              className="px-4 py-2 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 border border-violet-500/30 font-medium text-sm transition-all"
            >
              📥 Export CSV
            </button>
          </>
        )}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {isAdvanced && processedEntries.length !== entries.length
              ? `${processedEntries.length} of ${entries.length} symbols`
              : `${entries.length} symbol${entries.length !== 1 ? "s" : ""}`}
          </span>
          <button
            onClick={toggleViewMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isAdvanced
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30"
                : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
            }`}
            title={isAdvanced ? "Switch to simple view" : "Switch to advanced view"}
          >
            {isAdvanced ? "⚡ Advanced" : "☰ Simple"}
          </button>
        </div>
      </div>

      {/* Sort & Filter bar — advanced only */}
      {isAdvanced && (
        <div className="flex flex-wrap items-center gap-3 mb-4 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Sort</span>
            {(["symbol", "change", "proximity", "crossed"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortBy === key
                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                }`}
              >
                {key === "symbol" ? "A-Z" : key === "change" ? "% Change" : key === "proximity" ? "Near Target" : "Crossed"}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Filter</span>
            {([
              ["all", "All"],
              ["crossed", "Crossed"],
              ["not-crossed", "Not Crossed"],
              ["near-target", "Near (≤5%)"],
            ] as [FilterKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterBy(key)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterBy === key
                    ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {processedEntries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No entries match the current filter</p>
        </div>
      )}

      {/* Stock cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(isAdvanced ? processedEntries : entries).map((entry) => {
          const crossed = isCrossed(entry);
          const pctChange = isAdvanced ? getPercentChange(entry.currentPrice, entry.previousClose) : null;
          const proximity = isAdvanced ? getProximity(entry) : null;
          const proximityBadge = isAdvanced ? getProximityBadge(entry) : null;
          const isEditing = isAdvanced && editingId === entry.id;

          return (
            <div
              key={entry.id}
              className={`relative bg-white/5 backdrop-blur-sm border rounded-2xl p-5 transition-all hover:bg-white/8 ${
                crossed
                  ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : proximityBadge === "NEAR TARGET"
                    ? "border-yellow-500/40 shadow-lg shadow-yellow-500/10"
                    : selected.has(entry.id)
                      ? "border-amber-500/40 shadow-lg shadow-amber-500/10"
                      : "border-white/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  {isAdvanced && (
                    <button
                      onClick={() => toggleSelect(entry.id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        selected.has(entry.id)
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {selected.has(entry.id) && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-bold text-white">{entry.symbol}</span>
                      {/* % Change badge */}
                      {pctChange !== null && (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            pctChange >= 0
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%
                        </span>
                      )}
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditCrossing("above")}
                            className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
                              editCrossing === "above"
                                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                                : "bg-white/5 text-gray-500"
                            }`}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => setEditCrossing("below")}
                            className={`text-xs font-bold px-2 py-1 rounded-full transition-all ${
                              editCrossing === "below"
                                ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
                                : "bg-white/5 text-gray-500"
                            }`}
                          >
                            ▼
                          </button>
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-24 text-xs bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            entry.crossing === "above"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {entry.crossing === "above" ? "▲ ABOVE" : "▼ BELOW"} ${entry.price.toFixed(2)}
                        </span>
                      )}
                      {crossed && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-500/30 text-emerald-300 animate-pulse">
                          ✓ CROSSED
                        </span>
                      )}
                      {proximityBadge && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-yellow-500/20 ${getProximityColor(entry)}`}>
                          ⚡ {proximityBadge}
                        </span>
                      )}
                    </div>
                    {/* Proximity to target */}
                    {proximity !== null && !crossed && (
                      <p className={`text-xs mt-0.5 ${getProximityColor(entry)}`}>
                        {Math.abs(proximity).toFixed(1)}% {proximity > 0 ? "above" : "below"} target
                      </p>
                    )}
                    {entry.name && (
                      <p className="text-sm text-gray-400 mt-0.5">{entry.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit(entry.id)}
                        disabled={saving}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                        title="Save"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-400 hover:text-gray-300 transition-colors p-1"
                        title="Cancel"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <>
                      {isAdvanced && (
                        <button
                          onClick={() => startEdit(entry)}
                          className="text-gray-600 hover:text-indigo-400 transition-colors p-1"
                          title="Edit entry"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className="text-gray-600 hover:text-rose-400 transition-colors p-1"
                        title="Delete entry"
                      >
                        {deletingId === entry.id ? (
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Price data */}
              {isAdvanced ? (
                <div className="grid grid-cols-4 gap-2 bg-white/5 rounded-xl p-3">
                  <PriceCell label="Current" value={entry.currentPrice} />
                  <PriceCell label="Prev Close" value={entry.previousClose} />
                  <PriceCell label="High" value={entry.previousHigh} />
                  <PriceCell label="Low" value={entry.previousLow} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 bg-white/5 rounded-xl p-3">
                  <PriceCell label="Current" value={entry.currentPrice} />
                  <PriceCell label="Prev Close" value={entry.previousClose} />
                </div>
              )}

              {/* 52-Week Range — advanced only */}
              {isAdvanced && (entry.fiftyTwoWeekHigh !== null || entry.fiftyTwoWeekLow !== null) && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>{entry.fiftyTwoWeekLow !== null ? `$${entry.fiftyTwoWeekLow.toFixed(2)}` : "—"}</span>
                    <span className="uppercase tracking-wider">52-Week Range</span>
                    <span>{entry.fiftyTwoWeekHigh !== null ? `$${entry.fiftyTwoWeekHigh.toFixed(2)}` : "—"}</span>
                  </div>
                  <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
                    {entry.fiftyTwoWeekLow !== null && entry.fiftyTwoWeekHigh !== null && entry.currentPrice !== null && entry.fiftyTwoWeekHigh > entry.fiftyTwoWeekLow && (
                      <>
                        <div
                          className="absolute h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full opacity-40"
                          style={{ width: "100%" }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg shadow-white/30 border border-white/50"
                          style={{
                            left: `${Math.max(0, Math.min(100, ((entry.currentPrice - entry.fiftyTwoWeekLow) / (entry.fiftyTwoWeekHigh - entry.fiftyTwoWeekLow)) * 100))}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Notes (editable or display) */}
              {isEditing ? (
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="w-full mt-3 text-sm bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-indigo-500/50 placeholder-gray-600"
                />
              ) : (
                entry.notes && (
                  <p className="text-sm text-gray-400 mt-3 bg-white/5 rounded-lg px-3 py-2 italic">
                    💡 {entry.notes}
                  </p>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl animate-[slideUp_0.3s_ease-out] z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
