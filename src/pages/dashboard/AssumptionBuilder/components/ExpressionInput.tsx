import { useState, useRef, useEffect, useCallback } from "react";
import type { Datasource } from "@/api/validationWorkflow.api";
import { useTranslation } from "react-i18next";

interface ExpressionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  datasources: Datasource[];
  isLoading?: boolean;
  className?: string;
}

// Allowed characters: numbers, operators, parentheses, spaces, and {{ }} for datasources
// const ALLOWED_PATTERN = /^[0-9+\-*/%().\s{}a-zA-Z_]*$/;

export const ExpressionInput = ({
  value,
  onChange,
  placeholder,
  datasources,
  isLoading = false,
  className = "",
}: ExpressionInputProps) => {
  const { t } = useTranslation();
  const defaultPlaceholder = placeholder || t("assumptionBuilder.enterExpression");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter datasources based on search term
  const filteredDatasources = datasources.filter((ds) => ds.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Check if we should show dropdown (when user types {{)
  const checkForTrigger = useCallback((inputValue: string, position: number) => {
    // Look for {{ before cursor position
    const textBeforeCursor = inputValue.slice(0, position);
    const lastOpenBrackets = textBeforeCursor.lastIndexOf("{{");
    const lastCloseBrackets = textBeforeCursor.lastIndexOf("}}");

    // If we have {{ and it's not closed yet
    if (lastOpenBrackets !== -1 && lastOpenBrackets > lastCloseBrackets) {
      const searchText = textBeforeCursor.slice(lastOpenBrackets + 2);
      setSearchTerm(searchText);
      setShowDropdown(true);

      // Calculate dropdown position
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.height + 4,
          left: 0,
        });
      }
    } else {
      setShowDropdown(false);
      setSearchTerm("");
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newPosition = e.target.selectionStart || 0;

    // Allow any character input
    onChange(newValue);
    setCursorPosition(newPosition);
    checkForTrigger(newValue, newPosition);
  };

  // Handle key navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown) {
      if (e.key === "Escape") {
        setShowDropdown(false);
      } else if (e.key === "Enter" && filteredDatasources.length > 0) {
        e.preventDefault();
        selectDatasource(filteredDatasources[0]);
      }
    }
  };

  // Select a datasource from dropdown
  const selectDatasource = (datasource: Datasource) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);

    // Find the position of {{ before cursor
    const lastOpenBrackets = textBeforeCursor.lastIndexOf("{{");

    if (lastOpenBrackets !== -1) {
      // Replace from {{ to cursor with the datasource
      const newValue = textBeforeCursor.slice(0, lastOpenBrackets) + `{{${datasource.name}}}` + textAfterCursor;

      onChange(newValue);
      setShowDropdown(false);
      setSearchTerm("");

      // Focus back on input and set cursor after the inserted datasource
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPosition = lastOpenBrackets + datasource.name.length + 4; // 4 for {{ and }}
          inputRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Highlighted overlay */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
          placeholder={defaultPlaceholder}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B7AD] focus:border-transparent bg-transparent text-black caret-gray-900 cursor-text"
          style={{ caretColor: "#111827" }}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
          style={{ top: dropdownPosition.top }}>
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Loading datasources...</div>
          ) : filteredDatasources.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">No datasources found</div>
          ) : (
            filteredDatasources.map((datasource) => (
              <button
                key={datasource.name}
                onClick={() => selectDatasource(datasource)}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{datasource.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                    {datasource.return_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{datasource.description}</p>
              </button>
            ))
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-400 mt-1">
        Type <code className="bg-gray-100 px-1 rounded">{"{{"}</code> to insert a datasource
      </p>
    </div>
  );
};
