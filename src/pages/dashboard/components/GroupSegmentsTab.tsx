import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Shield, Power, PowerOff } from "lucide-react";
import {
  useGetGroupSegmentsQuery,
  useToggleGroupSegmentMutation,
  useRemoveGroupSegmentMutation,
} from "@/api/securityGroups.api";
import { Button } from "@/components/ui";
import { toast } from "react-hot-toast";
import AddSegmentsModal from "./AddSegmentsModal.tsx";

interface GroupSegmentsTabProps {
  groupId: number;
  onUpdate: () => void;
}

export default function GroupSegmentsTab({ groupId, onUpdate }: GroupSegmentsTabProps) {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: segmentsData, isLoading } = useGetGroupSegmentsQuery(groupId);
  const [toggleSegment] = useToggleGroupSegmentMutation();
  const [removeSegment] = useRemoveGroupSegmentMutation();

  const segments = segmentsData?.segments || [];

  // Group segments by segment type
  const groupedSegments = segments.reduce((acc, segment) => {
    const typeId = segment.segment_type_id;
    if (!acc[typeId]) {
      acc[typeId] = {
        segment_type_id: typeId,
        segment_type_name: segment.segment_type_name,
        segments: []
      };
    }
    acc[typeId].segments.push(segment);
    return acc;
  }, {} as Record<number, { segment_type_id: number; segment_type_name: string; segments: typeof segments }>);

  const segmentGroups = Object.values(groupedSegments);

  const handleToggleSegment = async (accessId: number, currentStatus: boolean) => {
    const action = currentStatus ? t("securityGroups.deactivate") : t("securityGroups.activate");
    if (!window.confirm(`${t("securityGroups.confirmToggleSegment")} (${action})?`)) return;

    try {
      await toggleSegment({ groupId, accessId }).unwrap();
      toast.success(t("securityGroups.segmentToggleSuccess"));
      onUpdate();
    } catch {
      toast.error(t("securityGroups.segmentToggleError"));
    }
  };

  const handleRemoveSegment = async (accessId: number) => {
    if (!window.confirm(t("securityGroups.confirmDeleteSegment"))) return;

    try {
      await removeSegment({ groupId, accessId }).unwrap();
      toast.success(t("securityGroups.segmentDeletedSuccess"));
      onUpdate();
    } catch {
      toast.error(t("securityGroups.segmentDeletedError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("securityGroups.groupSegments")}
        </h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4E8476] text-white hover:bg-[#3d6a5e]"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("securityGroups.addSegments")}
        </Button>
      </div>

      {segments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t("securityGroups.noSegments")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {segmentGroups.map((group) => (
            <div key={group.segment_type_id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 overflow-hidden">
              {/* Segment Type Header */}
              <div className="bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] px-4 py-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-white" />
                  <h4 className="text-white font-bold text-lg">
                    {group.segment_type_name}
                  </h4>
                  <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                    {group.segments.length} {group.segments.length === 1 ? t("securityGroups.segment") : t("securityGroups.segments")}
                  </span>
                </div>
              </div>

              {/* Segments List */}
              <div className="p-4 space-y-3">
                {group.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-[#4E8476]/50 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-800 text-lg">
                            {segment.segment_code}
                          </span>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-700">
                            {segment.segment_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            segment.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {segment.is_active ? t("securityGroups.active") : t("securityGroups.inactive")}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{t("securityGroups.addedAt")}: {new Date(segment.added_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleToggleSegment(segment.id, segment.is_active)}
                          className={`${
                            segment.is_active
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-green-500 hover:bg-green-600"
                          } text-white`}
                          title={segment.is_active ? t("securityGroups.deactivate") : t("securityGroups.activate")}
                        >
                          {segment.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                        <Button
                          onClick={() => handleRemoveSegment(segment.id)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          title={t("securityGroups.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddSegmentsModal
        groupId={groupId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={onUpdate}
      />
    </div>
  );
}
