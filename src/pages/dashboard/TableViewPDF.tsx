import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useExportToPdfMutation,
  type TransactionReportData,
} from "@/api/transfer.api";
// import ksaMinistryLogo from "../../assets/ksa_ministry_text.svg";
// import saudiLogo from "../../assets/saudilogotext.png";
import tanfeezLogo from "../../assets/Tanfeezletter.png";

// Table columns configuration
const tableColumns = [
  {
    key: "budgetItem",
    label: "عنصر الميزانية",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "costCenter",
    label: "مراكز التكلفة",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "geographicLocation",
    label: "الموقع الجغرافي",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "economicClassification",
    label: "التصنيف الاقتصادي",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "documentNumber",
    label: "رقم السند",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "discussionType",
    label: "نوع المناقلة",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "amount",
    label: "المبلغ",
    rowSpan: 2,
    align: "center" as const,
  },
  {
    key: "description",
    label: "الوصف",
    rowSpan: 2,
    align: "right" as const,
  },
  {
    key: "justifications",
    label: "المبررات",
    rowSpan: 2,
    align: "right" as const,
  },
];

// Type for table row data
interface TableRowData {
  id: number;
  budgetItem: string;
  costCenter: string;
  geographicLocation: string;
  economicClassification: string;
  documentNumber: string;
  discussionType: string;
  amount: string;
  description: string;
  justifications: string;
}

// Type for the API response when multiple IDs are provided
interface MultipleTransactionsResponse {
  count: number;
  error_count: number;
  success_count: number;
  transactions: TransactionReportData[];
}

const formatSegment = (segment?: {
  from_code?: string;
  to_code?: string;
  from_name?: string;
  to_name?: string;
}) => {
  if (!segment) return "-";
  const code = segment.from_code || segment.to_code || "";
  const name = segment.from_name || segment.to_name || "";
  if (code && name) return `${code} - ${name}`;
  return code || name || "-";
};

const formatNumber = (value?: number | null) => {
  if (value === null || value === undefined) return "-";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toLocaleString("en-US");
};

// Helper function to clean HTML tags from text
const cleanHtmlTags = (text: string): string => {
  if (!text) return "-";
  // Remove HTML tags and trim whitespace
  return (
    text
      .replace(/<br\s*\/?>/gi, "\n") // Replace <br> with newline
      .replace(/<[^>]*>/g, "") // Remove all other HTML tags
      .trim() || "-"
  );
};

// Helper function to transform API data to table format
const transformApiDataToTableData = (
  apiData: TransactionReportData[]
): TableRowData[] => {
  const rows: TableRowData[] = [];

  apiData.forEach((transaction, transactionIndex) => {
    // Helper to format discussionType with direction
    const formatDiscussionType = (
      fromCenter?: number | null,
      toCenter?: number | null
    ) => {
      const parts: string[] = [];

      if (transaction.transfer_type) {
        parts.push(transaction.transfer_type);
      }

      if (transaction.control_budget) {
        parts.push(transaction.control_budget);
      }

      // Add direction based on which amount has value
      if (fromCenter !== null && fromCenter !== undefined && fromCenter !== 0) {
        parts.push("من");
      } else if (
        toCenter !== null &&
        toCenter !== undefined &&
        toCenter !== 0
      ) {
        parts.push("إلى");
      }

      return parts.length > 0 ? parts.join(" - ") : "-";
    };

    if (transaction.transfers && transaction.transfers.length > 0) {
      transaction.transfers.forEach((transfer, transferIndex) => {
        // Determine which amount to display
        const amountValue =
          transfer.from_center !== null &&
          transfer.from_center !== undefined &&
          transfer.from_center !== 0
            ? transfer.from_center
            : transfer.to_center;

        rows.push({
          id:
            transfer.transfer_id ||
            transaction.transaction_id ||
            transactionIndex * 10 + transferIndex + 1,
          budgetItem: formatSegment(transfer.segments?.segment_11),
          costCenter: formatSegment(transfer.segments?.segment_9),
          geographicLocation: formatSegment(transfer.segments?.segment_5),
          economicClassification: transfer.gfs_code?.toString() || "-",
          documentNumber:
            transaction.code || transaction.transaction_id?.toString() || "-",
          discussionType: formatDiscussionType(
            transfer.from_center,
            transfer.to_center
          ),
          amount: formatNumber(amountValue),
          description: cleanHtmlTags(transaction.notes ?? ""),
          justifications: cleanHtmlTags(transfer.reason ?? ""),
        });
      });
    } else {
      // No transfers - show transaction summary row
      rows.push({
        id: transaction.transaction_id || transactionIndex + 1,
        budgetItem: "-",
        costCenter: "-",
        geographicLocation: "-",
        economicClassification: "-",
        documentNumber:
          transaction.code || transaction.transaction_id?.toString() || "-",
        discussionType: formatDiscussionType(null, null),
        amount: "-",
        description: cleanHtmlTags(transaction.notes ?? ""),
        justifications: "-",
      });
    }
  });

  return rows;
};

