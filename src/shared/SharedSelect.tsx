import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

// Chevron down icon
const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
// Check icon for selected option
const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SharedSelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  title?: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  clearable?: boolean;
  size?: "text-sm" | "text-md" | "text-lg" | "text-xl";
}

export function SharedSelect({
  options,
  value,
  onChange,
  title,
  placeholder = "Select an option",
  searchable = true,
  searchPlaceholder = "Search options...",
  disabled = false,
  className = "",
  error,
  required = false,
  size = "text-sm",
  clearable = true,
}: SharedSelectProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find((option) => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm("");
    }
  };

  const handleOptionSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      {/* Label */}
      {title && (
        <label
          className={cn(
            `block ${size} font-bold text-[#282828] mb-3`,
            isRTL ? "text-right" : "text-left"
          )}
        >
          {title}
          {required && (
            <span className={cn("text-red-500", isRTL ? "mr-1" : "ml-1")}>
              *
            </span>
          )}
        </label>
      )}

      {/* Select container */}
      <div ref={selectRef} className="relative">
        {/* Select button */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "relative w-full px-3 py-4 bg-white border border-[#E2E2E2] rounded-md cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
            "disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-300" : "border-gray-300",
            isOpen && !error && "ring-2 ring-[var(--color-primary)] border-transparent",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <span
            className={cn(
              "block truncate relative text-sm font-medium text-[#282828]",
              !selectedOption && "text-[#282828]"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <span
            className={cn(
              "absolute inset-y-0 flex items-center",
              isRTL ? "left-0 pl-2" : "right-0 pr-2"
            )}
          >
            {selectedOption && clearable ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200 pointer-events-auto"
              >
                <XIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            ) : (
              <ChevronDownIcon
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform duration-200 pointer-events-none",
                  isOpen && "transform rotate-180"
                )}
              />
            )}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={searchPlaceholder}
                    dir={isRTL ? "rtl" : "ltr"}
                    className={cn(
                      "w-full py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent",
                      isRTL ? "pr-1 text-right" : "pl-1 text-left"
                    )}
                  />
                </div>
              </div>
            )}

            {/* Options list */}
            <div className="max-h-60 overflow-auto py-1">
              {filteredOptions.length === 0 ? (
                <div
                  className={cn(
                    "px-3 py-2 text-sm text-gray-500 text-center",
                    isRTL ? "text-right" : "text-left"
                  )}
                >
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionSelect(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      "relative w-full capitalize px-3 py-2 text-sm hover:bg-gray-100",
                      "focus:outline-none focus:bg-gray-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
                      value === option.value && "bg-[#f7f7f7] text-[var(--color-primary)]",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    <span className="block truncate">{option.label}</span>

                    {value === option.value && (
                      <span
                        className={cn(
                          "absolute inset-y-0 flex items-center",
                          isRTL ? "left-0 pl-3" : "right-0 pr-3"
                        )}
                      >
                        <CheckIcon className="text-[var(--color-primary)]" />
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default SharedSelect;
