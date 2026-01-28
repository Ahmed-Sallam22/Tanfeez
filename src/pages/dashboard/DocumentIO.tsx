import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import {
  //   FileSpreadsheet,
  //   Download,
  Upload,
  Filter,
  SortAsc,
} from "lucide-react";
import SearchBar from "@/shared/SearchBar";
import toast from "react-hot-toast";
import {
  useGetInvoicesQuery,
  useDeleteInvoiceMutation,
} from "@/api/invoice.api";

export default function DocumentIO() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // API hooks
  const {
    data: invoicesData,
    isLoading,
    error,
  } = useGetInvoicesQuery({
    page: currentPage,
    page_size: 10,
    search: searchQuery,
  });
  const [deleteInvoice] = useDeleteInvoiceMutation();

  // Transform API data to table format
  const tableData: TableRow[] =
    invoicesData?.results?.map((invoice, index) => ({
      id: invoice?.Invoice_ID || index,
      Invoice_ID: invoice?.Invoice_ID || index,
      InvoiceNumber: invoice?.InvoiceNumber || invoice?.Invoice_Number || "",
      Supplier: invoice?.Supplier || "",
      InvoiceAmount: invoice?.InvoiceAmount || "0",
      InvoiceDate: invoice?.InvoiceDate || "",
      status: invoice?.status || "Pending",
      BusinessUnit: invoice?.BusinessUnit || "",
      SupplierSite: invoice?.SupplierSite || "",
      InvoiceCurrency: invoice?.InvoiceCurrency || "AED",
    })) || [];

  // Table columns
  const columns: TableColumn[] = [
    {
      id: "InvoiceNumber",
      header: "Invoice Number",
      accessor: "InvoiceNumber",
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{String(value)}</span>
      ),
    },
    {
      id: "Supplier",
      header: "Supplier",
      accessor: "Supplier",
      sortable: true,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      id: "SupplierSite",
      header: "Supplier Site",
      accessor: "SupplierSite",
      sortable: true,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      id: "InvoiceAmount",
      header: "Amount",
      accessor: "InvoiceAmount",
      sortable: true,
      render: (value, row) => (
        <span className="font-medium text-gray-900">
          {Number(value).toLocaleString()} {String(row.InvoiceCurrency || "")}
        </span>
      ),
    },
    {
      id: "InvoiceDate",
      header: "Invoice Date",
      accessor: "InvoiceDate",
      sortable: true,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            value === "Submitted"
              ? "bg-green-100 text-green-800"
              : value === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: "BusinessUnit",
      header: "Business Unit",
      accessor: "BusinessUnit",
      sortable: true,
      render: (value) => <span className="text-gray-700">{String(value)}</span>,
    },
  ]; // Handlers
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    console.log("Search query:", text);
    // Implement search logic here
  };

  //   const handleExportExcel = () => {
  //     toast.success("Exporting to Excel...");
  //     // Implement Excel export logic
  //   };

  //   const handleDownloadZip = () => {
  //     toast.success("Downloading ZIP file...");
  //     // Implement ZIP download logic
  //   };

  const handleUploadInvoice = () => {
    navigate("/app/Document_I/O/upload");
  };

  const handleView = (row: TableRow) => {
    navigate(`/app/Document_I/O/${row.InvoiceNumber}`);
  };

  const handleDelete = async (row: TableRow) => {
    setIsDeleting(true);
    try {
      await deleteInvoice(String(row.InvoiceNumber)).unwrap();
      toast.success(`Invoice ${row.InvoiceNumber} deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete invoice");
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    console.log("Page changed to:", page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all your invoices in one place
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button> */}
          {/* <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Download className="h-4 w-4" />
            Download ZIP
          </button> */}
          <button
            onClick={handleUploadInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg transition-colors font-medium text-sm"
          >
            <Upload className="h-4 w-4" />
            Upload Invoice
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 w-full sm:w-auto">
            <SearchBar
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={handleSearch}
              onSubmit={handleSearch}
              debounce={250}
            />
          </div>

          {/* Sort and Filter Buttons */}
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              onClick={() => toast.success("Sort functionality")}
            >
              <SortAsc className="h-4 w-4" />
              Sort
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
              onClick={() => toast.success("Filter functionality")}
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-600 mb-4">Failed to load invoices</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <SharedTable
            title="All Invoices"
            columns={columns}
            data={tableData}
            showPagination={true}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            itemsPerPage={10}
            maxHeight="600px"
            documents={true}
            showActions={true}
            onView={handleView}
            onDelete={handleDelete}
            showFooter={true}
            showColumnSelector={true}
            className="shadow-none"
          />
        )}
      </div>

      {/* Delete Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--color-primary)]"></div>
            <p className="text-lg font-medium text-gray-900">
              Deleting Invoice...
            </p>
            <p className="text-sm text-gray-500">Please wait</p>
          </div>
        </div>
      )}
    </div>
  );
}
