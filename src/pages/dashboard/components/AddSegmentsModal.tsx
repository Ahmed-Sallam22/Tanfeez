import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Layers, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useGetAvailableSegmentsQuery,
  useAddGroupSegmentsMutation,
} from "@/api/securityGroups.api";
import { toast } from "react-hot-toast";

interface AddSegmentsModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSegmentsModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: AddSegmentsModalProps) {
  const { t } = useTranslation();
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: availableSegmentsData, isLoading } =
    useGetAvailableSegmentsQuery({ groupId });
  const [addSegments, { isLoading: adding }] = useAddGroupSegmentsMutation();

  const segments = availableSegmentsData?.segment_types.flatMap(type => type.segments) || [];

  // Group segments by type
  interface SegmentGroup {
    segment_type_id: number;
    segment_type_name: string;
    segments: typeof segments;
  }
  const segmentGroups = segments.reduce((acc: Record<number, SegmentGroup>, segment) => {
    const typeId = segment.segment_type_id;
    if (!acc[typeId]) {
      acc[typeId] = {
        segment_type_id: typeId,
        segment_type_name: segment.segment_type_name,
        segments: [],
      };
    }
    acc[typeId].segments.push(segment);
    return acc;
  }, {});

  // Filter segments by search term
  const filteredGroups = Object.values(segmentGroups).map((group) => ({
    ...group,
    segments: group.segments.filter(
      (seg) =>
        seg.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seg.alias.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((group) => group.segments.length > 0);

  const toggleSegment = (segmentId: number) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
  };

  const toggleAllInGroup = (groupSegments: Array<{ id: number }>) => {
    const groupIds = groupSegments.map((seg) => seg.id);
    const allSelected = groupIds.every((id) => selectedSegments.includes(id));

    if (allSelected) {
      setSelectedSegments((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelectedSegments((prev) => [...new Set([...prev, ...groupIds])]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSegments.length === 0) {
      toast.error(t("securityGroups.selectSegmentError"));
      return;
    }

    try {
      // Group selected segments by type
      const segmentsByType = selectedSegments.reduce((acc: Record<number, number[]>, segmentId) => {
        const segment = segments.find(s => s.id === segmentId);
        if (segment) {
          const typeId = segment.segment_type_id;
          if (!acc[typeId]) acc[typeId] = [];
          acc[typeId].push(segmentId);
        }
        return acc;
      }, {});

      await addSegments({
        groupId,
        data: {
          segment_assignments: Object.entries(segmentsByType).map(([typeId, segmentIds]) => ({
            segment_type_id: Number(typeId),
            segment_codes: segments.filter(s => segmentIds.includes(s.id)).map(s => s.code),
          })),
        },
      }).unwrap();

      toast.success(t("securityGroups.segmentsAddedSuccess"));
      onSuccess();
      onClose();
      setSelectedSegments([]);
      setSearchTerm("");
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      toast.error(err?.data?.error || t("securityGroups.segmentsAddedError"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--color-primary)] to-[#3d6a5e] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">{t("securityGroups.addSegments")}</h2>
              {selectedSegments.length > 0 && (
                <p className="text-sm text-white/80">
                  {selectedSegments.length} {t("securityGroups.selected")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("securityGroups.searchSegments")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Segments List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : segments.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t("securityGroups.noAvailableSegments")}</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">{t("securityGroups.noMatchingSegments")}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredGroups.map((group) => {
                const groupIds = group.segments.map((seg) => seg.id);
                const allSelected = groupIds.every((id: number) =>
                  selectedSegments.includes(id)
                );
                const someSelected = groupIds.some((id: number) =>
                  selectedSegments.includes(id)
                );

                return (
                  <div
                    key={group.segment_type_id}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden"
                  >
                    {/* Group Header */}
                    <div className="bg-gradient-to-r from-[var(--color-primary)]/10 to-[#3d6a5e]/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-[var(--color-primary)]" />
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {group.segment_type_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {group.segments.length} {t("securityGroups.available")}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleAllInGroup(group.segments)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            allSelected
                              ? "bg-[var(--color-primary)] text-white hover:bg-[#3d6a5e]"
                              : someSelected
                              ? "bg-[var(--color-primary)]/50 text-white hover:bg-[var(--color-primary)]"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {allSelected
                            ? t("securityGroups.deselectAll")
                            : t("securityGroups.selectAll")}
                        </button>
                      </div>
                    </div>

                    {/* Segments Grid */}
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.segments.map((segment) => (
                        <label
                          key={segment.id}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedSegments.includes(segment.id)
                              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                              : "border-gray-200 hover:border-[var(--color-primary)]/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSegments.includes(segment.id)}
                            onChange={() => toggleSegment(segment.id)}
                            className="w-5 h-5 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {segment.code}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {segment.alias}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex items-center justify-between border-t">
          <div className="text-sm text-gray-600">
            {selectedSegments.length > 0 && (
              <>
                {selectedSegments.length} {t("securityGroups.segmentsSelected")}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={adding || selectedSegments.length === 0}
              className="bg-[var(--color-primary)] text-white hover:bg-[#3d6a5e] disabled:opacity-50"
            >
              {adding
                ? t("common.adding")
                : `${t("securityGroups.addSegments")} (${selectedSegments.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
