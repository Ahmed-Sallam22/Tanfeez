// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip as RTooltip,
//   Legend,
//   BarChart,
//   CartesianGrid,
//   XAxis,
//   YAxis,
//   Bar,
// } from "recharts";
// import {
//   useGetAccountWiseDashboardQuery,
//   useGetDashboardDataQuery,
//   useGetEntitiesMappingQuery,
//   useGetProjectWiseDashboardQuery,
// } from "@/api/dashboard.api";
// import {
//   SharedTable,
//   type TableColumn,
//   type TableRow as SharedTableRow,
// } from "@/shared/SharedTable";
// import { SharedTable2 } from "@/shared/SharedTable 2";

// import {
//   useGetActiveProjectsWithEnvelopeQuery,
//   useGetProjectsQuery,
//   type EnvelopeProject,
// } from "@/api/envelope.api";
// import SharedSelect from "@/shared/SharedSelect";
// import ModeSelect from "@/components/ui/ModeSelect";
// import { useUserLevel } from "@/features/auth/hooks";
// import { cn } from "@/utils/cn";
// interface EnvelopeTableRow {
//   id: string;
//   project_code: string;
//   submitted_total: number;
//   approved_total: number;
// }

// // ===== Reusable Pieces =====
// function LoadingSkeleton({ className = "" }: { className?: string }) {
//   return (
//     <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
//   );
// }
// function formatPctFromFraction(p: number) {
//   return `${(p * 1000000).toFixed(2)}%`;
// }
// function ChartLoadingSkeleton({ t }: { t: (key: string) => string }) {
//   return (
//     <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
//       <LoadingSkeleton className="h-6 w-32 mb-4" />
//       <div className="h-[280px] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//           <span className="text-gray-500 text-sm">
//             {t("home.loadingChart")}
//           </span>
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatCardSkeleton() {
//   return (
//     <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
//       <div className="flex justify-between items-center">
//         <LoadingSkeleton className="h-4 w-24" />
//         <LoadingSkeleton className="h-3 w-6" />
//       </div>
//       <LoadingSkeleton className="h-8 w-20 mt-2" />
//       <div className="flex justify-between items-center mt-2">
//         <LoadingSkeleton className="h-3 w-20" />
//         <LoadingSkeleton className="h-3 w-8" />
//       </div>
//     </div>
//   );
// }

// function ErrorState({
//   message = "Failed to load data",
//   t,
// }: {
//   message?: string;
//   t: (key: string) => string;
// }) {
//   return (
//     <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
//       <div className="flex flex-col items-center justify-center text-center">
//         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
//           <svg
//             className="w-8 h-8 text-red-600"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//             />
//           </svg>
//         </div>
//         <h3 className="text-lg font-medium text-gray-900 mb-2">
//           {t("home.errorLoadingDashboard")}
//         </h3>
//         <p className="text-gray-500 mb-4">{message}</p>
//         <button
//           onClick={() => window.location.reload()}
//           className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-blue-700 transition-colors"
//         >
//           {t("common.retry")}
//         </button>
//       </div>
//     </div>
//   );
// }

// function StatCard({
//   title,
//   value,
//   subtitle,
//   deltaPct, // <- pass a number like 0.0123 for +1.23%. Omit/undefined to hide.
// }: {
//   title: string;
//   value: string | number;
//   subtitle?: string;
//   deltaPct?: number; // percent in decimal form (e.g. 0.0123)
// }) {
//   const hasDelta = typeof deltaPct === "number" && !Number.isNaN(deltaPct);
//   const isUp = hasDelta && deltaPct > 0;
//   const isDown = hasDelta && deltaPct < 0;

//   const arrow = hasDelta ? (isUp ? "↗" : isDown ? "↘" : "→") : null;
//   const deltaColor = isUp
//     ? "text-green-600"
//     : isDown
//     ? "text-red-600"
//     : "text-gray-500";

//   const formattedValue =
//     typeof value === "number" ? value.toLocaleString() : value;

//   return (
//     <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
//       <div className="flex justify-between items-center">
//         <div className="text-sm text-gray-500">{title}</div>
//         {arrow && (
//           <div className={`text-xs font-medium ${deltaColor}`}>{arrow}</div>
//         )}
//       </div>

//       <div className="mt-2 text-2xl font-meduim text-gray-900">
//         {formattedValue}
//       </div>

//       <div className="flex justify-between items-center">
//         {subtitle ? (
//           <div className="mt-1 text-xs text-[#282828]">{subtitle}</div>
//         ) : (
//           <span />
//         )}
//         {hasDelta ? (
//           <span className={`text-xs font-medium ${deltaColor}`}>
//             {formatPctFromFraction(deltaPct)}
//           </span>
//         ) : null}
//       </div>
//     </div>
//   );
// }

// // Move this outside the component to avoid re-creation on every render
// const LABEL_TO_GROUP: Record<string, "MenPower" | "NonMenPower" | "Copex"> = {
//   Manpower: "MenPower",
//   "Non-Manpower": "NonMenPower",
//   Capex: "Copex",
//   // tolerate raw keys too (in case you call setFilter with them)
//   MenPower: "MenPower",
//   NonMenPower: "NonMenPower",
//   Copex: "Copex",
// };

// // ===== Page =====
// export default function Home() {
//   const { t, i18n } = useTranslation();
//   const isRTL = i18n.language === "ar";
//   const navigate = useNavigate();
//   // Mode & Date Range
//   const [mode, setMode] = useState<"all" | "Envelope" | "Budget">("all");
//   // const [from, setFrom] = useState<string>(format(subDays(new Date(), 7), "yyyy-MM-dd"));

//   // API call
//   const {
//     data: dashboardData,
//     isLoading,
//     error,
//     refetch: refetchDashboard,
//   } = useGetDashboardDataQuery({ type: "all" });
//   const [selectedProject, setSelectedProject] = useState<string | number>(
//     "843"
//   );

//   const [year, setYear] = useState<string>("2025");
//   const [filter, setFilter] = useState<string | null>(null); // e.g. "MenPower"

//   const {
//     data: accountWiseData,
//     isLoading: isLoadingAccountWise,
//     error: accountWiseError,
//     refetch: refetchAccountWise,
//   } = useGetAccountWiseDashboardQuery(
//     { project_code: String(selectedProject) },
//     { skip: !selectedProject }
//   );

//   const accountSummaryData = useMemo(() => {
//     if (!accountWiseData?.data) return [];

//     return [
//       {
//         name: t("home.manpower"),
//         value:
//           year === "2025"
//             ? accountWiseData.data.MenPower.summary.total_fy25_budget
//             : accountWiseData.data.MenPower.summary.total_fy24_budget,
//         color: "#007E77",
//       },
//       {
//         name: t("home.nonManpower"),
//         value:
//           year === "2025"
//             ? accountWiseData.data.NonMenPower.summary.total_fy25_budget
//             : accountWiseData.data.NonMenPower.summary.total_fy24_budget,
//         color: "#6BE6E4",
//       },
//       {
//         name: t("home.capex"),
//         value:
//           year === "2025"
//             ? accountWiseData.data.Copex.summary.total_fy25_budget
//             : accountWiseData.data.Copex.summary.total_fy24_budget,
//         color: "var(--color-primary)",
//       },
//     ];
//   }, [accountWiseData, year, t]);
//   const [selectedEntity, setSelectedEntity] = useState<string>("10001"); // default
//   const { data: entitiesData } = useGetEntitiesMappingQuery();
//   // Process request dates for timeline table (only for normal data)
//   const {
//     data: projectWiseData,
//     isLoading: isLoadingProjectWise,
//     error: projectWiseError,
//     refetch: refetchProjectWise,
//   } = useGetProjectWiseDashboardQuery({ entity_code: selectedEntity });
//   // Table columns for request timeline
//   const timelineColumns: TableColumn[] = [
//     {
//       id: "project_code",
//       header: t("home.projectCode"),
//       accessor: "project_code",
//       render: (value) => (
//         <span className="text-sm text-gray-900">{String(value)}</span>
//       ),
//     },
//     {
//       id: "project_name",
//       header: t("home.projectName"),
//       accessor: "project_name",
//       render: (value) => (
//         <span className="text-sm font-medium">{String(value)}</span>
//       ),
//     },
//     {
//       id: "FY24_budget",
//       header: t("home.fy24Budget"),
//       accessor: "FY24_budget",
//       render: (value) => (
//         <span className="text-sm font-medium">{String(value)}</span>
//       ),
//     },
//     {
//       id: "FY25_budget_current",
//       header: t("home.fy25BudgetCurrent"),
//       accessor: "FY25_budget_current",
//       render: (value) => (
//         <span className="text-sm font-medium">{String(value)}</span>
//       ),
//     },
//     {
//       id: "variances",
//       header: t("home.variances"),
//       accessor: "variances",
//       render: (value) => (
//         <span className="text-sm font-medium">{String(value)}</span>
//       ),
//     },
//   ];

//   // ===== Mock Data =====

//   const statusData = useMemo(() => {
//     const normalData = dashboardData?.normal;
//     if (!normalData) {
//       return [
//         { name: t("home.approved"), value: 0, color: "#007E77" },
//         { name: t("home.pending"), value: 0, color: "#6BE6E4" },
//         { name: t("home.rejected"), value: 0, color: "var(--color-primary)" },
//       ];
//     }

//     return [
//       {
//         name: t("home.approved"),
//         value: normalData.approved_transfers,
//         color: "#007E77",
//       },
//       {
//         name: t("home.pending"),
//         value: normalData.pending_transfers,
//         color: "#6BE6E4",
//       },
//       {
//         name: t("home.rejected"),
//         value: normalData.rejected_transfers,
//         color: "var(--color-primary)",
//       },
//     ];
//   }, [dashboardData?.normal, t]);

//   // Fetch projects list
//   const { data: projectsData } = useGetProjectsQuery();

//   const {
//     data: envelopeData,
//     isLoading: isLoadingEnvelope,
//     error: envelopeError,
//   } = useGetActiveProjectsWithEnvelopeQuery();
//   const userLevel = useUserLevel(); // number (e.g., 4)

//   const stats = useMemo(() => {
//     const base: Array<{
//       title: string;
//       value: number | string;
//       subtitle?: string;
//       deltaPct?: number; // decimal (e.g., 0.0123)
//     }> = envelopeData
//       ? [
//           {
//             title: t("home.initialEnvelope"),
//             value: envelopeData.initial_envelope,
//             subtitle: t("home.yearStartEnvelope"),
//             // no deltaPct for initial -> hidden automatically
//           },
//           {
//             title: t("home.projectedEnvelope"),
//             value: envelopeData.estimated_envelope ?? "-",
//             subtitle: t("home.afterApprovalPending"),
//             deltaPct: envelopeData.estimated_envelope_change_percentage, // may be +/-
//           },
//           {
//             title: t("home.final"),
//             value: envelopeData.current_envelope,
//             subtitle: t("home.approvedTransactions"),
//             deltaPct: envelopeData.current_envelope_change_percentage, // may be +/-
//           },
//         ]
//       : [
//           {
//             title: t("home.initialEnvelope"),
//             value: "-",
//             subtitle: t("home.yearStartEnvelope"),
//           },
//           {
//             title: t("home.projectedEnvelope"),
//             value: "-",
//             subtitle: t("home.afterApprovalPending"),
//           },
//           {
//             title: t("home.final"),
//             value: "-",
//             subtitle: t("home.approvedTransactions"),
//           },
//         ];

//     if (userLevel === 4) {
//       base.push({
//         title: t("home.contingency"),
//         value: 564_318_837,
//         subtitle: t("home.contingency"),
//         // no deltaPct -> hidden
//       });
//     }

//     return base;
//   }, [envelopeData, userLevel, t]);

//   const accountColumns: TableColumn[] = [
//     { id: "account", header: t("home.accountCode"), accessor: "account" },
//     {
//       id: "account_name",
//       header: t("home.accountName"),
//       accessor: "account_name",
//     },
//     {
//       id: "approved_total",
//       header: t("home.approvedTotal"),
//       accessor: "approved_total",
//       render: (v: any) => (
//         <span
//           className={(v as number) >= 0 ? "text-green-600" : "text-red-600"}
//         >
//           {(v as number)?.toLocaleString()}
//         </span>
//       ),
//     },
//     {
//       id: "FY24_budget",
//       header: t("home.fy24Budget"),
//       accessor: "FY24_budget",
//     },
//     { id: "FY25_budget", header: "FY25 Budget", accessor: "FY25_budget" },
//   ];
//   const accountGroupedData = useMemo(() => {
//     if (!accountWiseData?.data) return [];

//     const sections = [
//       { key: "MenPower", title: t("home.manpower") },
//       { key: "NonMenPower", title: t("home.nonManpower") },
//       { key: "Copex", title: t("home.capex") },
//     ] as const;

//     return sections.map(({ key, title }) => {
//       const section = (accountWiseData.data as any)[key] ?? {};
//       const summary = section.summary ?? {};
//       const rows = section.accounts ?? [];

//       return {
//         __type: "group",
//         id: key, // unique id for toggling
//         title, // group title
//         totals: {
//           // map to your column ids so they land in the right cells
//           approved_total: Number(summary.total_approved_transfers || 0),
//           FY24_budget: Number(summary.total_fy24_budget || 0),
//           FY25_budget: Number(summary.total_fy25_budget || 0),
//         },
//         rows, // the original accounts array
//       };
//     });
//   }, [accountWiseData, t]);

//   useEffect(() => {
//     // when project changes: clear account filter & refetch project-related endpoints
//     setFilter(null);
//     refetchAccountWise();
//   }, [selectedProject, refetchAccountWise]);

//   useEffect(() => {
//     // when entity changes: refetch the project-wise table
//     refetchProjectWise();
//   }, [selectedEntity, refetchProjectWise]);

//   useEffect(() => {
//     // if mode or year changes and you want to force a fresh pull
//     refetchDashboard();
//     // year affects only derived memos in your code; if your APIs support year, add it to args and refetch here too.
//   }, [mode, year, refetchDashboard]);
//   const filteredAccountGroupedData = useMemo(() => {
//     if (!accountGroupedData?.length || !filter) return accountGroupedData;
//     const key = LABEL_TO_GROUP[filter];
//     return key
//       ? accountGroupedData.filter((g: any) => g.id === key)
//       : accountGroupedData;
//   }, [accountGroupedData, filter]);

//   const tableRows: EnvelopeTableRow[] =
//     envelopeData?.data?.map((project: EnvelopeProject, index: number) => ({
//       id: `${project.project_code}-${index}`,
//       project_code: project.project_code,
//       submitted_total: project.submitted_total,
//       approved_total: project.approved_total,
//     })) || [];

//   const columns: TableColumn[] = [
//     {
//       id: "project_code",
//       header: t("home.projectCode"),
//       render: (_, row) => {
//         const envelopeRow = row as unknown as EnvelopeTableRow;
//         return (
//           <span className="text-sm font-medium text-gray-900">
//             {envelopeRow.project_code}
//           </span>
//         );
//       },
//     },
//     {
//       id: "submitted_total",
//       header: t("home.submittedTotal"),
//       showSum: true,
//       render: (_, row) => {
//         const envelopeRow = row as unknown as EnvelopeTableRow;
//         const value = envelopeRow.submitted_total;
//         const isPositive = value >= 0;
//         const arrow = isPositive ? (
//           <svg
//             width="11"
//             height="11"
//             viewBox="0 0 11 11"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M4 0.34375V1.65625H8.40625L0.65625 9.40625L1.59375 10.3438L9.34375 2.59375V7H10.6562V0.34375H4Z"
//               fill="#00A350"
//             />
//           </svg>
//         ) : (
//           <svg
//             width="11"
//             height="11"
//             viewBox="0 0 11 11"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M10.3438 1.59375L9.40625 0.65625L1.65625 8.40625V4H0.34375V10.6562H7V9.34375H2.59375L10.3438 1.59375Z"
//               fill="#D44333"
//             />
//           </svg>
//         );
//         return (
//           <span
//             className={`flex items-center gap-1 text-sm font-medium ${
//               isPositive ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {value.toLocaleString()}
//             {isPositive ? arrow : arrow}
//           </span>
//         );
//       },
//     },
//     {
//       id: "approved_total",
//       header: t("home.approvedTotal"),
//       showSum: true,
//       render: (_, row) => {
//         const envelopeRow = row as unknown as EnvelopeTableRow;
//         const value = envelopeRow.approved_total;
//         const isPositive = value >= 0;
//         const arrow = isPositive ? (
//           <svg
//             width="11"
//             height="11"
//             viewBox="0 0 11 11"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M4 0.34375V1.65625H8.40625L0.65625 9.40625L1.59375 10.3438L9.34375 2.59375V7H10.6562V0.34375H4Z"
//               fill="#00A350"
//             />
//           </svg>
//         ) : (
//           <svg
//             width="11"
//             height="11"
//             viewBox="0 0 11 11"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M10.3438 1.59375L9.40625 0.65625L1.65625 8.40625V4H0.34375V10.6562H7V9.34375H2.59375L10.3438 1.59375Z"
//               fill="#D44333"
//             />
//           </svg>
//         );
//         return (
//           <span
//             className={`flex items-center gap-1 text-sm font-medium ${
//               isPositive ? "text-green-600" : "text-red-600"
//             }`}
//           >
//             {value.toLocaleString()}
//             {isPositive ? arrow : arrow}
//           </span>
//         );
//       },
//     },
//   ];
//   const isLevel4 = userLevel === 4;

//   // formatter used by both label and tooltip
//   const fmtAmount = (n: number) => {
//     const v = Number(n);
//     if (!Number.isFinite(v)) return "";
//     if (Math.abs(v) >= 1_000_000_000)
//       return (v / 1_000_000_000).toFixed(1) + "B";
//     if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
//     if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(1) + "K";
//     return v.toLocaleString();
//   };

//   const renderCustomizedLabel = ({
//     cx,
//     cy,
//     midAngle,
//     innerRadius,
//     outerRadius,
//     value,
//   }: any) => {
//     const v = Number(value);
//     if (!Number.isFinite(v) || v === 0) return null; // 🔒 hide for 0

//     const RADIAN = Math.PI / 180;
//     const r = innerRadius + (outerRadius - innerRadius) * 0.5;
//     const x = cx + r * Math.cos(-(midAngle ?? 0) * RADIAN);
//     const y = cy + r * Math.sin(-(midAngle ?? 0) * RADIAN);

//     return (
//       <text
//         x={x}
//         y={y}
//         fill="#fff"
//         fontSize={14}
//         fontWeight={600}
//         textAnchor={x > cx ? "start" : "end"}
//         dominantBaseline="central"
//       >
//         {fmtAmount(v)}
//       </text>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {/* Error State */}
//       {error && (
//         <ErrorState message={t("home.failedToLoadDashboardData")} t={t} />
//       )}

//       {/* Header */}
//       {/* Header */}
//       <div className={cn("flex items-center justify-between gap-4")}>
//         {/* Left side */}
//         <h1
//           className={cn(
//             "text-2xl font-bold text-gray-900",
//             isRTL ? "text-right" : "text-left"
//           )}
//         >
//           {t("dashboard") || "Dashboard"}
//         </h1>

//         {/* Right side */}
//         <div
//           className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}
//         >
//           {/* Project Selection */}

//           <ModeSelect
//             value={mode} // "all" | "Envelope" | "Budget"
//             onChange={(v) => setMode(v)}
//           />
//         </div>
//       </div>
//       {(mode === "Budget" || mode === "all") && (
//         <div className={cn("flex items-center gap-4 mb-4")}>
//           <SharedSelect
//             className="w-full"
//             required={false}
//             value={selectedProject}
//             onChange={(option) => setSelectedProject(option)}
//             placeholder={t("home.selectProject")}
//             options={[
//               ...(projectsData?.data?.map((project) => ({
//                 value: project.id.toString(),
//                 label: project.alias_default || project.project || project.id,
//               })) || []),
//             ]}
//           />
//           <SharedSelect
//             className="w-full"
//             required={false}
//             value={selectedEntity}
//             onChange={(value) => setSelectedEntity(String(value))}
//             placeholder={t("home.selectEntity")}
//             options={[
//               ...(entitiesData?.data?.data?.map((entity: any) => ({
//                 value: entity.entity_code,
//                 label: entity.entity_name,
//               })) || []),
//             ]}
//           />
//         </div>
//       )}
//       {/* Stats */}
//       {(mode === "Envelope" || mode === "all") && (
//         <div
//           className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${
//             isLevel4 ? "xl:grid-cols-4" : "xl:grid-cols-3"
//           }`}
//         >
//           {isLoading
//             ? Array.from({ length: 4 }).map((_, i) => (
//                 <StatCardSkeleton key={i} />
//               ))
//             : stats.map((s, index) => (
//                 <div
//                   key={s.title}
//                   className="animate-fadeIn"
//                   style={{
//                     animationDelay: `${index * 0.1}s`,
//                     opacity: 0,
//                     animation: `fadeIn 0.6s ease-out ${index * 0.1}s forwards`,
//                   }}
//                 >
//                   <StatCard
//                     title={s.title}
//                     value={
//                       typeof s.value === "number"
//                         ? s.value.toLocaleString()
//                         : s.value
//                     }
//                     subtitle={s.subtitle}
//                     deltaPct={s.deltaPct}
//                   />
//                 </div>
//               ))}
//         </div>
//       )}
//       {mode === "Envelope" && (
//         <div className="bg-white rounded-2xl shadow-sm">
//           {isLoadingEnvelope ? (
//             <div
//               className={cn(
//                 "flex justify-center items-center h-64"
//                 // isRTL && "flex-row-reverse"
//               )}
//             >
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>
//                 {t("home.loadingEnvelopeData")}
//               </span>
//             </div>
//           ) : envelopeError ? (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="text-red-600 text-lg font-medium">
//                   {t("home.errorLoadingData")}
//                 </div>
//                 <div className="text-gray-500 text-sm mt-1">
//                   {t("home.checkConnection")}
//                 </div>
//               </div>
//             </div>
//           ) : tableRows.length > 0 ? (
//             <SharedTable
//               title={t("home.activeProjectsWithEnvelope")}
//               columns={columns}
//               data={tableRows as unknown as SharedTableRow[]}
//               showFooter={true}
//               showPagination={false}
//               maxHeight="600px"
//               showColumnSelector={true}
//             />
//           ) : (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="text-gray-500 text-lg">
//                   {t("home.noDataAvailable")}
//                 </div>
//                 <div className="text-gray-400 text-sm mt-1">
//                   {t("home.tryAdjustingFilters")}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//       {/* Charts Row 1 */}
//       {(mode === "Budget" || mode === "all") && (
//         <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
//           {isLoading ? (
//             <>
//               <ChartLoadingSkeleton t={t} />
//               <ChartLoadingSkeleton t={t} />
//             </>
//           ) : (
//             <>
//               {/* Breakdown of Budget (Donut) */}
//               <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//                 <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
//                   <div
//                     className={cn(
//                       "flex items-center justify-between mb-4"
//                       // isRTL && "flex-row-reverse"
//                     )}
//                   >
//                     <div className="font-semibold text-gray-900">
//                       {t("home.breakdownOfBudget")}
//                     </div>
//                     <div>
//                       <select
//                         className="rounded-xl border border-[#F6F6F6] bg-[#F6F6F6] px-3 py-1.5 text-sm  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                         defaultValue="2025"
//                         onChange={(e) => setYear(e.target.value)}
//                       >
//                         <option value="2025">2025</option>
//                         <option value="2024">2024</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-center">
//                     {/* Chart */}

//                     <div className="h-[280px] w-full   ms-auto">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <PieChart>
//                           <Pie
//                             data={accountSummaryData}
//                             dataKey="value"
//                             nameKey="name"
//                             paddingAngle={1}
//                             cx="50%"
//                             cy="50%"
//                             labelLine={false}
//                             label={renderCustomizedLabel}
//                             outerRadius={100}
//                             onClick={(data) => {
//                               // Navigate to dashboard details page for the selected type
//                               const typeMap: Record<string, string> = {
//                                 Manpower: "manpower",
//                                 "Non-Manpower": "non-manpower",
//                                 Capex: "capex",
//                               };
//                               const type = typeMap[data.name] || "manpower";
//                               navigate(
//                                 `/app/dashboard-details/${type}?project=${selectedProject}`
//                               );
//                             }}
//                           >
//                             {accountSummaryData.map((entry, i) => (
//                               <Cell
//                                 key={i}
//                                 fill={entry.color}
//                                 cursor="pointer"
//                                 stroke="#ffffff"
//                                 strokeWidth={2}
//                               />
//                             ))}
//                           </Pie>

//                           <RTooltip
//                             content={({ active, payload }) => {
//                               if (!active || !payload?.length) return null;
//                               const p = payload[0];
//                               return (
//                                 <div className="rounded-lg bg-black text-white px-3 py-2 text-sm shadow">
//                                   <div className="font-medium">{p.name}</div>
//                                   <div>{(p.value / 1_000_000).toFixed(1)}M</div>
//                                 </div>
//                               );
//                             }}
//                           />
//                           <Legend
//                             verticalAlign="bottom"
//                             align="center"
//                             iconType="circle"
//                             content={(props: any) => {
//                               const payload = (props?.payload ??
//                                 []) as Array<any>;
//                               if (!payload.length) return null;

//                               return (
//                                 <div className="mt-6 flex items-center justify-center gap-8 sm:gap-12">
//                                   {payload.map((item) => {
//                                     const label = String(
//                                       item?.value ?? ""
//                                     ).replace("_", " ");
//                                     const isActive =
//                                       filter === label ||
//                                       filter === LABEL_TO_GROUP[label];
//                                     return (
//                                       <button
//                                         key={`${item?.dataKey ?? "k"}-${
//                                           item?.value ?? "v"
//                                         }`}
//                                         type="button"
//                                         onClick={() =>
//                                           setFilter((prev) =>
//                                             prev === label ||
//                                             prev === LABEL_TO_GROUP[label]
//                                               ? null
//                                               : label
//                                           )
//                                         }
//                                         className={`inline-flex items-center gap-3 ${
//                                           isActive ? "opacity-100" : ""
//                                         }`}
//                                       >
//                                         <span
//                                           className="inline-block h-4 w-4 rounded-[6px] ring-1 ring-white shadow"
//                                           style={{
//                                             backgroundColor: item?.color,
//                                           }}
//                                           aria-hidden
//                                         />
//                                         <span className="text-[#0B2440] text-sm font-semibold">
//                                           {label}
//                                         </span>
//                                       </button>
//                                     );
//                                   })}
//                                 </div>
//                               );
//                             }}
//                           />
//                         </PieChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Transfer Status Chart */}
//                 <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 animate-fadeIn">
//                   <div
//                     className={cn(
//                       "flex items-center justify-between mb-4"
//                       // isRTL && "flex-row-reverse"
//                     )}
//                   >
//                     <div className="font-semibold text-gray-900">
//                       {t("home.transferStatus")}
//                     </div>
//                     <div>
//                       <select
//                         className="rounded-xl border border-[#F6F6F6] bg-[#F6F6F6] px-3 py-1.5 text-sm  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
//                         defaultValue="2025"
//                         onChange={(e) => setYear(e.target.value)}
//                       >
//                         <option value="2025">2025</option>
//                         <option value="2024">2024</option>
//                       </select>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-center">
//                     {/* Chart */}
//                     <div className="h-[280px] w-full">
//                       <ResponsiveContainer width="100%" height="100%">
//                         <BarChart data={statusData} barSize={40}>
//                           <CartesianGrid vertical={false} stroke={"#E5E7EB"} />{" "}
//                           <XAxis
//                             dataKey="name"
//                             tickFormatter={(v) => String(v).replace("_", " ")}
//                             axisLine={false}
//                             tickLine={false}
//                           />
//                           <YAxis
//                             axisLine={false}
//                             tickLine={false}
//                             // tick={false} // uncomment to hide labels
//                           />
//                           <RTooltip
//                             wrapperStyle={{
//                               background: "transparent",
//                               border: "none",
//                               boxShadow: "none",
//                             }}
//                             contentStyle={{
//                               background: "#E5E7EB",
//                               color: "#fff",
//                               border: "none",
//                             }} // keep tooltip pill
//                             formatter={(value: number, name: string) => [
//                               Number(value).toLocaleString(),
//                               String(name).replace("_", " "),
//                             ]}
//                             labelFormatter={() => ""}
//                           />
//                           <Bar
//                             dataKey="value"
//                             name="Transfers"
//                             radius={[8, 8, 0, 0]}
//                           >
//                             {statusData.map((entry, i) => (
//                               <Cell key={i} fill={entry.color} />
//                             ))}
//                           </Bar>
//                         </BarChart>
//                       </ResponsiveContainer>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {/* Request Timeline Pipeline Table - Only for Normal mode */}
//       {(mode === "Budget" || mode === "all") && (
//         <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
//           <div
//             className={cn(
//               "mb-4 font-semibold text-gray-900",
//               isRTL ? "text-right" : "text-left"
//             )}
//           >
//             {t("home.projectWiseBreakdown")}
//           </div>

//           {isLoadingProjectWise ? (
//             <div
//               className={cn(
//                 "flex justify-center items-center h-32"
//                 // isRTL && "flex-row-reverse"
//               )}
//             >
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>
//                 {t("home.loadingProjectWiseData")}
//               </span>
//             </div>
//           ) : projectWiseError ? (
//             <div className="flex justify-center items-center h-32 text-red-600">
//               {t("home.failedToLoadProjectWiseData")}
//             </div>
//           ) : (
//             <SharedTable
//               columns={timelineColumns}
//               data={projectWiseData?.data || []}
//               showPagination={false}
//               itemsPerPage={10}
//               currentPage={1}
//               maxHeight="800px"
//               className="mt-4"
//             />
//           )}
//         </div>
//       )}
//       {/* Request Timeline Pipeline Table - Only for Normal mode */}
//       {(mode === "Budget" || mode === "all") && (
//         <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
//           <div
//             className={cn(
//               "mb-4 font-semibold text-gray-900",
//               isRTL ? "text-right" : "text-left"
//             )}
//           >
//             {t("home.accountWiseBreakdown")}
//           </div>
//           {isLoadingAccountWise ? (
//             <div
//               className={cn(
//                 "flex justify-center items-center h-32",
//                 isRTL && "flex-row-reverse"
//               )}
//             >
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className={cn("text-gray-600", isRTL ? "mr-2" : "ml-2")}>
//                 {t("home.loadingAccountWiseData")}
//               </span>
//             </div>
//           ) : accountWiseError ? (
//             <ErrorState message={t("home.failedToLoadAccountWiseData")} t={t} />
//           ) : (
//             <SharedTable2
//               columns={accountColumns}
//               data={filteredAccountGroupedData as any}
//               showPagination={false}
//               groupable={true}
//               itemsPerPage={10}
//               currentPage={1}
//               maxHeight="600px"
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
