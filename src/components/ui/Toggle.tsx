import React from "react";
import { useTranslation } from "react-i18next";

interface ToggleProps {
  id?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const sizeClasses = {
    sm: "w-9 h-5",
    md: "w-11 h-6",
    lg: "w-14 h-7",
  };

  const thumbSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const translateClasses = {
    sm: checked
      ? isRTL
        ? "translate-x-0"
        : "translate-x-4"
      : isRTL
      ? "-translate-x-4"
      : "translate-x-0",
    md: checked
      ? isRTL
        ? "translate-x-0"
        : "translate-x-5"
      : isRTL
      ? "-translate-x-5"
      : "translate-x-0",
    lg: checked
      ? isRTL
        ? "translate-x-0"
        : "translate-x-7"
      : isRTL
      ? "-translate-x-7"
      : "translate-x-0",
  };

  return (
    <div
      className={`flex items-center gap-3 ${
        isRTL ? "flex-row-reverse" : ""
      } ${className}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id ? `${id}-label` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          ${sizeClasses[size]}
          relative inline-flex items-center rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2
          focus:ring-[var(--color-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
          ${
            checked
              ? "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]"
              : "bg-gray-200 hover:bg-gray-300"
          }
        `}
      >
        <span
          aria-hidden="true"
          className={`
            ${thumbSizeClasses[size]}
            ${translateClasses[size]}
            pointer-events-none inline-block rounded-full bg-white shadow transform
            ring-0 transition duration-200 ease-in-out
          `}
        />
      </button>
      <label
        id={id ? `${id}-label` : undefined}
        htmlFor={id}
        className={`text-sm font-medium text-gray-700 cursor-pointer select-none ${
          isRTL ? "text-right" : "text-left"
        }`}
        onClick={() => !disabled && onChange(!checked)}
      >
        {label}
      </label>
    </div>
  );
};

export default Toggle;
