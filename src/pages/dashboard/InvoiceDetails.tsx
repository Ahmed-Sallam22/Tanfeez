import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import type { UploadInvoiceResponse } from "@/api/invoice.api";
import {
  useSaveInvoiceMutation,
  useUpdateInvoiceMutation,
  useSubmitInvoiceMutation,
  useGetInvoiceByIdQuery,
} from "@/api/invoice.api";
import { SharedModal } from "@/shared/SharedModal";
import SharedSelect, { type SelectOption } from "@/shared/SharedSelect";

const ACCOUNT_CODE_OPTIONS = [
  {
    code: "5000000",
    label: "Expenses",
  },
  { code: "5010000", label: "Cost Of Sales" },
  { code: "5010001", label: "Salaries Eng Staff" },
  { code: "5010002", label: "Depreciation Charges To Cost Of Sales" },
  { code: "5010003", label: "Inventory - NRV Adjustment to PL" },
  { code: "5010004", label: "FM Service Charges" },
  { code: "5010005", label: "Community Service Charges" },
  { code: "5010006", label: "Chilled Water Consumption Charges" },
  { code: "5010007", label: "Broker comission" },
  { code: "5010008", label: "Development Fee" },
  { code: "5010015", label: "Other Cost of Sales" },
  { code: "5010016", label: "Other Cost of Sales  - RP" },
  { code: "5040000", label: "General And Administrative Expenses" },
  { code: "5040100", label: "G&A - Staff Costs" },
  { code: "5040101", label: "Basic Salary" },
  { code: "5040102", label: "Children Allowance" },
  { code: "5040103", label: "Social Allowance" },
  { code: "5040104", label: "Special Allowance" },
  { code: "5040105", label: "Airfare Allowance" },
  { code: "5040106", label: "Consolidated Allowance" },
  { code: "5040107", label: "Overtime Expenses" },
  { code: "5040108", label: "Education Assistance" },
  { code: "5040109", label: "Life Insurance Expense" },
  { code: "5040111", label: "Health Insurance Expense" },
  { code: "5040112", label: "Leave Provision" },
  { code: "5040113", label: "Expatriates EOSB" },
  { code: "5040114", label: "UAE Nationals EOSB Non Pensionable" },
  { code: "5040115", label: "Defined Benefit Contribution" },
  { code: "5040116", label: "UAE Nationals Pension" },
  { code: "5040117", label: "Employee Relocation Expenses" },
  { code: "5040118", label: "Repatriation Expense" },
  { code: "5040119", label: "Non UAE Employee Pension" },
  { code: "5040121", label: "Special Needs Assistance" },
  { code: "5040122", label: "Payroll Taxes Employer" },
  { code: "5040123", label: "Workers Compensation Expense" },
  { code: "5040124", label: "Visa Expenses" },
  { code: "5040125", label: "Professional Membership Fees" },
  { code: "5040126", label: "International Assignment Allowance" },
  { code: "5040127", label: "Outward Secondee Compensation Recharges" },
  { code: "5040128", label: "Inward Secondee Compensation Recharges" },
  { code: "5040129", label: "Secondee Employee Tax Expense" },
  { code: "5040131", label: "Long-Term Contractors" },
  { code: "5040132", label: "Recruitment Expenses" },
  { code: "5040133", label: "Training Expenses Fees" },
  { code: "5040134", label: "Lump Sum Adjustments" },
  { code: "5040135", label: "Ex Gratia Payment" },
  { code: "5040136", label: "Discretionary Bonus" },
  { code: "5040137", label: "Board And Committee Membership Fee" },
  { code: "5040138", label: "Long-Term Incentive Plan Expense" },
  { code: "5040141", label: "Special Compensation Payment" },
  {
    code: "5040200",
    label: "G&A - Depreciation Of Property, Plant And Equipment",
  },
  { code: "5040201", label: "Depreciation Expense Buildings" },
  { code: "5040202", label: "Depreciation Expense Machinery And Equipment" },
  { code: "5040203", label: "Depreciation Expense Transportation Equipment" },
  { code: "5040204", label: "Depreciation Expense Furniture And Fixtures" },
  { code: "5040205", label: "Depreciation Expense Office Equipment" },
  { code: "5040206", label: "Depreciation Expense Computers And Software" },
  { code: "5040207", label: "Depreciation Expense Leasehold Improvements" },
  { code: "8888888", label: "Dummy Account" },
] as const;

