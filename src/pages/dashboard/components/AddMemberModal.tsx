import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useGetAvailableUsersQuery,
  useGetGroupRolesQuery,
  useAddGroupMemberMutation,
  useGetGroupSegmentsQuery,
} from "@/api/securityGroups.api";
import { toast } from "react-hot-toast";

interface AddMemberModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [accessMode, setAccessMode] = useState<"all_group_segments" | "restricted_segments">(
    "all_group_segments"
  );
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [notes, setNotes] = useState("");

  const { data: availableUsers, isLoading: usersLoading } =
    useGetAvailableUsersQuery({ groupId }, { skip: !isOpen });
  const { data: rolesData, isLoading: rolesLoading } = useGetGroupRolesQuery(groupId, { skip: !isOpen });
  const { data: segmentsData, isLoading: segmentsLoading } =
    useGetGroupSegmentsQuery(groupId, { skip: !isOpen });
  const [addMember, { isLoading: adding }] = useAddGroupMemberMutation();

  const users = availableUsers?.users || [];
  const roles = rolesData?.roles || [];
  const segments = segmentsData?.segments || [];

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('AddMemberModal opened');
      console.log('Available users:', availableUsers);
      console.log('Roles data:', rolesData);
      console.log('Segments data:', segmentsData);
    }
  }, [isOpen, availableUsers, rolesData, segmentsData]);

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

  const toggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleSegment = (segmentId: number) => {
    setSelectedSegments((prev) =>
      prev.includes(segmentId) ? prev.filter((id) => id !== segmentId) : [...prev, segmentId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error(t("securityGroups.selectUserError"));
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error(t("securityGroups.selectRoleError"));
      return;
    }

    if (accessMode === "restricted_segments" && selectedSegments.length === 0) {
      toast.error(t("securityGroups.selectSegmentError"));
      return;
    }

    try {
      await addMember({
        groupId,
        data: {
          user_id: selectedUserId,
          role_ids: selectedRoles,
          access_mode: accessMode,
          specific_segment_ids: accessMode === "restricted_segments" ? selectedSegments : undefined,
          notes,
        },
      }).unwrap();

      toast.success(t("securityGroups.memberAddedSuccess"));
      onSuccess();
      onClose();
      resetForm();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      toast.error(err?.data?.error || t("securityGroups.memberAddedError"));
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setSelectedRoles([]);
    setAccessMode("all_group_segments");
    setSelectedSegments([]);
    setNotes("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{t("securityGroups.addMember")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.selectUser")} *
            </label>
            {usersLoading ? (
              <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
            ) : users.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
                {t("securityGroups.noAvailableUsers")}
              </div>
            ) : (
              <select
                value={selectedUserId || ""}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4E8476] focus:outline-none"
              >
                <option value="">{t("securityGroups.selectUser")}</option>
                {users.map((user: { id: number; username: string; role_name: string }) => (
                  <option key={user.id} value={user.id}>
                    {user.username} - {user.role_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.assignRoles")} *
            </label>
            {rolesLoading ? (
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ) : roles.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
                {t("securityGroups.noRolesAvailable")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`p-4 border-2 rounded-xl transition-all text-left ${
                      selectedRoles.includes(role.id)
                        ? "border-[#4E8476] bg-[#4E8476]/10"
                        : "border-gray-200 hover:border-[#4E8476]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#4E8476]" />
                        <span className="font-medium">{role.role_name}</span>
                      </div>
                      {selectedRoles.includes(role.id) && (
                        <div className="h-5 w-5 bg-[#4E8476] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Access Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.segmentAccess")} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccessMode("all_group_segments")}
                className={`p-4 border-2 rounded-xl transition-all ${
                  accessMode === "all_group_segments"
                    ? "border-[#4E8476] bg-[#4E8476]/10"
                    : "border-gray-200 hover:border-[#4E8476]/50"
                }`}
              >
                <div className="font-medium">{t("securityGroups.allGroupSegments")}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {t("securityGroups.accessAllSegments")}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccessMode("restricted_segments")}
                className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                  accessMode === "restricted_segments"
                    ? "border-[#4E8476] bg-[#4E8476]/10"
                    : "border-gray-200 hover:border-[#4E8476]/50"
                }`}
              >
                <div className="font-medium">{t("securityGroups.specificSegments")}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {t("securityGroups.restrictAccess")}
                </div>
              </button>
            </div>
          </div>

          {/* Specific Segments Selection */}
          {accessMode === "restricted_segments" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("securityGroups.selectSpecificSegments")} *
              </label>
              {segmentsLoading ? (
                <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
              ) : segments.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-500">
                  {t("securityGroups.noSegmentsAvailable")}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-4 border-2 border-gray-200 rounded-xl p-4">
                  {Object.values(segmentGroups).map((group) => (
                    <div key={group.segment_type_id}>
                      <div className="text-sm font-semibold text-gray-700 mb-2">
                        {group.segment_type_name}
                      </div>
                      <div className="space-y-2 pl-4">
                        {group.segments.map((segment) => (
                          <label
                            key={segment.id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedSegments.includes(segment.id)}
                              onChange={() => toggleSegment(segment.id)}
                              className="w-4 h-4 text-[#4E8476] rounded focus:ring-[#4E8476]"
                            />
                            <span className="text-sm">
                              {segment.segment_code} - {segment.segment_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              rows={3}
              placeholder={t("securityGroups.addNotesPlaceholder")}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4E8476] focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex items-center justify-end gap-3 border-t">
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={adding || !selectedUserId || selectedRoles.length === 0}
            className="bg-[#4E8476] text-white hover:bg-[#3d6a5e] disabled:opacity-50"
          >
            {adding ? t("common.adding") : t("securityGroups.addMember")}
          </Button>
        </div>
      </div>
    </div>
  );
}
