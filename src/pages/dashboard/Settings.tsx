import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Upload, Image as ImageIcon, RefreshCw, Save, X } from "lucide-react";
import { Button, ConfirmationModal } from "../../components/ui";
import {
  useGetThemeSettingsQuery,
  useUpdateThemeSettingsMutation,
} from "../../api/settings.api";

// Default values
const DEFAULT_COLOR = "#4E8476";
const DEFAULT_HOVER_COLOR = "#365e53";
const DEFAULT_LOGO = "/src/assets/Tanfeezletter.png";
const DEFAULT_COVER = "/src/assets/bgDesigne.jpg";

export default function Settings() {
  const { t } = useTranslation();
  const { data: themeSettings, isLoading: isLoadingSettings } =
    useGetThemeSettingsQuery();
  const [updateThemeSettings, { isLoading: isUpdating }] =
    useUpdateThemeSettingsMutation();

  const [color, setColor] = useState(DEFAULT_COLOR);
  const [hoverColor, setHoverColor] = useState(DEFAULT_HOVER_COLOR);
  const [logoPreview, setLogoPreview] = useState<string>(DEFAULT_LOGO);
  const [coverPreview, setCoverPreview] = useState<string>(DEFAULT_COVER);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Modal states
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load settings from backend or use defaults
  useEffect(() => {
    if (themeSettings) {
      setColor(themeSettings.color || DEFAULT_COLOR);
      setHoverColor(themeSettings.hover_color || DEFAULT_HOVER_COLOR);
      setLogoPreview(themeSettings.main_logo || DEFAULT_LOGO);
      setCoverPreview(themeSettings.main_cover || DEFAULT_COVER);
    }
  }, [themeSettings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("settings.fileTooLarge"));
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(t("settings.invalidFileType"));
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("settings.fileTooLarge"));
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(t("settings.invalidFileType"));
        return;
      }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveClick = () => {
    // Show save confirmation modal
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async () => {
    try {
      const formData = new FormData();

      // Always send colors
      formData.append("color", color);
      formData.append("hover_color", hoverColor);

      // Send logo - either new file or null
      if (logoFile) {
        formData.append("main_logo", logoFile);
      } else if (logoPreview && !logoPreview.startsWith("/src/assets/")) {
        // Only send if it's not the default preview
        formData.append("main_logo", logoPreview);
      } else {
        formData.append("main_logo", "null");
      }

      // Send cover - either new file or null
      if (coverFile) {
        formData.append("main_cover", coverFile);
      } else if (coverPreview && !coverPreview.startsWith("/src/assets/")) {
        // Only send if it's not the default preview
        formData.append("main_cover", coverPreview);
      } else {
        formData.append("main_cover", "null");
      }

      await updateThemeSettings(formData).unwrap();

      setShowSaveModal(false);
      toast.success(t("settings.savedSuccessfully"));

      // Update CSS variables immediately
      document.documentElement.style.setProperty("--color-primary", color);
      document.documentElement.style.setProperty(
        "--color-primary-hover",
        hoverColor,
      );

      // Auto refresh to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settings.saveFailed"));
      setShowSaveModal(false);
    }
  };

  const handleReset = () => {
    // Show reset confirmation modal
    setShowResetModal(true);
  };

  const handleResetConfirm = async () => {
    try {
      // Create FormData with default color values and null for images
      const formData = new FormData();
      formData.append("color", DEFAULT_COLOR);
      formData.append("hover_color", DEFAULT_HOVER_COLOR);
      formData.append("main_logo", "null");
      formData.append("main_cover", "null");

      // Send to backend
      await updateThemeSettings(formData).unwrap();

      // Update UI with defaults
      setColor(DEFAULT_COLOR);
      setHoverColor(DEFAULT_HOVER_COLOR);
      setLogoPreview(DEFAULT_LOGO);
      setCoverPreview(DEFAULT_COVER);
      setLogoFile(null);
      setCoverFile(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (coverInputRef.current) coverInputRef.current.value = "";

      setShowResetModal(false);

      toast.success(
        t("settings.resetSuccessfully") ||
          "Settings reset to defaults successfully!",
      );

      // Update CSS variables immediately
      document.documentElement.style.setProperty(
        "--color-primary",
        DEFAULT_COLOR,
      );
      document.documentElement.style.setProperty(
        "--color-primary-hover",
        DEFAULT_HOVER_COLOR,
      );

      // Auto refresh to apply all changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error(t("settings.resetFailed") || "Failed to reset settings");
      setShowResetModal(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6  mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 ">
          {t("settings.title")}
        </h1>
        <p className="mt-2 text-sm text-gray-600 ">
          {t("settings.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colors Section */}
        <div className="bg-white  rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900  mb-4">
            {t("settings.colors")}
          </h2>

          {/* Primary Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700  mb-2">
              {t("settings.primaryColor")}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="#1e3a5f"
              />
            </div>
            <div
              className="mt-3 p-4 rounded-md"
              style={{ backgroundColor: color }}
            >
              <span className="text-white font-medium">
                {t("settings.preview")}
              </span>
            </div>
          </div>

          {/* Hover Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700  mb-2">
              {t("settings.hoverColor")}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={hoverColor}
                onChange={(e) => setHoverColor(e.target.value)}
                className="h-12 w-24 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={hoverColor}
                onChange={(e) => setHoverColor(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="#2c5282"
              />
            </div>
            <div
              className="mt-3 p-4 rounded-md transition-colors hover:opacity-90"
              style={{ backgroundColor: hoverColor }}
            >
              <span className="text-white font-medium">
                {t("settings.hoverPreview")}
              </span>
            </div>
          </div>
        </div>

        {/* Images Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900  mb-4">
            {t("settings.images")}
          </h2>

          {/* Logo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700  mb-2">
              {t("settings.mainLogo")}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {logoPreview && (
                <div className="mb-3 flex justify-center relative">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-20 w-auto object-contain"
                  />
                  <button
                    onClick={() => {
                      setLogoPreview("");
                      setLogoFile(null);
                      if (logoInputRef.current) logoInputRef.current.value = "";
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t("settings.uploadLogo")}
              </label>
              <p className="mt-2 text-xs text-gray-500">
                {t("settings.imageRequirements")}
              </p>
            </div>
          </div>

          {/* Cover Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("settings.mainCover")}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {coverPreview && (
                <div className="mb-3 flex justify-center relative">
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="h-32 w-full object-cover rounded"
                  />
                  <button
                    onClick={() => {
                      setCoverPreview("");
                      setCoverFile(null);
                      if (coverInputRef.current)
                        coverInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove cover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
                id="cover-upload"
              />
              <label
                htmlFor="cover-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                {t("settings.uploadCover")}
              </label>
              <p className="mt-2 text-xs text-gray-500">
                {t("settings.imageRequirements")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <Button
          variant="secondary"
          onClick={handleReset}
          disabled={isUpdating}
          className="inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t("settings.reset")}
        </Button>
        <Button
          onClick={handleSaveClick}
          disabled={isUpdating}
          className="inline-flex items-center gap-2"
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("settings.saving")}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t("settings.save")}
            </>
          )}
        </Button>
      </div>

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={handleSaveConfirm}
        message={
          t("settings.saveConfirmation") ||
          "Are you sure you want to save these settings? This will update the theme configuration."
        }
        confirmText={t("settings.save") || "Save"}
        cancelText={t("common.cancel") || "Cancel"}
        type="info"
        isLoading={isUpdating}
      />

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetConfirm}
        message={
          t("settings.resetConfirmation") ||
          "Are you sure you want to reset to default settings? This will restore all colors and images to their original values."
        }
        confirmText={t("settings.reset") || "Reset"}
        cancelText={t("common.cancel") || "Cancel"}
        type="warning"
        isLoading={isUpdating}
      />
    </div>
  );
}
