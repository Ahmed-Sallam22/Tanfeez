import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckCircle } from "lucide-react";
import type { ActionNodeData } from "./types";

export const SuccessNode = ({ data, selected }: NodeProps) => {
  const nodeData = data as ActionNodeData;
  const message = nodeData.message || "Workflow completes successfully";

  return (
    <div
      className={`bg-white rounded-2xl shadow-md border ${
        selected ? "border-green-500 border-2" : "border-gray-100"
      } min-w-[220px] max-w-[300px] p-5`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-500 !w-3 !h-3"
      />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-gray-800 text-base block">
            {String(nodeData.label || "Action: Success")}
          </span>
          <p className="text-xs text-gray-400 mt-0.5 truncate" title={message}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
