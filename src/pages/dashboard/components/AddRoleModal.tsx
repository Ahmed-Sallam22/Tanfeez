import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, ShieldPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useGetSystemRolesQuery,
  useCreateGroupRoleMutation,
} from "@/api/securityGroups.api";
import { toast } from "react-hot-toast";

interface AddRoleModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddRoleModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: AddRoleModalProps) {
  const { t } = useTranslation();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const { data: systemRoles, isLoading } = useGetSystemRolesQuery(undefined, { skip: !isOpen });
  const [addRole, { isLoading: adding }] = useCreateGroupRoleMutation();

  const roles = systemRoles?.roles || [];

  // Debug logging
  useEffect(() => {
    if (isOpen) {
      console.log('AddRoleModal opened');
      console.log('System roles:', systemRoles);
      console.log('Roles array:', systemRoles?.roles || []);
    }
  }, [isOpen, systemRoles]);

  const handleSubmit = async () => {
    if (!selectedRoleId) {
      toast.error(t("securityGroups.selectRoleError"));
      return;
    }

    try {
      await addRole({
        groupId,
        data: {
          role_ids: [selectedRoleId],
        },
      }).unwrap();

      toast.success(t("securityGroups.roleAddedSuccess"));
      onSuccess();
      onClose();
      setSelectedRoleId(null);
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      toast.error(err?.data?.error || t("securityGroups.roleAddedError"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[var(--color-primary)] to-[#3d6a5e] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldPlus className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{t("securityGroups.addRole")}</h2>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              {t("securityGroups.selectSystemRole")}
            </label>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : roles.length === 0 ? (
              <div className="py-12 text-center">
                <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("securityGroups.noSystemRoles")}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {roles.map((role) => (
                  <button
                    key={role.role_id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.role_id)}
                    className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                      selectedRoleId === role.role_id
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                        : "border-gray-200 hover:border-[var(--color-primary)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            selectedRoleId === role.role_id
                              ? "bg-[var(--color-primary)]"
                              : "bg-gray-200"
                          }`}
                        >
                          <Shield
                            className={`h-5 w-5 ${
                              selectedRoleId === role.role_id
                                ? "text-white"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {role.role_name}
                          </div>
                          {role.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {role.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedRoleId === role.role_id && (
                        <div className="h-6 w-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>{t("securityGroups.note")}:</strong>{" "}
              {t("securityGroups.roleWillBeAssignedToAllMembers")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex items-center justify-end gap-3 border-t">
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={adding || !selectedRoleId}
            className="bg-[var(--color-primary)] text-white hover:bg-[#3d6a5e] disabled:opacity-50"
          >
            {adding ? t("common.adding") : t("securityGroups.addRole")}
          </Button>
        </div>
      </div>
    </div>
  );
}
