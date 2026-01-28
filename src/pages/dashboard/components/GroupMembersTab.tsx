import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Lock, Check, Edit } from "lucide-react";
import {
  useGetGroupMembersQuery,
  useRemoveGroupMemberMutation,
} from "@/api/securityGroups.api";
import { Button } from "@/components/ui";
import { toast } from "react-hot-toast";
import AddMemberModal from "./AddMemberModal.tsx";
import EditMemberModal from "./EditMemberModal.tsx";

interface GroupMembersTabProps {
  groupId: number;
  onUpdate: () => void;
}

export default function GroupMembersTab({ groupId, onUpdate }: GroupMembersTabProps) {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{
    membershipId: number;
    data: any;
  } | null>(null);
  const { data: membersData, isLoading } = useGetGroupMembersQuery(groupId);
  const [removeMember] = useRemoveGroupMemberMutation();

  const members = membersData?.members || [];

  const handleRemoveMember = async (membershipId: number) => {
    if (!window.confirm(t("securityGroups.confirmRemoveMember"))) return;

    try {
      await removeMember({ groupId, membershipId }).unwrap();
      toast.success(t("securityGroups.memberRemovedSuccess"));
      onUpdate();
    } catch {
      toast.error(t("securityGroups.memberRemovedError"));
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
          {t("securityGroups.groupMembers")}
        </h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[var(--color-primary)] text-white hover:bg-[#3d6a5e]"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("securityGroups.addMember")}
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Lock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t("securityGroups.noMembers")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.membership_id}
              className="p-4 border-2 border-gray-200 rounded-xl hover:border-[var(--color-primary)]/50 transition-all bg-gradient-to-r from-white to-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800 text-lg">
                      {member.username}
                    </h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {member.user_role}
                    </span>
                  </div>
                  {member.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      📝 {member.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {member.assigned_roles && member.assigned_roles.length > 0 ? (
                      member.assigned_roles.map((role) => (
                        <span
                          key={role.security_group_role_id}
                          className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full"
                        >
                          👤 {role.role_name}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {t("securityGroups.noRoles")}
                      </span>
                    )}
                  </div>
                  {member.access_mode === "restricted_segments" && member.specific_segments_count > 0 ? (
                    <div className="mt-2 px-3 py-2 bg-yellow-50 border-l-4 border-yellow-400 rounded inline-block">
                      <p className="text-xs text-yellow-800 font-semibold flex items-center gap-1">
                        🔒 {t("securityGroups.customSegments")}: {member.specific_segments_count} segments
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 px-3 py-2 bg-emerald-50 border-l-4 border-emerald-400 rounded inline-block">
                      <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> {t("securityGroups.allGroupSegments")}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setEditingMember({ membershipId: member.membership_id, data: member })}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    title={t("securityGroups.editMember")}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleRemoveMember(member.membership_id)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    title={t("securityGroups.removeMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddMemberModal
        groupId={groupId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={onUpdate}
      />

      {editingMember && (
        <EditMemberModal
          groupId={groupId}
          membershipId={editingMember.membershipId}
          currentMember={editingMember.data}
          isOpen={true}
          onClose={() => setEditingMember(null)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
