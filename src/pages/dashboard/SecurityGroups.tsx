import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Users, Shield, Lock } from "lucide-react";
import {
  useGetSecurityGroupsQuery,
  useCreateSecurityGroupMutation,
  useDeleteSecurityGroupMutation,
  useDeleteSecurityGroupPermanentMutation,
} from "@/api/securityGroups.api";
import { Button } from "@/components/ui";
import { toast } from "react-hot-toast";
import GroupDetailsPanel from "./components/GroupDetailsPanel.tsx";
import CreateGroupModal from "./components/CreateGroupModal.tsx";

export default function SecurityGroups() {
  const { t } = useTranslation();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: groupsData, isLoading, refetch } = useGetSecurityGroupsQuery();
  const [createGroup] = useCreateSecurityGroupMutation();
  const [deleteGroup] = useDeleteSecurityGroupMutation();
  const [deleteGroupPermanent] = useDeleteSecurityGroupPermanentMutation();

  const groups = groupsData?.groups || [];
  const totalGroups = groupsData?.total_groups || 0;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const activeGroups = groups.filter((g) => g.is_active);
  const totalMembers = groups.reduce((sum, g) => sum + g.total_members, 0);
  const totalSegments = groups.reduce((sum, g) => sum + g.total_segments, 0);

  const handleCreateGroup = async (data: {
    group_name: string;
    description: string;
    is_active: boolean;
  }) => {
    try {
      await createGroup(data).unwrap();
      toast.success(t("securityGroups.groupCreatedSuccess"));
      setIsCreateModalOpen(false);
      refetch();
    } catch {
      toast.error(t("securityGroups.groupCreatedError"));
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm(t("securityGroups.confirmDeactivateGroup"))) return;

    try {
      await deleteGroup(groupId).unwrap();
      toast.success(t("securityGroups.groupDeactivated"));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
      refetch();
    } catch {
      toast.error(t("securityGroups.groupDeactivatedError"));
    }
  };

  const handleDeleteGroupPermanent = async (groupId: number, groupName: string) => {
    if (!window.confirm(t("securityGroups.confirmDeleteGroupPermanent", { name: groupName }))) return;

    try {
      await deleteGroupPermanent(groupId).unwrap();
      toast.success(t("securityGroups.groupDeletedPermanent"));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(null);
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t("securityGroups.groupDeletedError"));
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Shield className="h-8 w-8 text-[#4E8476]" />
              {t("securityGroups.title")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("securityGroups.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] hover:from-[#3d6a5e] hover:to-[#2d5246] text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("securityGroups.createGroup")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-gradient-to-br from-[#4E8476] to-[#3d6a5e] rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t("securityGroups.totalGroups")}</p>
                <h3 className="text-3xl font-bold mt-1">{totalGroups}</h3>
              </div>
              <Shield className="h-10 w-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t("securityGroups.activeGroups")}</p>
                <h3 className="text-3xl font-bold mt-1">{activeGroups.length}</h3>
              </div>
              <Lock className="h-10 w-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t("securityGroups.totalMembers")}</p>
                <h3 className="text-3xl font-bold mt-1">{totalMembers}</h3>
              </div>
              <Users className="h-10 w-10 text-white/30" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{t("securityGroups.totalSegments")}</p>
                <h3 className="text-3xl font-bold mt-1">{totalSegments}</h3>
              </div>
              <Shield className="h-10 w-10 text-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#4E8476]" />
            {t("securityGroups.groupsList")}
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t("securityGroups.noGroups")}</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 bg-[#4E8476] text-white"
              >
                {t("securityGroups.createFirstGroup")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedGroupId === group.id
                      ? "border-[#4E8476] bg-[#4E8476]/5 shadow-md"
                      : "border-gray-200 hover:border-[#4E8476]/50 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {group.group_name}
                        {group.is_active ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                            {t("securityGroups.active")}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                            {t("securityGroups.inactive")}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {group.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {group.total_members}
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {group.total_segments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Details Panel */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <GroupDetailsPanel
              group={selectedGroup}
              onDelete={handleDeleteGroup}
              onDeletePermanent={handleDeleteGroupPermanent}
              onUpdate={refetch}
            />
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
              <Shield className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("securityGroups.selectGroup")}
              </h3>
              <p className="text-gray-500">
                {t("securityGroups.selectGroupDescription")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}
