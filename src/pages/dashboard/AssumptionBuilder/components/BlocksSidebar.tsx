import { blockItems } from "./blockItems";
import { LuBlocks } from "react-icons/lu";
import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { useTranslation } from "react-i18next";

interface BlocksSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string, label: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const BlocksSidebar = ({ onDragStart, isCollapsed, onToggleCollapse }: BlocksSidebarProps) => {
  const { t } = useTranslation();

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="bg-white rounded-r-2xl p-3 flex-shrink-0 absolute top-4 left-0 shadow-md z-20 border border-gray-100 hover:bg-gray-50 transition-colors"
        aria-label={t("assumptionBuilder.expandLeftSidebar")}>
        <TbLayoutSidebarLeftCollapse size={20} className="text-gray-600 rotate-180" />
      </button>
    );
  }

  return (
    <div className="w-56 bg-white rounded-2xl p-4 flex-shrink-0 absolute top-4 left-4 shadow-md gap-6 z-20 border border-gray-100">
      <div className="flex items-center gap-2 mb-1">
        <LuBlocks size={24} />
        <span className="font-semibold text-gray-800">{t("assumptionBuilder.blocks")}</span>
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t("assumptionBuilder.collapseLeftSidebar")}>
          <TbLayoutSidebarLeftCollapse size={16} className="text-gray-600" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">{t("assumptionBuilder.dragAndDropInfo")}</p>

      <div className="space-y-2">
        {blockItems.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => onDragStart(e, block.type, t(`assumptionBuilder.${block.labelKey}`))}
            className="flex items-center gap-2 p-2.5 bg-white border border-gray-100 rounded-xl cursor-grab hover:border-[#00B7AD] hover:shadow-sm transition-all active:cursor-grabbing">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${block.color}10` }}>
              <span style={{ color: block.color }}>{block.icon}</span>
            </div>
            <span className="text-xs font-medium text-gray-700">{t(`assumptionBuilder.${block.labelKey}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
