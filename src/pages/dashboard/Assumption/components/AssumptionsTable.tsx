import {
  SharedTable,
  type TableRow as SharedTableRow,
} from "@/shared/SharedTable";
import type { ValidationWorkflow } from "./types";
import { getValidationWorkflowColumns } from "./tableColumns";
import type { ExecutionPoint } from "@/api/validationWorkflow.api";
import { useTranslation } from "react-i18next";

interface ValidationWorkflowsTableProps {
  workflows: ValidationWorkflow[];
  onEdit: (row: SharedTableRow) => void;
  onDelete: (row: SharedTableRow) => void;
  onDescriptionClick: (workflow: ValidationWorkflow) => void;
  onNameClick: (workflow: ValidationWorkflow) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalCount?: number;
  executionPoints?: ExecutionPoint[];
  showSelection?: boolean;
  selectedRows?: Set<number | string>;
  onSelectionChange?: (selectedIds: Set<number | string>) => void;
}

export const AssumptionsTable = ({
  workflows,
  onEdit,
  onDelete,
  onDescriptionClick,
  onNameClick,
  currentPage,
  onPageChange,
  itemsPerPage,
  totalCount,
  executionPoints,
  showSelection = false,
  selectedRows,
  onSelectionChange,
}: ValidationWorkflowsTableProps) => {
  const { t } = useTranslation();
  const columns = getValidationWorkflowColumns(
    onDescriptionClick,
    onNameClick,
    executionPoints,
    t
  );
  const total = totalCount ?? workflows.length;
  const shouldShowPagination = total > itemsPerPage;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <SharedTable
        title={t("assumptions.validationWorkflowsList")}
        columns={columns}
        data={workflows as unknown as SharedTableRow[]}
        showFooter={false}
        maxHeight="600px"
        showActions={true}
        onDelete={onDelete}
        onEdit={onEdit}
        showPagination={shouldShowPagination}
        currentPage={currentPage}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
        showSelection={showSelection}
        selectedRows={selectedRows}
        onSelectionChange={onSelectionChange}
      />
    </div>
  );
};

// Alias for backward compatibility
export const ValidationWorkflowsTable = AssumptionsTable;