// Page Header Component - will repeat on each printed page
const PageHeader = () => (
  <div className="page-header flex items-center justify-between px-10 py-6">
    {/* <div className="flex-shrink-0">
      <img
        src={saudiLogo}
        alt="شعار السعودية"
        className="h-16 w-auto object-contain"
      />
    </div> */}
    <div className="mx-auto">
      <img
        src={tanfeezLogo}
        alt="شعار تنفيذ"
        className="h-40 w-auto object-contain"
      />
    </div>
    {/* <div className="flex-shrink-0">
      <img
        src={ksaMinistryLogo}
        alt="شعار الوزارة"
        className="h-16 w-auto object-contain"
      />
    </div> */}
  </div>
);

// Page Footer Component - will repeat on each printed page
const PageFooter = () => (
  <div className="page-footer flex items-center justify-between px-10 py-6">
    {/* Right - مدير الادارة */}
    <div className="text-center">
      <p className="font-bold text-lg mb-8">اعتماد مدير الادارة</p>
      <div className="border-t border-gray-400 w-48 mx-auto pt-2">
        <p className="text-gray-500">التوقيع</p>
      </div>
    </div>

    {/* Left - وكيل الوزارة */}
    <div className="text-center">
      <p className="font-bold text-lg mb-8">اعتماد وكيل الوزارة</p>
      <div className="border-t border-gray-400 w-48 mx-auto pt-2">
        <p className="text-gray-500">التوقيع</p>
      </div>
    </div>
  </div>
);

const TableViewPDF = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [exportToPdf, { isLoading }] = useExportToPdfMutation();
  const [tableData, setTableData] = useState<TableRowData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const idsParam = searchParams.get("ids");

    // Protection: Redirect if no IDs provided
    if (!idsParam || idsParam.trim() === "") {
      setError(t("messages.selectAtLeastOne"));
      // Redirect to transfer page after 2 seconds
      setTimeout(() => {
        window.location.href = "/app/transfer";
      }, 2000);
      return;
    }

    const ids = idsParam
      .split(",")
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    // Protection: Validate IDs
    if (ids.length === 0) {
      setError(t("messages.invalidData"));
      setTimeout(() => {
        window.location.href = "/app/transfer";
      }, 2000);
      return;
    }

    // Fetch report data from API
    exportToPdf({ transaction_ids: ids })
      .unwrap()
      .then(
        (
          response:
            | TransactionReportData
            | TransactionReportData[]
            | MultipleTransactionsResponse
        ) => {
          console.log("Table PDF API Response:", response);

          // Ensure response is always an array
          let dataArray: TransactionReportData[];

          // Check if response has transactions property (multiple IDs)
          if (
            response &&
            typeof response === "object" &&
            "transactions" in response &&
            Array.isArray(response.transactions)
          ) {
            dataArray = response.transactions;
            console.log(
              "Multiple transactions response, count:",
              (response as MultipleTransactionsResponse).count
            );
          }
          // Check if response is directly an array
          else if (Array.isArray(response)) {
            dataArray = response;
          }
          // Single transaction object
          else if (
            response &&
            typeof response === "object" &&
            "transaction_id" in response
          ) {
            dataArray = [response as TransactionReportData];
          }
          // Invalid response
          else {
            setError(t("common.noData"));
            setTimeout(() => {
              window.location.href = "/app/transfer";
            }, 2000);
            return;
          }

          // Validate data array
          if (dataArray.length === 0) {
            setError(t("common.noData"));
            setTimeout(() => {
              window.location.href = "/app/transfer";
            }, 2000);
            return;
          }

          // Transform API data to table format
          const transformedData = transformApiDataToTableData(dataArray);
          console.log(
            "Setting table data, length:",
            transformedData.length,
            transformedData
          );
          setTableData(transformedData);
        }
      )
      .catch((err) => {
        console.error("Error fetching table data:", err);
        setError(t("messages.exportError"));
        // Redirect to transfer page after error
        setTimeout(() => {
          window.location.href = "/app/transfer";
        }, 2000);
      });
  }, [searchParams, exportToPdf, t]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E8476] mx-auto mb-4"></div>
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("common.error")}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4E8476]"></div>
            <span>{t("messages.redirecting")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!tableData || tableData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📄</div>
          <p className="text-gray-600">{t("common.noData")}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="flex flex-col min-h-screen bg-white"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden flex justify-end p-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          طباعة PDF
        </button>
      </div>

      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <PageHeader />
      </div>

      {/* Main Content - Takes remaining space */}
      <div className="flex-1 px-8 py-4 overflow-auto">
        {/* Data Table */}
        <table className="data-table w-full border-collapse border border-gray-400">
          <thead>
            {/* Header row */}
            <tr className="bg-gray-100">
              {tableColumns.map((col) => (
                <th
                  key={col.key}
                  className={`border border-gray-400 px-3 py-3 text-${col.align} font-bold`}
                  rowSpan={col.rowSpan}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr key={`${row.id}-${index}`} className="hover:bg-gray-50">
                {tableColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`border border-gray-400 px-3 py-3 text-${col.align}`}
                    style={{
                      whiteSpace:
                        col.key === "description" ||
                        col.key === "justifications"
                          ? "pre-wrap"
                          : "normal",
                      verticalAlign: "top",
                    }}
                  >
                    {row[col.key as keyof typeof row]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0">
        <PageFooter />
      </div>
    </div>
  );
};

export default TableViewPDF;
