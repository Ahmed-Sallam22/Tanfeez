import { useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
} from "recharts";
import { useGetAccountWiseDashboardQuery } from "@/api/dashboard.api";
import { type TableColumn } from "@/shared/SharedTable";
import { SharedTable2, type TableRow } from "@/shared/SharedTable 2";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/utils/cn";

function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

function ChartLoadingSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <LoadingSkeleton className="h-6 w-32 mb-4" />
      <div className="h-[280px] flex items-center justify-center">
        <LoadingSkeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    </div>
  );
}

export default function DashboardDetails() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [year] = useState<string>("2025");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  // Get the project parameter from URL
  const currentProject = searchParams.get("project");

  // Fetch data using the project parameter
  const { data: accountWiseData, isLoading: accountWiseLoading } =
    useGetAccountWiseDashboardQuery({
      project_code: currentProject || "",
    });

  // Get the title and data key based on type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "manpower":
        return {
          title: t("home.manpower"),
          dataKey: "MenPower",
          color: "#007E77",
        };
      case "non-manpower":
        return {
          title: t("home.nonManpower"),
          dataKey: "NonMenPower",
          color: "#6BE6E4",
        };
      case "capex":
        return {
          title: t("home.capex"),
          dataKey: "Copex",
          color: "var(--color-primary)",
        };
      default:
        return {
          title: t("dashboard"),
          dataKey: "MenPower",
          color: "#007E77",
        };
    }
  };

  const typeConfig = getTypeConfig(type || "manpower");

  // Process account summary data for the first chart (only the selected type)
  const accountSummaryData = useMemo(() => {
    if (!accountWiseData?.data) return [];

    const typeData = (accountWiseData.data as Record<string, unknown>)[
      typeConfig.dataKey
    ] as Record<string, unknown>;
    const summary = typeData?.summary as Record<string, unknown>;
    return [
      {
        name: typeConfig.title,
        value:
          year === "2025"
            ? (summary?.total_fy25_budget as number) || 0
            : (summary?.total_fy24_budget as number) || 0,
        color: typeConfig.color,
      },
    ];
  }, [accountWiseData, year, typeConfig]);

  // Process status data for the second chart (filtered by type)

  // Process filtered account data for the table
  const filteredAccountData = useMemo(() => {
    console.log(accountWiseData);
    if (!accountWiseData?.data) return [];

    const typeData = (accountWiseData.data as Record<string, unknown>)[
      typeConfig.dataKey
    ] as Record<string, unknown>;
    if (typeData?.accounts) {
      return (typeData.accounts as unknown[]).map((account) => {
        const acc = account as Record<string, unknown>;
        return {
          id: acc.account_code as string,
          account_name: acc.account_name as string,
          account_code: acc.account as string,
          FY24_budget: acc.FY24_budget as number,
          FY25_budget: acc.FY25_budget as number,
          approved_total: acc.approved_total as number,
        };
      });
    }
    return [];
  }, [accountWiseData, typeConfig]);

  // Account columns for the table
  const accountColumns: TableColumn[] = [
    {
      id: "account_code",
      header: t("home.accountCode"),
      accessor: "account_code",
      sortable: true,
    },
    {
      id: "account_name",
      header: t("home.accountName"),
      accessor: "account_name",
      sortable: true,
    },

    {
      id: "FY24_budget",
      header: t("home.fy24Budget"),
      accessor: "FY24_budget",
      sortable: true,
    },
    {
      id: "FY25_budget",
      header: "FY25 Budget",
      accessor: "FY25_budget",
      sortable: true,
    },

    {
      id: "approved_total",
      header: t("home.approvedTotal"),
      accessor: "approved_total",
      sortable: true,
      render: (v: unknown) => (
        <span
          className={(v as number) >= 0 ? "text-green-600" : "text-red-600"}
        >
          {(v as number)?.toLocaleString()}
        </span>
      ),
    },
  ];

  const isLoading = accountWiseLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between",
          // isRTL && "flex-row-reverse"
        )}
      >
        <div className={cn("flex flex-col gap-2", isRTL && "items-end")}>
          <div
            className={cn(
              "flex items-center gap-4",
              // isRTL && "flex-row-reverse"
            )}
          >
            <button
              onClick={() => navigate("/app")}
              className={cn(
                "flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors",
                // isRTL && "flex-row-reverse"
              )}
            >
              <ArrowLeft className={cn("h-5 w-5",)} />
              {t("dashboardDetails.backToDashboard")}
            </button>
            <h1
              className={cn(
                "text-2xl font-bold text-gray-900",
                isRTL ? "text-right" : "text-left"
              )}
            >
              {typeConfig.title} {t("dashboardDetails.details")}
            </h1>
          </div>
        </div>
      </div>

      {/* Year Filter */}
      {/* <div className="flex gap-4 items-center">
        <div>
          <select
            className="rounded-xl border border-[#F6F6F6] bg-[#F6F6F6] px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div> */}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
        {/* Breakdown of Budget Chart */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
          <div
            className={cn(
              "flex items-center justify-between mb-4",
              // isRTL && "flex-row-reverse"
            )}
          >
            <div className="font-semibold text-gray-900">
              {typeConfig.title} {t("dashboardDetails.budgetBreakdown")}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="h-[280px] w-full ms-auto">
              {isLoading ? (
                <ChartLoadingSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountSummaryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={100}
                      outerRadius={115}
                    >
                      {accountSummaryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>

                    <RTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0];
                        return (
                          <div className="rounded-lg bg-black text-white px-3 py-2 text-sm shadow">
                            <div className="font-medium">{p.name}</div>
                            <div>
                              {((p.value as number) / 1_000_000).toFixed(0)}M
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      content={(props: unknown) => {
                        const payload = ((props as Record<string, unknown>)
                          ?.payload ?? []) as Array<unknown>;
                        if (!payload.length) return null;

                        return (
                          <div className="mt-6 flex items-center justify-center gap-8 sm:gap-12">
                            {payload.map((item, index) => {
                              const itemData = item as Record<string, unknown>;
                              const label = String(
                                itemData?.value ?? ""
                              ).replace("_", " ");
                              return (
                                <div
                                  key={`${itemData?.dataKey ?? "k"}-${index}`}
                                  className="inline-flex items-center gap-3"
                                >
                                  <span
                                    className="inline-block h-4 w-4 rounded-[6px] ring-1 ring-white shadow"
                                    style={{
                                      backgroundColor:
                                        itemData?.color as string,
                                    }}
                                    aria-hidden
                                  />
                                  <span className="text-[#0B2440] text-sm font-semibold">
                                    {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account-wise breakdown table */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div
          className={cn(
            "mb-4 font-semibold text-gray-900",
            isRTL ? "text-right" : "text-left"
          )}
        >
          {typeConfig.title} {t("dashboardDetails.accountWiseBreakdown")}
        </div>
        {isLoading ? (
          <div
            className={cn(
              "flex justify-center items-center h-32",
              isRTL && "flex-row-reverse"
            )}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>
              {t("dashboardDetails.loadingAccountWiseData")}
            </span>
          </div>
        ) : (
          <SharedTable2
            columns={accountColumns}
            data={filteredAccountData as TableRow[]}
            showPagination={true}
            itemsPerPage={10}
            currentPage={1}
            maxHeight="600px"
          />
        )}
      </div>
    </div>
  );
}
