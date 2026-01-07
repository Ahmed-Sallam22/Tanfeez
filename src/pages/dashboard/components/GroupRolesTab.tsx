import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Plus, Trash2, Clock, Settings, CheckCircle, XCircle } from "lucide-react";
import {
  useGetGroupRolesQuery,
  useDeleteGroupRoleMutation,
  useActivateGroupRoleMutation,
  useDeleteGroupRolePermanentMutation,
} from "@/api/securityGroups.api";
import toast from "react-hot-toast";
import AddRoleModal from "./AddRoleModal.tsx";
import ManageAbilitiesModal from "./ManageAbilitiesModal.tsx";

interface GroupRolesTabProps {
  groupId: number;
  onUpdate?: () => void;
}

export default function GroupRolesTab({ groupId, onUpdate }: GroupRolesTabProps) {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAbilitiesModalOpen, setIsAbilitiesModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: number; name: string } | null>(null);
  const { data: roles, isLoading } = useGetGroupRolesQuery(groupId);
  const [deleteRole] = useDeleteGroupRoleMutation();
  const [activateRole] = useActivateGroupRoleMutation();
  const [deleteRolePermanent] = useDeleteGroupRolePermanentMutation();

  const handleDeactivateRole = async (roleId: number) => {
    if (confirm(t("securityGroups.confirmDeactivate"))) {
      try {
        await deleteRole({ groupId, roleId }).unwrap();
        toast.success(t("securityGroups.roleDeactivated"));
        onUpdate?.();
      } catch {
        toast.error("Failed to deactivate role");
      }
    }
  };

  const handleActivateRole = async (roleId: number) => {
    try {
      await activateRole({ groupId, roleId }).unwrap();
      toast.success(t("securityGroups.roleActivated"));
      onUpdate?.();
    } catch (error: any) {
      toast.error(error?.data?.error || "Failed to activate role");
    }
  };

  const handleDeletePermanent = async (roleId: number, roleName: string) => {
    if (confirm(t("securityGroups.confirmDeletePermanent", { name: roleName }))) {
      try {
        await deleteRolePermanent({ groupId, roleId }).unwrap();
        toast.success(t("securityGroups.roleDeletedPermanent"));
        onUpdate?.();
      } catch (error: any) {
        toast.error(error?.data?.message || "Failed to delete role permanently");
      }
    }
  };

  const handleManageAbilities = (roleId: number, roleName: string) => {
    setSelectedRole({ id: roleId, name: roleName });
    setIsAbilitiesModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t("loading")}...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          {t("securityGroups.roles")}
        </h3>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Plus size={18} />
          {t("securityGroups.createRole")}
        </button>
      </div>

      {!roles?.roles?.length ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <Shield className="mx-auto mb-3 text-gray-400" size={48} />
          <p className="text-gray-600">{t("securityGroups.noRoles")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.roles.map((role) => (
            <div
              key={role.id}
              className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#4E8476]/50 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={18} className="text-[#4E8476]" />
                    <h4 className="font-semibold text-gray-800">
                      {role.role_name}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        role.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {role.is_active
                        ? t("securityGroups.active")
                        : t("securityGroups.inactive")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>{t("securityGroups.addedAt")}: {new Date(role.added_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManageAbilities(role.id, role.role_name)}
                    className="p-2 text-[#4E8476] hover:bg-[#4E8476]/10 rounded-lg transition-colors"
                    title={t("securityGroups.manageAbilities")}
                  >
                    <Settings size={18} />
                  </button>
                  {!role.is_active ? (
                    <button
                      onClick={() => handleActivateRole(role.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title={t("securityGroups.activateRole")}
                    >
                      <CheckCircle size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivateRole(role.id)}
                      className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      title={t("securityGroups.deactivateRole")}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePermanent(role.id, role.role_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t("securityGroups.deletePermanent")}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddRoleModal
        groupId={groupId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => onUpdate?.()}
      />

      {selectedRole && (
        <ManageAbilitiesModal
          groupId={groupId}
          roleId={selectedRole.id}
          roleName={selectedRole.name}
          isOpen={isAbilitiesModalOpen}
          onClose={() => {
            setIsAbilitiesModalOpen(false);
            setSelectedRole(null);
          }}
          onSuccess={() => onUpdate?.()}
        />
      )}
    </div>
  );
}
