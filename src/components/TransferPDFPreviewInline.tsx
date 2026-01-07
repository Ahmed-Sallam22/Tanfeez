import React from "react";
import type { TransactionReportData } from "@/api/transfer.api";

interface TransferPDFPreviewInlineProps {
  data: TransactionReportData;
  isRTL?: boolean;
  t: (key: string) => string;
}

export const TransferPDFPreviewInline: React.FC<
  TransferPDFPreviewInlineProps
> = ({ data, isRTL = false, t }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(isRTL ? "ar-SA" : "en-US");
    } catch {
      return dateString;
    }
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        direction: isRTL ? "rtl" : "ltr",
        fontFamily: isRTL ? "Arial, sans-serif" : "Arial, sans-serif",
        padding: "20px",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          borderBottom: "2px solid #d1d5db",
          paddingBottom: "24px",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            textAlign: "center",
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          {t("transfer.transferReport")}
        </h1>

        {/* Transaction Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.code")}:
              </span>
              <span style={{ color: "#111827" }}>{data.code}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.requestedBy")}:
              </span>
              <span style={{ color: "#111827" }}>{data.requested_by}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.budgetType")}:
              </span>
              <span style={{ color: "#111827" }}>{data.budget_type}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("transfer.transferType")}:
              </span>
              <span style={{ color: "#111827" }}>{data.transfer_type}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.requestDate")}:
              </span>
              <span style={{ color: "#111827" }}>
                {formatDate(data.request_date)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.transactionDate")}:
              </span>
              <span style={{ color: "#111827" }}>{data.transaction_date}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.budgetControl")}:
              </span>
              <span style={{ color: "#111827" }}>{data.control_budget}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontWeight: "600", color: "#374151" }}>
                {t("tableColumns.status")}:
              </span>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "500",
                  backgroundColor:
                    data.status === "success" || data.status === "approved"
                      ? "#d1fae5"
                      : data.status === "pending"
                      ? "#fef3c7"
                      : "#fee2e2",
                  color:
                    data.status === "success" || data.status === "approved"
                      ? "#065f46"
                      : data.status === "pending"
                      ? "#92400e"
                      : "#991b1b",
                }}
              >
                {data.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                fontWeight: "600",
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              {t("common.notes")}:
            </p>
            <p style={{ color: "#111827" }}>{data.notes}</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "16px",
            borderBottom: "2px solid #d1d5db",
            paddingBottom: "8px",
          }}
        >
          {t("common.summary")}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#dbeafe",
              padding: "16px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              {t("common.totalTransfers")}
            </p>
            <p
              style={{ fontSize: "24px", fontWeight: "bold", color: "#1e40af" }}
            >
              {data.summary.total_transfers}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#d1fae5",
              padding: "16px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              {t("common.totalFrom")}
            </p>
            <p
              style={{ fontSize: "24px", fontWeight: "bold", color: "#059669" }}
            >
              {formatNumber(data.summary.total_from_center)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: "#e9d5ff",
              padding: "16px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              {t("common.totalTo")}
            </p>
            <p
              style={{ fontSize: "24px", fontWeight: "bold", color: "#7c3aed" }}
            >
              {formatNumber(data.summary.total_to_center)}
            </p>
          </div>
          <div
            style={{
              backgroundColor: data.summary.balanced ? "#d1fae5" : "#fee2e2",
              padding: "16px",
              borderRadius: "4px",
            }}
          >
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              {t("transfer.balanced")}
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: data.summary.balanced ? "#059669" : "#dc2626",
              }}
            >
              {data.summary.balanced ? t("common.yes") : t("common.no")}
            </p>
          </div>
        </div>
      </div>

      {/* Transfers Details */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "16px",
            borderBottom: "2px solid #d1d5db",
            paddingBottom: "8px",
          }}
        >
          {t("transfer.transferDetails")}
        </h2>

        {data.transfers.map((transfer, index) => (
          <div
            key={transfer.transfer_id}
            style={{
              marginBottom: "32px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            {/* Transfer Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                paddingBottom: "8px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#111827",
                }}
              >
                {t("transfer.transferNumber")} #{index + 1}
              </h3>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                ID: {transfer.transfer_id}
              </span>
            </div>

            {/* Amounts */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  padding: "12px",
                  borderRadius: "4px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {t("transfer.fromCenter")}:
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#dc2626",
                  }}
                >
                  {formatNumber(transfer.from_center)}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: "#d1fae5",
                  padding: "12px",
                  borderRadius: "4px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {t("transfer.toCenter")}:
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#059669",
                  }}
                >
                  {formatNumber(transfer.to_center)}
                </p>
              </div>
            </div>

            {/* Segments */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <h4 style={{ fontWeight: "600", color: "#111827" }}>
                {t("transfer.segments")}:
              </h4>

              {Object.entries(transfer.segments)
                .filter(([, segment]) => segment.from_code || segment.to_code)
                .map(([key, segment]) => (
                  <div
                    key={key}
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "16px",
                      borderRadius: "4px",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "12px",
                      }}
                    >
                      {segment.segment_name}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {/* From */}
                      {segment.from_code && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontWeight: "600",
                            }}
                          >
                            {t("transfer.from")}:
                          </p>
                          <p style={{ fontSize: "14px", color: "#111827" }}>
                            <span style={{ fontFamily: "monospace" }}>
                              {segment.from_code}
                            </span>
                            {segment.from_name && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "4px",
                                }}
                              >
                                {segment.from_name}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* To */}
                      {segment.to_code && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontWeight: "600",
                            }}
                          >
                            {t("transfer.to")}:
                          </p>
                          <p style={{ fontSize: "14px", color: "#111827" }}>
                            <span style={{ fontFamily: "monospace" }}>
                              {segment.to_code}
                            </span>
                            {segment.to_name && (
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  marginTop: "4px",
                                }}
                              >
                                {segment.to_name}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            {/* Budget Control Information */}
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "#dbeafe",
                padding: "16px",
                borderRadius: "4px",
              }}
            >
              <h4
                style={{
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                {t("transfer.budgetControl")}:
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  fontSize: "14px",
                }}
              >
                <div>
                  <p style={{ color: "#6b7280" }}>{t("transfer.budget")}:</p>
                  <p style={{ fontWeight: "600" }}>
                    {formatNumber(transfer.budget_control.budget)}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#6b7280" }}>
                    {t("transfer.encumbrance")}:
                  </p>
                  <p style={{ fontWeight: "600" }}>
                    {formatNumber(transfer.budget_control.encumbrance)}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#6b7280" }}>
                    {t("transfer.fundsAvailable")}:
                  </p>
                  <p style={{ fontWeight: "600", color: "#059669" }}>
                    {formatNumber(transfer.budget_control.funds_available)}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#6b7280" }}>{t("transfer.actual")}:</p>
                  <p style={{ fontWeight: "600" }}>
                    {formatNumber(transfer.budget_control.actual)}
                  </p>
                </div>
                <div>
                  <p style={{ color: "#6b7280" }}>{t("common.other")}:</p>
                  <p style={{ fontWeight: "600" }}>
                    {formatNumber(transfer.budget_control.other)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "32px",
          paddingTop: "16px",
          borderTop: "2px solid #d1d5db",
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        <p>
          {t("transfer.generatedOn")}:{" "}
          {new Date().toLocaleString(isRTL ? "ar-SA" : "en-US")}
        </p>
        <p style={{ marginTop: "4px" }}>{t("transfer.systemGenerated")}</p>
      </div>
    </div>
  );
};
