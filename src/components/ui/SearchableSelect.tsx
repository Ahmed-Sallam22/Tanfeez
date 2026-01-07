import  { useMemo, useRef, useState, useEffect } from "react";

type SearchableSelectProps = {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
};

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // keep highlight in range
  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0);
  }, [filtered.length, highlight]);

  // close on click outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ensure highlighted item stays in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelectorAll("li")[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const selectValue = (v: string) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* Control */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 border border-[#E2E2E2] rounded text-left text-sm flex items-center justify-between"
      >
        <span className={value ? "text-black" : "text-[#AFAFAF]"}>
          {value || placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0">
          <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-[#E2E2E2] rounded shadow">
          {/* Search input */}
          <div className="p-2 border-b border-[#E2E2E2]">
            <input
              autoFocus
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((i) => Math.min(i + 1, filtered.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((i) => Math.max(i - 1, 0)); }
                else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlight]) selectValue(filtered[highlight]); }
                else if (e.key === "Escape") { setOpen(false); }
              }}
              placeholder="Search…"
              className="w-full px-3 py-2 border border-transparent rounded text-sm focus:outline-none focus:ring-0"
            />
          </div>

          {/* Options (shows ~10 items, then scrolls) */}
          <ul
            ref={listRef}
            className="max-h-[22.5rem] overflow-y-auto" /* 10 items × ~2.25rem each */
            role="listbox"
          >
            {/* Optional “clear” item */}
            <li
              role="option"
              aria-selected={value === ""}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectValue("")}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${value === "" ? "bg-gray-50" : ""}`}
            >
              {placeholder}
            </li>

            {filtered.map((opt, idx) => {
              const isActive = idx === highlight;
              const isSelected = opt === value;
              return (
                <li
                  key={opt}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectValue(opt)}
                  className={`px-3 py-2 text-sm cursor-pointer ${
                    isActive ? "bg-gray-100" : ""
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  {opt}
                </li>
              );
            })}

            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500 select-none">No matches</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
