import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, Trash2, Users, Shield, Key, XCircle } from "lucide-react";
import type { SecurityGroup } from "@/api/securityGroups.api";
import { Button } from "@/components/ui";
import GroupMembersTab from "./GroupMembersTab.tsx";
import GroupSegmentsTab from "./GroupSegmentsTab.tsx";
import GroupRolesTab from "./GroupRolesTab.tsx";

interface GroupDetailsPanelProps {
  group: SecurityGroup;
  onDelete: (groupId: number) => void;
  onDeletePermanent: (groupId: number, groupName: string) => void;
  onUpdate: () => void;
}

export default function GroupDetailsPanel({
  group,
  onDelete,
  onDeletePermanent,
  onUpdate,
}: GroupDetailsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"members" | "segments" | "roles">("members");

  const tabs = [
    { id: "members" as const, label: t("securityGroups.members"), icon: Users, count: group.total_members },
    { id: "segments" as const, label: t("securityGroups.segments"), icon: Shield, count: group.total_segments },
    { id: "roles" as const, label: t("securityGroups.roles"), icon: Key, count: group.total_roles },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{group.group_name}</h2>
            <p className="text-white/90">{group.description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="px-3 py-1 bg-white/20 rounded-full">
                {group.is_active ? t("securityGroups.active") : t("securityGroups.inactive")}
              </span>
              <span className="text-white/80">
                {t("securityGroups.createdAt")}: {new Date(group.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {/* TODO: Implement edit */}}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
              title={t("securityGroups.edit")}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete(group.id)}
              className="bg-orange-500/20 hover:bg-orange-500/30 text-white border-0"
              title={t("securityGroups.deactivate")}
            >
              <XCircle className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDeletePermanent(group.id, group.group_name)}
              className="bg-red-500/20 hover:bg-red-500/30 text-white border-0"
              title={t("securityGroups.deletePermanent")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all relative ${
                activeTab === tab.id
                  ? "text-[#4E8476] bg-white border-b-2 border-[#4E8476]"
                  : "text-gray-600 hover:text-[#4E8476] hover:bg-gray-100"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? "bg-[#4E8476]/10 text-[#4E8476]"
                  : "bg-gray-200 text-gray-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "members" && (
          <GroupMembersTab groupId={group.id} onUpdate={onUpdate} />
        )}
        {activeTab === "segments" && (
          <GroupSegmentsTab groupId={group.id} onUpdate={onUpdate} />
        )}
        {activeTab === "roles" && (
          <GroupRolesTab groupId={group.id} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}
