import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SharedTable,
  type TableColumn,
  type TableRow as SharedTableRow,
} from "@/shared/SharedTable";
import SharedModal from "@/shared/SharedModal";
import {
  useGetWorkflowTemplatesQuery,
  useDeleteWorkflowTemplateMutation,
  type WorkflowTemplate,
} from "@/api/workflow.api";
import toast from "react-hot-toast";

export default function WorkFlow() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowTemplate | null>(null);

  // Fetch workflow templates data
  const {
    data: workflowData,
    error,
    isLoading,
  } = useGetWorkflowTemplatesQuery();

  // Delete workflow mutation
  const [deleteWorkflowTemplate] = useDeleteWorkflowTemplateMutation();

  const handleCreateNewWorkflow = () => {
    navigate("/app/AddWorkFlow");
  };

  const handleEdit = (row: SharedTableRow) => {
    const workflow = row as unknown as WorkflowTemplate;
    navigate(`/app/EditWorkFlow/${workflow.id}`);
  };

  const handleDelete = async (row: SharedTableRow) => {
    const workflow = row as unknown as WorkflowTemplate;
    try {
      await deleteWorkflowTemplate(workflow.id).unwrap();
      toast.success(t("workflow.deleteSuccess"));
      // Success feedback could be added here (toast notification, etc.)
    } catch (error) {
      console.error("Failed to delete workflow template:", error);
      toast.error(t("workflow.deleteFailed"));
      // Error feedback could be added here
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDescriptionClick = (workflow: WorkflowTemplate) => {
    setSelectedWorkflow(workflow);
    setIsDescriptionModalOpen(true);
  };

  // Define columns for the workflows table
  const columns: TableColumn[] = [
    {
      id: "code",
      header: t("workflow.workflowCode"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;
        return (
          <span className="text-sm text-gray-900 font-medium">
            {workflow.code}
          </span>
        );
      },
    },
    {
      id: "name",
      header: t("common.name"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;
        return <span className="text-sm text-gray-900">{workflow.name}</span>;
      },
    },
    {
      id: "transfer_type",
      header: t("workflow.transferType"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;
        return (
          <span className="text-sm text-gray-900">
            {workflow.transfer_type}
          </span>
        );
      },
    },
    {
      id: "description",
      header: t("common.description"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;

        return (
          <button
            onClick={() => handleDescriptionClick(workflow)}
            className="text-sm text-gray-900 bg-gray-100 p-2 rounded-md truncate max-w-xs hover:bg-gray-200 transition-colors cursor-pointer text-left"
            title={t("workflow.viewDescription")}
          >
            {t("common.description")}
          </button>
        );
      },
    },
    {
      id: "version",
      header: t("workflow.workflowVersion"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;
        return (
          <span className="text-sm text-gray-900">v.{workflow.version}</span>
        );
      },
    },
    {
      id: "is_active",
      header: t("tableColumns.status"),
      render: (_, row) => {
        const workflow = row as unknown as WorkflowTemplate;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              workflow.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {workflow.is_active ? t("workflow.active") : t("workflow.inactive")}
          </span>
        );
      },
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          {t("workflow.loadingWorkflows")}
        </span>
      </div>
    );
  }

  // Show error state
  if (error) {
    const errorMessage =
      "data" in error
        ? JSON.stringify(error.data)
        : "message" in error
        ? error.message
        : "Failed to load workflows";

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Error: {errorMessage}</div>
      </div>
    );
  }

  const workflows = workflowData?.results || [];
  const shouldShowPagination = workflows.length > itemsPerPage;

  return (
    <div>
      {/* Header with title and Create New Workflow button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t("workflow.workflows")}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/WorkflowAssignments")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--color-primary)] border border-[var(--color-primary)] text-sm font-medium rounded-lg hover:bg-[#f0f9f6] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <polyline points="17 11 19 13 23 9"></polyline>
            </svg>
            {t("workflow.manageAssignments")}
          </button>
          <button
            onClick={handleCreateNewWorkflow}
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
            {t("workflow.createNewWorkflow")}
          </button>
        </div>
      </div>

      {/* Workflows List Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <SharedTable
          title={t("workflow.workflowsList")}
          columns={columns}
          data={workflows as unknown as SharedTableRow[]}
          showFooter={false}
          maxHeight="600px"
          showActions={true}
          onDelete={handleDelete}
          onEdit={handleEdit}
          showPagination={shouldShowPagination}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Description Modal */}
      <SharedModal
        isOpen={isDescriptionModalOpen}
        onClose={() => setIsDescriptionModalOpen(false)}
        title={t("workflow.workflowDescription")}
        size="md"
      >
        <div className="p-4">
          {selectedWorkflow && (
            <div className="space-y-4">
              <div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    {selectedWorkflow.description ||
                      t("workflow.noDescription")}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsDescriptionModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
