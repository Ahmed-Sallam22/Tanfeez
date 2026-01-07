import { useCallback, useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import toast from "react-hot-toast";
import { BlocksSidebar } from "./components/BlocksSidebar";
import { PropertiesSidebar } from "./components/PropertiesSidebar";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import type { WorkflowData, StageData } from "./components/types";
import {
  useBulkCreateStepsMutation,
  useBulkUpdateStepsMutation,
  useDeleteValidationStepMutation,
  useGetDatasourcesQuery,
  useGetValidationWorkflowQuery,
} from "../../../api/validationWorkflow.api";
import { useTranslation } from "react-i18next";

// Type for original node data (from API)
interface OriginalNodeData {
  id: number;
  label: string;
  leftSide: string;
  operator: string;
  rightSide: string;
  ifTrueAction: string;
  ifTrueActionData: Record<string, unknown>;
  ifFalseAction: string;
  ifFalseActionData: Record<string, unknown>;
  failureMessage: string;
  x: number;
  y: number;
}

// Initial nodes and edges
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function AssumptionBuilder() {
  const { t } = useTranslation();
  const location = useLocation();
  const { id: urlWorkflowId } = useParams<{ id: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [activeTab, setActiveTab] = useState<"properties" | "settings">("settings");
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Track original node data from API (to detect changes)
  const originalNodesDataRef = useRef<Map<string, OriginalNodeData>>(new Map());

  // API Mutations
  const [bulkCreateSteps, { isLoading: isCreating }] = useBulkCreateStepsMutation();
  const [bulkUpdateSteps, { isLoading: isUpdating }] = useBulkUpdateStepsMutation();
  const [deleteValidationStep, { isLoading: isDeleting }] = useDeleteValidationStepMutation();

  // Workflow settings
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    name: "",
    executionPoint: "",
    description: "",
    isDefault: true,
    conditions: [],
  });

  // Get workflow ID from URL params or location state
  const workflowIdFromState = (location.state as { workflowId?: number })?.workflowId;
  const currentWorkflowId = urlWorkflowId ? parseInt(urlWorkflowId) : workflowIdFromState;

  // Fetch workflow data if we have a workflow ID
  const {
    data: workflowApiData,
    isLoading: isWorkflowLoading,
    refetch,
  } = useGetValidationWorkflowQuery(currentWorkflowId!, {
    skip: !currentWorkflowId,
  });

  // Fetch datasources based on execution point
  const { data: datasourcesData, isLoading: isDatasourcesLoading } = useGetDatasourcesQuery(
    workflowData.executionPoint,
    {
      skip: !workflowData.executionPoint, // Skip if no execution point selected
    }
  );

  // Show loading state while fetching workflow
  const isLoadingWorkflow = isWorkflowLoading && currentWorkflowId;

  // Reset initialization when workflow ID changes or component mounts
  useEffect(() => {
    if (currentWorkflowId) {
      setIsInitialized(false);
      // Refetch the workflow data when the page loads or ID changes
      refetch();
    }
  }, [currentWorkflowId, refetch]);

  // Load workflow data from API response
  useEffect(() => {
    if (workflowApiData && !isInitialized) {
      // Set workflow data
      setWorkflowData({
        name: workflowApiData.name || "",
        executionPoint: workflowApiData.execution_point || "",
        description: workflowApiData.description || "",
        isDefault: workflowApiData.is_default ?? true,
        conditions: [],
        workflowId: workflowApiData.id,
      });

      // Convert steps to nodes
      if (workflowApiData.steps && workflowApiData.steps.length > 0) {
        const allNodes: Node[] = [];
        const allEdges: Edge[] = [];

        // Track which steps connect to which (for layout calculation)
        const stepConnections = new Map<number, { trueTarget?: number; falseTarget?: number }>();

        // Track which steps have action nodes (not proceed_to_step)
        const stepHasActionNodes = new Map<number, { hasTrue: boolean; hasFalse: boolean }>();

        // First pass: build connection map and check for action nodes
        workflowApiData.steps.forEach((step) => {
          const connections: { trueTarget?: number; falseTarget?: number } = {};
          const hasActions = { hasTrue: false, hasFalse: false };

          if (step.if_true_action === "proceed_to_step" || step.if_true_action === "proceed_to_step_by_id") {
            connections.trueTarget = (step.if_true_action_data as { next_step_id?: number })?.next_step_id;
          } else if (step.if_true_action === "complete_success" || step.if_true_action === "complete_failure") {
            hasActions.hasTrue = true;
          }

          if (step.if_false_action === "proceed_to_step" || step.if_false_action === "proceed_to_step_by_id") {
            connections.falseTarget = (step.if_false_action_data as { next_step_id?: number })?.next_step_id;
          } else if (step.if_false_action === "complete_success" || step.if_false_action === "complete_failure") {
            hasActions.hasFalse = true;
          }

          stepConnections.set(step.id, connections);
          stepHasActionNodes.set(step.id, hasActions);
        });

        // Calculate positions based on flow - use tree layout
        const nodePositions = new Map<number, { x: number; y: number; level: number }>();
        const processedSteps = new Set<number>();

        // Find root step (initial_step or first step)
        const initialStepId = workflowApiData.initial_step || workflowApiData.steps[0]?.id;

        // Layout constants - increased spacing to prevent overlap
        const CONDITION_NODE_HEIGHT = 160; // Approximate height of condition node
        const ACTION_NODE_HEIGHT = 100; // Approximate height of action node
        const ACTION_NODE_OFFSET_Y = 180; // Vertical offset for action nodes from condition
        const ACTION_NODE_OFFSET_X = 280; // Horizontal offset for action nodes from condition
        const MIN_VERTICAL_GAP = 120; // Minimum gap between nodes
        const HORIZONTAL_BRANCH_SPACING = 350; // Horizontal spacing between branches

        // Calculate vertical spacing: if previous node has action children, add extra space
        const getVerticalSpacing = (prevStepId: number | null) => {
          if (!prevStepId) return 0;
          const prevActions = stepHasActionNodes.get(prevStepId);
          if (prevActions && (prevActions.hasTrue || prevActions.hasFalse)) {
            // Previous node has action children, need more space
            return CONDITION_NODE_HEIGHT + ACTION_NODE_OFFSET_Y + ACTION_NODE_HEIGHT + MIN_VERTICAL_GAP;
          }
          // No action children, just normal spacing
          return CONDITION_NODE_HEIGHT + MIN_VERTICAL_GAP;
        };

        // BFS to assign levels and positions - track cumulative Y position
        const queue: Array<{
          stepId: number;
          level: number;
          xOffset: number;
          prevStepId: number | null;
        }> = [];
        if (initialStepId) {
          queue.push({
            stepId: initialStepId,
            level: 0,
            xOffset: 0,
            prevStepId: null,
          });
        }

        let maxLevel = 0;
        const levelYPositions = new Map<number, number>(); // Track Y position for each level
        levelYPositions.set(0, 80); // Starting Y position

        while (queue.length > 0) {
          const { stepId, level, xOffset, prevStepId } = queue.shift()!;

          if (processedSteps.has(stepId)) continue;
          processedSteps.add(stepId);

          maxLevel = Math.max(maxLevel, level);

          // Calculate Y position based on previous level
          let currentY = levelYPositions.get(level);
          if (currentY === undefined) {
            // Calculate based on previous level's position and spacing
            const prevLevelY = levelYPositions.get(level - 1) || 80;
            const spacing = getVerticalSpacing(prevStepId);
            currentY = prevLevelY + spacing;
            levelYPositions.set(level, currentY);
          }

          // Calculate position
          const x = 500 + xOffset;
          const y = currentY;

          nodePositions.set(stepId, { x, y, level });

          // Add connected steps to queue with proper horizontal spacing
          const connections = stepConnections.get(stepId);
          if (connections) {
            // Calculate dynamic spacing based on level to create a tree-like spread
            const levelSpacing = Math.max(HORIZONTAL_BRANCH_SPACING * Math.pow(0.7, level), 200);

            if (connections.trueTarget && !processedSteps.has(connections.trueTarget)) {
              queue.push({
                stepId: connections.trueTarget,
                level: level + 1,
                xOffset: xOffset - levelSpacing,
                prevStepId: stepId,
              });
            }
            if (connections.falseTarget && !processedSteps.has(connections.falseTarget)) {
              queue.push({
                stepId: connections.falseTarget,
                level: level + 1,
                xOffset: xOffset + levelSpacing,
                prevStepId: stepId,
              });
            }
          }
        }

        // Process any unprocessed steps (disconnected nodes)
        let lastY = Math.max(...Array.from(levelYPositions.values())) || 80;
        let disconnectedX = 500;
        workflowApiData.steps.forEach((step) => {
          if (!processedSteps.has(step.id)) {
            lastY += CONDITION_NODE_HEIGHT + ACTION_NODE_OFFSET_Y + ACTION_NODE_HEIGHT + MIN_VERTICAL_GAP;
            nodePositions.set(step.id, {
              x: disconnectedX,
              y: lastY,
              level: maxLevel + 1,
            });
            disconnectedX += 400; // Space out disconnected nodes horizontally
          }
        });

        // Second pass: create nodes and edges
        workflowApiData.steps.forEach((step) => {
          const conditionNodeId = `condition-${step.id}`;

          // Use position from API if available (not null/undefined), otherwise calculate position
          let position;
          if (step.x !== null && step.x !== undefined && step.y !== null && step.y !== undefined) {
            // Use saved position from backend
            position = {
              x: step.x,
              y: step.y,
              level: 0, // Level not needed when using saved positions
            };
          } else {
            // Fallback to calculated position
            position = nodePositions.get(step.id) || {
              x: 400,
              y: 100,
              level: 0,
            };
          }

          // Store original data for tracking changes (including position)
          originalNodesDataRef.current.set(conditionNodeId, {
            id: step.id,
            label: step.name,
            leftSide: step.left_expression,
            operator: step.operation,
            rightSide: step.right_expression,
            ifTrueAction: step.if_true_action,
            ifTrueActionData: step.if_true_action_data as Record<string, unknown>,
            ifFalseAction: step.if_false_action,
            ifFalseActionData: step.if_false_action_data as Record<string, unknown>,
            failureMessage: step.failure_message || "",
            x: position.x,
            y: position.y,
          });

          // Create condition node
          const conditionNode: Node = {
            id: conditionNodeId,
            type: "condition",
            position: {
              x: position.x,
              y: position.y,
            },
            data: {
              id: step.id,
              label: step.name,
              leftSide: step.left_expression,
              operator: step.operation,
              rightSide: step.right_expression,
              leftDataType: "text",
              rightDataType: "text",
              ifTrueAction: step.if_true_action,
              ifTrueActionData: step.if_true_action_data,
              ifFalseAction: step.if_false_action,
              ifFalseActionData: step.if_false_action_data,
              failureMessage: step.failure_message,
              isActive: step.is_active,
            },
          };
          allNodes.push(conditionNode);

          // Handle if_true_action
          if (step.if_true_action === "complete_success") {
            const message = (step.if_true_action_data as { message?: string })?.message || "";
            const successNodeId = `success-${step.id}-true`;

            // Create success node - position to the left and below
            const successNode: Node = {
              id: successNodeId,
              type: "success",
              position: {
                x: position.x - ACTION_NODE_OFFSET_X,
                y: position.y + ACTION_NODE_OFFSET_Y,
              },
              data: {
                label: "Action: Success",
                message: message,
                actionType: "complete_success",
              },
            };
            allNodes.push(successNode);

            // Create edge from condition to success
            allEdges.push({
              id: `edge-${step.id}-true-success`,
              source: conditionNodeId,
              target: successNodeId,
              sourceHandle: "true",
              type: "smoothstep",
              style: { stroke: "#22C55E", strokeWidth: 2 },
              label: "True",
              labelStyle: { fill: "#22C55E", fontWeight: 500 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#22C55E" },
            });
          } else if (step.if_true_action === "complete_failure") {
            const error = (step.if_true_action_data as { error?: string })?.error || "";
            const failNodeId = `fail-${step.id}-true`;

            // Create fail node for true action - position to the left and below
            const failNode: Node = {
              id: failNodeId,
              type: "fail",
              position: {
                x: position.x - ACTION_NODE_OFFSET_X,
                y: position.y + ACTION_NODE_OFFSET_Y,
              },
              data: {
                label: "Action: Fail",
                error: error,
                actionType: "complete_failure",
              },
            };
            allNodes.push(failNode);

            // Create edge from condition to fail
            allEdges.push({
              id: `edge-${step.id}-true-fail`,
              source: conditionNodeId,
              target: failNodeId,
              sourceHandle: "true",
              type: "smoothstep",
              style: { stroke: "#22C55E", strokeWidth: 2 },
              label: "True",
              labelStyle: { fill: "#22C55E", fontWeight: 500 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#22C55E" },
            });
          } else if (step.if_true_action === "proceed_to_step" || step.if_true_action === "proceed_to_step_by_id") {
            const nextStepId = (step.if_true_action_data as { next_step_id?: number })?.next_step_id;
            if (nextStepId) {
              allEdges.push({
                id: `edge-${step.id}-true-${nextStepId}`,
                source: conditionNodeId,
                target: `condition-${nextStepId}`,
                sourceHandle: "true",
                type: "smoothstep",
                style: { stroke: "#22C55E", strokeWidth: 2 },
                label: "True",
                labelStyle: { fill: "#22C55E", fontWeight: 500 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#22C55E" },
              });
            }
          }

          // Handle if_false_action
          if (step.if_false_action === "complete_failure") {
            const error = (step.if_false_action_data as { error?: string })?.error || "";
            const failNodeId = `fail-${step.id}-false`;

            // Create fail node - position to the right and below
            const failNode: Node = {
              id: failNodeId,
              type: "fail",
              position: {
                x: position.x + ACTION_NODE_OFFSET_X,
                y: position.y + ACTION_NODE_OFFSET_Y,
              },
              data: {
                label: "Action: Fail",
                error: error,
                actionType: "complete_failure",
              },
            };
            allNodes.push(failNode);

            // Create edge from condition to fail
            allEdges.push({
              id: `edge-${step.id}-false-fail`,
              source: conditionNodeId,
              target: failNodeId,
              sourceHandle: "false",
              type: "smoothstep",
              style: { stroke: "#EF4444", strokeWidth: 2 },
              label: "False",
              labelStyle: { fill: "#EF4444", fontWeight: 500 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
            });
          } else if (step.if_false_action === "complete_success") {
            const message = (step.if_false_action_data as { message?: string })?.message || "";
            const successNodeId = `success-${step.id}-false`;

            // Create success node for false action - position to the right and below
            const successNode: Node = {
              id: successNodeId,
              type: "success",
              position: {
                x: position.x + ACTION_NODE_OFFSET_X,
                y: position.y + ACTION_NODE_OFFSET_Y,
              },
              data: {
                label: "Action: Success",
                message: message,
                actionType: "complete_success",
              },
            };
            allNodes.push(successNode);

            // Create edge from condition to success
            allEdges.push({
              id: `edge-${step.id}-false-success`,
              source: conditionNodeId,
              target: successNodeId,
              sourceHandle: "false",
              type: "smoothstep",
              style: { stroke: "#EF4444", strokeWidth: 2 },
              label: "False",
              labelStyle: { fill: "#EF4444", fontWeight: 500 },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
            });
          } else if (step.if_false_action === "proceed_to_step" || step.if_false_action === "proceed_to_step_by_id") {
            const nextStepId = (step.if_false_action_data as { next_step_id?: number })?.next_step_id;
            if (nextStepId) {
              allEdges.push({
                id: `edge-${step.id}-false-${nextStepId}`,
                source: conditionNodeId,
                target: `condition-${nextStepId}`,
                sourceHandle: "false",
                type: "smoothstep",
                style: { stroke: "#EF4444", strokeWidth: 2 },
                label: "False",
                labelStyle: { fill: "#EF4444", fontWeight: 500 },
                markerEnd: { type: MarkerType.ArrowClosed, color: "#EF4444" },
              });
            }
          }
        });

        setNodes(allNodes);
        setEdges(allEdges);
      }

      setIsInitialized(true);
    }
  }, [workflowApiData, isInitialized, setNodes, setEdges]);

  // Load workflow data from navigation state if available (fallback for creating new workflow)
  useEffect(() => {
    if (location.state && !currentWorkflowId) {
      const { name, executionPoint, description, isDefault } = location.state as WorkflowData;
      if (name || executionPoint) {
        setWorkflowData({
          name: name || "",
          executionPoint: executionPoint || "",
          description: description || "",
          isDefault: isDefault ?? true,
          conditions: [],
        });
      }
    }
  }, [location.state, currentWorkflowId]);

  // Stage properties (for selected node)
  const [stageData, setStageData] = useState<StageData>({
    name: "",
    leftSide: "",
    leftDataType: "text",
    operator: "==",
    rightSide: "",
    rightDataType: "text",
    ifTrueAction: "complete_success",
    ifTrueActionData: { message: "" },
    ifFalseAction: "complete_failure",
    ifFalseActionData: { error: "" },
    failureMessage: "",
  });

  // Auto-update node when stageData changes (Feature 1)
  useEffect(() => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: stageData.name,
              leftSide: stageData.leftSide,
              leftDataType: stageData.leftDataType,
              operator: stageData.operator,
              rightSide: stageData.rightSide,
              rightDataType: stageData.rightDataType,
              ifTrueAction: stageData.ifTrueAction,
              ifTrueActionData: stageData.ifTrueActionData,
              ifFalseAction: stageData.ifFalseAction,
              ifFalseActionData: stageData.ifFalseActionData,
              failureMessage: stageData.failureMessage,
              // Update message/error/actionType for success/fail nodes
              message: stageData.message,
              error: stageData.error,
              actionType: stageData.actionType,
            },
          };
        }
        return node;
      })
    );
  }, [stageData, selectedNode, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceHandle = params.sourceHandle;
      let edgeStyle = {};
      let labelText = "";

      if (sourceHandle === "true") {
        edgeStyle = { stroke: "#22C55E", strokeWidth: 2 };
        labelText = "True";
      } else if (sourceHandle === "false") {
        edgeStyle = { stroke: "#EF4444", strokeWidth: 2 };
        labelText = "False";
      }

      const sourceNode = nodes.find((n) => n.id === params.source);
      const isSourceCondition = sourceNode?.type === "condition";

      // Rule 1: Each condition handle can only have ONE outgoing edge
      if (isSourceCondition) {
        const existingEdgeFromHandle = edges.find(
          (edge) => edge.source === params.source && edge.sourceHandle === params.sourceHandle
        );

        if (existingEdgeFromHandle) {
          const oldTargetNode = nodes.find((n) => n.id === existingEdgeFromHandle.target);

          // Delete old target if it's success/fail and different from new target
          if (
            oldTargetNode &&
            (oldTargetNode.type === "success" || oldTargetNode.type === "fail") &&
            existingEdgeFromHandle.target !== params.target
          ) {
            setNodes((nds) => nds.filter((node) => node.id !== existingEdgeFromHandle.target));
          }

          // Remove old edge
          setEdges((eds) => eds.filter((edge) => edge.id !== existingEdgeFromHandle.id));
        }
      }

      // Rule 2: Each node can only have ONE incoming edge
      // Find any existing edge that goes TO the same target
      const existingEdgeToTarget = edges.find((edge) => edge.target === params.target);

      if (existingEdgeToTarget) {
        // Just remove the old incoming edge, don't delete any nodes
        setEdges((eds) => eds.filter((edge) => edge.id !== existingEdgeToTarget.id));
      }

      // Add the new edge
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            style: edgeStyle,
            label: labelText,
            labelStyle: {
              fill: sourceHandle === "true" ? "#22C55E" : "#EF4444",
              fontWeight: 500,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: sourceHandle === "true" ? "#22C55E" : "#EF4444",
            },
          },
          eds
        )
      );
    },
    [setEdges, edges, nodes, setNodes]
  );

  // Handle edge deletion - only delete the edge, not the nodes
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      // Just delete the edges, don't touch the nodes
      setEdges((eds) => eds.filter((edge) => !edgesToDelete.some((e) => e.id === edge.id)));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setActiveTab("properties");
    if (node.data) {
      setStageData({
        name: (node.data.label as string) || "",
        leftSide: (node.data.leftSide as string) || "",
        leftDataType: (node.data.leftDataType as string) || "text",
        operator: (node.data.operator as string) || "==",
        rightSide: (node.data.rightSide as string) || "",
        rightDataType: (node.data.rightDataType as string) || "text",
        ifTrueAction: (node.data.ifTrueAction as string) || "complete_success",
        ifTrueActionData: (node.data.ifTrueActionData as Record<string, unknown>) || { message: "" },
        ifFalseAction: (node.data.ifFalseAction as string) || "complete_failure",
        ifFalseActionData: (node.data.ifFalseActionData as Record<string, unknown>) || { error: "" },
        failureMessage: (node.data.failureMessage as string) || "",
        // For success/fail nodes, load message/error/actionType (auto-determined by node type)
        message: (node.data.message as string) || "",
        error: (node.data.error as string) || "",
        actionType: node.type === "success" ? "complete_success" : node.type === "fail" ? "complete_failure" : "",
      });
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setActiveTab("settings");
  }, []);

  // Handle drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent, position: { x: number; y: number }) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/label");

      if (!type) return;

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label,
          leftSide: "",
          operator: "==",
          rightSide: "",
          leftDataType: "text",
          rightDataType: "text",
          ifTrueAction: "complete_success",
          ifTrueActionData: { message: "" },
          ifFalseAction: "complete_failure",
          ifFalseActionData: { error: "" },
          failureMessage: "",
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  // Delete selected node (and associated action nodes if it's a condition)
  const deleteSelectedNode = useCallback(async () => {
    if (!selectedNode) return;

    // Get the node ID to delete
    const nodeIdToDelete = selectedNode.id;
    const nodeData = selectedNode.data as { id?: number };

    // Start with the selected node
    let nodeIdsToDelete = [nodeIdToDelete];

    if (selectedNode.type === "condition") {
      // Extract the step ID from condition node ID (format: "condition-{stepId}")
      const stepIdMatch = nodeIdToDelete.match(/^condition-(\d+)$/);
      if (stepIdMatch) {
        const stepId = stepIdMatch[1];
        // Add associated action nodes to delete list
        nodeIdsToDelete = [
          nodeIdToDelete,
          `success-${stepId}-true`,
          `success-${stepId}-false`,
          `fail-${stepId}-true`,
          `fail-${stepId}-false`,
        ];
      } else {
        // For manually created condition nodes (without step ID pattern)
        // Find all nodes connected to this condition via edges
        const connectedNodeIds = edges.filter((edge) => edge.source === nodeIdToDelete).map((edge) => edge.target);

        nodeIdsToDelete = [nodeIdToDelete, ...connectedNodeIds];
      }

      // If the node has an ID (saved in database), call the delete API
      if (nodeData.id) {
        try {
          await deleteValidationStep(nodeData.id).unwrap();
          toast.success(t("assumptionBuilder.stepDeleted"));

          // Remove from original data ref
          originalNodesDataRef.current.delete(nodeIdToDelete);
        } catch (error) {
          console.error("Error deleting step:", error);
          toast.error(t("assumptionBuilder.failedToDelete"));
          return; // Don't remove from UI if API call fails
        }
      }
    }
    // For success/fail nodes, only delete that specific node (not the condition)
    // nodeIdsToDelete already contains just [nodeIdToDelete]

    // Filter out nodes to delete
    setNodes((nds) => nds.filter((node) => !nodeIdsToDelete.includes(node.id)));

    // Filter out edges connected to any of the deleted nodes
    setEdges((eds) =>
      eds.filter((edge) => !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target))
    );

    setSelectedNode(null);
  }, [selectedNode, edges, setNodes, setEdges, deleteValidationStep, t]);

  // Build workflow JSON and save to API
  const buildWorkflowJSON = useCallback(async () => {
    if (!workflowData.workflowId) {
      toast.error("Workflow ID is required. Please create a workflow first.");
      return;
    }

    // Get new_step_id from workflow data (from API response)
    const newStepId = workflowApiData?.new_step_id || 1;

    // Filter only condition nodes (not success/fail nodes)
    const conditionNodes = nodes.filter((node) => node.type === "condition");

    // FIRST PASS: Assign IDs to all new nodes that don't have one
    const nodeIdAssignments = new Map<string, number>();
    let nextAvailableId = newStepId;

    conditionNodes.forEach((node) => {
      const nodeData = node.data as { id?: number };
      if (!nodeData.id || nodeData.id >= newStepId) {
        // This is a new node, assign it an ID
        const assignedId = nodeData.id || nextAvailableId++;
        nodeIdAssignments.set(node.id, assignedId);
      }
    });

    // Update nodes with assigned IDs (temporarily, for this save operation)
    const updatedNodes = nodes.map((node) => {
      const assignedId = nodeIdAssignments.get(node.id);
      if (assignedId) {
        return {
          ...node,
          data: {
            ...node.data,
            id: assignedId,
          },
        };
      }
      return node;
    });

    // Update the nodes state temporarily so findNextStepFromNode can see the IDs
    setNodes(updatedNodes);

    // Separate new steps (no id or id >= new_step_id) from existing steps (has id < new_step_id)
    const newSteps: Array<{
      id: number;
      name: string;
      description: string;
      order: number;
      x: number;
      y: number;
      left_expression: string;
      operation: string;
      right_expression: string;
      if_true_action: string;
      if_true_action_data: Record<string, unknown>;
      if_false_action: string;
      if_false_action_data: Record<string, unknown>;
      failure_message: string;
      is_active: boolean;
    }> = [];

    const existingStepsUpdates: Array<{
      step_id: number;
      [key: string]: unknown;
    }> = [];

    // Track order counter for all steps
    let orderCounter = 1;

    // Helper function to find next step using updatedNodes (with assigned IDs)
    const findNextStepWithAssignedIds = (
      conditionNodeId: string,
      isTrue: boolean
    ): { action: string; actionData: Record<string, unknown> } => {
      const handleId = isTrue ? "true" : "false";

      // Current condition node
      const currentCondition = updatedNodes.find((n) => n.id === conditionNodeId);
      const currentCondData = (currentCondition?.data || {}) as Record<string, unknown>;

      // Helper to safely read fields
      const getStringField = (src: Record<string, unknown> | undefined, key: string): string | undefined => {
        if (!src) return undefined;
        const val = src[key];
        return typeof val === "string" ? val : undefined;
      };

      // Check for direct connection from condition handle to another condition
      const directEdgeToCondition = edges.find((e) => e.source === conditionNodeId && e.sourceHandle === handleId);

      if (directEdgeToCondition) {
        const targetNode = updatedNodes.find((n) => n.id === directEdgeToCondition.target);

        if (targetNode && targetNode.type === "condition") {
          const targetData = (targetNode.data || {}) as Record<string, unknown>;

          if (typeof targetData.id === "number") {
            const note =
              getStringField(currentCondData, "note") ||
              getStringField(currentCondData, "message") ||
              (isTrue ? "Condition passed" : "Condition failed");

            return {
              action: "proceed_to_step_by_id",
              actionData: { next_step_id: targetData.id, note },
            };
          }
        }
      }

      // Check for action node connection
      const edgeFromCondition = edges.find((e) => e.source === conditionNodeId && e.sourceHandle === handleId);

      if (edgeFromCondition) {
        const targetNode = updatedNodes.find((n) => n.id === edgeFromCondition.target);

        if (targetNode && (targetNode.type === "success" || targetNode.type === "fail")) {
          const actionData = (targetNode.data || {}) as Record<string, unknown>;

          // Check if action node links to another condition
          const edgeToNextStep = edges.find((e) => e.source === targetNode.id);
          if (edgeToNextStep) {
            const nextCondition = updatedNodes.find((n) => n.id === edgeToNextStep.target);
            if (nextCondition && nextCondition.type === "condition") {
              const nextData = (nextCondition.data || {}) as Record<string, unknown>;

              if (typeof nextData.id === "number") {
                const note =
                  getStringField(actionData, "message") ||
                  getStringField(actionData, "error") ||
                  (isTrue ? "Condition passed" : "Condition failed");

                return {
                  action: "proceed_to_step_by_id",
                  actionData: { next_step_id: nextData.id, note },
                };
              }
            }
          }

          // Return action based on node type
          if (targetNode.type === "success") {
            const message = getStringField(actionData, "message") || "";
            return { action: "complete_success", actionData: { message } };
          } else {
            const error = getStringField(actionData, "error") || "";
            return { action: "complete_failure", actionData: { error } };
          }
        }
      }

      // Fallback
      return isTrue
        ? { action: "complete_success", actionData: { message: "" } }
        : { action: "complete_failure", actionData: { error: "" } };
    };

    conditionNodes.forEach((node) => {
      // Get the corresponding node from updatedNodes (which has assigned IDs)
      const updatedNode = updatedNodes.find((n) => n.id === node.id);
      const nodeData = (updatedNode?.data || node.data) as {
        id?: number;
        label?: string;
        leftSide?: string;
        operator?: string;
        rightSide?: string;
        ifTrueAction?: string;
        ifTrueActionData?: Record<string, unknown>;
        ifFalseAction?: string;
        ifFalseActionData?: Record<string, unknown>;
        failureMessage?: string;
      };

      // Determine actions based on edge connections (using nodes with assigned IDs)
      const truePathResult = findNextStepWithAssignedIds(node.id, true);
      const falsePathResult = findNextStepWithAssignedIds(node.id, false);

      console.log("🔍 Node:", node.id);
      console.log("✅ True path:", truePathResult);
      console.log("❌ False path:", falsePathResult);

      const ifTrueAction = truePathResult.action;
      const ifTrueActionData = truePathResult.actionData;
      const ifFalseAction = falsePathResult.action;
      const ifFalseActionData = falsePathResult.actionData;
      const failureMessage = nodeData.failureMessage || `${nodeData.label || "Step"} validation failed`;

      // Get node position (x, y coordinates)
      const nodePosition = node.position;
      const positionX = Math.round(nodePosition.x * 100) / 100; // Round to 2 decimal places
      const positionY = Math.round(nodePosition.y * 100) / 100;

      // Current order for this step
      const currentOrder = orderCounter++;

      // Check if this is a new step (no id OR id >= new_step_id)
      const isNewStep = !nodeData.id || nodeData.id >= newStepId;

      if (!isNewStep && nodeData.id) {
        // Existing step (id < new_step_id) - only send changed fields
        const originalData = originalNodesDataRef.current.get(node.id);
        const changes: { step_id: number; [key: string]: unknown } = {
          step_id: nodeData.id,
        };

        // Compare each field and only add if changed
        if (originalData) {
          let hasChanges = false;

          if (nodeData.label !== originalData.label) {
            changes.name = nodeData.label;
            hasChanges = true;
          }
          // Always include order to maintain position
          changes.order = currentOrder;

          // Check if position changed (compare with original)
          const positionChanged =
            Math.abs(positionX - originalData.x) > 0.01 || Math.abs(positionY - originalData.y) > 0.01;

          // Always include position (x, y coordinates)
          changes.x = positionX;
          changes.y = positionY;

          if (positionChanged) {
            hasChanges = true;
          }

          if (nodeData.leftSide !== originalData.leftSide) {
            changes.left_expression = nodeData.leftSide;
            hasChanges = true;
          }
          if (nodeData.operator !== originalData.operator) {
            changes.operation = nodeData.operator;
            hasChanges = true;
          }
          if (nodeData.rightSide !== originalData.rightSide) {
            changes.right_expression = nodeData.rightSide;
            hasChanges = true;
          }
          if (ifTrueAction !== originalData.ifTrueAction) {
            changes.if_true_action = ifTrueAction;
            hasChanges = true;
          }
          if (JSON.stringify(ifTrueActionData) !== JSON.stringify(originalData.ifTrueActionData)) {
            changes.if_true_action_data = ifTrueActionData;
            hasChanges = true;
          }
          if (ifFalseAction !== originalData.ifFalseAction) {
            changes.if_false_action = ifFalseAction;
            hasChanges = true;
          }
          if (JSON.stringify(ifFalseActionData) !== JSON.stringify(originalData.ifFalseActionData)) {
            changes.if_false_action_data = ifFalseActionData;
            hasChanges = true;
          }
          if (failureMessage !== originalData.failureMessage) {
            changes.failure_message = failureMessage;
            hasChanges = true;
          }

          // Add to updates if there are any actual changes (including position)
          if (hasChanges) {
            changes.workflow_id = workflowData.workflowId;
            existingStepsUpdates.push(changes);
          }
        } else {
          // No original data found, send all fields
          existingStepsUpdates.push({
            step_id: nodeData.id,
            name: nodeData.label || `Step ${currentOrder}`,
            order: currentOrder,
            x: positionX,
            y: positionY,
            left_expression: nodeData.leftSide || "",
            operation: nodeData.operator || "==",
            right_expression: nodeData.rightSide || "",
            if_true_action: ifTrueAction,
            if_true_action_data: ifTrueActionData,
            if_false_action: ifFalseAction,
            if_false_action_data: ifFalseActionData,
            failure_message: failureMessage,
            workflow_id: workflowData.workflowId,
          });
        }
      } else {
        // New step (no id OR id >= new_step_id) - include all fields with ID
        const stepId = nodeData.id || newStepId + newSteps.length;
        newSteps.push({
          id: stepId,
          name: nodeData.label || `Step ${currentOrder}`,
          description: `Validation step: ${nodeData.label || ""}`,
          order: currentOrder,
          x: positionX,
          y: positionY,
          left_expression: nodeData.leftSide || "",
          operation: nodeData.operator || "==",
          right_expression: nodeData.rightSide || "",
          if_true_action: ifTrueAction,
          if_true_action_data: ifTrueActionData,
          if_false_action: ifFalseAction,
          if_false_action_data: ifFalseActionData,
          failure_message: failureMessage,
          is_active: true,
        });
      }
    });

    try {
      const promises: Promise<unknown>[] = [];

      // Create new steps if any
      if (newSteps.length > 0) {
        console.log("📦 Creating new steps with payload:", {
          workflow_id: workflowData.workflowId!,
          new_step_id: newStepId,
          steps: newSteps,
        });

        const createPromise = bulkCreateSteps({
          workflow_id: workflowData.workflowId!,
          new_step_id: newStepId,
          steps: newSteps,
        })
          .unwrap()
          .then((result) => {
            // Handle both `created_steps` and `steps` response formats
            const createdSteps = result.created_steps || result.steps || [];
            const stepCount = result.created_count || createdSteps.length;

            toast.success(
              t("assumptionBuilder.successfullyCreatedSteps", {
                count: stepCount,
              })
            );
            console.log("Created steps:", result);

            // Update nodes with the returned IDs and store original data
            const newStepNodes = conditionNodes.filter((node) => !(node.data as { id?: number }).id);
            setNodes((nds) =>
              nds.map((node) => {
                const newStepIndex = newStepNodes.findIndex((n) => n.id === node.id);
                if (newStepIndex !== -1 && createdSteps[newStepIndex]) {
                  const createdStep = createdSteps[newStepIndex];
                  const nodeData = node.data as Record<string, unknown>;

                  // Store original data for future change detection (including position)
                  if (createdStep.id !== undefined) {
                    originalNodesDataRef.current.set(node.id, {
                      id: createdStep.id,
                      label: (nodeData.label as string) || "",
                      leftSide: (nodeData.leftSide as string) || "",
                      operator: (nodeData.operator as string) || "==",
                      rightSide: (nodeData.rightSide as string) || "",
                      ifTrueAction: (nodeData.ifTrueAction as string) || "complete_success",
                      ifTrueActionData: (nodeData.ifTrueActionData as Record<string, unknown>) || {},
                      ifFalseAction: (nodeData.ifFalseAction as string) || "complete_failure",
                      ifFalseActionData: (nodeData.ifFalseActionData as Record<string, unknown>) || {},
                      failureMessage: (nodeData.failureMessage as string) || "",
                      x: node.position.x,
                      y: node.position.y,
                    });
                  }

                  return {
                    ...node,
                    data: {
                      ...node.data,
                      id: createdStep.id,
                    },
                  };
                }
                return node;
              })
            );
          });
        promises.push(createPromise);
      }

      // Update existing steps if any have changes
      if (existingStepsUpdates.length > 0) {
        console.log("🔄 Updating existing steps with payload:", {
          new_step_id: newStepId,
          updates: existingStepsUpdates,
        });

        const updatePromise = bulkUpdateSteps({
          new_step_id: newStepId,
          updates: existingStepsUpdates,
        })
          .unwrap()
          .then((result) => {
            const count = result.updated_count || result.steps?.length || existingStepsUpdates.length;
            toast.success(t("assumptionBuilder.successfullyUpdatedSteps", { count }));
            console.log("Updated steps:", result);

            // Update original data ref with new values
            existingStepsUpdates.forEach((update) => {
              const node = conditionNodes.find((n) => (n.data as { id?: number }).id === update.step_id);
              if (node) {
                const currentOriginal = originalNodesDataRef.current.get(node.id);
                if (currentOriginal) {
                  // Merge updates into original data
                  originalNodesDataRef.current.set(node.id, {
                    ...currentOriginal,
                    ...(update.name !== undefined && {
                      label: update.name as string,
                    }),
                    ...(update.left_expression !== undefined && {
                      leftSide: update.left_expression as string,
                    }),
                    ...(update.operation !== undefined && {
                      operator: update.operation as string,
                    }),
                    ...(update.right_expression !== undefined && {
                      rightSide: update.right_expression as string,
                    }),
                    ...(update.if_true_action !== undefined && {
                      ifTrueAction: update.if_true_action as string,
                    }),
                    ...(update.if_true_action_data !== undefined && {
                      ifTrueActionData: update.if_true_action_data as Record<string, unknown>,
                    }),
                    ...(update.if_false_action !== undefined && {
                      ifFalseAction: update.if_false_action as string,
                    }),
                    ...(update.if_false_action_data !== undefined && {
                      ifFalseActionData: update.if_false_action_data as Record<string, unknown>,
                    }),
                    ...(update.failure_message !== undefined && {
                      failureMessage: update.failure_message as string,
                    }),
                    // Update position in original data
                    ...(update.x !== undefined && {
                      x: update.x as number,
                    }),
                    ...(update.y !== undefined && {
                      y: update.y as number,
                    }),
                  });
                }
              }
            });
          });
        promises.push(updatePromise);
      }

      if (promises.length === 0) {
        toast.success(t("assumptionBuilder.noChangesToSave"));
        return;
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error saving workflow steps:", error);
      toast.error(t("assumptionBuilder.failedToSaveSteps"));
    }
  }, [workflowData, nodes, edges, bulkCreateSteps, bulkUpdateSteps, setNodes, workflowApiData?.new_step_id]);

  // Show loading overlay while fetching workflow
  if (isLoadingWorkflow) {
    return (
      <div className="h-[calc(100vh-137px)] flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-10 w-10 text-[#00B7AD]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">{t("assumptionBuilder.loadingWorkflow")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-137px)] flex flex-col bg-[#FAFAFA] overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
        <BlocksSidebar
          onDragStart={onDragStart}
          isCollapsed={isLeftSidebarCollapsed}
          onToggleCollapse={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
        />

        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />

        <PropertiesSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedNode={selectedNode}
          stageData={stageData}
          setStageData={setStageData}
          workflowData={workflowData}
          setWorkflowData={setWorkflowData}
          deleteSelectedNode={deleteSelectedNode}
          buildWorkflowJSON={buildWorkflowJSON}
          isCollapsed={isRightSidebarCollapsed}
          onToggleCollapse={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          isSaving={isCreating || isUpdating || isDeleting}
          datasources={datasourcesData?.datasources || []}
          isDatasourcesLoading={isDatasourcesLoading}
        />
      </div>
    </div>
  );
}
