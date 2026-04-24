"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SearchResult {
  symbol: string;
  name: string;
}

interface AddStockFormProps {
  currentDate: string;
  onAdded: () => void;
}

export default function AddStockForm({ currentDate, onAdded }: AddStockFormProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [crossing, setCrossing] = useState<"above" | "below">("above");
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchSymbols = useCallback(async (query: string) => {
    if (query.length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSymbolChange = (value: string) => {
    setSymbol(value.toUpperCase());
    setError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSymbols(value), 300);
  };

  const selectResult = (result: SearchResult) => {
    setSymbol(result.symbol);
    setName(result.name);
    setShowDropdown(false);
    setResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          name,
          date: currentDate,
          price: Number(price),
          crossing,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add entry");
        return;
      }

      // Reset form
      setSymbol("");
      setName("");
      setPrice("");
      setCrossing("above");
      setNotes("");
      onAdded();
    } catch {
      setError("Failed to add entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Add Stock</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Symbol with autocomplete */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm text-gray-400 mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="AAPL"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/20 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-9 text-gray-400">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {showDropdown && results.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.symbol}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-bold text-indigo-400">{r.symbol}</span>
                  <span className="text-gray-400 text-sm ml-2">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Price Level</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150.00"
            required
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/20 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
        </div>

        {/* Crossing */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crossing</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCrossing("above")}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                crossing === "above"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              ▲ Above
            </button>
            <button
              type="button"
              onClick={() => setCrossing("below")}
              className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                crossing === "below"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              ▼ Below
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm text-gray-400 mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Breakout pattern..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-gray-500 border border-white/20 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 text-rose-400 text-sm bg-rose-500/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={submitting || !symbol || !price}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
        >
          {submitting ? "Adding..." : "Add Stock"}
        </button>
      </div>
    </form>
  );
}
