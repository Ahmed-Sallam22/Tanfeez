import SharedModal from "@/shared/SharedModal";
import type { ValidationWorkflow } from "./types";
import { useTranslation } from "react-i18next";

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: ValidationWorkflow | null;
}

export const DescriptionModal = ({ isOpen, onClose, workflow }: DescriptionModalProps) => {
  const { t } = useTranslation();

  return (
    <SharedModal isOpen={isOpen} onClose={onClose} title={t("assumptions.workflowDescription")} size="md">
      <div className="p-4">
        {workflow && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">{workflow.name}</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {workflow.description || t("assumptions.noDescriptionAvailable")}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">
            {t("assumptions.close")}
          </button>
        </div>
      </div>
    </SharedModal>
  );
};
