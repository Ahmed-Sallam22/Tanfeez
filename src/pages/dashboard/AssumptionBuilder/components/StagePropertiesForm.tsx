import type { Node } from "@xyflow/react";
import { useMemo, useState, useEffect } from "react";
import { GitBranch, X } from "lucide-react";
import { Input } from "@/components/ui";
import { SharedSelect } from "@/shared/SharedSelect";
import { operatorOptions } from "./constants";
import type { StageData } from "./types";
import { ExpressionInput } from "./ExpressionInput";
import type { Datasource } from "@/api/validationWorkflow.api";
import { useTranslation } from "react-i18next";

interface StagePropertiesFormProps {
  selectedNode: Node | null;
  stageData: StageData;
  setStageData: React.Dispatch<React.SetStateAction<StageData>>;
  deleteSelectedNode: () => void;
  datasources?: Datasource[];
  isDatasourcesLoading?: boolean;
}

export const StagePropertiesForm = ({
  selectedNode,
  stageData,
  setStageData,
  deleteSelectedNode,
  datasources = [],
  isDatasourcesLoading = false,
}: StagePropertiesFormProps) => {
  const { t } = useTranslation();
  const [arrayDraft, setArrayDraft] = useState("");

  const isArrayOperator = useMemo(
    () => stageData.operator === "in" || stageData.operator === "not_in" ||
      stageData.operator === "in_contain" || stageData.operator === "not_in_contain" ||
      stageData.operator === "in_starts_with" || stageData.operator === "not_in_starts_with",
    [stageData.operator]
  );

  const parsedArrayValues = useMemo(() => {
    if (!stageData.rightSide) return [];
    try {
      const parsed = JSON.parse(stageData.rightSide);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      // fallback below
    }
    return stageData.rightSide
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }, [stageData.rightSide]);

  useEffect(() => {
    setArrayDraft("");
  }, [isArrayOperator]);

  const handleAddArrayValue = () => {
    const trimmed = arrayDraft.trim();
    if (!trimmed) return;
    const nextValues = [...parsedArrayValues, trimmed];
    setStageData((prev) => ({
      ...prev,
      rightSide: JSON.stringify(nextValues),
    }));
    setArrayDraft("");
  };

  const handleRemoveArrayValue = (index: number) => {
    const nextValues = parsedArrayValues.filter((_, i) => i !== index);
    setStageData((prev) => ({
      ...prev,
      rightSide: JSON.stringify(nextValues),
    }));
  };

  if (!selectedNode) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
          <GitBranch className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm">{t("assumptionBuilder.selectStage")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("assumptionBuilder.stageName")}</label>
        <Input
          placeholder={t("assumptionBuilder.stageName")}
          value={stageData.name}
          onChange={(e) =>
            setStageData((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
        />
      </div>

      {selectedNode.type === "condition" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptionBuilder.leftHandSide")}
            </label>
            <ExpressionInput
              value={stageData.leftSide}
              onChange={(value) =>
                setStageData((prev) => ({
                  ...prev,
                  leftSide: value,
                }))
              }
              placeholder="e.g., datasource:Transaction_Total_From + 100"
              datasources={datasources}
              isLoading={isDatasourcesLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t("assumptionBuilder.operation")}</label>
            <SharedSelect
              options={operatorOptions}
              value={stageData.operator}
              onChange={(value) =>
                setStageData((prev) => ({
                  ...prev,
                  operator: String(value),
                }))
              }
              placeholder={t("assumptionBuilder.selectOperator")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("assumptionBuilder.rightHandSide")}
            </label>
            {isArrayOperator ? (
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">


                <div className="flex flex-wrap gap-2 mb-3 min-h-[38px]">
                  {parsedArrayValues.length === 0 ? (
                    <span className="text-xs text-gray-400">أضف القيم ثم اضغط Enter</span>
                  ) : (
                    parsedArrayValues.map((val, idx) => (
                      <span
                        key={`${val}-${idx}`}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayValue(idx)}
                          className="text-emerald-600 hover:text-emerald-800 focus:outline-none">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="grid  gap-2">
                  <Input
                    value={arrayDraft}
                    onChange={(e) => setArrayDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddArrayValue();
                      }
                    }}
                    placeholder='مثال: 5000 ثم Enter لإضافتها (تُحفظ كـ ["5000","5100"])'
                  />
                  <button
                    type="button"
                    onClick={handleAddArrayValue}
                    className="px-3 py-2 bg-[#00B7AD] hover:bg-[#009e96] text-white text-sm font-semibold rounded-lg transition-colors">
                    إضافة
                  </button>
                </div>
              </div>
            ) : (
              <ExpressionInput
                value={stageData.rightSide}
                onChange={(value) =>
                  setStageData((prev) => ({
                    ...prev,
                    rightSide: value,
                  }))
                }
                placeholder='e.g., 50000 * datasource:Tax_Rate or ["5000","5100"]'
                datasources={datasources}
                isLoading={isDatasourcesLoading}
              />
            )}
          </div>
        </>
      )}

      {/* Show message/error inputs only for success and fail nodes */}
      {(selectedNode.type === "success" || selectedNode.type === "fail") && (
        <>
          {/* Dynamic Message/Error Input based on node type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedNode.type === "success"
                ? t("assumptionBuilder.successMessage")
                : t("assumptionBuilder.errorMessage")}
            </label>
            <Input
              placeholder={
                selectedNode.type === "success"
                  ? t("assumptionBuilder.enterSuccessMessage")
                  : t("assumptionBuilder.enterErrorMessage")
              }
              value={selectedNode.type === "success" ? stageData.message || "" : stageData.error || ""}
              onChange={(e) => {
                if (selectedNode.type === "success") {
                  setStageData((prev) => ({
                    ...prev,
                    message: e.target.value,
                    actionType: "complete_success", // Auto-set based on node type
                  }));
                } else {
                  setStageData((prev) => ({
                    ...prev,
                    error: e.target.value,
                    actionType: "complete_failure", // Auto-set based on node type
                  }));
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              {selectedNode.type === "success"
                ? t("assumptionBuilder.successMessageInfo")
                : t("assumptionBuilder.errorMessageInfo")}
            </p>
          </div>
        </>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={deleteSelectedNode}
          className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
          {t("assumptionBuilder.delete")}
        </button>
      </div>
    </div>
  );
};
