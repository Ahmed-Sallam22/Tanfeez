import { useTranslation } from "react-i18next";
import { useRef } from "react";

interface ValidationWorkflowHeaderProps {
  onCreateNew: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  selectedCount?: number;
  isExporting?: boolean;
  isImporting?: boolean;
}

export const AssumptionHeader = ({
  onCreateNew,
  onExport,
  onImport,
  selectedCount = 0,
  isExporting = false,
  isImporting = false,
}: ValidationWorkflowHeaderProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      // Reset input so the same file can be selected again
      event.target.value = "";
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {t("assumptions.validationWorkflows")}
      </h1>

      <div className="flex items-center gap-3">
        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={selectedCount === 0 || isExporting}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedCount === 0 || isExporting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          title={
            selectedCount === 0 ? t("assumptions.selectWorkflowsToExport") : ""
          }
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("common.exporting")}
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 10V2M8 10L5 7M8 10L11 7M2 14H14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("assumptions.exportWorkflows")}{" "}
              {selectedCount > 0 && `(${selectedCount})`}
            </>
          )}
        </button>

        {/* Import Button */}
        <button
          onClick={handleImportClick}
          disabled={isImporting}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isImporting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("common.importing")}
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 2V10M8 2L5 5M8 2L11 5M2 14H14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {t("assumptions.importWorkflows")}
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.yaml,.yml"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Create New Button */}
        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 1V15M1 8H15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t("assumptions.createNewValidationWorkflow")}
        </button>
      </div>
    </div>
  );
};

// Alias for backward compatibility
export const ValidationWorkflowHeader = AssumptionHeader;
