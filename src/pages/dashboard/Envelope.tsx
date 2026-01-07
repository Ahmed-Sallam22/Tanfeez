// import { useState } from "react";
// import {
//   SharedTable,
//   type TableColumn,
//   type TableRow as SharedTableRow,
// } from "@/shared/SharedTable";
// import {
//   useGetActiveProjectsWithEnvelopeQuery,
//   type EnvelopeProject,
//   useGetProjectsEnvelopeQuery,
// } from "@/api/envelope.api";
// import SharedSelect from "@/shared/SharedSelect";

// interface EnvelopeTableRow {
//   id: string;
//   project_code: string;
//   submitted_total: number;
//   approved_total: number;
// }

// export default function Envelope() {
//   const [selectedProject, setSelectedProject] = useState<string|number>("");
//   // const [year, setYear] = useState<string>("");
//   // const [month, setMonth] = useState<string>("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   // Fetch projects list
//   const { data: projectsData, isLoading: isLoadingProjects } =
//     useGetProjectsEnvelopeQuery();

//   // Fetch envelope data when project is selected
//   const {
//     data: envelopeData,
//     isLoading: isLoadingEnvelope,
//     error: envelopeError,
//   } = useGetActiveProjectsWithEnvelopeQuery(
//     {
//       project_code: String(selectedProject),
//       // year: year || undefined,
//       // month: month || undefined,
//     },
//     { skip: !selectedProject }
//   );

//   // Transform envelope data for table
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
//       header: "Project Code",
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
//       header: "Submitted Total",
//       showSum: true,
//       render: (_, row) => {
//         const envelopeRow = row as unknown as EnvelopeTableRow;
//         const value = envelopeRow.submitted_total;
//         const isPositive = value >= 0;
//         const arrow = isPositive ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M4 0.34375V1.65625H8.40625L0.65625 9.40625L1.59375 10.3438L9.34375 2.59375V7H10.6562V0.34375H4Z" fill="#00A350"/>
// </svg>
//  : <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M10.3438 1.59375L9.40625 0.65625L1.65625 8.40625V4H0.34375V10.6562H7V9.34375H2.59375L10.3438 1.59375Z" fill="#D44333"/>
// </svg>
// ;

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
//       header: "Approved Total",
//       showSum: true,
//       render: (_, row) => {
//         const envelopeRow = row as unknown as EnvelopeTableRow;
//         const value = envelopeRow.approved_total;
//         const isPositive = value >= 0;
//        const arrow = isPositive ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M4 0.34375V1.65625H8.40625L0.65625 9.40625L1.59375 10.3438L9.34375 2.59375V7H10.6562V0.34375H4Z" fill="#00A350"/>
// </svg>
//  : <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
// <path d="M10.3438 1.59375L9.40625 0.65625L1.65625 8.40625V4H0.34375V10.6562H7V9.34375H2.59375L10.3438 1.59375Z" fill="#D44333"/>
// </svg>
// ;
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

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//   };

//   // const months = [
//   //   "Jan",
//   //   "Feb",
//   //   "Mar",
//   //   "Apr",
//   //   "May",
//   //   "Jun",
//   //   "Jul",
//   //   "Aug",
//   //   "Sep",
//   //   "Oct",
//   //   "Nov",
//   //   "Dec",
//   // ];

//   // const currentYear = new Date().getFullYear();
//   // const years = Array.from({ length: 10 }, (_, i) =>
//   //   (currentYear - 5 + i).toString().slice(-2)
//   // );

//   return (
//     <div className="space-y-6">
//       {/* Page Header */}
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900">Envelope</h1>
//         <p className="text-sm text-gray-600 mt-1">
//           View active projects with envelope information
//         </p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-2xl p-6 shadow-sm">
//         {/* <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2> */}

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Project Selection */}
//           <div>
//             <SharedSelect
//               title="Project"
//               required={true}
//               value={selectedProject}
//               onChange={(value) => setSelectedProject(value)}
//               placeholder="Select a project"
//               disabled={isLoadingProjects}
//               options={[
//                 ...(projectsData?.data?.map((project) => ({
//                   value: project.id,
//                   label: project.alias_default || project.id,
//                 })) || []),
//               ]}
//             />
//           </div>

