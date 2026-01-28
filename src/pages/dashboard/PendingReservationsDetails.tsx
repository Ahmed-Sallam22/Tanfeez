import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  SharedTable,
  type TableColumn,
  type TableRow as SharedTableRow,
  type TableRow,
} from "@/shared/SharedTable";
import SharedModal from "@/shared/SharedModal";
import { useGetTransferDetailsQuery } from "@/api/transferDetails.api";
import { useBulkApproveRejectTransferMutation } from "@/api/pendingTransfer.api";
import toast from "react-hot-toast";
import { formatNumber } from "@/utils/formatNumber";
import { useGetSegmentTypesQuery } from "@/api/segmentConfiguration.api";
import { useTranslation } from "react-i18next";

interface TransferTableRow {
  id: string;
  to: number;
  from: number;
  encumbrance: number;
  availableBudget: number;
  actual: number;
  // Additional fields from API
  approvedBudget?: number;
  // New fields for financial data
  other_ytd?: number;
  period?: string;
  control_budget_name?: string;
  costValue?: number; // قيمة التكاليف (funds_available / 2 for MOFA_COST_2)
  // Validation errors
  validation_errors?: string[];
  // New budget fields
  commitments?: string;
  obligations?: string;
  other_consumption?: string;
  // New budget tracking fields
  total_budget?: number;
  initial_budget?: number;
  budget_adjustments?: number;
  // Dynamic segments (segment1, segment2, etc.)
  [key: string]: string | number | string[] | undefined;
}
export default function PendingReservationsDetails() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Use the transaction ID from params, default to 82 for testing
  const transactionId = id || "513"; // Use ID from params or default to 513

  const { data: apiData, isLoading } =
    useGetTransferDetailsQuery(transactionId);

  // Fetch segment types for dynamic columns
  const { data: segmentTypesData, isLoading: isLoadingSegmentTypes } =
    useGetSegmentTypesQuery();
  const requiredSegments = useMemo(() => {
    if (!segmentTypesData?.data) return [];
    return segmentTypesData.data
      .filter((segment) => segment.segment_type_is_required)
      .sort(
        (a, b) => a.segment_type_oracle_number - b.segment_type_oracle_number
      );
  }, [segmentTypesData]);

  // State for processed rows
  const [rows, setRows] = useState<TransferTableRow[]>([]);
  const createDefaultRow = (): TransferTableRow => {
    const defaultRow: TransferTableRow = {
      id: "default-1",
      to: 0,
      from: 0,
      encumbrance: 0,
      availableBudget: 0,
      actual: 0,
      approvedBudget: 0,
      other_ytd: 0,
      period: "",
      validation_errors: [], // Explicitly set as empty array (no errors)
      commitments: "0",
      obligations: "0",
      other_consumption: "0",
    };

    // Add dynamic segment fields
    requiredSegments.forEach((segment) => {
      const segmentKey = `segment${segment.segment_type_oracle_number}`;
      defaultRow[segmentKey] = "";
      defaultRow[`${segmentKey}_name`] = "";
    });

    return defaultRow;
  };
  // Process API data when it loads
  useEffect(() => {
    if (apiData?.transfers && apiData.transfers.length > 0) {
      const initialRows = apiData.transfers.map((transfer) => {
        // Get MOFA_CASH budget data (first control budget)
        const mofaCash = transfer.control_budgets?.find(
          (cb) => cb.Control_budget_name === "MOFA_CASH"
        );

        // Get MOFA_COST_2 budget data (second control budget)
        // const mofaCost2 = transfer.control_budgets?.find(
        //   (cb) => cb.Control_budget_name === "MOFA_COST_2"
        // );

        const row: TransferTableRow = {
          id: transfer.transfer_id?.toString() || "0",
          to: parseFloat(transfer.to_center) || 0,
          from: parseFloat(transfer.from_center) || 0,
          // Use control_budgets data if available, otherwise fall back to transfer data
          encumbrance: mofaCash
            ? mofaCash.Encumbrance
            : parseFloat(transfer.encumbrance) || 0,
          availableBudget: mofaCash
            ? mofaCash.Funds_available
            : parseFloat(transfer.available_budget) || 0,
          actual: mofaCash ? mofaCash.Actual : parseFloat(transfer.actual) || 0,
          approvedBudget: mofaCash
            ? mofaCash.Budget
            : parseFloat(transfer.approved_budget) || 0,
          other_ytd: mofaCash ? mofaCash.Other : 0,
          period: mofaCash
            ? mofaCash.Period_name
            : apiData?.summary.period || "",
          control_budget_name: mofaCash ? mofaCash.Control_budget_name : "",
          validation_errors: transfer.validation_errors,
          commitments: mofaCash
            ? mofaCash.Commitments.toString()
            : transfer.commitments || "0",
          obligations: mofaCash
            ? mofaCash.Obligation.toString()
            : transfer.obligations || "0",
          other_consumption: mofaCash
            ? mofaCash.Other.toString()
            : transfer.other_consumption || "0",
          // Calculate cost value from MOFA_COST_2
          costValue: mofaCash ? Number(mofaCash.Total_budget) / 2 : 0,
          // Add new budget tracking fields from MOFA_CASH
          total_budget: mofaCash ? mofaCash.Total_budget || 0 : 0,
          initial_budget: mofaCash ? mofaCash.Initial_budget || 0 : 0,
          budget_adjustments: mofaCash ? mofaCash.Budget_adjustments || 0 : 0,
        };

        // Add dynamic segment fields from the transfer data
        requiredSegments.forEach((segment) => {
          const segmentKey = `segment${segment.segment_type_oracle_number}`;
          const oracleNumber = segment.segment_type_oracle_number.toString();

          // Map segment data from the API response
          if (transfer.segments && transfer.segments[oracleNumber]) {
            const segmentData = transfer.segments[oracleNumber];
            // Use from_code if available, otherwise use to_code (one of them should have a value)
            const segmentCode =
              segmentData.from_code || segmentData.to_code || "";
            const segmentAlias =
              segmentData.from_alias || segmentData.to_alias || "";

            row[segmentKey] = segmentCode;
            row[`${segmentKey}_name`] = segmentAlias;
          } else {
            row[segmentKey] = "";
            row[`${segmentKey}_name`] = "";
          }
        });

        return row;
      });
      setRows(initialRows);
    } else if (!isLoading && !isLoadingSegmentTypes) {
      // Only set default row if we're not loading and there's truly no data
      setRows([createDefaultRow()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiData, requiredSegments, isLoading, isLoadingSegmentTypes]);

  // Check if pagination should be shown
  const shouldShowPagination = rows.length > 10;

  const handleBack = () => {
    navigate("/app/PendingTransfer");
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to translate segment names
  const getSegmentHeader = (
    segmentNumber: number,
    segmentName: string
  ): string => {
    const translations: Record<number, string> = {
      5: t("pendingReservationsDetails.mofaGeographic"),
      9: t("pendingReservationsDetails.mofaCostCenter"),
      11: t("pendingReservationsDetails.mofaBudget"),
    };
    return translations[segmentNumber] || segmentName;
  };

  const generateDynamicSegmentColumns = (): TableColumn[] => {
    const dynamicColumns: TableColumn[] = [];

    requiredSegments.forEach((segment) => {
      const segmentKey = `segment${segment.segment_type_oracle_number}`;
      const translatedHeader = getSegmentHeader(
        segment.segment_type_oracle_number,
        segment.segment_name
      );

      // Add code column with dropdown
      dynamicColumns.push({
        id: segmentKey,
        header: translatedHeader,

        render: (_, row) => {
          const transferRow = row as unknown as TransferTableRow;
          return (
            <span className="text-sm text-gray-900">
              {transferRow[segmentKey] as string}
            </span>
          );
        },
      });

      // Add name column (read-only display)
      dynamicColumns.push({
        id: `${segmentKey}_name`,
        header: `${translatedHeader}`,

        render: (_, row) => {
          const transferRow = row as unknown as TransferTableRow;
          return (
            <span className="text-sm text-gray-900">
              {transferRow[`${segmentKey}_name`] as string}
            </span>
          );
        },
      });
    });

    return dynamicColumns;
  };
  // Keep the old columns for the main transfer table
  const columnsDetails: TableColumn[] = [
    // Dynamic segment columns will be inserted here
    ...generateDynamicSegmentColumns(),

    {
      id: "encumbrance",
      header: t("pendingReservationsDetails.encumbrance"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.encumbrance || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "availableBudget",
      header: t("pendingReservationsDetails.availableBudget"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.availableBudget || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },

    {
      id: "actual",
      header: t("pendingReservationsDetails.actual"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.actual || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "commitments",
      header: t("pendingReservationsDetails.commitments"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = Number(transferRow.commitments) || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "obligations",
      header: t("pendingReservationsDetails.obligations"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = Number(transferRow.obligations) || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "other_consumption",
      header: t("pendingReservationsDetails.otherConsumption"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = Number(transferRow.other_consumption) || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "approvedBudget",
      header: t("pendingReservationsDetails.approvedBudget"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.approvedBudget || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "total_budget",
      header: t("pendingReservationsDetails.totalBudget"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.total_budget || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "initial_budget",
      header: t("pendingReservationsDetails.initialBudget"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.initial_budget || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "budget_adjustments",
      header: t("pendingReservationsDetails.budgetAdjustments"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.budget_adjustments || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "other_ytd",
      header: t("pendingReservationsDetails.otherYtd"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const value = transferRow.other_ytd || 0;
        return (
          <span className="text-sm text-gray-900">{formatNumber(value)}</span>
        );
      },
    },
    {
      id: "period",
      header: t("pendingReservationsDetails.period"),

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        return (
          <span className="text-sm text-gray-900">{transferRow.period}</span>
        );
      },
    },
    {
      id: "costValue",
      header: t("pendingReservationsDetails.costBudget50"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        // Show cost value only if it's greater than 0
        const value = transferRow.costValue || 0;
        if (value > 0) {
          return (
            <div className="bg-amber-50 -mx-3 -my-2 px-3 py-2 border-l-4 border-amber-400">
              <span className="text-sm font-semibold text-amber-900">
                {formatNumber(value)}
              </span>
            </div>
          );
        }
        return (
          <div className="bg-amber-50 -mx-3 -my-2 px-3 py-2 border-l-4 border-amber-400">
            <span className="text-sm text-gray-400">-</span>
          </div>
        );
      },
    },
    {
      id: "from",
      header: t("pendingReservationsDetails.from"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;

        return (
          <span className={`text-sm text-gray-900 `}>
            {formatNumber(transferRow.from)}
          </span>
        );
      },
    },
    {
      id: "to",
      header: t("pendingReservationsDetails.to"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;

        return (
          <span className={`text-sm text-gray-900 `}>
            {formatNumber(transferRow.to)}
          </span>
        );
      },
    },
  ];

  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [bulkApproveRejectTransfer] = useBulkApproveRejectTransferMutation();

  const [reason, setReason] = useState<string>("");

  const handleApprove = (row: TableRow) => {
    console.log(row);

    setSelectedRow(row);
    setReason(""); // Clear reason when opening modal
    setIsApproveModalOpen(true);
  };

  const handleReject = (row: TableRow) => {
    setSelectedRow(row);
    setReason(""); // Clear reason when opening modal
    setIsRejectModalOpen(true);
  };
  const confirmApprove = async () => {
    if (id) {
      try {
        const ACTION_APPROVE = "approve";
        await bulkApproveRejectTransfer({
          transaction_id: [parseInt(id)],
          decide: [ACTION_APPROVE],
          reason: reason ? [reason] : [],
          other_user_id: [],
        }).unwrap();
        console.log("Transfer approved successfully:", selectedRow);
        toast.success(t("pendingReservations.approveSuccess"));
        navigate("/app/PendingTransfer");
        setReason(""); // Clear reason after success
      } catch (error) {
        console.error("Error approving transfer:", error);
        // Handle error (show toast notification, etc.)
      }
    }
    setIsApproveModalOpen(false);
    setSelectedRow(null);
  };

  const confirmReject = async () => {
    if (id) {
      try {
        const ACTION_REJECT = "reject";
        await bulkApproveRejectTransfer({
          transaction_id: [parseInt(id)],
          decide: [ACTION_REJECT],
          reason: reason ? [reason] : [],
          other_user_id: [],
        }).unwrap();
        console.log("Transfer rejected successfully:", id);
        toast.success(t("pendingReservations.rejectSuccess"));
        navigate("/app/PendingTransfer");

        setReason(""); // Clear reason after success
      } catch (error) {
        console.error("Error rejecting transfer:", error);
        // Handle error (show toast notification, etc.)
      }
    }
    setIsRejectModalOpen(false);
    setSelectedRow(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">
          {t("pendingReservationsDetails.loadingTransfers")}
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2  cursor-pointer py-2 text-lg text-[var(--color-primary)] hover:text-[var(--color-primary)] "
        >
          {t("pendingReservationsDetails.title")}
        </button>
        <span className="text-[#737373] text-lg">/</span>
        <h1 className="text-lg  text-[#737373] font-light tracking-wide">
          {t("pendingReservationsDetails.code")}
        </h1>
      </div>

      <div>
        <SharedTable
          columns={columnsDetails}
          data={rows as unknown as SharedTableRow[]}
          showFooter={true}
          maxHeight="600px"
          showPagination={shouldShowPagination}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          addRowButtonText={t("pendingReservationsDetails.addNewRow")}
          showColumnSelector={true}
        />
      </div>
      <div className="flex justify-end items-center bg-white rounded-md shadow-sm  mt-4 p-3 w-full">
        {/* زرار Reject */}
        <button
          onClick={() => handleReject(selectedRow!)}
          className="px-4 py-1.5 border border-[#D44333] text-[#D44333] rounded-md hover:bg-red-50 transition"
        >
          {t("pendingReservationsDetails.reject")}
        </button>

        {/* مسافة صغيرة */}
        <div className="w-3" />

        {/* زرار Approve */}
        <button
          onClick={() => handleApprove(selectedRow!)}
          className="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          {t("pendingReservationsDetails.approve")}
        </button>
      </div>

      {/* Approve Modal */}
      <SharedModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setReason(""); // Clear reason when closing modal
        }}
        title={t("pendingReservationsDetails.approveBudgetRequest")}
        size="md"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-[#282828]">
              {t("pendingReservationsDetails.approveMessage")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("pendingReservationsDetails.reasonOptional")}
            </label>
            <textarea
              rows={7}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 text-sm resize-none py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-sm placeholder:text-[#AFAFAF]"
              placeholder={t("pendingReservationsDetails.addComments")}
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
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmApprove}
              className="px-4 py-2 text-sm font-medium text-white bg-[#00A350]  border border-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
              {t("pendingReservationsDetails.approve")}
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
        title={t("pendingReservationsDetails.rejectTransfer")}
        size="md"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div>
              <p className="text-sm text-[#282828]">
                {t("pendingReservationsDetails.rejectMessage")}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("pendingReservationsDetails.reasonForRejectionOptional")}
            </label>
            <textarea
              rows={7}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 text-sm resize-none py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-sm placeholder:text-[#AFAFAF]"
              placeholder={t("pendingReservationsDetails.describeReason")}
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
              {t("common.cancel")}
            </button>
            <button
              onClick={confirmReject}
              className="px-4 py-2 text-sm font-medium text-white bg-[#D44333] border border-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              {t("pendingReservationsDetails.rejectTransferButton")}
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
