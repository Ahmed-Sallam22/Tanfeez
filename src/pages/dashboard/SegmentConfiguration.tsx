import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Download } from "lucide-react";
import {
  SharedTable,
  type TableColumn,
  type TableRow as SharedTableRow,
} from "@/shared/SharedTable";
import {
  useGetSegmentTypesQuery,
  useDeleteSegmentTypeMutation,
  useToggleSegmentRequiredMutation,
  useToggleSegmentHierarchyMutation,
  useCreateSegmentTypeMutation,
  useUpdateSegmentTypeMutation,
  useLoadSegmentsValuesMutation,
  useLoadSegmentsFundsMutation,
  type SegmentType,
  type CreateSegmentTypeRequest,
  type LoadSegmentsResponse,
  type LoadFundsResponse,
} from "@/api/segmentConfiguration.api";
import toast from "react-hot-toast";
import SharedModal from "@/shared/SharedModal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

type ViewMode = "list" | "card";

export default function SegmentConfiguration() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoadResultModalOpen, setIsLoadResultModalOpen] = useState(false);
  const [isLoadFundsModalOpen, setIsLoadFundsModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [editingSegment, setEditingSegment] = useState<SegmentType | null>(
    null
  );
  const [deletingSegment, setDeletingSegment] = useState<SegmentType | null>(
    null
  );
  const [loadResult, setLoadResult] = useState<LoadSegmentsResponse | null>(
    null
  );
  const [loadFundsResult, setLoadFundsResult] =
    useState<LoadFundsResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateSegmentTypeRequest>({
    segment_name: "",
    oracle_segment_number: 0,
    is_required: "False",
    has_hierarchy: "False",
    display_order: 0,
    description: "",
  });

  // Fetch segment types data from API
  const { data: segmentData, isLoading } = useGetSegmentTypesQuery();

  // Mutations
  const [deleteSegmentType] = useDeleteSegmentTypeMutation();
  const [createSegmentType, { isLoading: isCreating }] =
    useCreateSegmentTypeMutation();
  const [updateSegmentType, { isLoading: isUpdating }] =
    useUpdateSegmentTypeMutation();
  const [loadSegmentsValues, { isLoading: isLoadingSegments }] =
    useLoadSegmentsValuesMutation();
  const [loadSegmentsFunds, { isLoading: isLoadingFunds }] =
    useLoadSegmentsFundsMutation();

  // Toggle mutations
  const [toggleRequired] = useToggleSegmentRequiredMutation();
  const [toggleHierarchy] = useToggleSegmentHierarchyMutation();

  const segments = segmentData?.data || [];

  const handleAddSegment = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingSegment(null);
    // Reset form
    setFormData({
      segment_name: "",
      oracle_segment_number: 0,
      is_required: "False",
      has_hierarchy: "False",
      display_order: 0,
      description: "",
    });
  };

  const handleSubmitSegment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.segment_name.trim()) {
      toast.error(t("segmentConfiguration.segmentRequired"));
      return;
    }

    if (formData.oracle_segment_number <= 0) {
      toast.error(t("validation.oracleNumberRequired"));
      return;
    }

    if (formData.display_order <= 0) {
      toast.error(t("validation.displayOrderRequired"));
      return;
    }

    try {
      if (editingSegment) {
        // Update existing segment
        await updateSegmentType({
          id: editingSegment.segment_id,
          data: formData,
        }).unwrap();
        toast.success(t("segmentConfiguration.updateSuccess"));
      } else {
        // Create new segment
        await createSegmentType(formData).unwrap();
        toast.success(t("segmentConfiguration.createSuccess"));
      }
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save segment type:", error);
      toast.error(
        editingSegment ? t("messages.updateFailed") : t("messages.createFailed")
      );
    }
  };

  const handleEditSegment = (segment: SegmentType) => {
    setEditingSegment(segment);
    // Pre-fill form with segment data
    setFormData({
      segment_name: segment.segment_name,
      oracle_segment_number: segment.segment_type_oracle_number,
      is_required: segment.segment_type_is_required ? "True" : "False",
      has_hierarchy: segment.segment_type_has_hierarchy ? "True" : "False",
      display_order: segment.segment_type_display_order,
      description: segment.description || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteSegmentClick = (segment: SegmentType) => {
    setDeletingSegment(segment);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSegment) return;

    try {
      await deleteSegmentType(deletingSegment.segment_id).unwrap();
      toast.success(t("segmentConfiguration.deleteSuccess"));
      setIsDeleteModalOpen(false);
      setDeletingSegment(null);
    } catch (error) {
      console.error("Failed to delete segment type:", error);
      toast.error(t("messages.deleteFailed"));
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingSegment(null);
  };

  const handleLoadSegments = async () => {
    try {
      const result = await loadSegmentsValues().unwrap();
      setLoadResult(result);
      setIsLoadResultModalOpen(true);
      toast.success(t("segmentConfiguration.loadSuccess"));
    } catch (error) {
      console.error("Failed to load segments:", error);
      toast.error(t("segmentConfiguration.loadError"));
    }
  };

  const handleLoadFundsClick = () => {
    setIsPeriodModalOpen(true);
  };

  const handleLoadFunds = async () => {
    if (!selectedPeriod.trim()) {
      toast.error(t("messages.enterPeriod"));
      return;
    }

    try {
      const result = await loadSegmentsFunds({
        period_name: selectedPeriod,
      }).unwrap();
      setLoadFundsResult(result);
      setIsPeriodModalOpen(false);
      setIsLoadFundsModalOpen(true);
      toast.success(result.message || t("messages.fundsLoadSuccess"));
    } catch (error) {
      console.error("Failed to load funds:", error);
      toast.error(t("messages.fundsLoadFailed"));
    }
  };

  const handleCloseLoadResultModal = () => {
    setIsLoadResultModalOpen(false);
    setLoadResult(null);
  };

  const handleToggleRequired = async (segment: SegmentType) => {
    try {
      await toggleRequired({
        id: segment.segment_id,
        is_required: !segment.segment_type_is_required,
      }).unwrap();
      toast.success(t("messages.requiredStatusUpdated"));
    } catch (error) {
      console.error("Failed to toggle required:", error);
      toast.error(t("messages.requiredStatusFailed"));
    }
  };

  const handleToggleHierarchy = async (segment: SegmentType) => {
    try {
      await toggleHierarchy({
        id: segment.segment_id,
        has_hierarchy: !segment.segment_type_has_hierarchy,
      }).unwrap();
      toast.success(t("messages.hierarchyStatusUpdated"));
    } catch (error) {
      console.error("Failed to toggle hierarchy:", error);
      toast.error(t("messages.hierarchyStatusFailed"));
    }
  };

  // Define columns for SharedTable
  const columns: TableColumn[] = [
    {
      id: "segment_name",
      header: t("segmentConfiguration.segmentName"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <span className="text-sm text-gray-900 font-medium">
            {segment.segment_name}
          </span>
        );
      },
    },
    {
      id: "segment_type",
      header: t("segmentConfiguration.segmentType"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <span className="text-sm text-gray-500">
            {segment.segment_type || "N/A"}
          </span>
        );
      },
    },
    {
      id: "segment_type_oracle_number",
      header: t("segmentConfiguration.oracleNumber"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <span className="text-sm text-gray-500">
            {segment.segment_type_oracle_number}
          </span>
        );
      },
    },
    {
      id: "segment_type_is_required",
      header: t("segmentConfiguration.required"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <button
            type="button"
            onClick={() => handleToggleRequired(segment)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:ring-offset-2"
            style={{
              backgroundColor: segment.segment_type_is_required
                ? "#4E8476"
                : "#e5e7eb",
            }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                segment.segment_type_is_required
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        );
      },
    },
    {
      id: "segment_type_has_hierarchy",
      header: t("segmentConfiguration.hierarchy"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <button
            type="button"
            onClick={() => handleToggleHierarchy(segment)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:ring-offset-2"
            style={{
              backgroundColor: segment.segment_type_has_hierarchy
                ? "#4E8476"
                : "#e5e7eb",
            }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                segment.segment_type_has_hierarchy
                  ? "translate-x-6"
                  : "translate-x-1"
              }`}
            />
          </button>
        );
      },
    },
    {
      id: "segment_type_display_order",
      header: t("tableColumns.displayOrder"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        return (
          <span className="text-sm text-gray-900">
            {segment.segment_type_display_order}
          </span>
        );
      },
    },
    {
      id: "segment_type_status",
      header: t("tableColumns.status"),
      render: (_, row) => {
        const segment = row as unknown as SegmentType;
        const isActive = segment.segment_type_status === "Active";
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {segment.segment_type_status}
          </span>
        );
      },
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E8476]"></div>
        <span className="ml-2 text-gray-600">Loading segments...</span>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-gray-900">
          {t("segmentConfiguration.title")}
        </h1>
        <button
          onClick={handleAddSegment}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#4E8476] hover:bg-[#3d6b5f] text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          {t("segmentConfiguration.addSegment")}
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        {/* Card Header with View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-gray-900">
            {t("segmentConfiguration.title")}
          </h2>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-[#4E8476] shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={t("segmentConfiguration.listView")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 4.16602H2.50792"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 10H2.50792"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.5 15.834H2.50792"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.66797 4.16602H17.5013"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.66797 10H17.5013"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.66797 15.834H17.5013"
                  stroke="currentColor"
                  strokeWidth="1.66667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "card"
                  ? "bg-white text-[#4E8476] shadow"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={t("segmentConfiguration.cardView")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.99744 2H2.99957C2.44752 2 2 2.44772 2 3V8C2 8.55228 2.44752 9 2.99957 9H7.99744C8.54949 9 8.99702 8.55228 8.99702 8V3C8.99702 2.44772 8.54949 2 7.99744 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M16.9935 2H11.9957C11.4436 2 10.9961 2.44772 10.9961 3V8C10.9961 8.55228 11.4436 9 11.9957 9H16.9935C17.5456 9 17.9931 8.55228 17.9931 8V3C17.9931 2.44772 17.5456 2 16.9935 2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M7.99744 11H2.99957C2.44752 11 2 11.4477 2 12V17C2 17.5523 2.44752 18 2.99957 18H7.99744C8.54949 18 8.99702 17.5523 8.99702 17V12C8.99702 11.4477 8.54949 11 7.99744 11Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M16.9935 11H11.9957C11.4436 11 10.9961 11.4477 10.9961 12V17C10.9961 17.5523 11.4436 18 11.9957 18H16.9935C17.5456 18 17.9931 17.5523 17.9931 17V12C17.9931 11.4477 17.5456 11 16.9935 11Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((segment) => (
              <div
                key={segment.segment_id}
                className="bg-white rounded-3xl shadow-[0_10px_35px_rgba(15,55,80,0.08)] border border-gray-100 p-6 transition-all duration-300 hover:shadow-[0_18px_45px_rgba(15,55,80,0.12)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {segment.segment_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {segment.segment_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[#4E8476]">
                    <button
                      type="button"
                      onClick={() => handleEditSegment(segment)}
                      className="rounded-full hover:bg-[#4E8476]/10 transition-colors p-1"
                      title={t("common.edit")}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_79_19294)">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M17.8384 9.74767C19.0575 8.52861 21.034 8.52861 22.253 9.74767C23.4721 10.9667 23.4721 12.9432 22.253 14.1623L15.9295 20.4858C15.5682 20.8471 15.3555 21.0598 15.119 21.2444C14.8401 21.4619 14.5384 21.6484 14.2191 21.8005C13.9482 21.9296 13.6629 22.0247 13.1781 22.1863L10.9574 22.9265L10.4227 23.1048C9.98896 23.2493 9.5108 23.1364 9.18753 22.8132C8.86426 22.4899 8.75139 22.0117 8.89596 21.578L9.81444 18.8226C9.976 18.3378 10.0711 18.0525 10.2002 17.7816C10.3523 17.4624 10.5388 17.1606 10.7563 16.8818C10.9409 16.6452 11.1536 16.4325 11.5149 16.0712L17.8384 9.74767ZM10.9343 21.8801L12.8287 21.2487C13.3561 21.0729 13.5802 20.9972 13.7889 20.8978C14.0426 20.7769 14.2823 20.6287 14.5039 20.4559C14.6862 20.3137 14.8541 20.147 15.2472 19.7539L20.2935 14.7076C19.7677 14.5222 19.0904 14.1785 18.4563 13.5444C17.8222 12.9103 17.4785 12.233 17.2931 11.7072L12.2468 16.7535C11.8537 17.1466 11.687 17.3145 11.5449 17.4968C11.372 17.7184 11.2238 17.9581 11.1029 18.2118C11.0035 18.4205 10.9279 18.6446 10.752 19.172L10.1206 21.0664L10.9343 21.8801ZM18.1042 10.8961C18.127 11.0127 18.1656 11.1713 18.2299 11.3566C18.3746 11.7739 18.6481 12.322 19.1634 12.8373C19.6787 13.3526 20.2268 13.6261 20.6441 13.7708C20.8294 13.8351 20.988 13.8737 21.1046 13.8965L21.5459 13.4552C22.3745 12.6267 22.3745 11.2833 21.5459 10.4548C20.7174 9.62624 19.3741 9.62624 18.5455 10.4548L18.1042 10.8961Z"
                            fill="#757575"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_79_19294">
                            <rect
                              width="16"
                              height="16"
                              fill="white"
                              transform="translate(8 8)"
                            />
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSegmentClick(segment)}
                      className="rounded-full hover:bg-red-50 transition-colors p-1"
                      title={t("common.delete")}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10.1133 6.66671C10.3878 5.88991 11.1287 5.33337 11.9995 5.33337C12.8703 5.33337 13.6111 5.88991 13.8857 6.66671"
                          stroke="#757575"
                          strokeLinecap="round"
                        />
                        <path
                          d="M17.6674 8H6.33398"
                          stroke="#757575"
                          strokeLinecap="round"
                        />
                        <path
                          d="M16.5545 9.66663L16.2478 14.266C16.1298 16.036 16.0708 16.9209 15.4942 17.4605C14.9175 18 14.0306 18 12.2567 18H11.7411C9.96726 18 9.08033 18 8.50365 17.4605C7.92698 16.9209 7.86798 16.036 7.74999 14.266L7.44336 9.66663"
                          stroke="#757575"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.334 11.3334L10.6673 14.6667"
                          stroke="#757575"
                          strokeLinecap="round"
                        />
                        <path
                          d="M13.6673 11.3334L13.334 14.6667"
                          stroke="#757575"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => handleToggleRequired(segment)}
                    className="inline-flex items-center gap-2 rounded-2xl py-2 text-sm font-semibold text-[#4E8476]"
                  >
                    <span
                      className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                        segment.segment_type_is_required
                          ? "bg-[#4E8476] border-[#4E8476]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {segment.segment_type_is_required && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 13 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4.5L4.5 8L12 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {t("segmentConfiguration.required")}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHierarchy(segment)}
                    className="inline-flex items-center gap-2 rounded-2xl py-2 text-sm font-semibold text-[#4E8476]"
                  >
                    <span
                      className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                        segment.segment_type_has_hierarchy
                          ? "bg-[#4E8476] border-[#4E8476]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {segment.segment_type_has_hierarchy && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 13 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1 4.5L4.5 8L12 1"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    {t("segmentConfiguration.hierarchy")}
                  </button>
                </div>

                <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                  {segment.description || t("common.noDescription")}
                </p>

                <div className="mt-3 flex items-center justify-between border-gray-100 pt-4">
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${
                      segment.segment_type_status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {segment.segment_type_status}
                  </span>
                  <div className="text-xs text-gray-500">
                    <div>
                      {t("segmentConfiguration.totalSegments")}:{" "}
                      {segment.total_segments}
                    </div>
                    <div>
                      {t("common.order")}: {segment.segment_type_display_order}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SharedTable
            columns={columns}
            data={segments as unknown as SharedTableRow[]}
            showFooter={false}
            maxHeight="600px"
            showActions={true}
            onDelete={(row) => {
              const segment = row as unknown as SegmentType;
              handleDeleteSegmentClick(segment);
            }}
            onEdit={(row) => {
              const segment = row as unknown as SegmentType;
              handleEditSegment(segment);
            }}
            showPagination={false}
          />
        )}
      </div>

      {/* Load Segments Buttons - Bottom Right */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleLoadSegments}
          disabled={isLoadingSegments}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#4E8476] hover:bg-[#3d6b5f] text-white rounded-lg transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingSegments ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t("common.loading")}
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              {t("segmentConfiguration.loadValues")}
            </>
          )}
        </button>

        <button
          onClick={handleLoadFundsClick}
          disabled={isLoadingFunds}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg transition-colors font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingFunds ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t("common.loading")}
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              {t("segmentConfiguration.loadFunds")}
            </>
          )}
        </button>
      </div>

      {/* Add/Edit Segment Modal */}
      <SharedModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={handleCloseModal}
        title={
          editingSegment
            ? t("segmentConfiguration.editSegment")
            : t("segmentConfiguration.addSegment")
        }
        size="lg"
      >
        <form onSubmit={handleSubmitSegment} className="p-6 space-y-6">
          {/* Segment Name */}
          <Input
            label={t("segmentConfiguration.segmentName")}
            placeholder={t("segmentConfiguration.enterSegmentName")}
            value={formData.segment_name}
            onChange={(e) =>
              setFormData({ ...formData, segment_name: e.target.value })
            }
            required
          />

          {/* Oracle Segment Number */}
          <Input
            label={t("segmentConfiguration.oracleNumber")}
            type="number"
            placeholder={t("common.enterValue")}
            value={formData.oracle_segment_number || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                oracle_segment_number: parseInt(e.target.value) || 0,
              })
            }
            required
            min={1}
          />

          {/* Display Order */}
          <Input
            label={t("tableColumns.displayOrder")}
            type="number"
            placeholder={t("common.enterValue")}
            value={formData.display_order || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                display_order: parseInt(e.target.value) || 0,
              })
            }
            required
            min={1}
          />

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#282828]">
              {t("segmentConfiguration.description")}
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              placeholder={t("common.enterDescription")}
              height={150}
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4">
            <Checkbox
              label={t("segmentConfiguration.required")}
              checked={formData.is_required === "True"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_required: e.target.checked ? "True" : "False",
                })
              }
            />

            <Checkbox
              label={t("segmentConfiguration.hierarchy")}
              checked={formData.has_hierarchy === "True"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  has_hierarchy: e.target.checked ? "True" : "False",
                })
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={isCreating || isUpdating}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isCreating || isUpdating}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating
                ? editingSegment
                  ? t("common.updating")
                  : t("common.creating")
                : editingSegment
                ? t("common.update")
                : t("common.create")}
            </Button>
          </div>
        </form>
      </SharedModal>

      {/* Delete Confirmation Modal */}
      <SharedModal
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        title={t("segmentConfiguration.deleteSegment")}
        size="md"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("segmentConfiguration.deleteConfirm")}
              </h3>
              {deletingSegment && (
                <p className="text-sm text-gray-600 mb-4">
                  {t("common.aboutToDelete")}{" "}
                  <span className="font-semibold text-gray-900">
                    "{deletingSegment.segment_name}"
                  </span>
                  . {t("common.cannotUndo")}
                </p>
              )}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>{t("common.warning")}:</strong>{" "}
                  {t("common.deleteWarning")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancelDelete}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </SharedModal>

      {/* Load Segments Result Modal */}
      <SharedModal
        isOpen={isLoadResultModalOpen}
        onClose={handleCloseLoadResultModal}
        title={t("segmentConfiguration.loadResultsTitle")}
        size="lg"
      >
        <div className="p-6 space-y-6">
          {loadResult && (
            <>
              {/* Success Message */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {loadResult.message}
                  </h3>
                </div>
              </div>

              {/* Results Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Records Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">
                        {t("segmentConfiguration.totalRecords")}
                      </p>
                      <p className="text-3xl font-bold text-blue-900">
                        {loadResult.total_records.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Created Count Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        {t("common.created")}
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {loadResult.created_count.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Skipped Count Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 mb-1">
                        {t("common.skipped")}
                      </p>
                      <p className="text-3xl font-bold text-yellow-900">
                        {loadResult.skipped_count.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#4E8476]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t("common.summary")}
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    • Successfully processed{" "}
                    <span className="font-semibold text-[#4E8476]">
                      {loadResult.total_records.toLocaleString()}
                    </span>{" "}
                    segments from control budgets
                  </p>
                  <p>
                    • Created{" "}
                    <span className="font-semibold text-green-600">
                      {loadResult.created_count.toLocaleString()}
                    </span>{" "}
                    new segment entries
                  </p>
                  {loadResult.skipped_count > 0 && (
                    <p>
                      • Skipped{" "}
                      <span className="font-semibold text-yellow-600">
                        {loadResult.skipped_count.toLocaleString()}
                      </span>{" "}
                      duplicate or invalid entries
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="primary"
              onClick={handleCloseLoadResultModal}
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </SharedModal>

      {/* Period Input Modal */}
      <SharedModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title={t("segmentConfiguration.loadFunds")}
        size="md"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("segmentConfiguration.period")}
            </label>
            <Input
              type="text"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              placeholder={t("segmentConfiguration.selectPeriod")}
              className="w-full"
            />
            <p className="mt-2 text-sm text-gray-500">
              {t("common.periodFormat")}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPeriodModalOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleLoadFunds}
              loading={isLoadingFunds}
            >
              {t("segmentConfiguration.loadFunds")}
            </Button>
          </div>
        </div>
      </SharedModal>

      {/* Load Funds Result Modal */}
      <SharedModal
        isOpen={isLoadFundsModalOpen}
        onClose={() => setIsLoadFundsModalOpen(false)}
        title={t("segmentConfiguration.loadFundsTitle")}
        size="lg"
      >
        <div className="p-6 space-y-6">
          {loadFundsResult && (
            <>
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      {loadFundsResult.message}
                    </h4>
                    <p className="text-sm text-green-700">
                      Successfully processed {loadFundsResult.total_success} out
                      of{" "}
                      {loadFundsResult.total_success +
                        loadFundsResult.total_failed}{" "}
                      control budgets
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Success Count Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">
                        {t("common.successful")}
                      </p>
                      <p className="text-3xl font-bold text-green-900">
                        {loadFundsResult.total_success}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Failed Count Card */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">
                        {t("common.failed")}
                      </p>
                      <p className="text-3xl font-bold text-red-900">
                        {loadFundsResult.total_failed}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("common.controlBudget")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("tableColumns.status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("common.message")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadFundsResult.results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {result.control_budget}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.success ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {t("common.success")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {t("common.failed")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {result.message}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-[#4E8476]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {t("common.summary")}
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    • Successfully downloaded funds data for{" "}
                    <span className="font-semibold text-green-600">
                      {loadFundsResult.total_success}
                    </span>{" "}
                    control budget(s)
                  </p>
                  {loadFundsResult.total_failed > 0 && (
                    <p>
                      • Failed to download for{" "}
                      <span className="font-semibold text-red-600">
                        {loadFundsResult.total_failed}
                      </span>{" "}
                      control budget(s)
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsLoadFundsModalOpen(false)}
            >
              {t("common.close")}
            </Button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
