import SearchBar from "@/shared/SearchBar";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import { SharedModal } from "@/shared/SharedModal";
import { SharedSelect } from "@/shared/SharedSelect";
import type { SelectOption } from "@/shared/SharedSelect";
import { RichTextEditor } from "@/components/ui";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  useGetFundAdjustmentListQuery,
  useCreateFundAdjustmentMutation,
  useUpdateFundAdjustmentMutation,
  useDeleteFundAdjustmentMutation,
} from "@/api/fundAdjustments.api";
import type { FundAdjustmentItem } from "@/api/fundAdjustments.api";
import {
  useGetAttachmentsQuery,
  useUploadAttachmentMutation,
} from "@/api/attachments.api";
import type { Attachment } from "@/api/attachments.api";
import {
  useGetTransferStatusQuery,
  useGetOracleStatusQuery,
} from "@/api/transfer.api";

const ORACLE_EXPECTED_SUBMIT_STEPS = 4;
const ORACLE_ERROR_STATUSES = ["error", "failed", "warning"];

export default function FundAdjustments() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State management
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [selectedFundAdjustment, setSelectedFundAdjustment] =
    useState<FundAdjustmentItem | null>(null);
  const [time_period, settime_period] = useState<string>("");
  const [reason, setreason] = useState<string>("");
  const [budget_control, setBudgetControl] = useState<string>("");
  const [transfer_type, setTransferType] = useState<string>("");

  // Export PDF state
  const [showExportUI, setShowExportUI] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Attachments state
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>("");

  // Status pipeline modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTransactionId, setStatusTransactionId] = useState<number | null>(
    null
  );

  // Oracle Track modal state
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [trackTransactionId, setTrackTransactionId] = useState<number | null>(
    null
  );
  const [activeOracleTab, setActiveOracleTab] = useState<"submit" | "journal">(
    "submit"
  );

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    time_period?: string;
    reason?: string;
    budget_control?: string;
    transfer_type?: string;
  }>({});

  // State for expanded comments in status modal
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );

  // API calls
  const { data: fundAdjustmentResponse, isLoading } =
    useGetFundAdjustmentListQuery({
      page: currentPage,
      page_size: 10,
      code: "DFR",
      search: searchQuery,
    });

  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useGetTransferStatusQuery(statusTransactionId!, {
    skip: !statusTransactionId || !isStatusModalOpen,
  });

  // Oracle Status API call

  // Oracle Status API call
  const {
    data: oracleStatusData,
    isLoading: isLoadingOracleStatus,
    error: oracleStatusError,
    refetch: refetchOracleStatus,
  } = useGetOracleStatusQuery(trackTransactionId!, {
    skip: !trackTransactionId || !isTrackModalOpen,
  });

  // Oracle submit pipeline summary (used to surface overall status)
  const submitGroup = oracleStatusData?.action_groups?.find(
    (group) => group.action_type?.toLowerCase() === "submit"
  );
  const submitSteps = submitGroup?.steps || [];
  const submitHasError = submitSteps.some((step) =>
    ORACLE_ERROR_STATUSES.includes((step.status || "").toLowerCase())
  );
  const submitAllSuccess =
    submitSteps.length >= ORACLE_EXPECTED_SUBMIT_STEPS &&
    submitSteps.every(
      (step) => (step.status || "").toLowerCase() === "success"
    );
  const submitOverallStatus: "approved" | "rejected" | "in_progress" | null =
    submitGroup && submitSteps.length > 0
      ? submitHasError
        ? "rejected"
        : submitAllSuccess
        ? "approved"
        : "in_progress"
      : null;
  const journalGroups =
    oracleStatusData?.action_groups?.filter(
      (group) => group.action_type?.toLowerCase() !== "submit"
    ) || [];

  const [createFundAdjustment, { isLoading: isCreating }] =
    useCreateFundAdjustmentMutation();
  const [updateFundAdjustment, { isLoading: isUpdating }] =
    useUpdateFundAdjustmentMutation();
  const [deleteFundAdjustment] = useDeleteFundAdjustmentMutation();

  // Attachments API calls
  const {
    data: attachmentsData,
    isLoading: isLoadingAttachments,
    refetch: refetchAttachments,
  } = useGetAttachmentsQuery(selectedTransactionId, {
    skip: !selectedTransactionId || !isAttachmentsModalOpen,
  });

  const [uploadAttachment, { isLoading: isUploading }] =
    useUploadAttachmentMutation();

  // State for managing edit mode opening
  const [shouldOpenModal, setShouldOpenModal] = useState(false);

  // Effect to open modal after state updates are complete
  useEffect(() => {
    if (shouldOpenModal && isEditMode) {
      console.log("🚀 Opening modal with state:", { time_period, reason });
      setIsCreateModalOpen(true);
      setShouldOpenModal(false);
    }
  }, [shouldOpenModal, isEditMode, time_period, reason]);

  // Handle null/empty values
  const safeValue = (value: unknown, fallback: string = "-") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  };

  // Transform API data to table format
  const transformedData: TableRow[] =
    fundAdjustmentResponse?.results?.map((item: FundAdjustmentItem) => ({
      id: item.transaction_id,
      code: safeValue(item.code),
      requested_by: safeValue(item.requested_by),
      description: safeValue(item.notes, "No description"),
      request_date: item.request_date
        ? new Date(item.request_date).toLocaleDateString()
        : "-",
      transaction_date: safeValue(item.transaction_date, "No Transaction Date"),
      track: item.transaction_id,
      status: safeValue(item.status, "pending"),
      attachment: item.attachment,
      amount: item.amount || 0,
      // Include original item for detail view
      original: item,
    })) || [];

  // Table columns configuration
  const fundAdjustmentColumns: TableColumn[] = [
    {
      id: "code",
      header: t("fundAdjustmentsPage.code"),
      accessor: "code",
      render: (value, row) => (
        <span
          className="font-medium bg-[#F6F6F6] p-2  rounded-md cursor-pointer hover:bg-[#e8f2ef] transition"
          onClick={() => handleCodeClick(row)}
        >
          {safeValue(value)}
        </span>
      ),
    },
    {
      id: "requested_by",
      header: t("fundAdjustmentsPage.requestedBy"),
      accessor: "requested_by",
      render: (value) => (
        <span className="font-medium text-[#282828]">{safeValue(value)}</span>
      ),
    },
    {
      id: "description",
      header: t("fundAdjustmentsPage.description"),
      accessor: "description",
      render: (value) => (
        <div
          className="text-[#282828] max-w-xs prose prose-sm prose-p:my-1 prose-p:leading-5"
          dangerouslySetInnerHTML={{
            __html: safeValue(value, t("fundAdjustments.noDescription")),
          }}
          style={{
            wordBreak: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        />
      ),
    },
    {
      id: "request_date",
      header: t("fundAdjustmentsPage.requestDate"),
      accessor: "request_date",
      render: (value) => (
        <span className="text-[#282828]">{safeValue(value)}</span>
      ),
    },
    {
      id: "transaction_date",
      header: t("fundAdjustmentsPage.transactionDate"),
      accessor: "transaction_date",
      render: (value) => (
        <span className="text-[#282828]">
          {safeValue(value, t("fundAdjustmentsPage.notSet"))}
        </span>
      ),
    },
    {
      id: "track",
      header: t("fundAdjustmentsPage.track"),
      accessor: "track",
      render: (_value, row) => (
        <span
          className="font-medium bg-[#F6F6F6] p-2 rounded-md cursor-pointer hover:bg-[#e8f2ef] transition"
          onClick={() => handleTrackClick(row)}
        >
          {t("fundAdjustmentsPage.track")}
        </span>
      ),
    },
    {
      id: "status",
      header: t("tableColumns.status"),
      accessor: "status",
      render: (value, row) => {
        // Helper to map raw status values to i18n keys
        const translateStatus = (status: unknown) => {
          const s = String(status || "").toLowerCase();
          switch (s) {
            case "approved":
            case "active":
              return t("statusTransfer.approved");
            case "pending":
              return t("statusTransfer.pending");
            case "rejected":
              return t("statusTransfer.rejected");
            case "in_progress":
            case "in-progress":
              return t("statusTransfer.in_progress");
            case "draft":
              return t("statusTransfer.draft");
            default:
              return safeValue(status);
          }
        };

        const bgClass =
          value === "approved" || value === "active"
            ? "bg-green-100 text-green-800"
            : value === "pending"
            ? "bg-yellow-100 text-yellow-800"
            : value === "rejected"
            ? "bg-red-100 text-red-800"
            : value === "in_progress" || value === "in-progress"
            ? "bg-blue-300 text-blue-800"
            : "bg-gray-100 text-gray-800";

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ${bgClass}`}
            onClick={() => handleStatusClick(row)}
          >
            {translateStatus(value)}
          </span>
        );
      },
    },
    {
      id: "attachment",
      header: t("fundAdjustmentsPage.attachments"),
      accessor: "attachment",
      render: (_value, row) => (
        <span
          className="font-medium bg-[#F6F6F6] p-2 rounded-md cursor-pointer hover:bg-[#e8f2ef] transition"
          onClick={() => handleAttachmentsClick(row)}
        >
          {t("fundAdjustmentsPage.attachments")}
        </span>
      ),
    },
  ]; // Event handlers
  const handleCodeClick = (row: TableRow) => {
    const originalFundAdjustment = row.original as FundAdjustmentItem;
    const status = originalFundAdjustment.status || "pending";
    navigate(`/app/FundAdjustments/${row.id}`, {
      state: { status },
    });
  };

  const handleStatusClick = (row: TableRow) => {
    const transactionId = Number(row.id);
    // Clear any previous status data to prevent showing old data
    setStatusTransactionId(null);
    setExpandedComments(new Set()); // Clear expanded comments
    setIsStatusModalOpen(true);
    // Set the transaction ID after modal is open to trigger fresh API call
    setTimeout(() => {
      setStatusTransactionId(transactionId);
    }, 100);
    console.log("Opening status pipeline for transaction:", transactionId);
  };

  // Handler for attachments click
  const handleAttachmentsClick = (row: TableRow) => {
    const transactionId = String(row.id);
    setSelectedTransactionId(transactionId);
    setIsAttachmentsModalOpen(true);
    console.log("Opening attachments modal for transaction:", transactionId);
  };

  // File upload handlers
  const handleFileSelect = async (file: File) => {
    if (!selectedTransactionId) {
      toast.error(t("fundAdjustments.noTransactionSelected"));
      return;
    }

    try {
      await uploadAttachment({
        transaction_id: selectedTransactionId,
        file: file,
      }).unwrap();

      toast.success(t("fundAdjustments.uploadSuccess"));
      // Refresh the attachments list
      refetchAttachments();
    } catch (error: unknown) {
      console.error("Error uploading file:", error);
      toast.error(t("fundAdjustments.uploadFailed"));
    }
  };

  // Download file handler
  const handleDownloadFile = (attachment: Attachment) => {
    try {
      // Decode base64 data
      const byteCharacters = atob(attachment.file_data);
      const byteNumbers = Array.from(
        { length: byteCharacters.length },
        (_, i) => byteCharacters.charCodeAt(i)
      );
      const byteArray = new Uint8Array(byteNumbers);

      // Create blob and download
      const blob = new Blob([byteArray], { type: attachment.file_type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("fundAdjustments.downloadSuccess"));
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error(t("fundAdjustments.downloadFailed"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(
      (file) =>
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".doc") ||
        file.name.endsWith(".docx")
    );

    if (validFile) {
      handleFileSelect(validFile);
    } else {
      alert(t("fundAdjustments.pleaseUploadValidExcelFile"));
    }
  };

  // Handler for track click
  const handleTrackClick = (row: TableRow) => {
    const transactionId = Number(row.id);
    setTrackTransactionId(null);
    setIsTrackModalOpen(true);
    // Set the transaction ID after modal is open to trigger fresh API call
    setTimeout(() => {
      setTrackTransactionId(transactionId);
    }, 100);
    console.log("Opening Oracle status for transaction:", transactionId);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchSubmit = (text: string) => {
    console.log("Search submitted:", text);
    // Implement search functionality
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilter = () => {
    console.log("Filter fund adjustments");
    // Add your filter logic here
  };

  const handleEdit = (row: TableRow) => {
    const originalFundAdjustment = row.original as FundAdjustmentItem;
    console.log("Editing fund adjustment:", originalFundAdjustment); // Debug log

    setSelectedFundAdjustment(originalFundAdjustment);
    setIsEditMode(true);

    // Clear previous validation errors
    setValidationErrors({});

    // Populate form with existing data
    // Handle transaction_date - check if it matches one of our select options
    let transactionDate = originalFundAdjustment.transaction_date || "";

    // If the transaction_date is a date string, try to extract month name
    if (
      transactionDate &&
      !accountOptions.some((option) => option.value === transactionDate)
    ) {
      try {
        const date = new Date(transactionDate);
        if (!isNaN(date.getTime())) {
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          transactionDate = monthNames[date.getMonth()];
        }
      } catch {
        transactionDate = "";
      }
    }

    const isValidOption = accountOptions.some(
      (option) => option.value === transactionDate
    );
    const finalDateValue = isValidOption ? transactionDate : "";

    // Handle notes/reason - use notes field as HTML directly for rich text editor
    const notes = originalFundAdjustment.notes || "";

    console.log("BEFORE setting form values:", {
      originalDate: originalFundAdjustment.transaction_date,
      processedDate: transactionDate,
      isValidOption,
      finalDateValue,
      originalNotes: originalFundAdjustment.notes,
      notes,
      currentTimePeriod: time_period,
      currentReason: reason,
    }); // Debug log

    // Set the values with explicit logging
    settime_period(finalDateValue);
    console.log("✅ Set time_period to:", finalDateValue);

    setreason(notes); // Use HTML directly
    console.log("✅ Set reason to:", notes);

    // Set budget control if available - use control_budget from API
    const budgetControl = originalFundAdjustment.control_budget || "";
    setBudgetControl(budgetControl);
    console.log("✅ Set budget_control to:", budgetControl);

    // Set transfer type if available
    const transferTypeValue = originalFundAdjustment.transfer_type || "";
    setTransferType(transferTypeValue);
    console.log("✅ Set transfer_type to:", transferTypeValue);

    console.log("AFTER setting form values:", {
      time_period_set: finalDateValue,
      reason_set: notes,
      budget_control_set: budgetControl,
      transfer_type_set: transferTypeValue,
    });

    // Trigger modal opening via useEffect after state updates
    setShouldOpenModal(true);
  };

  const handleDelete = async (row: TableRow) => {
    const fundAdjustmentStatus = row.status;

    // Check if fund adjustment can be deleted
    if (fundAdjustmentStatus !== "pending") {
      toast.error(
        t("fundAdjustmentsPage.cannotDeleteStatus", {
          status: fundAdjustmentStatus,
        })
      );
      return;
    }

    try {
      await deleteFundAdjustment(Number(row.id)).unwrap();
      toast.success(t("fundAdjustments.deleteSuccess"));
    } catch (error: unknown) {
      let errorMessage = t("fundAdjustments.deleteFailed");
      if (
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "message" in error.data
      ) {
        errorMessage = String(error.data.message);
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }
      toast.error(errorMessage);
    }
  };

  const handleCreateRequest = () => {
    setIsEditMode(false);
    setSelectedFundAdjustment(null);
    setValidationErrors({});

    // Clear form values
    settime_period("");
    setreason("");
    setBudgetControl("");
    setTransferType("");

    // Open modal after clearing values
    setIsCreateModalOpen(true);

    console.log("Creating new request - form cleared"); // Debug log
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsEditMode(false);
    setSelectedFundAdjustment(null);
    settime_period("");
    setreason("");
    setBudgetControl("");
    setTransferType("");
    setValidationErrors({});
    setShouldOpenModal(false); // Reset the modal trigger
  };

  const handleSave = async () => {
    // Clear previous validation errors
    setValidationErrors({});

    // Validation
    const errors: {
      time_period?: string;
      reason?: string;
      budget_control?: string;
      transfer_type?: string;
    } = {};

    if (!time_period.trim()) {
      errors.time_period = t("fundAdjustments.pleaseSelectTimePeriod");
    }

    if (!reason.trim()) {
      errors.reason = t("fundAdjustments.pleaseEnterNotes");
    }

    if (!budget_control.trim()) {
      errors.budget_control = t("fundAdjustments.pleaseSelectBudgetControl");
    }

    if (!transfer_type.trim()) {
      errors.transfer_type = t("fundAdjustments.pleaseSelectTransferType");
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Use HTML directly from the rich text editor (no conversion needed)
      const fundAdjustmentData = {
        transaction_date: time_period,
        notes: reason, // reason already contains HTML from RichTextEditor
        type: "DFR", // Static as requested
        budget_control: budget_control,
        transfer_type: transfer_type,
      };

      if (isEditMode && selectedFundAdjustment) {
        // Update existing fund adjustment
        await updateFundAdjustment({
          id: selectedFundAdjustment.transaction_id,
          body: fundAdjustmentData,
        }).unwrap();

        toast.success(t("fundAdjustments.updateSuccess"));
        console.log("Fund adjustment updated successfully");
      } else {
        // Create new fund adjustment
        await createFundAdjustment(fundAdjustmentData).unwrap();

        toast.success(t("fundAdjustments.createSuccess"));
        console.log("Fund adjustment created successfully");
      }

      handleCloseModal();
    } catch (error: unknown) {
      console.error("Error saving fund adjustment:", error);
      toast.error(t("fundAdjustments.createFailed"));
    }
  };

  // Select options for transaction dates - Current year (2025), Previous (2024), Next (2026)
  const accountOptions: SelectOption[] = [
    // Previous Year (2024)
    { value: "1-24", label: "1-24" },
    // Current Year (2025)
    { value: "1-25", label: "1-25" },
    // Next Year (2026)
    // { value: "1-26", label: "1-26" },
  ];

  // Select options for budget control
  const budgetControlOptions: SelectOption[] = [
    { value: "سيولة", label: "سيولة" },
    { value: "تكاليف", label: "تكاليف" },
  ];

  const transferTypeOptions: SelectOption[] = [
    { value: "تخفيض مباشر", label: "تخفيض مباشر" },
    {
      value: "تخفيض الجهات ذات العلاقة",
      label: "تخفيض الجهات ذات العلاقة",
    },
  ];

  const handleReasonChange = (value: string) => {
    setreason(value);
    // Clear validation error when user types
    if (validationErrors.reason) {
      setValidationErrors((prev) => ({ ...prev, reason: undefined }));
    }
  };

  // Calculate loading state based on action type
  const isSubmitting = isCreating || isUpdating;

  // Check if form has data
  const hasData = budget_control.trim() || time_period.trim() || reason.trim();

  const handleChat = (row: TableRow) => {
    // Navigate to chat page with transaction/request ID
    navigate(`/app/chat/${row.id}`, { state: { txCode: row.code } });
  };

  // Handle export to PDF
  const handleExportToPdf = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) {
      toast.error(t("messages.selectAtLeastOne"));
      return;
    }

    // Navigate to PDF view page
    const idsParam = selectedIds.join(",");
    navigate(`/app/table-view-pdf?ids=${idsParam}`);

    // Clear selection after navigation
    setSelectedRows(new Set());
  };

  // Handle selection change from SharedTable (converts Set<string | number> to Set<number>)
  const handleSelectionChange = (selectedIds: Set<string | number>) => {
    const numberSet = new Set<number>();
    selectedIds.forEach((id) => {
      const numId = typeof id === "string" ? parseInt(id, 10) : id;
      if (!isNaN(numId)) {
        numberSet.add(numId);
      }
    });
    setSelectedRows(numberSet);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("fundAdjustmentsPage.title")}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowExportUI(!showExportUI);
              if (showExportUI) {
                // Clear selection when disabling export mode
                setSelectedRows(new Set());
              }
            }}
            className={`px-4 py-2 rounded-md transition-colors font-medium ${
              showExportUI
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {showExportUI ? t("common.cancel") : t("common.exportPDF")}
          </button>
          <button
            onClick={handleCreateRequest}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[#35584f] transition-colors"
          >
            {t("fundAdjustmentsPage.createFundAdjustment")}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl mb-6">
        <SearchBar
          placeholder={t("fundAdjustmentsPage.searchPlaceholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          debounce={0}
        />
      </div>

      {/* Transfer Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
          <span className="ml-2 text-gray-600">
            {t("fundAdjustmentsPage.loading")}
          </span>
        </div>
      ) : transformedData.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 text-2xl mb-2">📄</div>
            <p className="text-gray-600">
              {t("fundAdjustmentsPage.noAdjustmentsFound")}
            </p>
          </div>
        </div>
      ) : (
        <SharedTable
          title={t("fundAdjustmentsPage.title")}
          columns={fundAdjustmentColumns}
          data={transformedData}
          maxHeight="600px"
          className="shadow-lg"
          showPagination={true}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
          totalCount={fundAdjustmentResponse?.count}
          hasNext={!!fundAdjustmentResponse?.next}
          hasPrevious={!!fundAdjustmentResponse?.previous}
          showActions={true}
          showFooter={true}
          onEdit={handleEdit}
          onDelete={handleDelete}
          transactions={true}
          onChat={handleChat}
          onFilter={handleFilter}
          showExportButton={showExportUI}
          exportButtonText={t("common.exportPDF")}
          showSelection={showExportUI}
          selectedRows={selectedRows}
          onSelectionChange={handleSelectionChange}
          filterLabel={t("fundAdjustmentsPage.filterTransfers")}
          onExport={showExportUI ? handleExportToPdf : undefined}
        />
      )}

      {/* Create/Edit Fund Adjustment Modal */}
      <SharedModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={
          isEditMode
            ? t("fundAdjustmentsPage.editFundAdjustment")
            : t("fundAdjustmentsPage.createFundAdjustment")
        }
        size="md"
      >
        <div className="p-4 space-y-4">
          {/* Budget Control */}
          <div className="space-y-2">
            <SharedSelect
              key={`budget-control-${
                isEditMode ? selectedFundAdjustment?.transaction_id : "create"
              }`}
              title={t("fundAdjustmentsPage.budgetControl")}
              options={budgetControlOptions}
              value={budget_control}
              onChange={(value) => setBudgetControl(String(value))}
              placeholder={t("fundAdjustmentsPage.selectBudgetControl")}
              required
            />
            {validationErrors.budget_control && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.budget_control}
              </p>
            )}
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <SharedSelect
              key={`transaction-date-${
                isEditMode ? selectedFundAdjustment?.transaction_id : "create"
              }`}
              title={t("fundAdjustmentsPage.transactionDateLabel")}
              options={accountOptions}
              value={time_period}
              onChange={(value) => settime_period(String(value))}
              placeholder={t("fundAdjustmentsPage.selectTransactionDate")}
              required
            />
          </div>
          <div>
            <SharedSelect
              key={`transfer-type-${
                isEditMode ? selectedFundAdjustment?.transaction_id : "create"
              }`}
              title={t("Type_of_reinforcement2")}
              options={transferTypeOptions}
              value={transfer_type}
              onChange={(value) => setTransferType(String(value))}
              placeholder={t("select_Type_of_reinforcement2")}
              required
            />
            {validationErrors.transfer_type && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.transfer_type}
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("fundAdjustmentsPage.notes")}
            </label>
            <div className="space-y-1">
              <RichTextEditor
                value={reason}
                onChange={handleReasonChange}
                placeholder={t("fundAdjustmentsPage.enterNotes")}
                className={
                  validationErrors.reason
                    ? "border-red-500 focus:border-red-500"
                    : ""
                }
              />
              {validationErrors.reason && (
                <p className="text-sm text-red-600">
                  {validationErrors.reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("fundAdjustmentsPage.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={
                isSubmitting ||
                !hasData ||
                Object.keys(validationErrors).length > 0
              }
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] border border-[var(--color-primary)] rounded-md hover:bg-[#35584f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isEditMode
                ? t("fundAdjustmentsPage.updateFundAdjustment")
                : t("fundAdjustmentsPage.createFundAdjustment")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Manage Attachments Modal */}
      <SharedModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        title={t("fundAdjustmentsPage.manageAttachments")}
        size="lg"
      >
        <div className="p-4">
          {/* Upload section */}
          <div
            className={`w-full flex flex-col py-8 gap-4 items-center transition-colors mb-6 ${
              isDragOver
                ? "bg-blue-100 border-2 border-dashed border-blue-400"
                : "bg-[#F6F6F6]"
            } rounded-lg`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="rounded-full p-2">
              <svg
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M35.417 18.7542C39.9483 18.7794 42.4023 18.9803 44.0031 20.5811C45.8337 22.4117 45.8337 25.358 45.8337 31.2505V33.3339C45.8337 39.2264 45.8337 42.1727 44.0031 44.0033C42.1725 45.8339 39.2262 45.8339 33.3337 45.8339H16.667C10.7744 45.8339 7.82816 45.8339 5.99757 44.0033C4.16699 42.1727 4.16699 39.2264 4.16699 33.3339L4.16699 31.2505C4.16699 25.358 4.16699 22.4117 5.99757 20.5811C7.59837 18.9803 10.0524 18.7794 14.5837 18.7542"
                  stroke="#282828"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M25 31.25L25 4.16666M25 4.16666L31.25 11.4583M25 4.16666L18.75 11.4583"
                  stroke="#282828"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-semibold text-base mb-1">
                {t("fundAdjustmentsPage.dragDropFile")}{" "}
                <button
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  className="text-[var(--color-primary)] underline hover:text-blue-700 transition-colors"
                  disabled={isUploading}
                >
                  {t("fundAdjustmentsPage.browse")}
                </button>
              </div>
              <div className="text-xs text-[#757575] mb-2">
                {t("fundAdjustmentsPage.supportedFormats")}
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file);
                    e.target.value = ""; // Reset input
                  }
                }}
              />
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">
                  {t("fundAdjustmentsPage.uploading")}
                </span>
              </div>
            )}
          </div>

          {/* Attachments list */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">
              {t("fundAdjustmentsPage.existingAttachments")}
            </h4>

            {isLoadingAttachments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("fundAdjustmentsPage.loadingAttachments")}
                </span>
              </div>
            ) : attachmentsData &&
              attachmentsData.attachments &&
              attachmentsData.attachments.length > 0 ? (
              <div className="space-y-2">
                {attachmentsData.attachments.map((attachment) => (
                  <div
                    key={attachment.attachment_id}
                    className="flex items-center justify-between gap-3 bg-white rounded-lg px-4 py-3 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <svg
                        width="24"
                        height="25"
                        viewBox="0 0 24 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16 2.5H8C4.5 2.5 3 4.5 3 7.5V17.5C3 20.5 4.5 22.5 8 22.5H16C19.5 22.5 21 20.5 21 17.5V7.5C21 4.5 19.5 2.5 16 2.5ZM8 12.75H12C12.41 12.75 12.75 13.09 12.75 13.5C12.75 13.91 12.41 14.25 12 14.25H8C7.59 14.25 7.25 13.91 7.25 13.5C7.25 13.09 7.59 12.75 8 12.75ZM16 18.25H8C7.59 18.25 7.25 17.91 7.25 17.5C7.25 17.09 7.59 16.75 8 16.75H16C16.41 16.75 16.75 17.09 16.75 17.5C16.75 17.91 16.41 18.25 16 18.25ZM18.5 9.75H16.5C14.98 9.75 13.75 8.52 13.75 7V5C13.75 4.59 14.09 4.25 14.5 4.25C14.91 4.25 15.25 4.59 15.25 5V7C15.25 7.69 15.81 8.25 16.5 8.25H18.5C18.91 8.25 19.25 8.59 19.25 9C19.25 9.41 18.91 9.75 18.5 9.75Z"
                          fill="#545454"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#545454] truncate">
                          {attachment.file_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#545454]">
                      <span>{(attachment.file_size / 1024).toFixed(1)} KB</span>
                      <span>
                        {new Date(attachment.upload_date).toLocaleDateString()}
                      </span>
                      <button
                        className="bg-[#EEEEEE] p-1 rounded-md hover:bg-gray-300 transition-colors"
                        title="Download"
                        onClick={() => handleDownloadFile(attachment)}
                      >
                        <svg
                          width="16"
                          height="17"
                          viewBox="0 0 16 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.36902 11.5041C8.27429 11.6077 8.14038 11.6667 8 11.6667C7.85962 11.6667 7.72571 11.6077 7.63099 11.5041L4.96432 8.58738C4.77799 8.38358 4.79215 8.06732 4.99595 7.88099C5.19975 7.69465 5.51602 7.70881 5.70235 7.91262L7.5 9.8788V2.5C7.5 2.22386 7.72386 2 8 2C8.27614 2 8.5 2.22386 8.5 2.5V9.8788L10.2977 7.91262C10.484 7.70881 10.8003 7.69465 11.0041 7.88099C11.2079 8.06732 11.222 8.38358 11.0357 8.58738L8.36902 11.5041Z"
                            fill="#282828"
                          />
                          <path
                            d="M2.5 10.5C2.5 10.2239 2.27614 10 2 10C1.72386 10 1.5 10.2239 1.5 10.5V10.5366C1.49999 11.4483 1.49998 12.1832 1.57768 12.7612C1.65836 13.3612 1.83096 13.8665 2.23223 14.2678C2.63351 14.669 3.13876 14.8416 3.73883 14.9223C4.31681 15 5.05169 15 5.96342 15H10.0366C10.9483 15 11.6832 15 12.2612 14.9223C12.8612 14.8416 13.3665 14.669 13.7678 14.2678C14.169 13.8665 14.3416 13.3612 14.4223 12.7612C14.5 12.1832 14.5 11.4483 14.5 10.5366V10.5C14.5 10.2239 14.2761 10 14 10C13.7239 10 13.5 10.2239 13.5 10.5C13.5 11.4569 13.4989 12.1244 13.4312 12.6279C13.3655 13.1171 13.2452 13.3762 13.0607 13.5607C12.8762 13.7452 12.6171 13.8655 12.1279 13.9312C11.6244 13.9989 10.9569 14 10 14H6C5.04306 14 4.37565 13.9989 3.87208 13.9312C3.3829 13.8655 3.12385 13.7452 2.93934 13.5607C2.75483 13.3762 2.63453 13.1171 2.56877 12.6279C2.50106 12.1244 2.5 11.4569 2.5 10.5Z"
                            fill="#282828"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 text-2xl mb-2">📎</div>
                <p>{t("fundAdjustmentsPage.noAttachmentsFound")}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              onClick={() => setIsAttachmentsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("fundAdjustmentsPage.close")}
            </button>
          </div>
        </div>
      </SharedModal>
      {/* Oracle ERP Status Modal */}
      <SharedModal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setTrackTransactionId(null);
          setActiveOracleTab("submit"); // Reset to default tab
        }}
        title={t("transfer.oracleStatus")}
        size="lg"
      >
        <div className="flex flex-col" style={{ maxHeight: "80vh" }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6 pt-4">
            <button
              onClick={() => setActiveOracleTab("submit")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeOracleTab === "submit"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("oracle.submitSteps")}
              </div>
            </button>
            <button
              onClick={() => setActiveOracleTab("journal")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeOracleTab === "journal"
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t("oracle.approveRejectSteps")}
              </div>
            </button>
          </div>

          {/* Overall submit status summary */}
          {activeOracleTab === "submit" && submitOverallStatus && (
            <div className="flex items-center justify-between px-6 py-4 my-5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    submitOverallStatus === "approved"
                      ? "bg-green-100 text-green-600"
                      : submitOverallStatus === "rejected"
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {submitOverallStatus === "approved" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {submitOverallStatus === "rejected" && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  {submitOverallStatus === "in_progress" && (
                    <div className="w-5 h-5 border-2 border-current border-b-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">حالة حجز القيد</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {submitOverallStatus === "in_progress"
                      ? "جاري حجز القيد"
                      : submitOverallStatus === "approved"
                      ? "تم حجز القيد"
                      : "فشل حجز القيد"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-xs text-gray-500">الخطوات</span>
                <span className="px-2 py-1 rounded-md bg-gray-100">
                  {submitSteps.length}/{ORACLE_EXPECTED_SUBMIT_STEPS}
                </span>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto ">
            {isLoadingOracleStatus ? (
              <div className="space-y-6">
                {/* Loading Skeleton */}
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-4 pb-8 last:pb-0"
                    >
                      <div className="relative z-10 w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                      <div className="flex-1 pt-2 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : oracleStatusError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("oracle.loadError")}
                </h3>
                <p className="text-sm text-gray-600 text-center max-w-md">
                  {t("oracle.loadErrorMessage")}
                </p>
              </div>
            ) : oracleStatusData ? (
              <div>
                {/* Submit Steps Tab Content */}
                {activeOracleTab === "submit" &&
                  (() => {
                    const submitGroupLocal = submitGroup;

                    if (!submitGroupLocal) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="text-gray-400 text-4xl mb-4">📋</div>
                          <p className="text-sm text-gray-600">
                            {t("oracle.noSubmitSteps")}
                          </p>
                        </div>
                      );
                    }

                    // return (
                    //   <div className="relative">
                    //     <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                    //     {submitGroupLocal.steps.map((step, index) => {
                    //       const isErrorStatus = ORACLE_ERROR_STATUSES.includes(
                    //         (step.status || "").toLowerCase()
                    //       );
                    //       const isSuccessStatus =
                    //         (step.status || "").toLowerCase() === "success";

                    //       return (
                    //         <div
                    //           key={index}
                    //           className="relative flex items-start gap-4 pb-8 last:pb-0"
                    //         >
                    //           <div
                    //             className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                    //               isSuccessStatus
                    //                 ? "bg-green-500 border-green-200"
                    //                 : isErrorStatus
                    //                 ? "bg-red-500 border-red-200"
                    //                 : "bg-gray-400 border-gray-200"
                    //             }`}
                    //           >
                    //             {isSuccessStatus ? (
                    //               <svg
                    //                 className="w-6 h-6 text-white"
                    //                 fill="currentColor"
                    //                 viewBox="0 0 20 20"
                    //               >
                    //                 <path
                    //                   fillRule="evenodd"
                    //                   d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    //                   clipRule="evenodd"
                    //                 />
                    //               </svg>
                    //             ) : isErrorStatus ? (
                    //               <svg
                    //                 className="w-6 h-6 text-white"
                    //                 fill="currentColor"
                    //                 viewBox="0 0 20 20"
                    //               >
                    //                 <path
                    //                   fillRule="evenodd"
                    //                   d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    //                   clipRule="evenodd"
                    //                 />
                    //               </svg>
                    //             ) : (
                    //               <span className="text-white font-bold">
                    //                 {step.step_number}
                    //               </span>
                    //             )}
                    //           </div>

                    //           <div className="flex-1 min-w-0 pt-1">
                    //             <div className="flex items-center justify-between mb-1">
                    //               <h4 className="text-sm font-semibold text-gray-900">
                    //                 {step.step_name}
                    //               </h4>
                    //               <span
                    //                 className={`text-xs font-medium px-2 py-1 rounded-full ${
                    //                   isSuccessStatus
                    //                     ? "bg-green-100 text-green-800"
                    //                     : isErrorStatus
                    //                     ? "bg-red-100 text-red-800"
                    //                     : "bg-gray-100 text-gray-800"
                    //                 }`}
                    //               >
                    //                 {step.status}
                    //               </span>
                    //             </div>
                    //             <p className="text-sm text-gray-600 mb-2">
                    //               {step.message}
                    //             </p>
                    //             {(step.request_id ||
                    //               step.document_id ||
                    //               step.group_id) && (
                    //               <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    //                 {step.request_id && (
                    //                   <span>
                    //                     <span className="font-medium">
                    //                       {t("oracle.requestId")}:
                    //                     </span>{" "}
                    //                     {step.request_id}
                    //                   </span>
                    //                 )}
                    //                 {step.document_id && (
                    //                   <span>
                    //                     <span className="font-medium">
                    //                       {t("oracle.documentId")}:
                    //                     </span>{" "}
                    //                     {step.document_id}
                    //                   </span>
                    //                 )}
                    //                 {step.group_id && (
                    //                   <span>
                    //                     <span className="font-medium">
                    //                       {t("oracle.groupId")}:
                    //                     </span>{" "}
                    //                     {step.group_id}
                    //                   </span>
                    //                 )}
                    //               </div>
                    //             )}
                    //           </div>
                    //         </div>
                    //       );
                    //     })}
                    //   </div>
                    // );
                  })()}

                {/* Journal Steps Tab Content */}
                {activeOracleTab === "journal" &&
                  (() => {
                    if (journalGroups.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="text-gray-400 text-4xl mb-4">📋</div>
                          <p className="text-sm text-gray-600">
                            {t("oracle.noJournalSteps")}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-8 mt-4">
                        {journalGroups.map((group, groupIndex) => {
                          // Determine the action type and display text
                          const actionType =
                            group.action_type?.toLowerCase() || "";
                          const isRejectAction = actionType === "reject";

                          // Calculate group status
                          const groupSteps = group.steps || [];
                          const groupHasError = groupSteps.some((step) =>
                            ["error", "failed", "warning"].includes(
                              (step.status || "").toLowerCase()
                            )
                          );
                          const groupAllSuccess = groupSteps.every(
                            (step) =>
                              (step.status || "").toLowerCase() === "success"
                          );
                          const groupStatus = groupHasError
                            ? "rejected"
                            : groupAllSuccess && groupSteps.length > 0
                            ? "approved"
                            : "in_progress";

                          // Display title based on action type and status
                          let displayTitle = "";
                          if (isRejectAction) {
                            if (groupStatus === "in_progress") {
                              displayTitle = "جاري عكس القيد";
                            } else if (groupStatus === "approved") {
                              displayTitle = "تم عكس القيد";
                            } else {
                              displayTitle = "فشل عكس القيد";
                            }
                          } else if (actionType === "approve") {
                            if (groupStatus === "in_progress") {
                              displayTitle = "جاري رفع الميزانية";
                            } else if (groupStatus === "approved") {
                              displayTitle = "تم رفع الميزانية";
                            } else {
                              displayTitle = "فشل رفع الميزانية";
                            }
                          } else {
                            // Fallback to original action_type
                            displayTitle = group.action_type || "";
                          }

                          return (
                            <div key={groupIndex}>
                              {/* Overall status summary for this group */}
                              <div className="flex items-center justify-between px-6 py-4 mb-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      groupStatus === "approved"
                                        ? "bg-green-100 text-green-600"
                                        : groupStatus === "rejected"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-blue-100 text-blue-600"
                                    }`}
                                  >
                                    {groupStatus === "approved" && (
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                    {groupStatus === "rejected" && (
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    )}
                                    {groupStatus === "in_progress" && (
                                      <div className="w-5 h-5 border-2 border-current border-b-transparent rounded-full animate-spin" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      {isRejectAction
                                        ? "حالة عكس القيد"
                                        : "حالة رفع الميزانية"}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {displayTitle}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                  <span className="text-xs text-gray-500">
                                    الخطوات
                                  </span>
                                  <span className="px-2 py-1 rounded-md bg-gray-100">
                                    {groupSteps.length}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-sm text-gray-600">{t("oracle.noData")}</p>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-between px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (refetchOracleStatus) {
                  refetchOracleStatus();
                  toast.success(t("oracle.refreshing"));
                }
              }}
              disabled={isLoadingOracleStatus}
              className="px-4 py-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)] rounded-md hover:bg-[var(--color-primary)]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingOracleStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary)]"></div>
                  <span>{t("oracle.refreshing")}</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>{t("common.refresh")}</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsTrackModalOpen(false);
                setTrackTransactionId(null);
                setActiveOracleTab("submit"); // Reset to default tab
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Status Pipeline Modal */}
      <SharedModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusTransactionId(null); // Clear the transaction ID when closing
        }}
        title={t("transfer.statusPipeline")}
        size="lg"
      >
        <div className="p-6">
          {isLoadingStatus ? (
            <>
              {console.log("[MODAL] Rendering LOADING state")}
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("messages.loadingStatus")}
                </span>
              </div>
            </>
          ) : statusError ? (
            <>
              {console.log("[MODAL] Rendering ERROR state:", statusError)}
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="text-red-500 text-lg mb-2">⚠️</div>
                  <p className="text-gray-600">
                    {t("messages.errorLoadingStatus")}
                  </p>
                </div>
              </div>
            </>
          ) : statusData ? (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    {t("TransferStatus")}:
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      statusData.transfer_status === "approved"
                        ? "bg-green-100 text-green-800"
                        : statusData.transfer_status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {t(`status.${statusData.transfer_status}`) ||
                      statusData.transfer_status}
                  </span>
                </div>
              </div>
              {/* Workflows */}
              {statusData.workflows?.map((workflow) => (
                <div key={workflow.execution_order} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold text-gray-800">
                      {workflow.workflow_name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        workflow.workflow_status === "approved"
                          ? "bg-green-100 text-green-800"
                          : workflow.workflow_status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {t(`status.${workflow.workflow_status}`) ||
                        workflow.workflow_status}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                    {workflow.stages?.map((stage) => (
                      <div
                        key={stage.order_index}
                        className="relative flex items-start space-x-4 pb-8 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${
                            stage.status === "approved" ||
                            stage.status === "active"
                              ? "bg-green-500 border-green-200"
                              : stage.status === "pending"
                              ? "bg-yellow-500 border-yellow-200"
                              : stage.status === "rejected"
                              ? "bg-red-500 border-red-200"
                              : "bg-[var(--color-primary)] border-blue-200"
                          }`}
                        >
                          {stage.status === "approved" ||
                          stage.status === "active" ? (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : stage.status === "pending" ? (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : stage.status === "rejected" ? (
                            <svg
                              className="w-6 h-6 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-6 h-6 text-white animate-spin"
                              viewBox="0 0 20 20"
                              fill="none"
                              role="status"
                              aria-label="In progress"
                            >
                              {/* faint full ring */}
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                stroke="currentColor"
                                strokeWidth="2"
                                opacity="0.25"
                              />
                              {/* leading arc */}
                              <path
                                d="M10 2 A 8 8 0 0 1 18 10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-lg ">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-semibold text-gray-900">
                                {stage.name}
                              </h5>
                              <span className="text-xs text-gray-500">
                                {t("status.stage")} {stage.order_index}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>
                                <span className="font-medium">
                                  {t("status.decisionPolicy")}:
                                </span>{" "}
                                {stage.decision_policy}
                              </span>
                            </div>

                            {/* Stage Status Icon */}
                            <div className="flex items-center mt-3 text-sm">
                              {stage.status === "approved" ||
                              stage.status === "active" ? (
                                <div className="flex items-center text-green-600">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="font-medium">
                                    {t(`status.${stage.status}`) ||
                                      stage.status}
                                  </span>
                                </div>
                              ) : stage.status === "pending" ? (
                                <div className="flex items-center text-yellow-600">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="font-medium">
                                    {t(`status.${stage.status}`) ||
                                      stage.status}
                                  </span>
                                </div>
                              ) : stage.status === "rejected" ? (
                                <div className="flex items-center text-red-600">
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="font-medium">
                                    {t(`status.${stage.status}`) ||
                                      stage.status}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center text-[var(--color-primary)]">
                                  <div className="w-4 h-4 bg-[var(--color-primary)] rounded-full mr-1"></div>
                                  <span className="font-medium">
                                    {t(`status.${stage.status}`) ||
                                      stage.status}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Information - Show if acted_by exists */}
                            {stage.acted_by && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                                  {/* User Info */}
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      {t("status.actedBy")}:
                                    </span>
                                    <span>{stage.acted_by.username}</span>
                                  </div>

                                  {/* Date Info */}
                                  {stage.acted_by.action_at && (
                                    <div className="flex items-center gap-2">
                                      <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <span className="font-medium">
                                        {t("status.actionDate")}:
                                      </span>
                                      <span>
                                        {new Date(
                                          stage.acted_by.action_at
                                        ).toLocaleString("ar-EG", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Comment Section */}
                                {stage.comment &&
                                  (() => {
                                    const commentKey = `${workflow.execution_order}-${stage.order_index}`;
                                    const isExpanded =
                                      expandedComments.has(commentKey);
                                    const lines = stage.comment.split("\n");
                                    const MAX_LINES = 2;
                                    const needsTruncation =
                                      lines.length > MAX_LINES;

                                    const displayText =
                                      needsTruncation && !isExpanded
                                        ? lines.slice(0, MAX_LINES).join("\n") +
                                          "..."
                                        : stage.comment;

                                    const toggleExpanded = () => {
                                      setExpandedComments((prev) => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(commentKey)) {
                                          newSet.delete(commentKey);
                                        } else {
                                          newSet.add(commentKey);
                                        }
                                        return newSet;
                                      });
                                    };

                                    return (
                                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <svg
                                            className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                            />
                                          </svg>
                                          <div className="flex-1">
                                            <span className="text-xs font-medium text-gray-600 block mb-1">
                                              {t("status.comment")}:
                                            </span>
                                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                                              {displayText}
                                            </p>
                                            {needsTruncation && (
                                              <button
                                                onClick={toggleExpanded}
                                                className="mt-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium transition-colors"
                                              >
                                                {isExpanded
                                                  ? t("common.showLess")
                                                  : t("common.showMore")}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}{" "}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-gray-400 text-2xl mb-2">📋</div>
              <p>{t("status.noData")}</p>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end mt-6 pt-4  border-gray-200">
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setStatusTransactionId(null); // Clear the transaction ID when closing
              }}
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
