import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui";
import {
  useGetRoleAbilitiesQuery,
  useUpdateRoleAbilitiesMutation,
} from "@/api/securityGroups.api";
import { toast } from "react-hot-toast";

interface ManageAbilitiesModalProps {
  groupId: number;
  roleId: number;
  roleName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ABILITY_DESCRIPTIONS: Record<string, { en: string; ar: string; icon: string }> = {
  TRANSFER: {
    en: "Create and submit budget transfers",
    ar: "إنشاء وتقديم طلبات نقل الميزانية",
    icon: "💸",
  },
  APPROVE: {
    en: "Approve pending transfers",
    ar: "الموافقة على طلبات النقل المعلقة",
    icon: "✅",
  },
  REJECT: {
    en: "Reject pending transfers",
    ar: "رفض طلبات النقل المعلقة",
    icon: "❌",
  },
  VIEW: {
    en: "View transfers and reports",
    ar: "عرض طلبات النقل والتقارير",
    icon: "👁️",
  },
  EDIT: {
    en: "Edit draft transfers",
    ar: "تعديل طلبات النقل المسودة",
    icon: "✏️",
  },
  DELETE: {
    en: "Delete draft transfers",
    ar: "حذف طلبات النقل المسودة",
    icon: "🗑️",
  },
  REPORT: {
    en: "Generate and export reports",
    ar: "إنشاء وتصدير التقارير",
    icon: "📊",
  },
};

export default function ManageAbilitiesModal({
  groupId,
  roleId,
  roleName,
  isOpen,
  onClose,
  onSuccess,
}: ManageAbilitiesModalProps) {
  const { t, i18n } = useTranslation();
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  const { data: abilitiesData, isLoading } = useGetRoleAbilitiesQuery(
    { groupId, roleId },
    { skip: !isOpen }
  );
  const [updateAbilities, { isLoading: updating }] = useUpdateRoleAbilitiesMutation();

  const availableAbilities = abilitiesData?.available_abilities || [];

  useEffect(() => {
    if (abilitiesData?.default_abilities && abilitiesData.default_abilities.length > 0) {
      setSelectedAbilities(abilitiesData.default_abilities);
    }
  }, [abilitiesData?.default_abilities]);

  const toggleAbility = (ability: string) => {
    setSelectedAbilities((prev) =>
      prev.includes(ability)
        ? prev.filter((a) => a !== ability)
        : [...prev, ability]
    );
  };

  const handleSubmit = async () => {
    try {
      await updateAbilities({
        groupId,
        roleId,
        abilities: selectedAbilities,
      }).unwrap();

      toast.success(t("securityGroups.abilitiesUpdated"));
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } };
      toast.error(err?.data?.error || t("securityGroups.abilitiesUpdateError"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#4E8476] to-[#3d6a5e] text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <div>
              <h2 className="text-2xl font-bold">{t("securityGroups.manageAbilities")}</h2>
              <p className="text-sm text-white/80">{roleName}</p>
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
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>{t("securityGroups.note")}:</strong>{" "}
                  {t("securityGroups.abilitiesApplyToAllMembers")}
                </p>
              </div>

              {/* Abilities Grid */}
              <div className="space-y-3">
                {availableAbilities.map((ability) => {
                  const isSelected = selectedAbilities.includes(ability);
                  const description = ABILITY_DESCRIPTIONS[ability];

                  return (
                    <button
                      key={ability}
                      type="button"
                      onClick={() => toggleAbility(ability)}
                      className={`w-full p-4 border-2 rounded-xl transition-all text-left ${
                        isSelected
                          ? "border-[#4E8476] bg-[#4E8476]/10"
                          : "border-gray-200 hover:border-[#4E8476]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${
                              isSelected
                                ? "bg-[#4E8476]"
                                : "bg-gray-200"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="h-6 w-6 text-white" />
                            ) : (
                              <span>{description?.icon || "🔐"}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {ability}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {i18n.language === "ar"
                                ? description?.ar
                                : description?.en}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="h-6 w-6 bg-[#4E8476] rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selection Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {t("securityGroups.selectedAbilities")}:
                  </span>
                  <span className="text-sm font-bold text-[#4E8476]">
                    {selectedAbilities.length} / {availableAbilities.length}
                  </span>
                </div>
                {selectedAbilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedAbilities.map((ability) => (
                      <span
                        key={ability}
                        className="px-3 py-1 bg-[#4E8476]/20 text-[#4E8476] rounded-full text-sm font-medium"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl flex items-center justify-end gap-3 border-t">
          <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updating || isLoading}
            className="bg-[#4E8476] text-white hover:bg-[#3d6a5e] disabled:opacity-50"
          >
            {updating ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
