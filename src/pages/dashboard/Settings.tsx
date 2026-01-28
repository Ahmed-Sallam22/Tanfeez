import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Upload, Image as ImageIcon, RefreshCw, Save } from "lucide-react";
import { Button } from "../../components/ui";
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

  const handleSave = async () => {
    try {
      const formData = new FormData();

      // Always send colors
      formData.append("color", color);
      formData.append("hover_color", hoverColor);

      // Send logo - either new file or current URL
      if (logoFile) {
        formData.append("main_logo", logoFile);
      } else if (logoPreview) {
        formData.append("main_logo", logoPreview);
      }

      // Send cover - either new file or current URL
      if (coverFile) {
        formData.append("main_cover", coverFile);
      } else if (coverPreview) {
        formData.append("main_cover", coverPreview);
      }

      await updateThemeSettings(formData).unwrap();
      toast.success(t("settings.savedSuccessfully"));

      // Prompt user to refresh
      const shouldRefresh = window.confirm(t("settings.refreshPrompt"));
      if (shouldRefresh) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(t("settings.saveFailed"));
    }
  };

  const handleReset = async () => {
    // Show confirmation popup
    const confirmReset = window.confirm(
      t("settings.resetConfirmation") ||
        "Are you sure you want to reset to default settings? This will restore all colors and images to their original values.",
    );

    if (!confirmReset) {
      return; // User cancelled
    }

    try {
      // Create FormData with default values
      const formData = new FormData();
      formData.append("color", DEFAULT_COLOR);
      formData.append("hover_color", DEFAULT_HOVER_COLOR);
      formData.append("main_logo", DEFAULT_LOGO);
      formData.append("main_cover", DEFAULT_COVER);

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

      toast.success(
        t("settings.resetSuccessfully") ||
          "Settings reset to defaults successfully!",
      );

      // Prompt user to refresh
      const shouldRefresh = window.confirm(t("settings.refreshPrompt"));
      if (shouldRefresh) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error(t("settings.resetFailed") || "Failed to reset settings");
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
                <div className="mb-3 flex justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-20 w-auto object-contain"
                  />
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
                <div className="mb-3 flex justify-center">
                  <img
                    src={coverPreview}
                    alt="Cover Preview"
                    className="h-32 w-full object-cover rounded"
                  />
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
          onClick={handleSave}
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
    </div>
  );
}
