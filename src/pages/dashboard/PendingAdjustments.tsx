import SearchBar from "@/shared/SearchBar";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import SharedModal from "@/shared/SharedModal";

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetPendingTransfersQuery,
  useBulkApproveRejectTransferMutation,
  type PendingTransferData,
} from "@/api/pendingTransfer.api";
import toast from "react-hot-toast";
import { useGetTransferStatusQuery } from "@/api/transfer.api";
import SharedSelect from "@/shared/SharedSelect";
import { useGetUsersQuery } from "@/api/user.api";
const PendingtransferData: TableRow[] = [];

export default function PendingTransfer() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "history" | undefined
  >("pending");

  // RTK Query hooks
  const { data: apiData, isLoading } = useGetPendingTransfersQuery({
    page: currentPage,
    page_size: 10,
    code: "DFR",
    status: statusFilter,
    search: searchQuery,
  });

  const [bulkApproveRejectTransfer] = useBulkApproveRejectTransferMutation();

  // Modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [reason, setReason] = useState<string>("");

  // Transform API data to table format (Code, Requested By, Status, Transaction Date, Amount)
  const transformApiDataToTableRows = (
    apiTransfers: PendingTransferData[]
  ): TableRow[] => {
    return apiTransfers.map((t) => {
      const id = String(t.transaction_id ?? t.id ?? "");
      const code = t.code ?? id;
      const requested_by = t.requested_by ?? t.from_center ?? "-";
      const statusRaw = t.status ?? "";
      const status =
        statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1).toLowerCase();
      const transaction_date =
        t.transaction_date ??
        (t.request_date ? new Date(t.request_date).toLocaleDateString() : "-");
      const amount =
        typeof t.amount === "string" ? parseFloat(t.amount) : t.amount ?? 0;

      return {
        id, // keep for navigation
        code,
        requested_by,
        status,
        transaction_date,
        amount,
      } as TableRow;
    });
  };

  // Use API data if available, otherwise fallback to static data mapped to new columns
  const tableData = apiData?.results
    ? transformApiDataToTableRows(apiData.results)
    : PendingtransferData.map((row) => ({
        id: String(row.id ?? ""),
        code: String(row.id ?? ""),
        requested_by: String(row.from ?? "-"),
        status: String(row.status ?? ""),
        transaction_date: String(row.date ?? "-"),
        amount: Number(row.amount ?? 0),
      }));

  // Handler for transaction ID click
  const handleTransactionIdClick = (row: TableRow) => {
    navigate(`/app/PendingAdjustments/${row.id}`);
  };

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTransactionId, setStatusTransactionId] = useState<number | null>(
    null
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const {
    data: statusData,
    isLoading: isLoadingStatus,
    error: statusError,
  } = useGetTransferStatusQuery(statusTransactionId!, {
    skip: !statusTransactionId || !isStatusModalOpen,
  });

  const handleStatusClick = (row: TableRow) => {
    const transactionId = Number(row.id);
    // Clear any previous status data to prevent showing old data
    setStatusTransactionId(null);
    setExpandedComments(new Set());

    setIsStatusModalOpen(true);
    // Set the transaction ID after modal is open to trigger fresh API call
    setTimeout(() => {
      setStatusTransactionId(transactionId);
    }, 100);
    console.log("Opening status pipeline for transaction:", transactionId);
  };
  const safeValue = (value: unknown, fallback: string = "-") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }
    return String(value);
  };

  const handleSearchChange = (text: string) => {
    console.log("Search changed:", text);
    setSearchQuery(text);
  };

  const doSearch = (text: string) => {
    console.log("Search submitted:", text);
    // run your filter / API call here
  };

  const handleFilter = () => {
    console.log("Filter transfers");
    // Add your filter logic here
  };

  const handlePageChange = (page: number) => {
    console.log("Page changed to:", page);
    setCurrentPage(page);
    // RTK Query will automatically refetch data when currentPage changes
  };

  const handleApprove = (row: TableRow) => {
    setSelectedRow(row);
    setReason(""); // Clear reason when opening modal
    setIsApproveModalOpen(true);
  };

  const handleReject = (row: TableRow) => {
    setSelectedRow(row);
    setReason(""); // Clear reason when opening modal
    setIsRejectModalOpen(true);
  };

  const handleView = (row: TableRow) => {
    navigate(`/app/PendingTransfer/${row.id}`);
  };

  const confirmApprove = async () => {
    if (selectedRow) {
      try {
        const ACTION_APPROVE = "approve";
        await bulkApproveRejectTransfer({
          transaction_id: [parseInt(selectedRow.id as string)],
          decide: [ACTION_APPROVE],
          reason: reason ? [reason] : [],
          other_user_id: [],
        }).unwrap();
        console.log("Transfer approved successfully:", selectedRow);
        setReason(""); // Clear reason after success
        toast.success(t("pendingAdjustments.approveSuccess"));
      } catch (error) {
        console.error("Error approving transfer:", error);
        toast.error(t("pendingAdjustments.approveFailed"));
      }
    }
    setIsApproveModalOpen(false);
    setSelectedRow(null);
  };

  const confirmReject = async () => {
    if (selectedRow) {
      try {
        const ACTION_REJECT = "reject";
        await bulkApproveRejectTransfer({
          transaction_id: [parseInt(selectedRow.id as string)],
          decide: [ACTION_REJECT],
          reason: reason ? [reason] : [],
          other_user_id: [],
        }).unwrap();
        console.log("Transfer rejected successfully:", selectedRow);
        setReason(""); // Clear reason after success
        toast.success(t("pendingAdjustments.rejectSuccess"));
      } catch (error) {
        console.error("Error rejecting transfer:", error);
        toast.error(t("pendingAdjustments.rejectFailed"));
      }
    }
    setIsRejectModalOpen(false);
    setSelectedRow(null);
  };

  const handleChat = (row: TableRow) => {
    // Navigate to chat page with transaction/request ID
    navigate(`/app/chat/${row.id}`, { state: { txCode: row.code } });
  };

  // Selection state for delegation
  const [selectedTransfers, setSelectedTransfers] = useState<Set<string>>(
    new Set()
  );

  const [isDelegateMode, setIsDelegateMode] = useState<boolean>(false);

  const [isDelegateModalOpen, setIsDelegateModalOpen] =
    useState<boolean>(false);
  const [delegateUser, setDelegateUser] = useState<number | null>(null);

  const [delegateReason, setDelegateReason] = useState<string>("");

  // Load ALL users for the modal (NEW)
  const { data: allUsers } = useGetUsersQuery();
  const userOptions = (allUsers ?? []).map((u) => ({
    value: u.id, // or String(u.id) if your SharedSelect needs strings
    label: `${u.username}`,
  }));
  const [searchParams, setSearchParams] = useSearchParams();

  // read from URL on first render
  useState(() => {
    if (searchParams.get("delegate") === "1") setIsDelegateMode(true);
  });

  const handleDelegateClick = () => {
    setIsDelegateMode(true);
    const next = new URLSearchParams(searchParams);
    next.set("delegate", "1");
    setSearchParams(next, { replace: true });
  };

  const handleCancelDelegate = () => {
    setIsDelegateMode(false);
    setSelectedTransfers(new Set());
    const next = new URLSearchParams(searchParams);
    next.delete("delegate");
    setSearchParams(next, { replace: true });
  };

  // Function to generate table columns configuration
  // ✅ Build columns then conditionally add the selection column
  const getPendingTransferColumns = (): TableColumn[] => {
    const cols: TableColumn[] = [
      {
        id: "code",
        header: t("pendingAdjustments.columns.transactionCode"),
        accessor: "code",
        width: 160,
        minWidth: 140,
        sortable: true,
        render: (value, row) => (
          <span
            className="font-medium bg-[#F6F6F6] p-2 rounded-md cursor-pointer hover:bg-blue-100 transition"
            onClick={() => handleTransactionIdClick(row)}
          >
            {String(value)}
          </span>
        ),
      },
      {
        id: "requested_by",
        header: t("pendingAdjustments.columns.requestedBy"),
        accessor: "requested_by",
        width: 160,
        minWidth: 140,
        sortable: true,
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

          const statusLower = String(value || "").toLowerCase();
          const bgClass =
            statusLower === "approved" || statusLower === "active"
              ? "bg-green-100 text-green-800"
              : statusLower === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : statusLower === "rejected"
              ? "bg-red-100 text-red-800"
              : statusLower === "in_progress" || statusLower === "in-progress"
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
        id: "transaction_date",
        header: t("pendingAdjustments.columns.transactionDate"),
        accessor: "transaction_date",
        width: 150,
        minWidth: 120,
        sortable: true,
      },
      {
        id: "amount",
        header: t("pendingAdjustments.columns.amount"),
        accessor: "amount",
        width: 120,
        minWidth: 100,
        sortable: true,
        render: (value) => (
          <span className="font-medium text-[#282828]">
            {Number(value).toLocaleString()}
          </span>
        ),
      },
    ];

    if (isDelegateMode) {
      cols.unshift({
        id: "select",
        header: "",
        width: 64,
        minWidth: 56,
        render: (_: unknown, row) => (
          <input
            type="checkbox"
            checked={selectedTransfers.has(String(row.id))}
            onChange={(e) =>
              handleTransferSelection(String(row.id), e.target.checked)
            }
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
        ),
      });
    }

    return cols;
  };
  // Delegation handlers
  const handleTransferSelection = (transferId: string, checked: boolean) => {
    setSelectedTransfers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transferId);
      } else {
        newSet.delete(transferId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(tableData.map((row) => String(row.id)));
      setSelectedTransfers(allIds);
    } else {
      setSelectedTransfers(new Set());
    }
  };

  const handleOpenDelegateModal = () => {
    setIsDelegateModalOpen(true);
  };

  const handleConfirmDelegate = async () => {
    console.log("Delegating to user ID:", delegateUser);

    if (!delegateUser) {
      toast.error("Please select a user to delegate to");
      return;
    }

    try {
      // Convert Set to Array for the API call
      const transferIds = Array.from(selectedTransfers).map((id) =>
        parseInt(id)
      );

      await bulkApproveRejectTransfer({
        transaction_id: transferIds,
        decide: ["delegate"], // Action is delegate
        reason: delegateReason ? [delegateReason] : [],
        other_user_id: [delegateUser], // User to delegate to (use number directly)
      }).unwrap();

      toast.success(
        t("pendingAdjustments.delegateSuccess", { count: transferIds.length })
      );

      // Reset state
      setIsDelegateModalOpen(false);
      setIsDelegateMode(false);
      setSelectedTransfers(new Set());
      setDelegateUser(null);
      setDelegateReason("");
    } catch (error) {
      console.error("Error delegating transfers:", error);
      toast.error(t("pendingAdjustments.delegateFailed"));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-wide">
          {t("pendingAdjustments.title")}
        </h1>

        {!isDelegateMode ? (
          <button
            onClick={handleDelegateClick}
            className="flex items-center gap-2 px-3 py-2 bg-[#4E8476] hover:bg-[#3d6b5f] text-white rounded-md transition-colors font-medium"
          >
            <svg
              width="24"
              height="11"
              viewBox="0 0 24 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 9.21364H3.90563C5.20531 9.21364 6.51897 9.34904 7.78385 9.60963C10.0213 10.0706 12.3771 10.1264 14.6375 9.76054M13.441 5.52211C13.5951 5.50426 13.7427 5.48379 13.8836 5.46131C15.0554 5.27441 16.039 4.64823 16.9395 3.96798L19.2631 2.21276C20.0822 1.59399 21.298 1.59387 22.1173 2.21248C22.8548 2.76939 23.0803 3.68639 22.614 4.43381C22.0703 5.30545 21.3041 6.42054 20.5685 7.10189M13.441 5.52211C13.3947 5.52748 13.3477 5.53262 13.3002 5.53749M13.441 5.52211C13.6285 5.48194 13.8146 5.36634 13.9893 5.21393C14.8162 4.49214 14.8685 3.27571 14.151 2.46973C13.9845 2.28273 13.7897 2.12678 13.5731 1.99758C9.97651 -0.14757 4.38068 1.48626 1 3.88375M13.441 5.52211C13.3941 5.53216 13.3471 5.53749 13.3002 5.53749M13.3002 5.53749C12.6273 5.60658 11.8401 5.62444 10.9666 5.54196"
                stroke="white"
                strokeWidth="1.92857"
                strokeLinecap="round"
              />
            </svg>
            {t("pendingAdjustments.delegate")}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelDelegate}
              className="flex items-center gap-2 px-3 py-2 bg-transparent border border-[#4E8476] text-[#4E8476] hover:bg-[#4E8476] hover:text-white  rounded-md transition-colors font-medium"
            >
              {t("pendingAdjustments.cancel")}
            </button>
            <button
              onClick={handleOpenDelegateModal}
              className="flex items-center gap-2 px-3 py-2 bg-[#4E8476] hover:bg-[#3d6b5f] text-white rounded-md transition-colors font-medium"
              disabled={selectedTransfers.size === 0}
            >
              {t("pendingAdjustments.proceedToDelegate")}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white rounded-2xl mt-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder={t("pendingAdjustments.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              onSubmit={doSearch}
              debounce={0}
            />
          </div>

          {isDelegateMode && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={
                    selectedTransfers.size > 0 &&
                    selectedTransfers.size === tableData.length
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                {t("pendingAdjustments.selectAll")}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">
              {t("pendingAdjustments.loadingTransfers")}
            </span>
          </div>
        ) : (
          <SharedTable
            title={t("pendingAdjustments.tableTitle")}
            columns={getPendingTransferColumns()}
            data={tableData}
            onFilter={handleFilter}
            filterLabel={t("pendingAdjustments.filterLabel")}
            maxHeight="600px"
            className="shadow-lg"
            showPagination={true}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            itemsPerPage={10}
            pending={true}
            showActions={true}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={handleView}
            showFooter={true}
            transactions={true}
            onChat={handleChat}
            showColumnSelector={true}
            showStatusFilter={true}
            currentStatus={statusFilter}
            onStatusChange={(status) => {
              setStatusFilter(status);
              // Update your API call here based on status
            }}
          />
        )}
      </div>

      {/* Approve Modal */}
      <SharedModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setReason(""); // Clear reason when closing modal
        }}
        title={t("pendingAdjustments.approveBudgetRequest")}
        size="md"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-[#282828]">
              {" "}
              {t("pendingAdjustments.approveConfirmMessage")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("pendingAdjustments.reasonOptional")}
            </label>
            <textarea
              rows={7}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 text-sm resize-none py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-sm placeholder:text-[#AFAFAF]"
              placeholder={t("pendingAdjustments.addCommentsPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsApproveModalOpen(false);
                setReason(""); // Clear reason when cancelling
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700  border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("pendingAdjustments.cancel")}
            </button>
            <button
              onClick={confirmApprove}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A350]  border border-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              {t("pendingAdjustments.approve")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Reject Modal */}
      <SharedModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setReason(""); // Clear reason when closing modal
        }}
        title={t("pendingAdjustments.rejectTransfer")}
        size="md"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-sm text-[#282828]">
                {t("pendingAdjustments.rejectConfirmMessage")}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("pendingAdjustments.reasonForRejection")}
            </label>
            <textarea
              rows={7}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 text-sm resize-none py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-sm placeholder:text-[#AFAFAF]"
              placeholder={t("pendingAdjustments.rejectReasonPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setReason(""); // Clear reason when cancelling
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700  border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("pendingAdjustments.cancel")}
            </button>
            <button
              onClick={confirmReject}
              className="px-4 py-2 text-sm font-medium text-white bg-[#D44333] border border-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              {t("pendingAdjustments.rejectTransferButton")}
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
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("messages.loadingStatus")}
                </span>
              </div>
            </>
          ) : statusError ? (
            <>
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
                              : "bg-[#4E8476] border-blue-200"
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

                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>
                                <span className="font-medium">
                                  {t("status.decisionPolicy")}:
                                </span>{" "}
                                {stage.decision_policy}
                              </span>
                            </div>

                            {/* Stage Status Icon */}
                            <div className="flex items-center mt-3 text-sm mb-3">
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
                                <div className="flex items-center text-[#4E8476]">
                                  <div className="w-4 h-4 bg-[#4E8476] rounded-full mr-1"></div>
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
                                                className="mt-1 text-xs text-[#4E8476] hover:text-[#3d6b5f] font-medium transition-colors"
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
      <SharedModal
        isOpen={isDelegateModalOpen}
        onClose={() => {
          setIsDelegateModalOpen(false);
          setDelegateUser(null);
          setDelegateReason("");
        }}
        title="Delegate Transfers"
        size="md"
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-[#282828] mb-4">
              You're about to delegate {selectedTransfers.size} transfer(s) to
              another user. Please select the user and provide a reason for the
              delegation.
            </p>
          </div>

          <div className="space-y-4">
            {/* User Selection */}
            <div>
              <SharedSelect
                title="Select User"
                required={true}
                value={delegateUser !== null ? String(delegateUser) : ""}
                onChange={(value) => {
                  const numericValue =
                    typeof value === "string" ? parseInt(value, 10) : value;
                  setDelegateUser(numericValue);
                }}
                placeholder="Choose a user to delegate to"
                options={userOptions}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-bold text-[#282828] mb-2">
                Reason for Delegation
              </label>
              <textarea
                rows={5}
                value={delegateReason}
                onChange={(e) => setDelegateReason(e.target.value)}
                className="w-full px-3 text-sm resize-none py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-sm placeholder:text-[#AFAFAF]"
                placeholder="Provide a reason for delegating these transfers..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setIsDelegateModalOpen(false);
                setDelegateUser(null);
                setDelegateReason("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelegate}
              disabled={!delegateUser}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-[#4E8476] rounded-md hover:bg-[#3d6b5f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Delegation
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
