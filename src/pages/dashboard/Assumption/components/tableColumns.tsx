import type { TableColumn } from "@/shared/SharedTable";
import type { ValidationWorkflow } from "./types";
import type { ExecutionPoint } from "@/api/validationWorkflow.api";
import type { TFunction } from "i18next";

// Helper function to format execution point for display
const formatExecutionPoint = (executionPoint: string, executionPointsMap?: Map<string, string>): string => {
  // If we have a map from API, use it
  if (executionPointsMap && executionPointsMap.has(executionPoint)) {
    return executionPointsMap.get(executionPoint) || executionPoint;
  }
  // Fallback: capitalize and replace underscores
  return executionPoint
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getValidationWorkflowColumns = (
  onDescriptionClick: (workflow: ValidationWorkflow) => void,
  onNameClick: (workflow: ValidationWorkflow) => void,
  executionPoints?: ExecutionPoint[],
  t?: TFunction
): TableColumn[] => {
  // Create a map for quick lookup: code -> name
  const executionPointsMap = new Map<string, string>();
  if (executionPoints) {
    executionPoints.forEach((ep) => {
      executionPointsMap.set(ep.code, ep.name);
    });
  }

  return [
    {
      id: "name",
      header: t ? t("assumptions.name") : "Name",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return (
          <button
            onClick={() => onNameClick(workflow)}
            className="text-sm text-[#4E8476] font-medium hover:text-[#3d6b5f] hover:underline transition-colors cursor-pointer">
            {workflow.name}
          </button>
        );
      },
    },
    {
      id: "description",
      header: t ? t("assumptions.description") : "Description",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return (
          <button
            onClick={() => onDescriptionClick(workflow)}
            className="text-sm text-gray-900 bg-gray-100 p-2 rounded-md truncate max-w-xs hover:bg-gray-200 transition-colors cursor-pointer text-left"
            title={t ? t("assumptions.clickToViewFullDescription") : "Click to view full description"}>
            {t ? t("assumptions.description") : "Description"}
          </button>
        );
      },
    },
    {
      id: "execution_point",
      header: t ? t("assumptions.executionPoint") : "Execution Point",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {formatExecutionPoint(workflow.execution_point, executionPointsMap)}
          </span>
        );
      },
    },
    {
      id: "status",
      header: t ? t("assumptions.status") : "Status",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        const statusColors: Record<string, string> = {
          active: "bg-green-100 text-green-800",
          inactive: "bg-red-100 text-red-800",
          draft: "bg-yellow-100 text-yellow-800",
        };
        const statusText = t ? t(`assumptions.${workflow.status}`) : workflow.status;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
              statusColors[workflow.status] || "bg-gray-100 text-gray-800"
            }`}>
            {statusText}
          </span>
        );
      },
    },
    {
      id: "is_default",
      header: t ? t("assumptions.isDefault") : "Default",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              workflow.is_default ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"
            }`}>
            {workflow.is_default ? (t ? t("assumptions.yes") : "Yes") : t ? t("assumptions.no") : "No"}
          </span>
        );
      },
    },
    {
      id: "created_by_username",
      header: t ? t("assumptions.createdBy") : "Created By",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return <span className="text-sm text-gray-900">{workflow.created_by_username}</span>;
      },
    },
    {
      id: "updated_at",
      header: t ? t("assumptions.lastUpdated") : "Last Updated",
      render: (_, row) => {
        const workflow = row as unknown as ValidationWorkflow;
        return <span className="text-sm text-gray-500">{formatDate(workflow.updated_at)}</span>;
      },
    },
  ];
};

// Alias for backward compatibility
export const getAssumptionColumns = getValidationWorkflowColumns;
