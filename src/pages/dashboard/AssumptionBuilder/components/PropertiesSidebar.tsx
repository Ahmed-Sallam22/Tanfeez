import type { Node } from "@xyflow/react";
import type { WorkflowData, StageData } from "./types";
import { StagePropertiesForm } from "./StagePropertiesForm";
import { WorkflowSettingsForm } from "./WorkflowSettingsForm";
import { TbLayoutSidebarRightCollapse } from "react-icons/tb";
import type { Datasource } from "@/api/validationWorkflow.api";
import { useTranslation } from "react-i18next";

interface PropertiesSidebarProps {
  activeTab: "properties" | "settings";
  setActiveTab: (tab: "properties" | "settings") => void;
  selectedNode: Node | null;
  stageData: StageData;
  setStageData: React.Dispatch<React.SetStateAction<StageData>>;
  workflowData: WorkflowData;
  setWorkflowData: React.Dispatch<React.SetStateAction<WorkflowData>>;
  deleteSelectedNode: () => void;
  buildWorkflowJSON: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSaving?: boolean;
  datasources?: Datasource[];
  isDatasourcesLoading?: boolean;
}

export const PropertiesSidebar = ({
  activeTab,
  setActiveTab,
  selectedNode,
  stageData,
  setStageData,
  workflowData,
  setWorkflowData,
  deleteSelectedNode,
  buildWorkflowJSON,
  isCollapsed,
  onToggleCollapse,
  isSaving = false,
  datasources = [],
  isDatasourcesLoading = false,
}: PropertiesSidebarProps) => {
  const { t } = useTranslation();

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="bg-white rounded-l-2xl p-3 flex-shrink-0 absolute top-4 right-0 shadow-md z-20 border border-gray-100 hover:bg-gray-50 transition-colors"
        aria-label={t("assumptionBuilder.expandRightSidebar")}>
        <TbLayoutSidebarRightCollapse size={20} className="text-gray-600 rotate-180" />
      </button>
    );
  }

  return (
    <div className="w-90 bg-white rounded-2xl p-4 flex-shrink-0 absolute top-4 right-4 shadow-md z-20 border border-gray-100 max-h-[calc(100vh-170px)] overflow-y-auto">
      {/* Tabs */}
      <div className="flex p-2 gap-1 mb-2">
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 py-3 text-sm font-medium transition-all rounded-lg ${
            activeTab === "properties" ? "text-white bg-[#00B7AD] shadow-sm" : "text-gray-500 hover:bg-gray-50"
          }`}>
          {t("assumptionBuilder.stageProperties")}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-2.5 text-sm font-medium transition-all rounded-lg ${
            activeTab === "settings" ? "text-white bg-[#00B7AD] shadow-sm" : "text-gray-500 hover:bg-gray-50"
          }`}>
          {t("assumptionBuilder.workflowSettings")}
        </button>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t("assumptionBuilder.collapseRightSidebar")}>
          <TbLayoutSidebarRightCollapse size={18} className="text-gray-600" />
        </button>
      </div>

      <div className="pt-2">
        {activeTab === "settings" ? (
          <WorkflowSettingsForm
            workflowData={workflowData}
            setWorkflowData={setWorkflowData}
            buildWorkflowJSON={buildWorkflowJSON}
            isSaving={isSaving}
          />
        ) : (
          <StagePropertiesForm
            selectedNode={selectedNode}
            stageData={stageData}
            setStageData={setStageData}
            deleteSelectedNode={deleteSelectedNode}
            datasources={datasources}
            isDatasourcesLoading={isDatasourcesLoading}
          />
        )}
      </div>
    </div>
  );
};
