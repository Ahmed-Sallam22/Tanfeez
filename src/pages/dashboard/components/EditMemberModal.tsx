import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import {
  useGetGroupRolesQuery,
  useGetGroupSegmentsQuery,
  useUpdateGroupMemberMutation,
} from "@/api/securityGroups.api";
import { Button } from "@/components/ui";
import { toast } from "react-hot-toast";

interface EditMemberModalProps {
  groupId: number;
  membershipId: number;
  currentMember: {
    username: string;
    assigned_roles: Array<{ security_group_role_id: number; role_name: string }>;
    access_mode: "all_group_segments" | "restricted_segments";
    specific_segments_count: number;
    notes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMemberModal({
  groupId,
  membershipId,
  currentMember,
  isOpen,
  onClose,
  onSuccess,
}: EditMemberModalProps) {
  const { t } = useTranslation();
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [accessMode, setAccessMode] = useState<"all_group_segments" | "restricted_segments">("all_group_segments");
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  const { data: rolesData } = useGetGroupRolesQuery(groupId);
  const { data: segmentsData } = useGetGroupSegmentsQuery(groupId);
  const [updateMember, { isLoading }] = useUpdateGroupMemberMutation();

  const groupRoles = rolesData?.roles || [];
  const groupSegments = segmentsData?.segments || [];

  // Initialize form with current values when modal opens
  useEffect(() => {
    if (isOpen && currentMember) {
      const roleIds = currentMember.assigned_roles?.map((r) => r.security_group_role_id) || [];
      setSelectedRoleIds(roleIds);
      setAccessMode(currentMember.access_mode || 'all_group_segments');
      setSelectedSegmentIds([]);
      setNotes(currentMember.notes || "");
    }
  }, [isOpen, currentMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoleIds.length < 1 || selectedRoleIds.length > 2) {
      toast.error(t("securityGroups.selectRoleError"));
      return;
    }

    if (accessMode === "restricted_segments" && selectedSegmentIds.length === 0) {
      toast.error(t("securityGroups.selectSegmentError"));
      return;
    }

    try {
      await updateMember({
        groupId,
        membershipId,
        data: {
          role_ids: selectedRoleIds,
          access_mode: accessMode,
          segment_assignment_ids: accessMode === "restricted_segments" ? selectedSegmentIds : undefined,
          notes,
        },
      }).unwrap();

      toast.success(t("securityGroups.memberUpdatedSuccess"));
      onSuccess();
      onClose();
    } catch {
      toast.error(t("securityGroups.memberUpdatedError"));
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSegment = (segmentId: number) => {
    setSelectedSegmentIds((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {t("securityGroups.editMember")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t("securityGroups.editing")}: <strong>{currentMember.username}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.assignRoles")} *
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {t("securityGroups.select1To2Roles")}
            </p>
            {groupRoles.length === 0 ? (
              <p className="text-sm text-gray-500">{t("securityGroups.noRolesAvailable")}</p>
            ) : (
              <div className="space-y-2">
                {groupRoles.map((role) => {
                  const isChecked = selectedRoleIds.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4E8476] transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(role.id)}
                        disabled={
                          !selectedRoleIds.includes(role.id) &&
                          selectedRoleIds.length >= 2
                        }
                        className="h-4 w-4 text-[#4E8476] focus:ring-[#4E8476]"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{role.role_name}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Segment Access Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.segmentAccess")} *
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4E8476] transition-all">
                <input
                  type="radio"
                  name="accessMode"
                  value="all_group_segments"
                  checked={accessMode === "all_group_segments"}
                  onChange={() => setAccessMode("all_group_segments")}
                  className="h-4 w-4 text-[#4E8476] focus:ring-[#4E8476]"
                />
                <span className="text-sm font-medium text-gray-800">
                  {t("securityGroups.accessAllSegments")}
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#4E8476] transition-all">
                <input
                  type="radio"
                  name="accessMode"
                  value="restricted_segments"
                  checked={accessMode === "restricted_segments"}
                  onChange={() => setAccessMode("restricted_segments")}
                  className="h-4 w-4 text-[#4E8476] focus:ring-[#4E8476]"
                />
                <span className="text-sm font-medium text-gray-800">
                  {t("securityGroups.restrictAccess")}
                </span>
              </label>
            </div>
          </div>

          {/* Specific Segments Selection (if restricted) */}
          {accessMode === "restricted_segments" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("securityGroups.selectSpecificSegments")} *
              </label>
              {groupSegments.length === 0 ? (
                <p className="text-sm text-gray-500">{t("securityGroups.noSegmentsAvailable")}</p>
              ) : (
                <div className="border-2 border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                  {groupSegments.map((segment) => (
                    <label
                      key={segment.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSegmentIds.includes(segment.id)}
                        onChange={() => toggleSegment(segment.id)}
                        className="h-4 w-4 text-[#4E8476] focus:ring-[#4E8476]"
                      />
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {segment.segment_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {segment.segment_type_name}: {segment.segment_code}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {selectedSegmentIds.length} {t("securityGroups.selected")}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("securityGroups.addNotesPlaceholder")}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4E8476] focus:border-[#4E8476] transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#4E8476] text-white hover:bg-[#3d6a5e] disabled:opacity-50"
            >
              {isLoading ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