const formatAccountDescription = (value: string | null | undefined) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parenIndex = trimmed.indexOf("(");
  return parenIndex > -1 ? trimmed.slice(0, parenIndex).trim() : trimmed;
};

const sanitizeAmountString = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "0";

  const raw = typeof value === "number" ? value.toString() : value;

  if (!raw) return "0";

  const collapsed = raw.replace(/\s+/g, "");
  const cleaned = collapsed.replace(/[^\d,.-]/g, "");

  const hasDot = cleaned.includes(".");
  const commaMatches = cleaned.match(/,/g);
  const commaCount = commaMatches ? commaMatches.length : 0;

  let normalized = cleaned;

  if (commaCount > 0) {
    if (!hasDot && commaCount === 1) {
      normalized = cleaned.replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  }

  if (
    !normalized ||
    normalized === "." ||
    normalized === "-" ||
    normalized === "-."
  ) {
    return "0";
  }

  return normalized;
};

const parseAmountValue = (
  value: string | number | null | undefined
): number => {
  const sanitized = sanitizeAmountString(value);
  const parsed = Number.parseFloat(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
};

type ExtractedInvoiceDistribution = {
  DistributionCombination?: string;
  DistributionLineType?: string;
  DistributionAmount?: string | number;
};

type ExtractedInvoiceLine = {
  LineNumber?: number;
  LineAmount?: string | number;
  invoiceDistributions?: ExtractedInvoiceDistribution[];
};

type ExtractedInvoiceData = {
  InvoiceNumber?: string;
  InvoiceDate?: string;
  Supplier?: string;
  SupplierSite?: string;
  BusinessUnit?: string;
  Description?: string;
  InvoiceAmount?: number | string;
  InvoiceCurrency?: string;
  InvoiceGroup?: string;
  AccountCode?: string;
  AccountDescription?: string;
  ["Account Description"]?: string;
  invoiceLines?: ExtractedInvoiceLine[];
};

const ACCOUNT_CODE_SELECT_OPTIONS: SelectOption[] = ACCOUNT_CODE_OPTIONS.map(
  (entry) => ({
    value: entry.code,
    label: `${entry.code} — ${entry.label}`,
  })
);

export default function InvoiceReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Get the uploaded invoice data from navigation state
  const uploadedData = (
    location.state as { invoiceData?: UploadInvoiceResponse }
  )?.invoiceData;

  // Fetch invoice from API if no uploaded data
  const {
    data: apiInvoiceResponse,
    error: invoiceError,
    isLoading: isLoadingInvoice,
  } = useGetInvoiceByIdQuery(id || "", { skip: !!uploadedData || !id });

  // Extract the first invoice from the results array
  const apiInvoiceData = apiInvoiceResponse?.results?.[0];

  // API Mutations
  const [saveInvoice, { isLoading: isSaving }] = useSaveInvoiceMutation();
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();
  const [submitInvoice, { isLoading: isSubmitting }] =
    useSubmitInvoiceMutation();

  // Modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Determine data source (uploaded or from API)
  const dataSource = useMemo(() => {
    return (
      uploadedData ||
      (apiInvoiceData
        ? {
            data: apiInvoiceData.Invoice_Data,
            pdf_base64: apiInvoiceData.base64_file,
            file_name: apiInvoiceData.file_name || "",
            invoice_number: apiInvoiceData.Invoice_Number,
            model_used: "api",
            message: "Invoice loaded from API",
          }
        : null)
    );
  }, [uploadedData, apiInvoiceData]);

  // editable form state (right column)
  const [form, setForm] = useState({
    invoiceNo: "",
    invoiceDate: "",
    supplier: "",
    supplierSite: "",
    businessUnit: "",
    description: "",
    invoiceAmount: 0,
    invoiceCurrency: "USD",
    invoiceGroup: "",
    accountCode: "",
    accountDescription: "",
    lineItems: [] as Array<{
      id: number;
      lineNumber: number;
      lineAmount: string;
      distributionCombination: string;
      distributionLineType: string;
      distributionAmount: string;
    }>,
  });

  // Update form when dataSource changes
  useEffect(() => {
    if (dataSource?.data) {
      const data = dataSource.data as ExtractedInvoiceData;

      const rawAccountDescription =
        data["Account Description"] ?? data.AccountDescription ?? "";
      const formattedAccountDescription = formatAccountDescription(
        rawAccountDescription
      );
      const initialAccountCode = data.AccountCode ?? "";

      const invoiceLines = data.invoiceLines ?? [];
      const lineItems = invoiceLines.map(
        (line: ExtractedInvoiceLine, idx: number) => {
          const lineAmountRaw = line.LineAmount ?? "0";
          const firstDistribution = line.invoiceDistributions?.[0];
          const distributionAmountRaw =
            firstDistribution?.DistributionAmount ?? lineAmountRaw ?? "0";

          const lineAmount = sanitizeAmountString(lineAmountRaw);
          const distributionAmount = sanitizeAmountString(
            distributionAmountRaw
          );

          return {
            id: idx + 1,
            lineNumber: line.LineNumber ?? idx + 1,
            lineAmount,
            distributionCombination:
              firstDistribution?.DistributionCombination ?? "",
            distributionLineType:
              firstDistribution?.DistributionLineType ?? "Item",
            distributionAmount,
          };
        }
      );

      setForm({
        invoiceNo: data.InvoiceNumber || "",
        invoiceDate: data.InvoiceDate || "",
        supplier: data.Supplier || "",
        supplierSite: data.SupplierSite || "",
        businessUnit: data.BusinessUnit || "",
        description: data.Description || "",
        invoiceAmount: parseAmountValue(data?.InvoiceAmount ?? 0),
        invoiceCurrency: data.InvoiceCurrency || "USD",
        invoiceGroup: data.InvoiceGroup || "",
        accountCode: initialAccountCode,
        accountDescription:
          formattedAccountDescription ||
          formatAccountDescription(
            ACCOUNT_CODE_OPTIONS.find((opt) => opt.code === initialAccountCode)
              ?.label
          ),
        lineItems: lineItems,
      });
    }
  }, [dataSource]);

  const calc = useMemo(() => {
    const subtotal = form.lineItems.reduce((total, li) => {
      return total + parseAmountValue(li.lineAmount);
    }, 0);
    return { subtotal };
  }, [form.lineItems]);

  const addRow = () => {
    const lastLineNumber =
      form.lineItems.length > 0
        ? Math.max(...form.lineItems.map((li) => li.lineNumber))
        : 0;

    setForm((f) => ({
      ...f,
      lineItems: [
        ...f.lineItems,
        {
          id: Date.now(),
          lineNumber: lastLineNumber + 1,
          lineAmount: "0",
          distributionCombination:
            f.lineItems[0]?.distributionCombination || "",
          distributionLineType: "Item",
          distributionAmount: "0",
        },
      ],
    }));
  };

  const updateRow = (
    id: number,
    patch: Partial<(typeof form)["lineItems"][number]>
  ) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate line items
      const hasAmount = form.lineItems.every(
        (r) => parseAmountValue(r.lineAmount) > 0
      );
      if (!hasAmount) {
        return toast.error(t("invoice.lineAmountError"));
      }

      // Prepare the payload
      const payload = {
        Invoice_Data: {
          InvoiceNumber: form.invoiceNo,
          InvoiceCurrency: form.invoiceCurrency,
          InvoiceAmount: form.invoiceAmount,
          InvoiceDate: form.invoiceDate,
          BusinessUnit: form.businessUnit,
          Supplier: form.supplier,
          SupplierSite: form.supplierSite,
          InvoiceGroup: form.invoiceGroup,
          Description: form.description,
          AccountCode: form.accountCode,
          "Account Description": form.accountDescription,
          invoiceDff: [
            {
              __FLEX_Context: "MIC_HQ",
            },
          ],
          invoiceLines: form.lineItems.map((line) => ({
            LineNumber: line.lineNumber,
            LineAmount: sanitizeAmountString(line.lineAmount),
            invoiceLineDff: [
              {
                __FLEX_Context: "MIC_HQ",
              },
            ],
            invoiceDistributions: [
              {
                DistributionLineNumber: 1,
                DistributionLineType: line.distributionLineType,
                DistributionAmount: sanitizeAmountString(
                  line.distributionAmount || line.lineAmount
                ),
                DistributionCombination: line.distributionCombination,
              },
            ],
          })),
        },
        Invoice_Number: form.invoiceNo,
        base64_file: dataSource?.pdf_base64 || "",
        file_name: dataSource?.file_name || "",
      };

      // If data comes from uploaded invoice (new), save first then submit
      if (uploadedData) {
        await saveInvoice(payload).unwrap();
        toast.success(t("invoice.invoiceSaved"));
      }
      // If data comes from API (existing invoice), update first then submit
      else if (apiInvoiceData) {
        await updateInvoice(payload).unwrap();
        toast.success(t("invoice.invoiceUpdated"));
      }

      // Then submit (for both cases)
      await submitInvoice({ InvoiceNumber: form.invoiceNo }).unwrap();
      toast.success(t("invoice.invoiceSubmitted"));
      navigate("/app/Document_I/O");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(t("invoice.submitFailed"));
    }
  };

  const handleModalSubmit = async () => {
    try {
      await submitInvoice({ InvoiceNumber: form.invoiceNo }).unwrap();
      toast.success(t("invoice.invoiceSubmitted"));
      setShowSubmitModal(false);
      navigate("/app/Document_I/O");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(t("invoice.submitFailed"));
    }
  };

  const handleModalCancel = () => {
    setShowSubmitModal(false);
    navigate("/app/Document_I/O");
  };

  // Show loading skeleton
  if (isLoadingInvoice) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* LEFT: PDF Preview Skeleton */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 p-6">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="rounded-xl border border-gray-200 bg-gray-100 h-[750px] animate-pulse flex items-center justify-center">
              <svg
                className="h-16 w-16 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* RIGHT: Form Skeleton */}
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(10)].map((_, idx) => (
                <div key={idx}>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Line Items Skeleton */}
            <div className="mt-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="rounded-xl ring-1 ring-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-3">
                  <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, idx) => (
                      <div
                        key={idx}
                        className="h-4 bg-gray-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                </div>
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="border-t border-gray-100 p-3">
                    <div className="grid grid-cols-4 gap-3">
                      {[...Array(4)].map((_, idx2) => (
                        <div
                          key={idx2}
                          className="h-8 bg-gray-100 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (invoiceError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-red-600 text-lg">
          {t("invoice.failedToLoadInvoice")}
        </p>
        <button
          onClick={() => navigate("/app/Document_I/O")}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
        >
          {t("invoice.backToInvoices")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/app/Document_I/O")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" /> {t("invoice.backToInvoices")}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: PDF Preview */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200  p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-800 ">
              {t("invoice.pdfPreview")}
            </h3>
          </div>

          {dataSource?.pdf_base64 ? (
            <div className="rounded-xl overflow-hidden border border-gray-200  bg-gray-50 ">
              <iframe
                src={`data:application/pdf;base64,${dataSource.pdf_base64}`}
                className="w-full h-[750px]"
                title="Invoice PDF"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300  bg-gray-50  p-16 flex flex-col items-center justify-center text-center">
              <svg
                className="h-14 w-14 text-gray-400  mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600  text-sm font-medium">
                {t("invoice.noPdfAvailable")}
              </p>
              <p className="text-gray-400  text-xs mt-1">
                {t("invoice.noPdfMessage")}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT: Extracted Data / Editor */}
        <div className="bg-white rounded-2xl ring-1 ring-black/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800">
              {apiInvoiceData
                ? t("invoice.invoiceDetailsViewOnly")
                : t("invoice.extractedData")}
            </h3>
            {apiInvoiceData && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t("invoice.readOnly")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.invoiceNumber")}
              </label>
              <input
                value={form.invoiceNo}
                onChange={(e) =>
                  setForm({ ...form, invoiceNo: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.invoiceDate")}
              </label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) =>
                    setForm({ ...form, invoiceDate: e.target.value })
                  }
                  disabled={!!apiInvoiceData}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    apiInvoiceData
                      ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                      : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.supplier")}
              </label>
              <input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.supplierSite")}
              </label>
              <input
                value={form.supplierSite}
                onChange={(e) =>
                  setForm({ ...form, supplierSite: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.businessUnit")}
              </label>
              <input
                value={form.businessUnit}
                onChange={(e) =>
                  setForm({ ...form, businessUnit: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.description")}
              </label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            {/* <div>
              <label className="text-xs text-gray-600">Invoice Amount</label>
              <input
                type="number"
                value={form.invoiceAmount}
                onChange={(e) =>
                  setForm({ ...form, invoiceAmount: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div> */}
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.invoiceCurrency")}
              </label>
              <input
                value={form.invoiceCurrency}
                onChange={(e) =>
                  setForm({ ...form, invoiceCurrency: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.invoiceGroup")}
              </label>
              <input
                value={form.invoiceGroup}
                onChange={(e) =>
                  setForm({ ...form, invoiceGroup: e.target.value })
                }
                disabled={!!apiInvoiceData}
                className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                  apiInvoiceData
                    ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                    : "border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">
                {t("invoice.totalAmountCalculated")}
              </label>
              <input
                disabled
                value={calc.subtotal.toFixed(2)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-800">
              {t("invoice.codeCombinations")}
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600">
                  {t("invoice.accountCode")}
                </label>
                <SharedSelect
                  options={ACCOUNT_CODE_SELECT_OPTIONS}
                  value={form.accountCode}
                  onChange={(nextValue) => {
                    const selectedCode = String(nextValue ?? "");
                    const option = ACCOUNT_CODE_OPTIONS.find(
                      (item) => item.code === selectedCode
                    );
                    setForm((prev) => ({
                      ...prev,
                      accountCode: selectedCode,
                      accountDescription: formatAccountDescription(
                        option?.label ?? ""
                      ),
                    }));
                  }}
                  placeholder={t("invoice.selectAccountCode")}
                  disabled={!!apiInvoiceData}
                  clearable
                  searchable
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">
                  {t("invoice.accountDescription")}
                </label>
                <input
                  value={form.accountDescription}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-700"
                  placeholder={t("invoice.selectAccountCodeToView")}
                />
              </div>
            </div>
          </div>

          {/* Line items editable */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-800">
                {t("invoice.lineItems")}
              </p>
              {!apiInvoiceData && (
                <button
                  onClick={addRow}
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" /> {t("invoice.addRow")}
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-xl ring-1 ring-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left w-16">#</th>
                    <th className="px-3 py-2 text-left w-32">
                      {t("invoice.amount")}
                    </th>
                    <th className="px-3 py-2 text-left">
                      {t("invoice.distributionCombination")}
                    </th>
                    <th className="px-3 py-2 text-left w-28">
                      {t("invoice.type")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((r) => {
                    return (
                      <tr key={r.id} className="border-t border-gray-100">
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={r.lineNumber}
                            disabled
                            className="w-full rounded-md px-2 py-1 text-gray-700 bg-gray-50 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2 ">
                          <input
                            type="number"
                            value={r.lineAmount}
                            onChange={(e) =>
                              updateRow(r.id, { lineAmount: e.target.value })
                            }
                            disabled={!!apiInvoiceData}
                            className={`w-full rounded-md border px-2 py-1 ${
                              apiInvoiceData
                                ? "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                                : "border-gray-200 focus:ring-1 focus:ring-teal-500"
                            }`}
                            min={0}
                            step={0.01}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={r.distributionCombination}
                            disabled
                            className="w-full px-2 py-1 text-gray-700 text-xs bg-gray-50 cursor-not-allowed"
                            placeholder="Distribution Combination"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={r.distributionLineType}
                            disabled
                            className="w-full rounded-md px-2 py-1 text-gray-700 bg-gray-50 cursor-not-allowed"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          {!apiInvoiceData && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isSaving || isUpdating}
                className=" flex items-center gap-2 text-md px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {uploadedData ? t("invoice.saving") : t("invoice.updating")}
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t("invoice.submitting")}
                  </>
                ) : (
                  <>{t("invoice.approveAndSave")}</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <SharedModal
        isOpen={showSubmitModal}
        onClose={handleModalCancel}
        title={t("invoice.invoiceSavedSuccess")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">{t("invoice.invoiceSavedMessage")}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleModalCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {t("invoice.later")}
            </button>
            <button
              onClick={handleModalSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white inline-flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t("invoice.submitting")}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t("invoice.submitNow")}
                </>
              )}
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
