import SharedModal from "@/shared/SharedModal";
import { Input } from "@/components/ui";
import { SharedSelect } from "@/shared/SharedSelect";
import { statusOptions } from "./constants";
import { useGetExecutionPointsQuery } from "@/api/validationWorkflow.api";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface ValidationWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  mode: "create" | "edit";
  name: string;
  setName: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  executionPoint: string;
  setExecutionPoint: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  isLoading?: boolean;
}

export const AssumptionModal = ({
  isOpen,
  onClose,
  onSave,
  mode,
  name,
  setName,
  description,
  setDescription,
  executionPoint,
  setExecutionPoint,
  status,
  setStatus,
  isLoading = false,
}: ValidationWorkflowModalProps) => {
  const { t } = useTranslation();

  // Fetch execution points from API
  const { data: executionPointsData, isLoading: isLoadingExecutionPoints } = useGetExecutionPointsQuery();

  // Transform execution points to options format (display name, pass code)
  const executionPointOptions = useMemo(() => {
    if (!executionPointsData?.execution_points) return [];
    return executionPointsData.execution_points.map((ep) => ({
      value: ep.code,
      label: ep.name,
    }));
  }, [executionPointsData]);

  // Translate status options
  const translatedStatusOptions = useMemo(() => {
    return statusOptions.map((option) => ({
      ...option,
      label: t(`assumptions.${option.value}`),
    }));
  }, [t]);

  return (
    <SharedModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === "create"
          ? t("assumptions.createValidationWorkflow")
          : t("assumptions.editValidationWorkflow")
      }
      size="md"
    >
      <>
        <div className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptions.nameRequired")}
            </label>
            <Input
              placeholder={t("assumptions.enterWorkflowName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptions.description")}
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00B7AD] focus:border-transparent resize-none bg-white"
              rows={4}
              placeholder={t("assumptions.enterWorkflowDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Execution Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptions.executionPointRequired")}
            </label>
            <SharedSelect
              options={executionPointOptions}
              value={executionPoint}
              onChange={(value) => setExecutionPoint(String(value))}
              placeholder={
                isLoadingExecutionPoints
                  ? t("assumptions.loading")
                  : t("assumptions.selectExecutionPoint")
              }
              disabled={isLoadingExecutionPoints}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptions.statusRequired")}
            </label>
            <SharedSelect
              options={translatedStatusOptions}
              value={status}
              onChange={(value) => setStatus(String(value))}
              placeholder={t("assumptions.selectStatus")}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t("assumptions.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)]  rounded-md hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {mode === "create" ? t("assumptions.save") : t("assumptions.save")}
          </button>
        </div>
      </>
    </SharedModal>
  );
};

// Alias for backward compatibility
export const ValidationWorkflowModal = AssumptionModal;
