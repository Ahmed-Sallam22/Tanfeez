// components/inputs/ModeSelect.tsx
import { useEffect, useRef, useState } from "react";
type Mode = "all" | "Envelope" | "Budget";

const options: { value: Mode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Envelope", label: "Envelope" },
  { value: "Budget", label: "Budget" },
];

export default function ModeSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: Mode;
  onChange: (v: Mode) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // close on outside click/escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      if (
        popRef.current &&
        !popRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        className={`group inline-flex text-sm items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5
          hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select mode"
      >
        {/* icon */}
        <span className="grid place-items-center  ring-gray-400/50 ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="#555" />
            <path
              d="M6 13c1.5-4 1.5-4 3.5 0S13 13 14.5 9 16 9 18 13"
              stroke="#555"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* label */}
        <span className=" text-gray-700">Mode</span>

        {/* chevron */}
        <svg
          className={`ml-1 h-5 w-5 text-gray-700 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div
          ref={popRef}
          role="listbox"
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5 z-50"
        >
          {options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm
                  ${
                    selected
                      ? "bg-cyan-50 text-cyan-800"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span>{opt.label}</span>
                {selected && (
                  <svg
                    className="h-4 w-4 text-cyan-700"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.4 7.4a1 1 0 0 1-1.4 0L3.3 10.5a1 1 0 1 1 1.4-1.4l3 3 6.7-6.7a1 1 0 0 1 1.3-.1z" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
