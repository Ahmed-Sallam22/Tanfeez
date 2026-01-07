import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import {
  SharedTable,
  type TableColumn,
  type TableRow as SharedTableRow,
} from "@/shared/SharedTable";
import SharedModal from "@/shared/SharedModal";
import {
  useGetTransferDetailsQuery,
  useCreateTransferMutation,
  useSubmitTransferMutation,
  useUploadExcelMutation,
  useReopenTransferMutation,
  transferDetailsApi,
} from "@/api/transferDetails.api";
import {
  useGetSegmentTypesQuery,
  useGetSegmentsByTypeQuery,
  type Segment,
} from "@/api/segmentConfiguration.api";
import { toast } from "react-hot-toast";
import { store } from "@/app/store";
import Select from "react-select";
import { formatNumber } from "@/utils/formatNumber";
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
  // Reason field for each row
  reason?: string;
  // Dynamic segments (segment1, segment2, etc.)
  [key: string]: string | number | string[] | undefined;
}

interface TransferDetailRow {
  id: string;
  itemId: string;
  itemName: string;
  accountId: string;
  accountName: string;
  from: number;
  to: number;
  approvedBudget: number;
  current: number;
  availableBudget: number;
}

export default function FundAdjustmentsDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Get status from navigation state (passed from Transfer page)
  const transferStatus = location.state?.status || null;

  // Use RTK Query to fetch transfer details
  const transactionId = id || "513"; // Use ID from params or default to 513
  const { data: apiData, isLoading } =
    useGetTransferDetailsQuery(transactionId);

  const [createTransfer] = useCreateTransferMutation();
  const [submitTransfer] = useSubmitTransferMutation();
  const [uploadExcel] = useUploadExcelMutation();
  const [reopenTransfer] = useReopenTransferMutation();

  // Fetch segment types for dynamic columns
  const { data: segmentTypesData, isLoading: isLoadingSegmentTypes } =
    useGetSegmentTypesQuery();

  // Get required segments (where segment_type_is_required is true)
  const requiredSegments = useMemo(() => {
    if (!segmentTypesData?.data) return [];
    return segmentTypesData.data
      .filter((segment) => segment.segment_type_is_required)
      .sort(
        (a, b) => a.segment_type_oracle_number - b.segment_type_oracle_number
      );
  }, [segmentTypesData]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for additional rows (new rows added by user)
  const [localRows, setLocalRows] = useState<TransferTableRow[]>([]);

  // State to track all edits locally (both existing and new rows)
  const [editedRows, setEditedRows] = useState<TransferTableRow[]>([]);

  // Initialize editedRows when API data loads
  useEffect(() => {
    if (apiData?.transfers && apiData.transfers.length > 0) {
      const initialRows = apiData.transfers.map((transfer) => {
        // Get MOFA_CASH budget data
        const mofaCash = transfer.control_budgets?.find(
          (cb) => cb.Control_budget_name === "MOFA_CASH"
        );

        // Get MOFA_COST_2 budget data
        const mofaCost2 = transfer.control_budgets?.find(
          (cb) => cb.Control_budget_name === "MOFA_COST_2"
        );

        // Determine which budget record to use based on control_budget
        // If control_budget === "سيولة" (liquidity), use MOFA_CASH
        // Otherwise, use MOFA_COST_2
        const isLiquidityTransfer =
          apiData?.summary?.control_budget === "سيولة";
        const primaryBudget = isLiquidityTransfer ? mofaCash : mofaCost2;

        const row: TransferTableRow = {
          id: transfer.transfer_id?.toString() || "0",
          to: parseFloat(transfer.to_center) || 0,
          from: parseFloat(transfer.from_center) || 0,
          // Use primaryBudget data based on control_budget, otherwise fall back to transfer data
          encumbrance: primaryBudget
            ? primaryBudget.Encumbrance
            : parseFloat(transfer.encumbrance) || 0,
          availableBudget: primaryBudget
            ? primaryBudget.Funds_available
            : parseFloat(transfer.available_budget) || 0,
          actual: primaryBudget
            ? primaryBudget.Actual
            : parseFloat(transfer.actual) || 0,
          approvedBudget: primaryBudget
            ? primaryBudget.Budget
            : parseFloat(transfer.approved_budget) || 0,
          other_ytd: primaryBudget ? primaryBudget.Other : 0,
          period: primaryBudget
            ? primaryBudget.Period_name
            : apiData?.summary.period || "",
          control_budget_name: primaryBudget
            ? primaryBudget.Control_budget_name
            : "",
          validation_errors: transfer.validation_errors,
          commitments: primaryBudget
            ? primaryBudget.Commitments.toString()
            : transfer.commitments || "0",
          obligations: primaryBudget
            ? primaryBudget.Obligation.toString()
            : transfer.obligations || "0",
          other_consumption: primaryBudget
            ? primaryBudget.Other.toString()
            : transfer.other_consumption || "0",
          // Calculate cost value ALWAYS from MOFA_COST_2
          costValue: mofaCash ? Number(mofaCash.Total_budget) / 2 : 0,
          // Add new budget tracking fields from primaryBudget
          total_budget: primaryBudget ? primaryBudget.Total_budget || 0 : 0,
          initial_budget: primaryBudget ? primaryBudget.Initial_budget || 0 : 0,
          budget_adjustments: primaryBudget
            ? primaryBudget.Budget_adjustments || 0
            : 0,
          // Add reason field from API
          reason: transfer.reason || "",
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
      setEditedRows(initialRows);
    } else if (!isLoading && !isLoadingSegmentTypes) {
      // Only set default row if we're not loading and there's truly no data
      setEditedRows([createDefaultRow()]);
    }
  }, [apiData, requiredSegments, isLoading, isLoadingSegmentTypes]);

  // Combine edited API rows with local rows for display
  const rows = useMemo(
    () => [...editedRows, ...localRows],
    [editedRows, localRows]
  );
  useEffect(() => {
    const savedLocalRows = localStorage.getItem(`localRows_${transactionId}`);
    if (savedLocalRows) {
      try {
        const parsedRows = JSON.parse(savedLocalRows);
        setLocalRows(parsedRows);
        console.log("Loaded local rows from localStorage:", parsedRows);
      } catch (error) {
        console.error("Error parsing localStorage data:", error);
      }
    }
  }, [transactionId]);

  // Save local rows to localStorage whenever they change
  useEffect(() => {
    if (localRows.length > 0) {
      localStorage.setItem(
        `localRows_${transactionId}`,
        JSON.stringify(localRows)
      );
      console.log("Saved local rows to localStorage:", localRows);
    } else {
      localStorage.removeItem(`localRows_${transactionId}`);
    }
  }, [localRows, transactionId]);

  useEffect(() => {
    const cleanupEmptyRows = () => {
      const nonEmptyRows = localRows.filter(isNonEmpty);
      if (nonEmptyRows.length > 0) {
        localStorage.setItem(
          `localRows_${transactionId}`,
          JSON.stringify(nonEmptyRows)
        );
      } else {
        localStorage.removeItem(`localRows_${transactionId}`);
      }
    };
    const handleBeforeUnload = () => cleanupEmptyRows();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      cleanupEmptyRows();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [localRows, transactionId]);

  type Option = { value: string; label: string; name: string };

  // Pre-call hooks for all required segments (must be called unconditionally)
  // We'll use the segment IDs to call the hooks - supporting up to 5 required segments
  const segment1 = requiredSegments[0];
  const segment2 = requiredSegments[1];
  const segment3 = requiredSegments[2];
  const segment4 = requiredSegments[3];
  const segment5 = requiredSegments[4];

  // Call hooks unconditionally (they will skip if segment is undefined)
  const { data: segmentData1 } = useGetSegmentsByTypeQuery(
    segment1?.segment_id || 0,
    {
      skip: !segment1,
    }
  );
  const { data: segmentData2 } = useGetSegmentsByTypeQuery(
    segment2?.segment_id || 0,
    {
      skip: !segment2,
    }
  );
  const { data: segmentData3 } = useGetSegmentsByTypeQuery(
    segment3?.segment_id || 0,
    {
      skip: !segment3,
    }
  );
  const { data: segmentData4 } = useGetSegmentsByTypeQuery(
    segment4?.segment_id || 0,
    {
      skip: !segment4,
    }
  );
  const { data: segmentData5 } = useGetSegmentsByTypeQuery(
    segment5?.segment_id || 0,
    {
      skip: !segment5,
    }
  );

  // Build segment data map
  const segmentDataMap = useMemo(() => {
    const map: Record<number, Segment[]> = {};
    if (segment1 && segmentData1?.data)
      map[segment1.segment_id] = segmentData1.data;
    if (segment2 && segmentData2?.data)
      map[segment2.segment_id] = segmentData2.data;
    if (segment3 && segmentData3?.data)
      map[segment3.segment_id] = segmentData3.data;
    if (segment4 && segmentData4?.data)
      map[segment4.segment_id] = segmentData4.data;
    if (segment5 && segmentData5?.data)
      map[segment5.segment_id] = segmentData5.data;
    return map;
  }, [
    segment1,
    segment2,
    segment3,
    segment4,
    segment5,
    segmentData1,
    segmentData2,
    segmentData3,
    segmentData4,
    segmentData5,
  ]);

  // Helper function to create options from segments
  const createSegmentOptions = (segmentId: number): Option[] => {
    const segments = segmentDataMap[segmentId] || [];
    return segments
      .filter((seg) => seg.is_active)
      .map((seg) => ({
        value: seg.code,
        label: `${seg.code} - ${seg.alias}`,
        name: seg.alias,
      }));
  };

  // Create a default row for when there's no data
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

  // Set submission status based on API status
  useEffect(() => {
    const statusFromSummary = apiData?.summary?.status;
    const statusFromDetails = apiData?.status?.status;
    const effectiveStatus = statusFromSummary ?? statusFromDetails;

    if (!effectiveStatus) {
      setIsSubmitted(false);
      return;
    }

    setIsSubmitted(effectiveStatus !== "not yet sent for approval");
  }, [apiData?.status?.status, apiData?.summary?.status]);

  // Sample data for fund requests details
  const [rowsDetails] = useState<TransferDetailRow[]>([
    {
      id: "1",
      itemId: "1213322",
      itemName: "11 - Project 1",
      accountId: "3121",
      accountName: "Audit fees",
      from: 1000,
      to: 20000,
      approvedBudget: 1283914.64,
      current: 346062.59,
      availableBudget: 22430677.39,
    },
    {
      id: "2",
      itemId: "1213323",
      itemName: "12 - Project 2",
      accountId: "3122",
      accountName: "Consulting fees",
      from: 5000,
      to: 15000,
      approvedBudget: 800000.0,
      current: 250000.0,
      availableBudget: 15000000.0,
    },
    {
      id: "3",
      itemId: "1213324",
      itemName: "13 - Project 3",
      accountId: "3123",
      accountName: "Training costs",
      from: 2000,
      to: 8000,
      approvedBudget: 500000.0,
      current: 150000.0,
      availableBudget: 8500000.0,
    },
  ]); // Check if pagination should be shown
  const shouldShowPagination = rows.length > 10;

  const handleBack = () => {
    navigate("/app/transfer");
  };

  const [pendingSavedLocalIds, setPendingSavedLocalIds] = useState<string[]>(
    []
  );
  const [awaitingSync, setAwaitingSync] = useState(false);

  const isNonEmpty = (row: TransferTableRow) => {
    // Check if any required segment has a value
    const hasSegmentValue = requiredSegments.some((seg) => {
      const segmentKey = `segment${seg.segment_type_oracle_number}`;
      return row[segmentKey] !== "" && row[segmentKey] !== undefined;
    });

    return hasSegmentValue || row.to > 0 || row.from > 0;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const nonEmptyEditedRows = editedRows.filter(isNonEmpty);
      const nonEmptyLocalRows = localRows.filter(isNonEmpty);

      const allRows = [...nonEmptyEditedRows, ...nonEmptyLocalRows];

      const transfersToSave = allRows.map((row) => {
        let fromCenter = row.from || 0;
        let toCenter = row.to || 0;
        if (fromCenter > 0) toCenter = 0;
        else if (toCenter > 0) fromCenter = 0;

        // Build dynamic segments object with the new structure
        const segments: Record<string, { code: string }> = {};
        requiredSegments.forEach((segment) => {
          const segmentKey = `segment${segment.segment_type_oracle_number}`;
          const segmentValue = row[segmentKey];
          if (segmentValue && typeof segmentValue === "string") {
            // Use the oracle number as the key (e.g., "5", "9", "11")
            segments[segment.segment_type_oracle_number.toString()] = {
              code: segmentValue,
            };
          }
        });

        return {
          transaction: parseInt(transactionId),
          from_center: fromCenter.toString(),
          to_center: toCenter.toString(),
          reason: row.reason || "", // Include reason from each row
          segments: segments,
        };
      });

      // Save
      const response = await createTransfer(transfersToSave).unwrap();

      const hasErrors = response?.transfers
        ? response.transfers.some(
            (t) => t.validation_errors && t.validation_errors.length > 0
          )
        : false;

      // Check if there are validation errors in the response
      if (response?.transfers) {
        if (hasErrors) {
          // Show warning toast about validation errors
          toast.error(t("fundAdjustmentsDetails.hasValidationErrors"));
        } else if (response.summary?.balanced) {
          toast.success(t("pendingTransferDetails.saveSuccessBalanced"));
        } else {
          toast.success(t("fundAdjustmentsDetails.saveSuccess"));
        }
      } else {
        toast.success(t("fundAdjustmentsDetails.saveSuccess"));
      }

      if (!hasErrors && nonEmptyLocalRows.length > 0) {
        setPendingSavedLocalIds(nonEmptyLocalRows.map((r) => r.id));
        setAwaitingSync(true);
      }

      // ✅ Immediately remove only the local rows that were saved
      // const savedLocalIds = nonEmptyLocalRows.map((r) => r.id);
      // setLocalRows((prev) => {
      //   const next = prev.filter((r) => !savedLocalIds.includes(r.id));
      //   if (next.length > 0) {
      //     localStorage.setItem(`localRows_${transactionId}`, JSON.stringify(next));
      //   } else {
      //     localStorage.removeItem(`localRows_${transactionId}`);
      //   }
      //   return next;
      // });

      // Ask RTK to refetch API rows
      store.dispatch(
        transferDetailsApi.util.invalidateTags(["TransferDetails"])
      );
    } catch (err) {
      console.error("Error saving transfers:", err);
      toast.error(t("fundAdjustmentsDetails.saveFailed"));
      // (no local deletion on error)
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!awaitingSync) return;
    if (!apiData?.transfers) return;

    // We assume the refetch has brought back the rows we just created.
    // Remove only the local rows that were part of this save.
    setLocalRows((prev) => {
      const next = prev.filter((r) => !pendingSavedLocalIds.includes(r.id));
      // Update localStorage accordingly
      if (next.length > 0) {
        localStorage.setItem(
          `localRows_${transactionId}`,
          JSON.stringify(next)
        );
      } else {
        localStorage.removeItem(`localRows_${transactionId}`);
      }
      return next;
    });

    // done syncing
    setPendingSavedLocalIds([]);
    setAwaitingSync(false);
  }, [apiData, awaitingSync, pendingSavedLocalIds, transactionId]);

  // Check if submit should be disabled
  const isSubmitDisabled = () => {
    // Filter out default rows (empty rows with no data)
    const nonDefaultEditedRows = editedRows.filter((row) => {
      if (!row.id.startsWith("default-")) return true;

      // Check if any dynamic segment has a value
      const hasSegmentValue = requiredSegments.some((seg) => {
        const segmentKey = `segment${seg.segment_type_oracle_number}`;
        return row[segmentKey] !== "" && row[segmentKey] !== undefined;
      });

      return hasSegmentValue;
    });

    // Count total valid rows (API rows + local rows)
    const totalValidRows =
      (apiData?.transfers?.length || 0) +
      localRows.length +
      nonDefaultEditedRows.length;

    // Check if there are fewer than 1 rows
    const hasInsufficientRows = totalValidRows < 1;

    // Check if there are validation errors from API data
    const hasValidationErrors =
      apiData?.validation_errors && apiData.validation_errors.length > 0;

    return hasInsufficientRows || hasValidationErrors;
  };

  const handleSubmit = async () => {
    if (!isSubmitDisabled()) {
      setIsSubmitting(true);
      try {
        // Call the submit API
        await submitTransfer({
          transaction: parseInt(transactionId),
        }).unwrap();

        // Show success toast
        toast.success(t("fundAdjustmentsDetails.submitSuccess"));

        // Set submitted state
        setIsSubmitted(true);

        console.log(
          "Transfer submitted successfully for transaction:",
          transactionId
        );
      } catch (error) {
        console.error("Error submitting transfer:", error);
        toast.error(t("fundAdjustmentsDetails.submitFailed"));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper function to fetch financial data when all required segments are selected
  const fetchFinancialDataForRow = async (
    rowId: string,
    segments: Record<number, string> // Changed to accept dynamic segments by oracle number
  ) => {
    try {
      // Check if all required segments are filled
      const allRequiredFilled = requiredSegments.every(
        (seg) => segments[seg.segment_type_oracle_number]
      );

      if (!allRequiredFilled) {
        console.log(
          `Row ${rowId}: Not all required segments filled, skipping API call`
        );
        return {};
      }

      // Build the API parameters dynamically with Segment format (e.g., Segment5, Segment9)
      const apiSegments: Record<string, string | number> = {};

      // Add each segment with capitalized Segment prefix
      requiredSegments.forEach((seg) => {
        const segmentKey = `Segment${seg.segment_type_oracle_number}`;
        const segmentValue = segments[seg.segment_type_oracle_number];
        // Use the value as-is (string or number)
        apiSegments[segmentKey] = segmentValue;
      });

      console.log(
        `Row ${rowId}: Calling financial data API with segments:`,
        apiSegments
      );

      // Use RTK Query's initiate method to trigger the query manually
      const result = await store
        .dispatch(
          transferDetailsApi.endpoints.getFinancialData.initiate({
            segments: apiSegments,
          })
        )
        .unwrap();

      console.log(`Row ${rowId}: Financial data fetched:`, result);

      // The API returns an array with multiple budget records
      const records = result.data || [];

      if (records.length === 0) {
        console.log(`Row ${rowId}: No financial data found in API response`);
        return {};
      }

      console.log(
        `Row ${rowId}: Processing ${records.length} budget record(s):`,
        records
      );

      // Find MOFA_CASH and MOFA_COST_2 records
      const mofaCashRecord = records.find(
        (r) => r.Control_budget_name === "MOFA_CASH"
      );
      const mofaCost2Record = records.find(
        (r) => r.Control_budget_name === "MOFA_COST_2"
      );

      // Determine which budget record to use based on control_budget
      // If control_budget === "سيولة" (liquidity), use MOFA_CASH
      // Otherwise, use MOFA_COST_2
      const isLiquidityTransfer = apiData?.summary?.control_budget === "سيولة";
      const primaryRecord = isLiquidityTransfer
        ? mofaCashRecord
        : mofaCost2Record;

      // Fallback to first record if primary is not found
      const recordToUse = primaryRecord || records[0];
      console.log(
        `Row ${rowId}: Control budget is "${apiData?.summary?.control_budget}", using ${recordToUse?.Control_budget_name} for main values`
      );

      // Calculate cost value ALWAYS from MOFA_COST_2 (Funds_available / 2)
      const costValue = mofaCashRecord
        ? (mofaCashRecord.Total_budget || 0) / 2
        : 0;

      // Collect all budget names
      const controlBudgetNames = records
        .map((r) => r.Control_budget_name)
        .filter(Boolean);

      // Apply financial data using the selected record based on control_budget
      const financialUpdates = {
        encumbrance: recordToUse.Encumbrance || 0,
        availableBudget: recordToUse.Funds_available || 0,
        actual: recordToUse.Actual || 0,
        approvedBudget: recordToUse.Budget || 0,
        other_ytd: recordToUse.Other || 0,
        period: recordToUse.Period_name || "",
        control_budget_name: controlBudgetNames.join(", "),
        costValue: costValue, // Always from MOFA_COST_2
        // Add new budget tracking fields
        total_budget: recordToUse.Total_budget || 0,
        initial_budget: recordToUse.Initial_budget || 0,
        budget_adjustments: recordToUse.Budget_adjustments || 0,
      };

      console.log(
        `Row ${rowId}: Using ${recordToUse.Control_budget_name} for main values`
      );
      console.log(`Row ${rowId}: Cost value from MOFA_COST_2: ${costValue}`);
      console.log(
        `Row ${rowId}: Applying financial updates:`,
        financialUpdates
      );

      return financialUpdates;
    } catch (error) {
      console.error(`Error fetching financial data for row ${rowId}:`, error);
      return {};
    }
  };

  const addNewRow = () => {
    const newRow: TransferTableRow = {
      id: `new-${Date.now()}`,
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
      newRow[segmentKey] = "";
      newRow[`${segmentKey}_name`] = "";
    });

    setLocalRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      // Save to localStorage when adding new rows
      localStorage.setItem(
        `localRows_${transactionId}`,
        JSON.stringify(updatedRows)
      );
      return updatedRows;
    });
  };

  // Function to delete a row
  const deleteRow = (rowId: string) => {
    // Check if this is a local row (new row)
    if (rowId.startsWith("new-")) {
      setLocalRows((prevRows) => {
        const updatedRows = prevRows.filter((row) => row.id !== rowId);

        // Update localStorage when deleting local rows
        if (updatedRows.length > 0) {
          localStorage.setItem(
            `localRows_${transactionId}`,
            JSON.stringify(updatedRows)
          );
        } else {
          localStorage.removeItem(`localRows_${transactionId}`);
        }

        console.log(`Deleted local row ${rowId}`);
        return updatedRows;
      });
    } else {
      // For existing API rows, remove from editedRows
      setEditedRows((prevRows) => {
        const updatedRows = prevRows.filter((row) => row.id !== rowId);
        console.log(`Deleted API row ${rowId}`);
        return updatedRows;
      });
    }
  };

  const updateRow = async (
    rowId: string,
    field: keyof TransferTableRow,
    value: string | number
  ) => {
    // Handle business logic for from/to mutual exclusivity
    const updatedValue = value;
    const additionalUpdates: Partial<TransferTableRow> = {};

    if (field === "from" && Number(value) > 0) {
      additionalUpdates.to = 0;
    } else if (field === "to" && Number(value) > 0) {
      additionalUpdates.from = 0;
    }

    // Update the row state immediately first (don't wait for API)
    // Check if this is a local row (new row)
    if (rowId.startsWith("new-")) {
      setLocalRows((prevRows) => {
        const updatedRows = prevRows.map((row) => {
          if (row.id === rowId) {
            return { ...row, [field]: updatedValue, ...additionalUpdates };
          }
          return row;
        });

        // Save to localStorage when updating local rows
        localStorage.setItem(
          `localRows_${transactionId}`,
          JSON.stringify(updatedRows)
        );
        return updatedRows;
      });
    } else {
      // For existing API rows (including default rows), update editedRows
      setEditedRows((prevRows) =>
        prevRows.map((row) => {
          if (row.id === rowId) {
            return { ...row, [field]: updatedValue, ...additionalUpdates };
          }
          return row;
        })
      );
    }

    // Now handle financial data API call if needed (after UI update)
    // Check if this is a dynamic segment field
    const isDynamicSegmentField = requiredSegments.some(
      (seg) => field === `segment${seg.segment_type_oracle_number}`
    );

    if (isDynamicSegmentField) {
      // Determine which state array to check based on row type
      const isNewRow = rowId.startsWith("new-");
      const currentRowArray = isNewRow ? localRows : editedRows;
      const currentRow = currentRowArray.find((r) => r.id === rowId);

      if (currentRow) {
        // Build segments object from current row values
        const segments: Record<number, string> = {};
        requiredSegments.forEach((seg) => {
          const segmentKey = `segment${seg.segment_type_oracle_number}`;
          if (field === segmentKey) {
            segments[seg.segment_type_oracle_number] = value.toString();
          } else {
            segments[seg.segment_type_oracle_number] =
              (currentRow[segmentKey] as string) || "";
          }
        });

        console.log(`Row ${rowId}: Current segments state:`, segments);

        // Check if all required segments are filled
        const allSegmentsFilled = requiredSegments.every(
          (seg) => segments[seg.segment_type_oracle_number]
        );

        // Only call API if ALL required segments are now complete
        if (allSegmentsFilled) {
          console.log(
            `Row ${rowId}: ✅ All required segments complete! Calling financial data API...`
          );
          console.log(`Row ${rowId}: API call with segments:`, segments);

          // Call API in background (don't await)
          fetchFinancialDataForRow(rowId, segments)
            .then((financialUpdates) => {
              console.log(
                `Row ${rowId}: Financial data received:`,
                financialUpdates
              );

              // Apply financial data to the row after API response
              if (isNewRow) {
                setLocalRows((prevRows) => {
                  const updatedRows = prevRows.map((row) => {
                    if (row.id === rowId) {
                      return { ...row, ...financialUpdates };
                    }
                    return row;
                  });
                  localStorage.setItem(
                    `localRows_${transactionId}`,
                    JSON.stringify(updatedRows)
                  );
                  return updatedRows;
                });
              } else {
                setEditedRows((prevRows) =>
                  prevRows.map((row) => {
                    if (row.id === rowId) {
                      return { ...row, ...financialUpdates };
                    }
                    return row;
                  })
                );
              }
            })
            .catch((error) => {
              console.error(
                `Error fetching financial data for row ${rowId}:`,
                error
              );
            });
        } else {
          console.log(
            `Row ${rowId}: ⏳ Segments incomplete, waiting for all required segments. Missing:`,
            requiredSegments
              .filter((seg) => !segments[seg.segment_type_oracle_number])
              .map((seg) => seg.segment_name)
          );
        }
      }
    }
  };

  // Define columns for SharedTable
  const columns: TableColumn[] = [
    {
      id: "itemId",
      header: t("fundAdjustmentsDetails.columns.itemId"),
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">{detailRow.itemId}</span>
        );
      },
    },
    {
      id: "itemName",
      header: t("fundAdjustmentsDetails.columns.itemName"),
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">{detailRow.itemName}</span>
        );
      },
    },
    {
      id: "accountId",
      header: t("fundAdjustmentsDetails.columns.accountId"),
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">{detailRow.accountId}</span>
        );
      },
    },
    {
      id: "accountName",
      header: t("fundAdjustmentsDetails.columns.accountName"),
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">{detailRow.accountName}</span>
        );
      },
    },
    {
      id: "from",
      header: t("fundAdjustmentsDetails.columns.from"),
      showSum: true,
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">
            {detailRow.from.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "to",
      header: t("fundAdjustmentsDetails.columns.to"),
      showSum: true,
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">
            {detailRow.to.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "approvedBudget",
      header: t("fundAdjustmentsDetails.columns.approvedBudget"),
      showSum: true,
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">
            {detailRow.approvedBudget.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "current",
      header: t("fundAdjustmentsDetails.columns.current"),
      showSum: true,
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">
            {detailRow.current.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "availableBudget",
      header: t("fundAdjustmentsDetails.columns.availableBudget"),
      showSum: true,
      render: (_, row) => {
        const detailRow = row as unknown as TransferDetailRow;
        return (
          <span className="text-sm text-gray-900">
            {detailRow.availableBudget.toLocaleString()}
          </span>
        );
      },
    },
  ];

  // Helper function to translate segment names
  const getSegmentHeader = (
    segmentNumber: number,
    segmentName: string
  ): string => {
    const translations: Record<number, string> = {
      5: t("SegmentNames.MofaGeographic"),
      9: t("SegmentNames.MofaCostCenter"),
      11: t("SegmentNames.MofaBudget"),
    };

    return translations[segmentNumber] || segmentName;
  };

  // Helper function to generate dynamic segment columns
  const generateDynamicSegmentColumns = (): TableColumn[] => {
    const dynamicColumns: TableColumn[] = [];

    requiredSegments.forEach((segment) => {
      const segmentKey = `segment${segment.segment_type_oracle_number}`;
      const segmentOptions = createSegmentOptions(segment.segment_id);
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
          return isSubmitted ? (
            <span className="text-sm text-gray-900">
              {transferRow[segmentKey] as string}
            </span>
          ) : (
            <Select
              value={
                segmentOptions.find(
                  (o) => o.value === transferRow[segmentKey]
                ) ?? null
              }
              onChange={(opt) => {
                updateRow(transferRow.id, segmentKey, opt?.value || "");
                if (opt)
                  updateRow(transferRow.id, `${segmentKey}_name`, opt.name);
              }}
              options={segmentOptions}
              placeholder={`Select ${segment.segment_name}`}
              isSearchable
              isClearable
              className="w-full"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  border: "1px solid #E2E2E2",
                  borderRadius: "6px",
                  minHeight: "38px",
                  fontSize: "12px",
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
                menuPortal: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
              menuPortalTarget={document.body}
            />
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
    {
      id: "validation",
      header: t("tableColumns.status"),
      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const apiValidationErrors = apiData?.validation_errors || [];

        // Filter errors to only show transfer_line errors for this specific row
        const rowErrors = apiValidationErrors.filter(
          (error) =>
            error.scope === "transfer_line" &&
            error.transfer_id?.toString() === transferRow.id
        );

        const hasErrors = rowErrors.length > 0;

        return (
          <div className="flex items-center  gap-3 justify-center">
            {apiData?.status.status === "not yet sent for approval" ||
            apiData?.summary?.status === "not yet sent for approval" ? (
              <button
                onClick={() => deleteRow(transferRow.id)}
                className="flex items-center justify-center w-6 h-6 bg-red-100 border border-red-300 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                title="Delete row"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}

            {hasErrors ? (
              <button
                onClick={() => {
                  // Extract messages from row-specific validation errors
                  const errorMessages = rowErrors
                    .map((error) => error.message)
                    .filter((msg): msg is string => !!msg);
                  handleValidationErrorClick(errorMessages);
                }}
                className="flex items-center justify-center w-6 h-6 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-600 hover:bg-yellow-200 transition-colors"
                title="Click to view validation errors"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 1L11 10H1L6 1Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 4V6.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="6" cy="8.5" r="0.5" fill="currentColor" />
                </svg>
              </button>
            ) : (
              <div className="w-6 h-6 bg-green-100 border border-green-300 rounded-full flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 6L4.5 8L9.5 3"
                    stroke="#16a34a"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      },
    },

    // Dynamic segment columns will be inserted here
    ...generateDynamicSegmentColumns(),

    {
      id: "encumbrance",
      header: t("fundAdjustmentsDetails.columns.encumbrance"),
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
      header: t("fundAdjustmentsDetails.columns.availableBudget"),
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
      header: t("fundAdjustmentsDetails.columns.actual"),
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
      header: t("fundAdjustmentsDetails.columns.commitments"),
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
      header: t("fundAdjustmentsDetails.columns.obligations"),
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
      header: t("fundAdjustmentsDetails.columns.otherConsumption"),
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
      header: t("fundAdjustmentsDetails.columns.approvedBudget"),
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
      header: t("fundAdjustmentsDetails.columns.totalBudget"),
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
      header: t("fundAdjustmentsDetails.columns.initialBudget"),
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
      header: t("fundAdjustmentsDetails.columns.budgetAdjustments"),
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
      header: t("fundAdjustmentsDetails.columns.otherYtd"),
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
      header: t("fundAdjustmentsDetails.columns.period"),

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        return (
          <span className="text-sm text-gray-900">{transferRow.period}</span>
        );
      },
    },
    // {
    //   id: "costValue",
    //   header: t("fundAdjustmentsDetails.columns.costBudget50"),
    //   showSum: true,

    //   render: (_, row) => {
    //     const transferRow = row as unknown as TransferTableRow;
    //     // Show cost value only if it's greater than 0
    //     const value = transferRow.costValue || 0;
    //     if (value > 0) {
    //       return (
    //         <div className="bg-amber-50 -mx-3 -my-2 px-3 py-2 border-l-4 border-amber-400">
    //           <span className="text-sm font-semibold text-amber-900">
    //             {formatNumber(value)}
    //           </span>
    //         </div>
    //       );
    //     }
    //     return (
    //       <div className="bg-amber-50 -mx-3 -my-2 px-3 py-2 border-l-4 border-amber-400">
    //         <span className="text-sm text-gray-400">-</span>
    //       </div>
    //     );
    //   },
    // },
    {
      id: "from",
      header: t("fundAdjustmentsDetails.columns.from"),
      showSum: true,

      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;

        return isSubmitted ? (
          <span className={`text-sm text-gray-900 `}>
            {formatNumber(transferRow.from)}
          </span>
        ) : (
          <input
            type="number"
            value={transferRow.from || ""}
            onChange={(e) =>
              updateRow(transferRow.id, "from", Number(e.target.value) || 0)
            }
            className={`w-full px-3 py-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[#AFAFAF] `}
            placeholder={t("fundAdjustmentsDetails.columns.from")}
          />
        );
      },
    },
    // {
    //   id: "to",
    //   header: t("fundAdjustmentsDetails.columns.to"),
    //   showSum: true,

    //   render: (_, row) => {
    //     const transferRow = row as unknown as TransferTableRow;

    //     return isSubmitted ? (
    //       <span className={`text-sm text-gray-900 `}>
    //         {formatNumber(transferRow.to)}
    //       </span>
    //     ) : (
    //       <input
    //         type="number"
    //         value={transferRow.to || ""}
    //         onChange={(e) =>
    //           updateRow(transferRow.id, "to", Number(e.target.value) || 0)
    //         }
    //         className={`w-full px-3 py-2 border rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[#AFAFAF] `}
    //         placeholder={t("fundAdjustmentsDetails.columns.to")}
    //       />
    //     );
    //   },
    // },
    {
      id: "reason",
      header: t("fundAdjustmentsDetails.columns.reason"),
      render: (_, row) => {
        const transferRow = row as unknown as TransferTableRow;
        const hasReason =
          transferRow.reason && transferRow.reason.trim() !== "";

        // Check if user can edit (only when status is "not yet sent for approval")
        const canEdit = !isSubmitted;

        return (
          <button
            onClick={() =>
              handleOpenReasonModal(transferRow.id, transferRow.reason || "")
            }
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              hasReason
                ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                : canEdit
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                : "bg-gray-50 text-gray-400 border border-gray-200 cursor-default"
            }`}
            title={
              hasReason
                ? transferRow.reason
                : canEdit
                ? t("common.addReason")
                : t("common.noReason")
            }
          >
            {hasReason ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="max-w-[100px] truncate">
                  {transferRow.reason}
                </span>
              </>
            ) : canEdit ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 3V13M3 8H13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{t("common.addReason")}</span>
              </>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </button>
        );
      },
    },
  ];

  // Handler for validation error click
  const handleValidationErrorClick = (errors: string[]) => {
    setSelectedValidationErrors(errors);
    setIsValidationErrorModalOpen(true);
  };

  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isValidationErrorModalOpen, setIsValidationErrorModalOpen] =
    useState(false);
  const [selectedValidationErrors, setSelectedValidationErrors] = useState<
    string[]
  >([]);

  // Reason modal state
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reasonModalRowId, setReasonModalRowId] = useState<string | null>(null);
  const [reasonModalText, setReasonModalText] = useState("");

  // Handler for opening reason modal
  const handleOpenReasonModal = (rowId: string, currentReason: string) => {
    setReasonModalRowId(rowId);
    setReasonModalText(currentReason || "");
    setIsReasonModalOpen(true);
  };

  // Handler for saving reason
  const handleSaveReason = () => {
    if (reasonModalRowId) {
      updateRow(reasonModalRowId, "reason", reasonModalText);
    }
    setIsReasonModalOpen(false);
    setReasonModalRowId(null);
    setReasonModalText("");
  };

  // Handler for closing reason modal
  const handleCloseReasonModal = () => {
    setIsReasonModalOpen(false);
    setReasonModalRowId(null);
    setReasonModalText("");
  };

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReopenClicked, setIsReopenClicked] = useState(false);

  // Handler for attachments click
  const handleAttachmentsClick = () => {
    setIsAttachmentsModalOpen(true);
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
      alert("Please upload a valid file (.xlsx, .pdf, .doc, .docx)");
    }
  };

  const handleFileSelect = (file: File) => {
    console.log("File selected:", file.name, file.size, file.type);
    setSelectedFile(file);
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      await uploadExcel({
        file: selectedFile,
        transaction: parseInt(transactionId),
      }).unwrap();

      toast.success(t("fundAdjustmentsDetails.uploadSuccess"));
      setIsAttachmentsModalOpen(false);
      setSelectedFile(null);

      console.log("Excel file uploaded successfully");
    } catch (error) {
      console.error("Error uploading Excel file:", error);
      toast.error(t("fundAdjustmentsDetails.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReopenRequest = async () => {
    try {
      // Set the state immediately to hide the button
      setIsReopenClicked(true);

      await reopenTransfer({
        transaction: parseInt(transactionId),
        action: "reopen",
      }).unwrap();

      toast.success(t("fundAdjustmentsDetails.reopenSuccess"));
      console.log("Transfer request reopened successfully");

      // Optionally navigate back to transfer list or refresh the page
      // navigate('/app/transfer');
    } catch (error) {
      console.error("Error reopening transfer request:", error);
      toast.error("Failed to reopen transfer request. Please try again.");

      // Reset the state if there was an error so user can try again
      setIsReopenClicked(false);
    }
  };

  // Show error state
  // if (error) {
  //   const errorMessage =
  //     "data" in error
  //       ? JSON.stringify(error.data)
  //       : "message" in error
  //       ? error.message
  //       : "Failed to load transfer details";

  //   return (
  //     <div className="flex items-center justify-center min-h-[400px]">
  //       <div className="text-lg text-red-600">Error: {errorMessage}</div>
  //     </div>
  //   );
  // }

  // Show loading state while data is being fetched
  if (isLoading || isLoadingSegmentTypes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4E8476]"></div>
          <p className="text-gray-600 text-lg">
            {t("fundAdjustmentsDetails.loadingDetails")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2  cursor-pointer py-2 text-lg text-[#4E8476] hover:text-[#4E8476] "
          >
            {t("fundAdjustmentsDetails.breadcrumbFundAdjustments")}
          </button>
          <span className="text-[#737373] text-lg">/</span>
          <h1 className="text-lg  text-[#737373] font-light tracking-wide">
            {t("fundAdjustmentsDetails.breadcrumbCode")}
          </h1>
        </div>

        {/* Segment Types Loader */}
        <div className="flex items-center gap-2">
          {isLoadingSegmentTypes && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {t("fundAdjustmentsDetails.loadingSegmentTypes")}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Information Card */}
      {apiData?.summary && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Transfer Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("tableColumns.code")}
                  </p>
                  <p className="text-lg font-semibold text-[#4E8476]">
                    {apiData.summary.code || "-"}
                  </p>
                </div>

                {/* Request Date */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("tableColumns.requestDate")}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {apiData.summary.request_date
                      ? new Date(
                          apiData.summary.request_date
                        ).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </p>
                </div>

                {/* Transfer Type */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("transfer.transferType")}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 5V8L10 10"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {apiData.summary.transfer_type || "-"}
                  </div>
                </div>

                {/* Control Budget */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("tableColumns.budgetControl")}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2 4L8 2L14 4V8.5C14 11.5 11.5 14 8 14C4.5 14 2 11.5 2 8.5V4Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {apiData.summary.control_budget || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Transaction-Level Validation Errors Banner */}
      {apiData?.validation_errors && apiData.validation_errors.length > 0 && (
        <>
          {apiData.validation_errors
            .filter((error) => error.scope === "transaction")
            .map((error, index) => (
              <div
                key={`transaction-error-${index}`}
                className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 border border-red-300 rounded-full flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 1L11 10H1L6 1Z"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 4V6.5"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <circle cx="6" cy="8.5" r="0.5" fill="#dc2626" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-700 mb-1">{error.message}</p>
                  </div>
                </div>
              </div>
            ))}
        </>
      )}

      <div>
        <SharedTable
          columns={columnsDetails}
          data={rows as unknown as SharedTableRow[]}
          showFooter={true}
          maxHeight="600px"
          onSave={isSaving ? undefined : handleSave}
          showSaveButton={!isSubmitted && !isSaving}
          showPagination={shouldShowPagination}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          showAddRowButton={!isSubmitted}
          onAddNewRow={addNewRow}
          addRowButtonText={t("fundAdjustmentsDetails.addNewRow")}
          showColumnSelector={true}
        />

        {/* Custom Save Section with Loading State */}
        {!isSubmitted && isSaving && (
          <div className="flex justify-end mt-4 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">
                {t("fundAdjustmentsDetails.savingTransfers")}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Section */}
      {!isSubmitted ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => handleAttachmentsClick()}
                className="inline-flex items-center text-sm gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_406_14639)">
                    <path
                      d="M11.334 6.00122C12.784 6.00929 13.5693 6.07359 14.0815 6.58585C14.6673 7.17164 14.6673 8.11444 14.6673 10.0001V10.6667C14.6673 12.5523 14.6673 13.4952 14.0815 14.0809C13.4957 14.6667 12.5529 14.6667 10.6673 14.6667H5.33398C3.44837 14.6667 2.50556 14.6667 1.91977 14.0809C1.33398 13.4952 1.33398 12.5523 1.33398 10.6667L1.33398 10.0001C1.33398 8.11444 1.33398 7.17163 1.91977 6.58585C2.43203 6.07359 3.2173 6.00929 4.66732 6.00122"
                      stroke="#545454"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 10L8 1.33333M8 1.33333L10 3.66667M8 1.33333L6 3.66667"
                      stroke="#545454"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_406_14639">
                      <rect width="16" height="16" rx="5" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                {t("fundAdjustmentsDetails.uploadTransferFile")}
              </button>

              {/* <button
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex text-sm items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M2.3103 2.30956C1.33398 3.28587 1.33398 4.85722 1.33398 7.99992C1.33398 11.1426 1.33398 12.714 2.3103 13.6903C3.28661 14.6666 4.85795 14.6666 8.00065 14.6666C11.1433 14.6666 12.7147 14.6666 13.691 13.6903C14.6673 12.714 14.6673 11.1426 14.6673 7.99992C14.6673 4.85722 14.6673 3.28587 13.691 2.30956C12.7147 1.33325 11.1433 1.33325 8.00065 1.33325C4.85795 1.33325 3.28661 1.33325 2.3103 2.30956ZM11.334 8.16659C11.6101 8.16659 11.834 8.39044 11.834 8.66659V11.9999C11.834 12.2761 11.6101 12.4999 11.334 12.4999C11.0578 12.4999 10.834 12.2761 10.834 11.9999V8.66659C10.834 8.39044 11.0578 8.16659 11.334 8.16659ZM8.50065 3.99992C8.50065 3.72378 8.27679 3.49992 8.00065 3.49992C7.72451 3.49992 7.50065 3.72378 7.50065 3.99992V11.9999C7.50065 12.2761 7.72451 12.4999 8.00065 12.4999C8.27679 12.4999 8.50065 12.2761 8.50065 11.9999V3.99992ZM4.66732 5.49992C4.94346 5.49992 5.16732 5.72378 5.16732 5.99992V11.9999C5.16732 12.2761 4.94346 12.4999 4.66732 12.4999C4.39118 12.4999 4.16732 12.2761 4.16732 11.9999V5.99992C4.16732 5.72378 4.39118 5.49992 4.66732 5.49992Z"
                    fill="#545454"
                  />
                </svg>
                {t("fundAdjustmentsDetails.report")}
              </button> */}
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled() || isSubmitting}
              className={`px-6 py-2 text-sm rounded-lg transition-colors inline-flex items-center gap-2 ${
                isSubmitDisabled() || isSubmitting
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#4E8476] text-white hover:bg-blue-700"
              }`}
              title={
                isSubmitting
                  ? t("fundAdjustmentsDetails.submittingTitle")
                  : isSubmitDisabled()
                  ? (() => {
                      const totalValidRows =
                        (apiData?.transfers?.length || 0) +
                        localRows.length +
                        editedRows.filter(
                          (row) =>
                            !(
                              row.id.startsWith("default-") &&
                              row.costCenterCode === "" &&
                              row.accountCode === "" &&
                              row.projectCode === ""
                            )
                        ).length;

                      if (totalValidRows < 1) {
                        return t(
                          "fundAdjustmentsDetails.submitDisabledMinRows"
                        );
                      } else {
                        return t("fundAdjustmentsDetails.submitDisabledErrors");
                      }
                    })()
                  : t("fundAdjustmentsDetails.submitTitle")
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t("fundAdjustmentsDetails.submitting")}
                </>
              ) : (
                t("fundAdjustmentsDetails.submit")
              )}
            </button>
          </div>

          {/* Submit status message - only show if submit is disabled */}
          {isSubmitDisabled() && (
            <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 1L15 14H1L8 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 5V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11" r="0.5" fill="currentColor" />
              </svg>
              <span>
                {(() => {
                  const totalValidRows =
                    (apiData?.transfers?.length || 0) +
                    localRows.length +
                    editedRows.filter(
                      (row) =>
                        !(
                          row.id.startsWith("default-") &&
                          row.costCenterCode === "" &&
                          row.accountCode === "" &&
                          row.projectCode === ""
                        )
                    ).length;

                  if (totalValidRows < 2) {
                    return t("fundAdjustmentsDetails.submitWarningMinRows");
                  } else {
                    return t("fundAdjustmentsDetails.submitWarningErrors");
                  }
                })()}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Only show Re-open Request button if status is rejected and not already clicked */}
      {!isReopenClicked &&
        (transferStatus === "rejected" ||
          apiData?.status?.status === "rejected" ||
          apiData?.summary?.status === "rejected") && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
            <button
              onClick={handleReopenRequest}
              className="inline-flex text-sm items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.70065 14.4466C12.5607 13.6933 14.6673 11.0933 14.6673 7.99992C14.6673 4.31992 11.7073 1.33325 8.00065 1.33325C3.55398 1.33325 1.33398 5.03992 1.33398 5.03992M1.33398 5.03992V1.99992M1.33398 5.03992H2.67398H4.29398"
                  stroke="#545454"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.33398 8C1.33398 11.68 4.32065 14.6667 8.00065 14.6667"
                  stroke="#545454"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="3 3"
                />
              </svg>
              {t("fundAdjustmentsDetails.reopenRequest")}
            </button>
          </div>
        )}

      {/* Manage Attachments Modal */}
      <SharedModal
        isOpen={isAttachmentsModalOpen}
        onClose={() => {
          setIsAttachmentsModalOpen(false);
          setSelectedFile(null);
        }}
        title={t("fundAdjustmentsDetails.uploadTransferFile")}
        size="lg"
      >
        {/* Upload icon */}
        <div
          className={`w-full flex flex-col py-10 gap-2.5 items-center transition-colors ${
            isDragOver
              ? "bg-blue-100 border-2 border-dashed border-blue-400"
              : "bg-[#F6F6F6]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className=" rounded-full p-2  ">
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
            <div className=" text-lg mb-1">
              {selectedFile ? (
                <span className="text-green-600">
                  {t("fundAdjustmentsDetails.selectedFile")}:{" "}
                  {selectedFile.name}
                </span>
              ) : (
                <>
                  {t("fundAdjustmentsDetails.dragAndDrop")}{" "}
                  <button
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    className="text-[#4E8476] underline hover:text-blue-700 transition-colors"
                  >
                    {t("fundAdjustmentsDetails.browse")}
                  </button>
                </>
              )}
            </div>
            <div className="text-xs text-[#757575] mb-2">
              {t("fundAdjustmentsDetails.supportedFormats")}
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileSelect(file);
                }
              }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 p-4 ">
          <button
            onClick={() => {
              setIsAttachmentsModalOpen(false);
              setSelectedFile(null);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isUploading}
          >
            {t("fundAdjustmentsDetails.cancel")}
          </button>
          <button
            onClick={handleUploadFile}
            disabled={!selectedFile || isUploading}
            className={`px-4 py-2 text-sm font-medium border rounded-md transition-colors inline-flex items-center gap-2 ${
              !selectedFile || isUploading
                ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                : "text-white bg-[#4E8476] border-[#4E8476] hover:bg-blue-700"
            }`}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t("fundAdjustmentsDetails.uploading")}
              </>
            ) : (
              t("fundAdjustmentsDetails.uploadFile")
            )}
          </button>
        </div>
      </SharedModal>

      {/* Manage Report */}
      <SharedModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={t("fundAdjustmentsDetails.reportTitle")}
        size="full"
      >
        <div className="p-4 ">
          <div className="bg-[#F6F6F6] rounded-lg p-3">
            <h2 className="text-md  font-medium mb-4">
              {t("fundAdjustmentsDetails.summary")}
            </h2>

            <div className="grid grid-cols-3 gap-4 justify-between items-center">
              <div>
                <p className="text-sm text-[#757575]">
                  {t("fundAdjustmentsDetails.transactionId")}:
                </p>
                <p className="text-sm  text-[#282828]">
                  {apiData?.summary?.transaction_id || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">
                  {t("fundAdjustmentsDetails.totalTransfers")}:{" "}
                </p>
                <p className="text-sm  text-[#282828]">
                  {apiData?.summary?.total_transfers || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#757575]">
                  {t("fundAdjustmentsDetails.totalFrom")}:
                </p>
                <p className="text-sm  text-[#282828]">
                  {apiData?.summary?.total_from?.toLocaleString() || "0.00"}
                </p>
              </div>

              <div>
                <p className="text-sm text-[#757575]">
                  {t("fundAdjustmentsDetails.totalTo")}:{" "}
                </p>
                <p className="text-sm  text-[#282828]">
                  {apiData?.summary?.total_to?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
          </div>

          {/* Report content goes here */}
          <SharedTable
            title={t("fundAdjustmentsDetails.reportTableTitle")}
            columns={columns}
            titleSize="sm"
            showShadow={false}
            data={rowsDetails as unknown as SharedTableRow[]}
            maxHeight="600px"
            showPagination={rowsDetails.length > 10}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            showColumnSelector={true}
          />
        </div>
      </SharedModal>

      {/* Validation Errors Modal */}
      <SharedModal
        isOpen={isValidationErrorModalOpen}
        onClose={() => setIsValidationErrorModalOpen(false)}
        title={t("fundAdjustmentsDetails.validationErrors")}
        size="md"
      >
        <div className="p-4">
          <div className="space-y-3">
            {selectedValidationErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M8 1L15 14H1L8 1Z"
                      stroke="#dc2626"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 5V8"
                      stroke="#dc2626"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="11" r="0.5" fill="#dc2626" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-red-800 font-medium">
                    {t("fundAdjustmentsDetails.error")} {index + 1}
                  </p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsValidationErrorModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("fundAdjustmentsDetails.close")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Reason Modal */}
      <SharedModal
        isOpen={isReasonModalOpen}
        onClose={handleCloseReasonModal}
        title={t("fundAdjustmentsDetails.reasonModalTitle")}
        size="md"
      >
        <div className="p-4">
          {isSubmitted ? (
            // View-only mode
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("common.reason")}
              </label>
              <div className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px]">
                {reasonModalText ? (
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {reasonModalText}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {t("common.noReason")}
                  </p>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleCloseReasonModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          ) : (
            // Edit mode
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("fundAdjustmentsDetails.reasonLabel")}
                </label>
                <textarea
                  value={reasonModalText}
                  onChange={(e) => setReasonModalText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:border-transparent resize-none"
                  rows={4}
                  placeholder={t("fundAdjustmentsDetails.reasonPlaceholder")}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseReasonModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {t("fundAdjustmentsDetails.cancel")}
                </button>
                <button
                  onClick={handleSaveReason}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-[#4E8476] rounded-md hover:bg-[#3d6b5f] transition-colors"
                >
                  {t("fundAdjustmentsDetails.saveReason")}
                </button>
              </div>
            </>
          )}
        </div>
      </SharedModal>
    </div>
  );
}