//           {/* Year Selection (Optional) */}
//           {/* <div>
//             <SharedSelect
//               title="Year (Optional)"
//               value={year}
//               onChange={(value) => setYear(String(value))}
//               placeholder="Select year"
//               options={years.map((yr) => ({
//                 value: yr,
//                 label: `20${yr}`,
//               }))}
//               clearable={true}
//             />
//           </div> */}

//           {/* Month Selection (Optional) */}
//           {/* <div>
//             <SharedSelect
//               title="Month (Optional)"
//               value={month}
//               onChange={(value) => setMonth(String(value))}
//               placeholder="Select month"
//               options={months.map((mo) => ({
//                 value: mo,
//                 label: mo,
//               }))}
//               clearable={true}
//             />
//           </div> */}
//         </div>
//       </div>

//       {/* Envelope Summary */}
//       {envelopeData && selectedProject && (
//         <div className="bg-white rounded-2xl p-6 shadow-sm">
//           <h2 className="text-lg font-semibold text-gray-900 mb-4">
//             Envelope Summary
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="bg-blue-50 rounded-lg p-4">
//               <div className="text-sm font-medium text-blue-600">
//                 Projected Envelope
//               </div>
//               <div className="text-2xl font-bold text-blue-900 mt-1">
//                 {envelopeData.initial_envelope.toLocaleString()}
//               </div>
//             </div>
//             <div className="bg-green-50 rounded-lg p-4">
//               <div className="text-sm font-medium text-green-600">
//                 Final Envelope
//               </div>
//               <div className="text-2xl font-bold text-green-900 mt-1">
//                 {envelopeData.current_envelope.toLocaleString()}
//               </div>
//             </div>
//             <div className="bg-orange-50 rounded-lg p-4">
//               <div className="text-sm font-medium text-orange-600">
//                 Estimated Envelope
//               </div>
//               <div className="text-2xl font-bold text-green-900 mt-1">
//                 {envelopeData?.estimated_envelope?.toLocaleString()}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Results Table */}
//       {selectedProject && (
//         <div className="bg-white rounded-2xl shadow-sm">
//           {isLoadingEnvelope ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//               <span className="ml-2 text-gray-600">
//                 Loading envelope data...
//               </span>
//             </div>
//           ) : envelopeError ? (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="text-red-600 text-lg font-medium">
//                   Error loading data
//                 </div>
//                 <div className="text-gray-500 text-sm mt-1">
//                   Please try selecting a different project or check your
//                   connection.
//                 </div>
//               </div>
//             </div>
//           ) : tableRows.length > 0 ? (
//             <SharedTable
//               title="Active Projects with Envelope"
//               columns={columns}
//               data={tableRows as unknown as SharedTableRow[]}
//               showFooter={true}
//               showPagination={tableRows.length > itemsPerPage}
//               currentPage={currentPage}
//               onPageChange={handlePageChange}
//               itemsPerPage={itemsPerPage}
//               maxHeight="600px"
//               showColumnSelector={true}
//             />
//           ) : (
//             <div className="flex items-center justify-center h-64">
//               <div className="text-center">
//                 <div className="text-gray-500 text-lg">No data available</div>
//                 <div className="text-gray-400 text-sm mt-1">
//                   Try adjusting your filters or select a different project.
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* No Project Selected State */}
//       {!selectedProject && (
//         <div className="bg-white rounded-2xl p-12 shadow-sm">
//           <div className="text-center">
//             <div className="text-gray-400 text-6xl mb-4">📊</div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Select a Project
//             </h3>
//             <p className="text-gray-500">
//               Choose a project from the dropdown above to view envelope data.
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
