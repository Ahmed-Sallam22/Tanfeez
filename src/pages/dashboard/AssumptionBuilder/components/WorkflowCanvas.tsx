import {
  ReactFlow,
  Background,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Minus } from "lucide-react";
import { ConditionNode } from "./ConditionNode";
import { SuccessNode } from "./SuccessNode";
import { FailNode } from "./FailNode";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

// Define node types
const nodeTypes = {
  condition: ConditionNode,
  success: SuccessNode,
  fail: FailNode,
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onEdgesDelete?: (edges: Edge[]) => void;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent, position: { x: number; y: number }) => void;
}

const ZoomControls = () => {
  const { zoomIn, zoomOut } = useReactFlow();
  const { t } = useTranslation();

  return (
    <div className="absolute bottom-4 z-50 left-4 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => zoomIn({ duration: 300 })}
        className="p-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer"
        aria-label={t("assumptionBuilder.zoomIn")}>
        <Plus className="w-4 h-4 text-gray-600" />
      </button>
      <button
        onClick={() => zoomOut({ duration: 300 })}
        className="p-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label={t("assumptionBuilder.zoomOut")}>
        <Minus className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};

const ReactFlowWrapper = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onEdgesDelete,
  onConnect,
  onNodeClick,
  onPaneClick,
  onDragOver,
  onDrop,
}: WorkflowCanvasProps) => {
  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Convert screen coordinates to flow coordinates
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onDrop(event, position);
    },
    [screenToFlowPosition, onDrop]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onEdgesDelete={onEdgesDelete}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={handleDrop}
      nodeTypes={nodeTypes}
      fitView
      className="bg-[#FAFAFA]"
      minZoom={0.00001}
      maxZoom={100}>
      <Background color="#575555" gap={16} size={1} />
      <ZoomControls />
    </ReactFlow>
  );
};

export const WorkflowCanvas = (props: WorkflowCanvasProps) => {
  return (
    <div className="flex-1 relative">
      <ReactFlowProvider>
        <ReactFlowWrapper {...props} />
      </ReactFlowProvider>
    </div>
  );
};
