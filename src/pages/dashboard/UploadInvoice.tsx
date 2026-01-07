import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Download, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useUploadInvoiceMutation } from "@/api/invoice.api";

// Allowed file extensions from the UI in the screenshot
const ACCEPTED = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".xlsx",
  ".doc",
  ".docx",
  ".zip",
];

function formatKB(bytes: number) {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatDMY(d: Date) {
  // match 25/8/2025 style (no leading zeros)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function UploadInvoices() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploadInvoice] = useUploadInvoiceMutation();

  const today = useMemo(() => new Date(), []);

  const validate = (f: File) => {
    const ok = ACCEPTED.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!ok) toast.error(t("invoice.unsupportedFile", { fileName: f.name }));
    return ok;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const list = Array.from(fileList).filter(validate);
    if (!list.length) return;
    setFiles((prev) => {
      // de-duplicate by name + size
      const map = new Map(prev.map((p) => [`${p.name}-${p.size}`, p]));
      list.forEach((f) => map.set(`${f.name}-${f.size}`, f));
      return Array.from(map.values());
    });
    toast.success(
      t("invoice.filesAdded", {
        count: list.length,
        plural: list.length > 1 ? "s" : "",
      })
    );
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDrag(true);
    else if (e.type === "dragleave") setDrag(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  const removeAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const downloadTemp = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.length) {
      toast.error(t("invoice.addAtLeastOneFile"));
      return;
    }

    setIsUploading(true);

    try {
      // Upload the first file and navigate to its details
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("model", "gemini");

      const response = await uploadInvoice(formData).unwrap();

      toast.success(t("invoice.uploadSuccess"));

      // Navigate to invoice details with the invoice number and pass the extracted data
      navigate(`/app/Document_I/O/${response.invoice_number}`, {
        state: { invoiceData: response },
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("invoice.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/Document_I/O")}
            className="flex items-center gap-2 text-[#4E8476] hover:text-[#3d6b5f] transition-colors"
          >
            {t("invoice.allInvoices")}
          </button>
          <span className="text-[#757575]">/</span>
          <span className="font-medium text-[#282828]">
            {t("invoice.uploadInvoice")}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
        <h2 className="text-lg  text-[#282828]">
          {t("invoice.uploadInvoices")}
        </h2>
        <p className="text-[13px] tracking-wider text-[#AFAFAF] mt-1">
          {t("invoice.dragDropInstructions")}
        </p>

        {/* Dropzone */}
        <div
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`mt-4 relative border-2 bg-[#F6F6F64D] border-dashed rounded-xl p-10 text-center transition-all ${
            drag
              ? "border-[#E2E2E2] bg-teal-50"
              : "border-gray-300 hover:border-teal-500"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.join(",")}
            onChange={onChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16  rounded-full flex items-center justify-center">
              <svg
                width="50"
                height="50"
                viewBox="0 0 50 50"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M35.416 18.7539C39.9473 18.7791 42.4013 18.9801 44.0021 20.5809C45.8327 22.4115 45.8327 25.3577 45.8327 31.2503V33.3336C45.8327 39.2262 45.8327 42.1725 44.0021 44.003C42.1715 45.8336 39.2252 45.8336 33.3327 45.8336H16.666C10.7735 45.8336 7.82718 45.8336 5.9966 44.003C4.16602 42.1725 4.16602 39.2262 4.16602 33.3336L4.16602 31.2503C4.16602 25.3577 4.16602 22.4115 5.9966 20.5809C7.5974 18.9801 10.0514 18.7791 14.5827 18.7539"
                  stroke="#282828"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M25 31.25L25 4.16666M25 4.16666L31.25 11.4583M25 4.16666L18.75 11.4583"
                  stroke="#282828"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {t("invoice.dragDropExcel")}{" "}
                <span className="text-[#4E8476]">{t("invoice.browse")}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t("invoice.supportedFormatsLong")}
              </p>
            </div>
          </div>
        </div>

        {/* Files list */}
        <div className="mt-4 space-y-1">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center justify-between bg-[#F6F6F6] rounded-xl border border-[#F6F6F6] p-3"
            >
              <div className="flex items-center gap-3 ">
                <div className="w-10 h-10  rounded-lg flex items-center justify-center ">
                  <svg
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.5 2H8.5C5 2 3.5 4 3.5 7V17C3.5 20 5 22 8.5 22H16.5C20 22 21.5 20 21.5 17V7C21.5 4 20 2 16.5 2ZM8.5 12.25H12.5C12.91 12.25 13.25 12.59 13.25 13C13.25 13.41 12.91 13.75 12.5 13.75H8.5C8.09 13.75 7.75 13.41 7.75 13C7.75 12.59 8.09 12.25 8.5 12.25ZM16.5 17.75H8.5C8.09 17.75 7.75 17.41 7.75 17C7.75 16.59 8.09 16.25 8.5 16.25H16.5C16.91 16.25 17.25 16.59 17.25 17C17.25 17.41 16.91 17.75 16.5 17.75ZM19 9.25H17C15.48 9.25 14.25 8.02 14.25 6.5V4.5C14.25 4.09 14.59 3.75 15 3.75C15.41 3.75 15.75 4.09 15.75 4.5V6.5C15.75 7.19 16.31 7.75 17 7.75H19C19.41 7.75 19.75 8.09 19.75 8.5C19.75 8.91 19.41 9.25 19 9.25Z"
                      fill="#4E8476"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-md text-[#545454] truncate">
                    #{f.name.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <span className="text-sm text-[#757575]">
                  {formatKB(f.size)}
                </span>
                <span className="text-sm text-[#757575]">
                  {formatDMY(today)}
                </span>

                <button
                  type="button"
                  onClick={() => downloadTemp(f)}
                  className="p-2 rounded-lg cursor-pointer bg-[#EEEEEE] hover:bg-gray-100"
                  title={t("invoice.download")}
                >
                  <Download className="h-5 w-5 text-gray-700" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="p-2 rounded-lg hover:bg-red-50"
                  title={t("invoice.remove")}
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={() => navigate("/app/Document_I/O")}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            {t("invoice.cancel")}
          </button>
          <button
            onClick={onSubmit}
            disabled={isUploading || !files.length}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[#4E8476] hover:bg-[#3d6b5f] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t("invoice.uploading")}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {t("invoice.uploadAndExtract")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
