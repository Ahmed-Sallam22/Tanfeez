import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    group_name: string;
    description: string;
    is_active: boolean;
  }) => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateGroupModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ group_name: "", description: "", is_active: true });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-[var(--color-primary)]/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[var(--color-primary)] to-[#3d6a5e] bg-clip-text text-transparent">
            {t("securityGroups.createNewGroup")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.groupName")}
            </label>
            <Input
              type="text"
              value={formData.group_name}
              onChange={(e) =>
                setFormData({ ...formData, group_name: e.target.value })
              }
              placeholder={t("securityGroups.groupNamePlaceholder")}
              required
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("securityGroups.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t("securityGroups.descriptionPlaceholder")}
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              {t("securityGroups.activeGroup")}
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-[var(--color-primary)] to-[#3d6a5e] text-white hover:from-[#3d6a5e] hover:to-[#2d5246]"
            >
              {t("common.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
