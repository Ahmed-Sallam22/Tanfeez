import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";
import {
  useGetDashboardDataQuery,
  type TransferTypeData,
} from "@/api/dashboard.api";
import { useGetAnalyticalReportQuery } from "@/api/analyticalReport.api";
import { useGetSegmentsByTypeQuery } from "@/api/segmentConfiguration.api";
import SharedSelect from "@/shared/SharedSelect";

import { cn } from "@/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}
// ===== Reusable Pieces =====
function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

function ErrorState({
  message = "Failed to load data",
  t,
}: {
  message?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("home.errorLoadingDashboard")}
        </h3>
        <p className="text-gray-500 mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}

// ===== Page =====
export default function Home() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Filter states for pie charts
  const [controlBudget, setControlBudget] = useState<string>("MOFA_COST_2");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Fetch segments for segment_type 11
  const { data: segmentsData } = useGetSegmentsByTypeQuery(11);

  // API call
  const {
    data: dashboardData,
    error,
    refetch: refetchDashboard,
  } = useGetDashboardDataQuery({ type: "all" });

  // Analytical Report API call for pie charts - now dynamic based on filter
  const { data: analyticalData, isLoading: isLoadingAnalytical } =
    useGetAnalyticalReportQuery({
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
      page: 1,
      page_size: 20,
    });

  // Budget filter options
  const budgetOptions = [
    { value: "MOFA_COST_2", label: t("analyticalReport.costs") || "التكاليف" },
    { value: "MOFA_CASH", label: t("analyticalReport.liquidity") || "السيولة" },
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

  // Filter change handlers
  const handleBudgetChange = (value: string | number) => {
    setControlBudget(String(value));
  };

  const handleSegmentChange = (value: string | number) => {
    setSelectedSegment(value ? Number(value) : null);
  };

  const handleSegmentFilterChange = (value: string | number) => {
    setSegmentFilter(String(value));
  };

  const [year, setYear] = useState<string>("2025");

  // ===== Mock Data =====

  const statusData = useMemo(() => {
    const normalData = dashboardData?.normal;

    // Calculate totals from by_transfer_type if available
    if (normalData?.by_transfer_type) {
      const types = Object.values(normalData.by_transfer_type);

      const totalApproved = types.reduce(
        (sum, type) => sum + type.approved_transfers,
        0
      );
      const totalPending = types.reduce(
        (sum, type) => sum + type.pending_transfers,
        0
      );
      const totalRejected = types.reduce(
        (sum, type) => sum + type.rejected_transfers,
        0
      );

      return [
        {
          name: t("home.approved"),
          value: totalApproved,
          color: "#007E77",
        },
        {
          name: t("home.pending"),
          value: totalPending,
          color: "#6BE6E4",
        },
        {
          name: t("home.rejected"),
          value: totalRejected,
          color: "var(--color-primary)",
        },
      ];
    }

    // Fallback to old structure if by_transfer_type is not available
    if (!normalData) {
      return [
        { name: t("home.approved"), value: 0, color: "#007E77" },
        { name: t("home.pending"), value: 0, color: "#6BE6E4" },
        { name: t("home.rejected"), value: 0, color: "var(--color-primary)" },
      ];
    }

    return [
      {
        name: t("home.approved"),
        value: normalData.approved_transfers || 0,
        color: "#007E77",
      },
      {
        name: t("home.pending"),
        value: normalData.pending_transfers || 0,
        color: "#6BE6E4",
      },
      {
        name: t("home.rejected"),
        value: normalData.rejected_transfers || 0,
        color: "var(--color-primary)",
      },
    ];
  }, [dashboardData?.normal, t]);

  useEffect(() => {
    // if mode or year changes and you want to force a fresh pull
    refetchDashboard();
    // year affects only derived memos in your code; if your APIs support year, add it to args and refetch here too.
  }, [year, refetchDashboard]);

  // Prepare pie chart data with theme colors
  const pieChartsData = useMemo(() => {
    // Use API data
    const summary = analyticalData?.summary;

    if (!summary) {
      return {
        exchangeRateData: [],
        totalExpenditureData: [],
        actualExpenditureData: [],
        reservationsData: [],
        exchangeRatePercentage: 0,
        actualPercentage: 0,
        encumbrancePercentage: 0,
      };
    }

    const totalBudget = summary.grand_total_budget || 1; // Avoid division by zero

    // Calculate percentages
    const actualPercentage = (summary.grand_actual / totalBudget) * 100;
    const encumbrancePercentage =
      (summary.grand_encumbrance / totalBudget) * 100;
    const totalActualPercentage =
      (summary.grand_total_actual / totalBudget) * 100;

    // Theme colors - 4 colors derived from primary #4E8476
    const COLORS = {
      primary: "var(--color-primary)", // Main theme green (original)
      secondary: "#6BA399", // Lighter teal
      tertiary: "#3D6860", // Darker shade
      light: "#8FB8AF", // Light muted green
    };

    // 1. مؤشر الصرف (Exchange Rate Indicator) - Total Actual vs Remaining Budget
    const exchangeRateData = [
      {
        name: t("home.totalSpent"),
        value: summary.grand_total_actual,
        color: COLORS.primary,
      },
      {
        name: t("home.remainingBudget"),
        value: summary.grand_funds_available,
        color: COLORS.light,
      },
    ];

    // 2. نسب اجمالي الصرف (Total Expenditure Ratio) - Breakdown of budget usage
    const totalExpenditureData = [
      {
        name: t("home.encumbranceInProgress"),
        value: summary.grand_encumbrance,
        color: COLORS.secondary,
      },
      {
        name: t("home.covenant"),
        value: summary.grand_Futures_column,
        color: COLORS.tertiary,
      },
      {
        name: t("home.actualSpent"),
        value: summary.grand_actual,
        color: COLORS.primary,
      },
      {
        name: t("home.remainingBudget"),
        value: summary.grand_funds_available,
        color: COLORS.light,
      },
    ];

    // 3. نسبة المنصرف الفعلي (Actual Expenditure Percentage)
    const actualExpenditureData = [
      {
        name: t("home.actualSpent"),
        value: summary.grand_actual,
        color: COLORS.primary,
      },
      {
        name: t("home.adjustedBudget"),
        value: summary.grand_total_budget,
        color: COLORS.light,
      },
    ];

    // 4. نسبة الحجوزات (Reservations/Encumbrance Percentage)
    const reservationsData = [
      {
        name: t("home.adjustedBudget"),
        value: summary.grand_total_budget,
        color: COLORS.light,
      },
      {
        name: t("home.encumbranceInProgress"),
        value: summary.grand_encumbrance,
        color: COLORS.secondary,
      },
    ];

    return {
      exchangeRateData,
      totalExpenditureData,
      actualExpenditureData,
      reservationsData,
      exchangeRatePercentage: totalActualPercentage.toFixed(2),
      actualPercentage: actualPercentage.toFixed(2),
      encumbrancePercentage: encumbrancePercentage.toFixed(2),
    };
  }, [analyticalData, t]); // Using API data with translations

  // Helper function to format numbers
  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Error State */}
      {error && (
        <ErrorState message={t("home.failedToLoadDashboardData")} t={t} />
      )}

      {/* Header */}
      {/* Header */}
      <div className={cn("flex items-center justify-between gap-4")}>
        {/* Left side */}
        <h1
          className={cn(
            "text-2xl font-bold text-gray-900",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {t("dashboard") || "Dashboard"}
        </h1>
      </div>
      {/* Transfer Status Chart */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
        <div
          className={cn(
            "flex items-center justify-between mb-4"
            // isRTL && "flex-row-reverse"
          )}
        >
          <div className="font-semibold text-gray-900">
            {t("home.transferStatus")}
          </div>
          <div>
            <select
              className="rounded-xl border border-[#F6F6F6] bg-[#F6F6F6] px-3 py-1.5 text-sm  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              defaultValue="2025"
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {/* Chart */}
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} barSize={40}>
                <CartesianGrid vertical={false} stroke={"#E5E7EB"} />{" "}
                <XAxis
                  dataKey="name"
                  tickFormatter={(v) => String(v).replace("_", " ")}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  // tick={false} // uncomment to hide labels
                />
                <RTooltip
                  cursor={{ fill: "rgba(78, 132, 118, 0.1)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const data = payload[0];
                    const statusName = String(data.payload.name);

                    // Determine which field to show based on status
                    const getValueByStatus = (
                      typeData: TransferTypeData | undefined,
                      status: string
                    ): number => {
                      if (!typeData) return 0;
                      if (status === t("home.approved"))
                        return typeData.approved_transfers;
                      if (status === t("home.pending"))
                        return typeData.pending_transfers;
                      if (status === t("home.rejected"))
                        return typeData.rejected_transfers;
                      return 0;
                    };

                    const transferTypes = ["FAR", "AFR", "DFR", "HFR"];

                    return (
                      <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: data.payload.color }}
                          />
                          <p className="font-semibold text-gray-900 text-sm">
                            {statusName}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {t("home.total")}:
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              {Number(data.value).toLocaleString()}
                            </span>
                          </div>
                          {dashboardData?.normal?.by_transfer_type && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-400 mb-1">
                                {t("home.breakdown")}:
                              </div>
                              <div className="space-y-1">
                                {transferTypes.map((type) => {
                                  const typeData =
                                    dashboardData.normal?.by_transfer_type?.[
                                      type as keyof typeof dashboardData.normal.by_transfer_type
                                    ];
                                  const value = getValueByStatus(
                                    typeData,
                                    statusName
                                  );
                                  return (
                                    <div
                                      key={type}
                                      className="flex justify-between items-center"
                                    >
                                      <span className="text-xs text-gray-600">
                                        {t(`home.transferTypes.${type}`)}:
                                      </span>
                                      <span className="text-xs font-medium text-gray-900">
                                        {Number(value).toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" name="Transfers" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transfer Types Charts Grid */}
      {dashboardData?.normal?.by_transfer_type && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(dashboardData.normal.by_transfer_type).map(
            ([type, data]) => {
              const typeColors: Record<string, string[]> = {
                FAR: ["#007E77", "#6BE6E4", "var(--color-primary)"],
                AFR: ["#2E7D32", "#81C784", "#4CAF50"],
                DFR: ["#D32F2F", "#EF5350", "#E57373"],
                HFR: ["#F57C00", "#FFB74D", "#FF9800"],
              };

              const chartData = [
                {
                  name: t("home.approved"),
                  value: data.approved_transfers,
                  color: typeColors[type][0],
                },
                {
                  name: t("home.pending"),
                  value: data.pending_transfers,
                  color: typeColors[type][1],
                },
                {
                  name: t("home.rejected"),
                  value: data.rejected_transfers,
                  color: typeColors[type][2],
                },
              ];

              return (
                <div
                  key={type}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold text-gray-900">
                      {t(`home.transferTypes.${type}`)}
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {t("home.total")}: {data.total_transfers}
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="h-[160px] w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={60}
                          innerRadius={40}
                          dataKey="value"
                          strokeWidth={0}
                          paddingAngle={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const data = payload[0];
                            return (
                              <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-medium text-sm text-gray-900">
                                  {data.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {Number(data.value).toLocaleString()}
                                </p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats */}
                  <div className="space-y-2">
                    {chartData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Pie Charts Section - مؤشرات الصرف */}
      <div className="space-y-4">
        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 ring-1 ring-black/5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t("home.expenditureIndicators") || "مؤشرات الصرف"}
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

        {/* Charts Grid */}
        {isLoadingAnalytical ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <LoadingSkeleton className="h-6 w-32 mb-4" />
                <div className="h-[280px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. مؤشر الصرف - Exchange Rate Indicator */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-gray-900">
                  {t("home.exchangeRateIndicator")}
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {pieChartsData.exchangeRatePercentage}%
                </div>
              </div>
              <div className="flex items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartsData.exchangeRateData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={55}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={3}
                      >
                        {pieChartsData.exchangeRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0];
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatValue(Number(data.value))}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-col gap-4">
                  {pieChartsData.exchangeRateData.map((item, index) => {
                    const total = pieChartsData.exchangeRateData.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {item.name}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatValue(item.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. نسب اجمالي الصرف - Total Expenditure Ratio */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-gray-900">
                  {t("home.totalExpenditureRatio")}
                </div>
              </div>
              <div className="flex items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartsData.totalExpenditureData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={55}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={3}
                      >
                        {pieChartsData.totalExpenditureData.map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0];
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatValue(Number(data.value))}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-col gap-3">
                  {pieChartsData.totalExpenditureData.map((item, index) => {
                    const total = pieChartsData.totalExpenditureData.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {item.name}
                          </div>
                          <div className="text-base font-bold text-gray-900">
                            {formatValue(item.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. نسبة المنصرف الفعلي - Actual Expenditure Percentage */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-gray-900">
                  {t("home.actualExpenditurePercentage")}
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {pieChartsData.actualPercentage}%
                </div>
              </div>
              <div className="flex items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartsData.actualExpenditureData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={55}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={3}
                      >
                        {pieChartsData.actualExpenditureData.map(
                          (entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          )
                        )}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0];
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatValue(Number(data.value))}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-col gap-4">
                  {pieChartsData.actualExpenditureData.map((item, index) => {
                    const total = pieChartsData.actualExpenditureData.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {item.name}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatValue(item.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. نسبة الحجوزات - Reservations Percentage */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-gray-900">
                  {t("home.reservationsPercentage")}
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {pieChartsData.encumbrancePercentage}%
                </div>
              </div>
              <div className="flex items-center justify-center gap-8">
                {/* Pie Chart */}
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartsData.reservationsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={55}
                        dataKey="value"
                        strokeWidth={0}
                        paddingAngle={3}
                      >
                        {pieChartsData.reservationsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const data = payload[0];
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-medium text-gray-900">
                                {data.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatValue(Number(data.value))}
                              </p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-col gap-4">
                  {pieChartsData.reservationsData.map((item, index) => {
                    const total = pieChartsData.reservationsData.reduce(
                      (sum, d) => sum + d.value,
                      0
                    );
                    const percentage = ((item.value / total) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {item.name}
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatValue(item.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {percentage}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
