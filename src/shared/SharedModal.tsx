import React from "react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

// Close icon component
const CloseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface SharedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export function SharedModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = "",
}: SharedModalProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-7xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-lg shadow-xl mx-4 w-full transition-all duration-300 transform",
          sizeClasses[size],
          isRTL ? "font-arabic" : "",
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 p-4 border-b border-gray-200"
            )}
          >
            {title && (
              <h3
                className={cn(
                  "text-lg text-[#282828] truncate",
                  isRTL ? "text-right" : "text-left"
                )}
              >
                {title}
              </h3>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-md border border-[#E2E2E2] hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <CloseIcon className="w-3 cursor-pointer h-3 text-[#545454]" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "  ",
            !title && !showCloseButton && "pt-6",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default SharedModal;
