import SearchBar from "@/shared/SearchBar";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import { SharedModal } from "@/shared/SharedModal";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  useGetAllTransfersListQuery,
  useDeleteTransferMutation,
  useGetTransferStatusQuery,
  useGetOracleStatusQuery,
} from "@/api/transfer.api";
import type { TransferItem } from "@/api/transfer.api";
import { useGetAttachmentsQuery } from "@/api/attachments.api";
import type { Attachment } from "@/api/attachments.api";
import { useGetUserProfileQuery } from "@/api/auth.api";
import { useGetGroupMembersQuery } from "@/api/securityGroups.api";
import Select from "react-select";
import { Filter, X } from "lucide-react";

export default function AllTransfers() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State management
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    undefined
  );
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );
  const [selectedStartDate, setSelectedStartDate] = useState<
    string | undefined
  >(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(
    undefined
  );
  const [selectedCode, setSelectedCode] = useState<string | undefined>(
    undefined
  );
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Get user profile to get group_id
  const { data: userProfile } = useGetUserProfileQuery();
  const groupId = userProfile?.groups?.[0]?.group_id;

  // Get group members for user filter
  const { data: groupMembersData } = useGetGroupMembersQuery(groupId!, {
    skip: !groupId,
  });

  // Prepare filter options
  const userOptions = useMemo(() => {
    if (!groupMembersData?.members) return [];
    return groupMembersData.members.map((member) => ({
      value: member.user_id,
      label: member.username,
    }));
  }, [groupMembersData]);

  const statusOptions = [
    { value: "pending", label: t("status.pending") },
    { value: "in_progress", label: t("status.in_progress") },
    { value: "approved", label: t("status.approved") },
    { value: "rejected", label: t("status.rejected") },
    { value: "un_holded", label: t("status.un_holded") },
  ];

  const codeOptions = [
    { value: "FAR", label: "FAR" },
    { value: "AFR", label: "AFR" },
    { value: "HFR", label: "HFR" },
    { value: "DFR", label: "DFR" },
  ];

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedUserId(undefined);
    setSelectedStatus(undefined);
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setSelectedCode(undefined);
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedUserId ||
    selectedStatus ||
    selectedStartDate ||
    selectedEndDate ||
    selectedCode;

  // Attachments state
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
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

  // Selection state for export
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(
    new Set()
  );
  const [showExportUI, setShowExportUI] = useState(false);

  // API calls - get ALL transfers with filters
  const { data: transferResponse, isLoading } = useGetAllTransfersListQuery({
    page: currentPage,
    page_size: 10,
    search: searchQuery,
    user_id: selectedUserId,
    status: selectedStatus,
    start_date: selectedStartDate,
    end_date: selectedEndDate,
    code: selectedCode,
  });

  const [deleteTransfer] = useDeleteTransferMutation();

  // Attachments API calls
  const { data: attachmentsData, isLoading: isLoadingAttachments } =
    useGetAttachmentsQuery(selectedTransactionId, {
      skip: !selectedTransactionId || !isAttachmentsModalOpen,
    });

  // Status API call
  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useGetTransferStatusQuery(statusTransactionId!, {
    skip: !statusTransactionId || !isStatusModalOpen,
  });

  // Oracle Status API call
  const {
    data: oracleStatusData,
    isLoading: isLoadingOracleStatus,
    error: oracleStatusError,
    refetch: refetchOracleStatus,
  } = useGetOracleStatusQuery(trackTransactionId!, {
    skip: !trackTransactionId || !isTrackModalOpen,
  });

  // Handle null/empty values
  const safeValue = (value: unknown, fallback: string = "-") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  };

  const transformedData: TableRow[] =
    transferResponse?.results?.map((item: TransferItem) => ({
      id: item.transaction_id,
      code: safeValue(item.code),
      type: safeValue(item.type),
      requested_by: safeValue(item.requested_by),
      description: safeValue(item.notes, t("common.noData")),
      request_date: item.request_date
        ? new Date(item.request_date).toLocaleDateString()
        : "-",
      transaction_date: safeValue(item.transaction_date, t("common.noData")),
      track: item.transaction_id,
      status: safeValue(item.status, t("common.pending")),
      attachment: item.attachment,
      amount: item.amount || 0,
      // Include original item for detail view
      original: item,
    })) || [];

  // Table columns configuration
  const transferColumns: TableColumn[] = [
    {
      id: "code",
      header: t("tableColumns.code"),
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
      id: "type",
      header: t("tableColumns.type"),
      accessor: "type",
      render: (value) => (
        <span className="font-medium text-[#282828]">{safeValue(value)}</span>
      ),
    },
    {
      id: "requested_by",
      header: t("tableColumns.requestedBy"),
      accessor: "requested_by",
      render: (value) => (
        <span className="font-medium text-[#282828]">{safeValue(value)}</span>
      ),
    },
    {
      id: "description",
      header: t("tableColumns.description"),
      accessor: "description",
      render: (value) => (
        <div
          className="text-[#282828] max-w-xs prose prose-sm prose-p:my-1 prose-p:leading-5"
          dangerouslySetInnerHTML={{
            __html: safeValue(value, t("common.noData")),
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
      header: t("tableColumns.requestDate"),
      accessor: "request_date",
      render: (value) => (
        <span className="text-[#282828]">{safeValue(value)}</span>
      ),
    },
    {
      id: "transaction_date",
      header: t("tableColumns.transactionDate"),
      accessor: "transaction_date",
      render: (value) => (
        <span className="text-[#282828]">
          {safeValue(value, t("common.noData"))}
        </span>
      ),
    },
    {
      id: "track",
      header: t("tableColumns.actions"),
      accessor: "track",
      render: (_value, row) => (
        <span
          className="font-medium bg-[#F6F6F6] p-2 rounded-md cursor-pointer hover:bg-[#e8f2ef] transition"
          onClick={() => handleTrackClick(row)}
        >
          {t("common.view")}
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
      header: t("common.attachments"),
      accessor: "attachment",
      render: (_value, row) => (
        <span
          className="font-medium bg-[#F6F6F6] p-2 rounded-md cursor-pointer hover:bg-[#e8f2ef] transition"
          onClick={() => handleAttachmentsClick(row)}
        >
          {t("common.attachments")}
        </span>
      ),
    },
  ];

  // Event handlers
  const handleCodeClick = (row: TableRow) => {
    const originalTransfer = row.original as TransferItem;
    const status = originalTransfer.status || "pending";
    navigate(`/app/transfer/${row.id}`, {
      state: { status },
    });
  };

  const handleStatusClick = (row: TableRow) => {
    const transactionId = Number(row.id);
    setStatusTransactionId(null);
    setIsStatusModalOpen(true);
    setTimeout(() => {
      setStatusTransactionId(transactionId);
    }, 100);
  };

  const handleAttachmentsClick = (row: TableRow) => {
    const transactionId = String(row.id);
    setSelectedTransactionId(transactionId);
    setIsAttachmentsModalOpen(true);
  };

  // Download file handler
  const handleDownloadFile = (attachment: Attachment) => {
    try {
      const byteCharacters = atob(attachment.file_data);
      const byteNumbers = Array.from(
        { length: byteCharacters.length },
        (_, i) => byteCharacters.charCodeAt(i)
      );
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], { type: attachment.file_type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("messages.downloadSuccess"));
    } catch {
      toast.error(t("messages.downloadError"));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTrackClick = (row: TableRow) => {
    const transactionId = Number(row.id);
    setTrackTransactionId(null);
    setIsTrackModalOpen(true);
    setTimeout(() => {
      setTrackTransactionId(transactionId);
    }, 100);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilter = () => {
    console.log("Filter transfers");
  };

  const handleDelete = async (row: TableRow) => {
    const transferStatus = row.status;

    if (transferStatus !== "pending") {
      toast.error(t("transfer.cannotDelete"));
      return;
    }

    try {
      await deleteTransfer(Number(row.id)).unwrap();
      toast.success(t("transfer.deleteSuccess"));
    } catch (error: unknown) {
      let errorMessage = "Failed to delete transfer";
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

  const handleChat = (row: TableRow) => {
    navigate(`/app/chat/${row.id}`, { state: { txCode: row.code } });
  };

  // Handle export to PDF
  const handleExportToPdf = async (selectedIds: number[]) => {
    if (selectedIds.length === 0) {
      toast.error(t("messages.selectAtLeastOne"));
      return;
    }

    const idsParam = selectedIds.join(",");
    navigate(`/app/table-view-pdf?ids=${idsParam}`);

    setSelectedRows(new Set());
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide">
          {t("allTransfers.title")}
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowExportUI(!showExportUI);
              if (showExportUI) {
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
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl mb-6">
        <SearchBar
          placeholder={t("common.searchPlaceholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          debounce={0}
        />
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl mb-6 z-[99] relative">
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-700">
              {t("common.filters")}
            </span>
            {hasActiveFilters && (
              <span className="bg-[#4E8476] text-white text-xs px-2 py-0.5 rounded-full">
                {t("common.active")}
              </span>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              showFilters ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Filter Content */}
        {showFilters && (
          <div className="p-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.user")}
                </label>
                <Select
                  options={userOptions}
                  value={userOptions.find(
                    (opt) => opt.value === selectedUserId
                  )}
                  onChange={(option) => {
                    setSelectedUserId(option?.value);
                    setCurrentPage(1);
                  }}
                  isClearable
                  placeholder={t("filters.selectUser")}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      "&:hover": { borderColor: "#4E8476" },
                    }),
                  }}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.status")}
                </label>
                <Select
                  options={statusOptions}
                  value={statusOptions.find(
                    (opt) => opt.value === selectedStatus
                  )}
                  onChange={(option) => {
                    setSelectedStatus(option?.value);
                    setCurrentPage(1);
                  }}
                  isClearable
                  placeholder={t("filters.selectStatus")}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      "&:hover": { borderColor: "#4E8476" },
                    }),
                  }}
                />
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.transactionType")}
                </label>
                <Select
                  options={codeOptions}
                  value={codeOptions.find((opt) => opt.value === selectedCode)}
                  onChange={(option) => {
                    setSelectedCode(option?.value);
                    setCurrentPage(1);
                  }}
                  isClearable
                  placeholder={t("filters.selectType")}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      "&:hover": { borderColor: "#4E8476" },
                    }),
                  }}
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.startDate")}
                </label>
                <input
                  type="date"
                  value={selectedStartDate || ""}
                  onChange={(e) => {
                    setSelectedStartDate(e.target.value || undefined);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:border-transparent text-sm"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("filters.endDate")}
                </label>
                <input
                  type="date"
                  value={selectedEndDate || ""}
                  onChange={(e) => {
                    setSelectedEndDate(e.target.value || undefined);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                  {t("common.clearFilters")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E8476]"></div>
          <span className="ml-2 text-gray-600">
            {t("messages.loadingTransfers")}
          </span>
        </div>
      ) : transformedData.length === 0 ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 text-2xl mb-2">📄</div>
            <p className="text-gray-600">{t("messages.noTransfers")}</p>
          </div>
        </div>
      ) : (
        <SharedTable
          title={t("allTransfers.title")}
          columns={transferColumns}
          data={transformedData}
          maxHeight="600px"
          className="shadow-lg"
          showPagination={true}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
          totalCount={transferResponse?.count}
          hasNext={!!transferResponse?.next}
          hasPrevious={!!transferResponse?.previous}
          showActions={true}
          showFooter={true}
          Edit={false}
          transactions={true}
          onChat={handleChat}
          onDelete={handleDelete}
          onFilter={handleFilter}
          filterLabel={t("common.filterLabel")}
          showSelection={showExportUI}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onExport={handleExportToPdf}
          showExportButton={showExportUI}
          exportButtonText={t("common.exportPDF")}
        />
      )}

      {/* Manage Attachments Modal */}
      <SharedModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => setIsAttachmentsModalOpen(false)}
        title={t("common.manageAttachments")}
        size="lg"
      >
        <div className="p-4">
          {/* Upload section - DISABLED (view only) */}
          <div
            className={`w-full flex flex-col py-8 gap-4 items-center transition-colors mb-6 bg-gray-100 rounded-lg opacity-60 cursor-not-allowed`}
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
              <div className="font-semibold text-base mb-1 text-gray-500">
                {t("common.uploadDisabled")}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {t("common.viewOnlyMode")}
              </div>
            </div>
          </div>

          {/* Attachments list */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">
              {t("common.existingAttachments")}
            </h4>

            {isLoadingAttachments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("messages.loadingAttachments")}
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
                <p>{t("messages.noAttachments")}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              onClick={() => setIsAttachmentsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Oracle ERP Status Modal - Same as Transfer.tsx */}
      <SharedModal
        isOpen={isTrackModalOpen}
        onClose={() => {
          setIsTrackModalOpen(false);
          setTrackTransactionId(null);
        }}
        title={t("transfer.oracleStatus")}
        size="lg"
      >
        {/* Copy Oracle modal content from Transfer.tsx - Same implementation */}
        <div className="p-6">
          {isLoadingOracleStatus ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">{t("oracle.loading")}</span>
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
            <div className="text-center py-8 text-gray-500">
              <div className="text-gray-400 text-2xl mb-2">✓</div>
              <p>{t("oracle.dataLoaded")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <p className="text-sm text-gray-600">{t("oracle.noData")}</p>
            </div>
          )}

          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                if (refetchOracleStatus) {
                  refetchOracleStatus();
                  toast.success(t("oracle.refreshing"));
                }
              }}
              disabled={isLoadingOracleStatus}
              className="px-4 py-2 text-sm font-medium text-[#4E8476] bg-[#4E8476]/10 border border-[#4E8476] rounded-md hover:bg-[#4E8476]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingOracleStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4E8476]"></div>
                  <span>{t("oracle.refreshing")}</span>
                </>
              ) : (
                <>
                  <span>{t("common.refresh")}</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsTrackModalOpen(false);
                setTrackTransactionId(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Status Pipeline Modal - Same as Transfer.tsx */}
      <SharedModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusTransactionId(null);
        }}
        title={t("transfer.statusPipeline")}
        size="lg"
      >
        <div className="p-6">
          {isLoadingStatus ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">
                {t("messages.loadingStatus")}
              </span>
            </div>
          ) : statusError ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">⚠️</div>
                <p className="text-gray-600">
                  {t("messages.errorLoadingStatus")}
                </p>
              </div>
            </div>
          ) : statusData ? (
            <div className="space-y-6">
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
              {/* Copy workflows display from Transfer.tsx if needed */}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-gray-400 text-2xl mb-2">📋</div>
              <p>{t("status.noData")}</p>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setStatusTransactionId(null);
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
