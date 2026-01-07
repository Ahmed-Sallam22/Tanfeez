import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGetAnalyticalReportQuery } from "../../api/analyticalReport.api";
import { useGetSegmentsByTypeQuery } from "../../api/segmentConfiguration.api";
import SharedSelect from "../../shared/SharedSelect";
import {
  SharedTable,
  type TableColumn,
  type TableRow,
} from "../../shared/SharedTable";
import { formatNumber } from "../../utils/formatNumber";

interface SelectOption {
  value: string;
  label: string;
}

export default function AnalyticalReport() {
  const { t } = useTranslation();
  const [controlBudget, setControlBudget] = useState<string>("MOFA_COST_2");
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Fetch segments for segment_type 11
  const { data: segmentsData } = useGetSegmentsByTypeQuery(11);

  // Fetch analytical report data
  const { data } = useGetAnalyticalReportQuery({
    segment_type_id: 11,
    segment_code: selectedSegment,
    control_budget_name: controlBudget,
    segment_filter: segmentFilter as
      | "all"
      | "with_transfers"
      | "with_funds"
      | "with_both"
      | "with_either",
    transaction_status: "approved",
    page: currentPage,
    page_size: pageSize,
  });

  // Budget options
  const budgetOptions: SelectOption[] = [
    { value: "MOFA_CASH", label: t("analyticalReport.liquidity") },
    { value: "MOFA_COST_2", label: t("analyticalReport.costs") },
  ];

  // Segment filter options
  const segmentFilterOptions: SelectOption[] = [
    { value: "all", label: t("analyticalReport.filterOptions.all") },
    {
      value: "with_transfers",
      label: t("analyticalReport.filterOptions.withTransfers"),
    },
    {
      value: "with_funds",
      label: t("analyticalReport.filterOptions.withFunds"),
    },
    { value: "with_both", label: t("analyticalReport.filterOptions.withBoth") },
    {
      value: "with_either",
      label: t("analyticalReport.filterOptions.withEither"),
    },
  ];

  // Segment options from API
  const segmentOptions: SelectOption[] = useMemo(() => {
    if (!segmentsData?.data) return [];
    return segmentsData.data.map((segment) => ({
      value: String(segment.code),
      label: `${segment.code} - ${segment.alias}`,
    }));
  }, [segmentsData]);

  const handleBudgetChange = (value: string | number) => {
    setControlBudget(String(value));
    setCurrentPage(1);
  };

  const handleSegmentChange = (value: string | number) => {
    setSelectedSegment(value ? Number(value) : null);
    setCurrentPage(1);
  };

  const handleSegmentFilterChange = (value: string | number) => {
    setSegmentFilter(String(value));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Define table columns
  const columns: TableColumn[] = useMemo(
    () => [
      {
        id: "economicClassificationNumber",
        header: t("analyticalReport.columns.economicClassificationNumber"),
        accessor: "mapping_code",
      },
      {
        id: "economicClassificationName",
        header: t("analyticalReport.columns.economicClassificationName"),
        accessor: "mapping_code_alias",
      },
      {
        id: "itemProgramProjectNumber",
        header: t("analyticalReport.columns.itemProgramProjectNumber"),
        accessor: "segment_code",
      },
      {
        id: "itemProgramProjectName",
        header: t("analyticalReport.columns.itemProgramProjectName"),
        accessor: "segment_alias",
      },
      {
        id: "initialBudget",
        header: t("analyticalReport.columns.initialBudget"),
        accessor: "initial_budget",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "decrease",
        header: t("analyticalReport.columns.decrease"),
        accessor: "total_decrease_fund",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      // {
      //   id: "transferredFrom",
      //   header: t("analyticalReport.columns.transferredFrom"),
      //   accessor: "total_from",
      //   render: (value: unknown) => formatNumber(value as number),
      //   showSum: true,
      // },
      // {
      //   id: "transferredTo",
      //   header: t("analyticalReport.columns.transferredTo"),
      //   accessor: "total_to",
      //   render: (value: unknown) => formatNumber(value as number),
      //   showSum: true,
      // },
      {
        id: "additionalFund",
        header: t("analyticalReport.columns.additionalFund"),
        accessor: "total_additional_fund",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "budgetAfterAdjustment",
        header: t("analyticalReport.columns.budgetAfterAdjustment"),
        accessor: "total_budget",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "encumbranceInProgress",
        header: t("analyticalReport.columns.encumbranceInProgress"),
        accessor: "encumbrance",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "futuresColumn",
        header: t("analyticalReport.columns.futuresColumn"),
        accessor: "Futures_column",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "actualExpenditure",
        header: t("analyticalReport.columns.actualExpenditure"),
        accessor: "actual",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "totalActual",
        header: t("analyticalReport.columns.totalActual"),
        accessor: "total_actual",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "fundsAvailable",
        header: t("analyticalReport.columns.fundsAvailable"),
        accessor: "funds_available",
        render: (value: unknown) => formatNumber(value as number),
        showSum: true,
      },
      {
        id: "exchangeRate",
        header: t("analyticalReport.columns.exchangeRate"),
        accessor: "exchange_rate",
        render: (value: unknown) => {
          const rate = value as number;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                rate >= 75
                  ? "bg-red-100 text-red-800"
                  : rate >= 50
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {rate.toFixed(2)}%
            </span>
          );
        },
      },
    ],
    [t]
  );

  // Convert segments to table rows
  const tableData: TableRow[] = useMemo(() => {
    return (data?.segments || []).map(
      (segment) => segment as unknown as TableRow
    );
  }, [data?.segments]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold text-gray-900">
          {t("analyticalReport.title")}
        </h1>
        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("analyticalReport.filters")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("analyticalReport.controlBudget")}
              </label>
              <SharedSelect
                options={budgetOptions}
                value={controlBudget}
                onChange={handleBudgetChange}
                placeholder={t("analyticalReport.selectControlBudget")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("analyticalReport.segment")}
              </label>
              <SharedSelect
                options={segmentOptions}
                value={selectedSegment ? String(selectedSegment) : ""}
                onChange={handleSegmentChange}
                placeholder={t("analyticalReport.selectSegment")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("analyticalReport.segmentFilter")}
              </label>
              <SharedSelect
                options={segmentFilterOptions}
                value={segmentFilter}
                onChange={handleSegmentFilterChange}
                placeholder={t("analyticalReport.selectSegmentFilter")}
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        {data?.summary && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("analyticalReport.summary")}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.totalSegments")}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.summary.total_segments}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandInitialBudget")}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatNumber(data.summary.grand_initial_budget)}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalDecreaseFund")}
                </p>
                <p className="text-xl font-bold text-red-600">
                  {formatNumber(data.summary.grand_total_decrease_fund)}
                </p>
              </div>
              {/* <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalFrom")}
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {formatNumber(data.summary.grand_total_from)}
                </p>
              </div> */}
              {/* <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalTo")}
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {formatNumber(data.summary.grand_total_to)}
                </p>
              </div> */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalAdditionalFund")}
                </p>
                <p className="text-xl font-bold text-indigo-600">
                  {formatNumber(data.summary.grand_total_additional_fund)}
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalBudget")}
                </p>
                <p className="text-xl font-bold text-teal-600">
                  {formatNumber(data.summary.grand_total_budget)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandEncumbrance")}
                </p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatNumber(data.summary.grand_encumbrance)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandFuturesColumn")}
                </p>
                <p className="text-xl font-bold text-gray-600">
                  {formatNumber(data.summary.grand_Futures_column)}
                </p>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandActual")}
                </p>
                <p className="text-xl font-bold text-pink-600">
                  {formatNumber(data.summary.grand_actual)}
                </p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandTotalActual")}
                </p>
                <p className="text-xl font-bold text-rose-600">
                  {formatNumber(data.summary.grand_total_actual)}
                </p>
              </div>
              <div className="bg-cyan-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandFundsAvailable")}
                </p>
                <p className="text-xl font-bold text-cyan-600">
                  {formatNumber(data.summary.grand_funds_available)}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  {t("analyticalReport.grandExchangeRate")}
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {data.summary.grand_exchange_rate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Table Section */}
        <SharedTable
          columns={columns}
          data={tableData}
          showPagination={true}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalCount={data?.pagination?.total_count}
          hasNext={data?.pagination?.has_next}
          hasPrevious={data?.pagination?.has_previous}
          itemsPerPage={pageSize}
          showFooter={true}
          showColumnFilters={false}
          className="bg-white rounded-lg shadow-sm"
        />
      </div>
    </div>
  );
}
