import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Direction = "ltr" | "rtl";

export interface SearchBarProps {
  placeholder?: string;
  value?: string; // Controlled value (optional)
  defaultValue?: string; // Uncontrolled initial value
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  className?: string; // Extra styles for outer container
  inputClassName?: string; // Extra styles for the input
  dir?: Direction; // Text direction: "ltr" | "rtl" (optional - will auto-detect from language)
  debounce?: number; // ms to debounce onChange (0 = none)
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  className = "",
  inputClassName = "",
  dir,
  debounce = 0,
}) => {
  const { i18n } = useTranslation();

  // Auto-detect direction from language if not explicitly provided
  const direction = dir || (i18n.language === "ar" ? "rtl" : "ltr");

  const isControlled = value !== undefined;
  const [inner, setInner] = useState<string>(
    isControlled ? value || "" : defaultValue
  );

  // Use controlled value if provided, otherwise use internal state
  const currentValue = isControlled ? value || "" : inner;

  // Update internal state when controlled value changes
  useEffect(() => {
    if (isControlled) {
      setInner(value || "");
    }
  }, [isControlled, value]);

  // Debounced onChange effect
  useEffect(() => {
    if (!onChange || debounce <= 0) return;
    const id = window.setTimeout(() => onChange(currentValue), debounce);
    return () => window.clearTimeout(id);
  }, [currentValue, debounce, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log("Input changed:", newValue); // Debug log

    // Always update internal state for immediate UI feedback
    if (!isControlled) {
      setInner(newValue);
    }

    // Call onChange immediately if no debounce
    if (onChange && debounce === 0) {
      onChange(newValue);
    }

    // For controlled components, call onChange immediately
    if (isControlled && onChange) {
      onChange(newValue);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted with value:", currentValue); // Debug log
    if (onSubmit) {
      onSubmit(currentValue);
    }
  };

  const iconSide = direction === "rtl" ? "right-3" : "left-3";
  const padSide = direction === "rtl" ? "pr-10" : "pl-10";

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl bg-white   ${className}`}
    >
      <div className="relative rounded-xl border border-gray-200 bg-white h-12 flex items-center focus-within:ring-2 focus-within:ring-[#ffffff]">
        {/* Search icon */}
        <svg
          className={`absolute ${iconSide} w-5 h-5 text-gray-400 pointer-events-none`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M20 20l-3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        <input
          type="text"
          dir={direction}
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full h-full bg-transparent outline-none placeholder:text-sm ${padSide} px-4 rounded-xl text-[#051852] placeholder:text-[#AFAFAF] ${inputClassName}`}
          aria-label={placeholder}
        />

        {/* Submit button (hidden, but allows Enter key to work) */}
        <button type="submit" className="sr-only">
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
