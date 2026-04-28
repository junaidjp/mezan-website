"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TickerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (ticker: string) => {
    setQuery("");
    setShowDropdown(false);
    router.push(`/research/stock/${ticker}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelect(query.trim().toUpperCase());
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-white/[0.04] px-4 py-2.5">
        <svg className="h-5 w-5 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search any ticker..."
          className="w-48 bg-transparent text-sm text-white placeholder-white/30 outline-none md:w-64"
        />
      </div>

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#0c1118] shadow-2xl">
          {results.map((r) => (
            <button
              key={r.ticker}
              onClick={() => handleSelect(r.ticker)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.06] border-b border-white/[0.04] last:border-0"
            >
              <div>
                <span className="text-sm font-semibold text-emerald-400">{r.ticker}</span>
                <span className="ml-2 text-xs text-white/40">{r.name}</span>
              </div>
              <span className="text-[10px] text-white/20">{r.exchange}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
