import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { ConditionNodeData } from "./types";
import { useTranslation } from "react-i18next";

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
};

export const ConditionNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as ConditionNodeData;
  const { t } = useTranslation();

  return (
    <div
      className={`bg-white rounded-2xl shadow-md border ${
        selected ? "border-[#00B7AD] border-2" : "border-gray-100"
      } min-w-[320px] p-5`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-[#00B7AD] !w-3 !h-3"
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#E8F8F7] flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-[#00B7AD]" />
        </div>
        <span className="font-semibold text-gray-800 text-base">
          {String(nodeData.label || t("assumptionBuilder.checkType"))}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
          <span>{t("assumptionBuilder.leftSide")}</span>
          <span>{t("assumptionBuilder.rightSide")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 border border-gray-100">
            {truncateText(
              String(nodeData.leftSide || t("assumptionBuilder.type")),
              30
            )}
          </div>
          <span className="text-gray-400 font-bold text-lg px-2">
            {String(nodeData.operator || "==")}
          </span>
          <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 border border-gray-100">
            {truncateText(String(nodeData.rightSide || "FAR"), 30)}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !w-3 !h-3"
        style={{ left: "25%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500  !w-3 !h-3"
        style={{ left: "75%" }}
      />
    </div>
  );
};
