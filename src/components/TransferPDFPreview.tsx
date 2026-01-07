import React from "react";
import { useTranslation } from "react-i18next";
import type { TransactionReportData } from "@/api/transfer.api";

// Re-export for backwards compatibility
export type TransferReportData = TransactionReportData;

interface TransferPDFPreviewProps {
  data: TransferReportData;
}

export const TransferPDFPreview: React.FC<TransferPDFPreviewProps> = ({
  data,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Debug logging
  console.log("TransferPDFPreview received data:", data);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(
        i18n.language === "ar" ? "ar-SA" : "en-US"
      );
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white" style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {/* Header Section */}
      <div className="border-b-2 border-gray-300 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
          {t("transfer.transferReport")}
        </h1>

        {/* Transaction Info Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.code")}:
              </span>
              <span className="text-gray-900">{data.code || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.requestedBy")}:
              </span>
              <span className="text-gray-900">{data.requested_by || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.budgetType")}:
              </span>
              <span className="text-gray-900">{data.budget_type || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("transfer.transferType")}:
              </span>
              <span className="text-gray-900">{data.transfer_type || "-"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.requestDate")}:
              </span>
              <span className="text-gray-900">
                {data.request_date ? formatDate(data.request_date) : "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.transactionDate")}:
              </span>
              <span className="text-gray-900">
                {data.transaction_date || "-"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.budgetControl")}:
              </span>
              <span className="text-gray-900">{data.control_budget}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold text-gray-700">
                {t("tableColumns.status")}:
              </span>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  data.status === "success" || data.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : data.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.status?.toUpperCase() || t("common.unknown")}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="font-semibold text-gray-700 mb-2">
              {t("common.notes")}:
            </p>
            <p className="text-gray-900">{data.notes}</p>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {data.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            {t("common.summary")}
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">
                {t("common.totalTransfers")}
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {data.summary.total_transfers || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">
                {t("common.totalFrom")}
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(data.summary.total_from_center || 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600 mb-1">
                {t("common.totalTo")}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(data.summary.total_to_center || 0)}
              </p>
            </div>
            <div
              className={`p-4 rounded ${
                data.summary.balanced ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-sm text-gray-600 mb-1">
                {t("transfer.balanced")}
              </p>
              <p
                className={`text-2xl font-bold ${
                  data.summary.balanced ? "text-green-600" : "text-red-600"
                }`}
              >
                {data.summary.balanced ? t("common.yes") : t("common.no")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transfers Details */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
          {t("transfer.transferDetails")}
        </h2>

        {!data.transfers || data.transfers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{t("common.noData")}</p>
          </div>
        ) : (
          data.transfers.map((transfer, index) => (
            <div
              key={transfer.transfer_id || `transfer-${index}`}
              className="mb-8 border border-gray-300 rounded-lg p-6"
            >
              {/* Transfer Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("transfer.transferNumber")} #{index + 1}
                </h3>
                <span className="text-sm text-gray-600">
                  ID: {transfer.transfer_id}
                </span>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-1">
                    {t("transfer.fromCenter")}:
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatNumber(transfer.from_center)}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600 mb-1">
                    {t("transfer.toCenter")}:
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {formatNumber(transfer.to_center)}
                  </p>
                </div>
              </div>

              {/* Segments - Only show segments with data */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">
                  {t("transfer.segments")}:
                </h4>

                {transfer.segments &&
                  Object.entries(transfer.segments)
                    .filter(
                      ([, segment]) => segment.from_code || segment.to_code
                    )
                    .map(([key, segment]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded">
                        <p className="font-semibold text-gray-900 mb-3">
                          {segment.segment_name}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          {/* From */}
                          {segment.from_code && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 font-semibold">
                                {t("transfer.from")}:
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-mono">
                                  {segment.from_code}
                                </span>
                                {segment.from_name && (
                                  <span className="block text-xs text-gray-600 mt-1">
                                    {segment.from_name}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* To */}
                          {segment.to_code && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-600 font-semibold">
                                {t("transfer.to")}:
                              </p>
                              <p className="text-sm text-gray-900">
                                <span className="font-mono">
                                  {segment.to_code}
                                </span>
                                {segment.to_name && (
                                  <span className="block text-xs text-gray-600 mt-1">
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
              {transfer.budget_control && (
                <div className="mt-4 bg-blue-50 p-4 rounded">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {t("transfer.budgetControl")}:
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">{t("transfer.budget")}:</p>
                      <p className="font-semibold">
                        {formatNumber(transfer.budget_control.budget || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        {t("transfer.encumbrance")}:
                      </p>
                      <p className="font-semibold">
                        {formatNumber(transfer.budget_control.encumbrance || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        {t("transfer.fundsAvailable")}:
                      </p>
                      <p className="font-semibold text-green-600">
                        {formatNumber(
                          transfer.budget_control.funds_available || 0
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t("transfer.actual")}:</p>
                      <p className="font-semibold">
                        {formatNumber(transfer.budget_control.actual || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t("common.other")}:</p>
                      <p className="font-semibold">
                        {formatNumber(transfer.budget_control.other || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
        <p>
          {t("transfer.generatedOn")}:{" "}
          {new Date().toLocaleString(
            i18n.language === "ar" ? "ar-SA" : "en-US"
          )}
        </p>
        <p className="mt-1">{t("transfer.systemGenerated")}</p>
      </div>
    </div>
  );
};
