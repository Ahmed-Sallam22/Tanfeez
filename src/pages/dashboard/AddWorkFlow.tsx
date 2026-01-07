import { Input, Toggle } from "@/components/ui";
import SharedModal from "@/shared/SharedModal";
import { SharedSelect, type SelectOption } from "@/shared/SharedSelect";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useGetSecurityGroupRolesQuery,
  useCreateWorkflowTemplateMutation,
  useUpdateWorkflowTemplateMutation,
  useGetWorkflowTemplateQuery,
  type WorkflowStage,
  type CreateWorkflowRequest,
} from "@/api/workflow.api";
// import { useGetSecurityGroupsQuery } from "@/api/securityGroups.api";

export default function AddWorkFlow() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const { t } = useTranslation();

  // API hooks
  const { data: securityGroupRolesData } = useGetSecurityGroupRolesQuery();
  // const { data: securityGroupsData } = useGetSecurityGroupsQuery();
  const [createWorkflowTemplate, { isLoading: isCreating }] =
    useCreateWorkflowTemplateMutation();
  const [updateWorkflowTemplate, { isLoading: isUpdating }] =
    useUpdateWorkflowTemplateMutation();
  const { data: workflowData, isLoading: isLoadingWorkflow } =
    useGetWorkflowTemplateQuery(Number(id), { skip: !isEditMode });

  const handleBack = () => {
    navigate("/app/WorkFlow"); // Navigate back to the previous page
  };

  // Workflow form state
  const [workflowForm, setWorkflowForm] = useState({
    code: "",
    name: "",
    transferType: "",
    version: undefined as number | undefined,
    description: "",
    isActive: true,
    affectActiveInstances: false,
  });

  // Stages state
  const [stages, setStages] = useState<WorkflowStage[]>([]);

  // Stage form state for modal
  const [stageForm, setStageForm] = useState({
    name: "",
    decisionPolicy: "ALL" as "ALL" | "ANY" | "QUORUM",
    allowReject: true,
    slaHours: undefined as number | undefined,
    requiredRole: undefined as number | undefined,
    isActive: true,
  });

  // Edit stage state
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(
    null
  );
  const [isStageEditMode, setIsStageEditMode] = useState(false);

  const [Transtype, setTranstype] = useState<string>("");

  // Load workflow data when editing
  useEffect(() => {
    if (isEditMode && workflowData) {
      const formData = {
        code: workflowData.code,
        name: workflowData.name,
        transferType: workflowData.transfer_type,
        version: workflowData.version,
        description: workflowData.description,
        isActive: workflowData.is_active,
        affectActiveInstances: workflowData.affect_active_instances || false,
      };

      setWorkflowForm(formData);
      setTranstype(workflowData.transfer_type);

      // Load stages data
      if (workflowData.stages) {
        const mappedStages: WorkflowStage[] = workflowData.stages.map(
          (stage) => ({
            order_index: stage.order_index,
            name: stage.name,
            decision_policy: stage.decision_policy,
            allow_reject: stage.allow_reject,
            sla_hours: stage.sla_hours,
            security_group: stage.security_group,
            security_group_name: stage.security_group_name,
            // Map additional fields if needed
            allow_delegate: stage.allow_delegate,
            quorum_count: stage.quorum_count,
            required_role: stage.required_role,
            dynamic_filter_json: stage.dynamic_filter_json,
            parallel_group: stage.parallel_group,
          })
        );
        setStages(mappedStages);
      }
    }
  }, [isEditMode, workflowData]);

  // Function to get all workflow values
  const getAllWorkflowValues = (): CreateWorkflowRequest => {
    // Always return all values for both create and update operations
    return {
      code: workflowForm.code,
      transfer_type: workflowForm.transferType,
      name: workflowForm.name,
      description: workflowForm.description,
      version: workflowForm.version || 1,
      is_active: workflowForm.isActive,
      affect_active_instances: workflowForm.affectActiveInstances,
      stages: stages,
    };
  };

  // Select options for transaction dates
  const TranstypeOptions: SelectOption[] = [
    { value: "FAR", label: "FAR" },
    { value: "DFR", label: "DFR" },
    { value: "AFR", label: "AFR" },
    { value: "HFR", label: "HFR" },
    { value: "Generic", label: "Generic" },
  ];

  // Decision policy options
  const decisionPolicyOptions: SelectOption[] = [
    { value: "ALL", label: "ALL" },
    { value: "ANY", label: "ANY" },
    { value: "QUORUM", label: "QUORUM" },
  ];

  // Role options from security group roles (group-specific role assignments)
  const roleOptions: SelectOption[] =
    securityGroupRolesData?.roles
      ?.filter((role) => role.is_active)
      .map((role) => ({
        value: role.id.toString(), // XX_SecurityGroupRole.id
        label: role.display_name, // "Group Name - Role Name"
      })) || [];

  // Security group options from API
  // const securityGroupOptions: SelectOption[] =
  //   securityGroupsData?.groups?.filter(group => group.is_active).map((group) => ({
  //     value: group.id.toString(),
  //     label: group.group_name,
  //   })) || [];

  const handleSelectChange = (value: string | number) => {
    setTranstype(String(value));
    setWorkflowForm((prev) => ({ ...prev, transferType: String(value) }));
  };

  const handleCreateStage = () => {
    if (isStageEditMode && editingStageIndex !== null) {
      // Update existing stage
      const updatedStages = [...stages];
      updatedStages[editingStageIndex] = {
        order_index: editingStageIndex + 1,
        name: stageForm.name,
        decision_policy: stageForm.decisionPolicy,
        allow_reject: stageForm.allowReject,
        sla_hours: stageForm.slaHours || 24,
        required_role: stageForm.requiredRole || null,
      };
      setStages(updatedStages);
      setIsStageEditMode(false);
      setEditingStageIndex(null);
    } else {
      // Create new stage
      const newStage: WorkflowStage = {
        order_index: stages.length + 1,
        name: stageForm.name,
        decision_policy: stageForm.decisionPolicy,
        allow_reject: stageForm.allowReject,
        sla_hours: stageForm.slaHours || 24,
        required_role: stageForm.requiredRole || null,
      };
      setStages((prev) => [...prev, newStage]);
    }

    setIsCreateModalOpen(false);

    // Reset stage form
    setStageForm({
      name: "",
      decisionPolicy: "ALL",
      allowReject: true,
      slaHours: undefined,
      requiredRole: undefined,
      isActive: true,
    });
  };

  const handleDeleteStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Reorder the remaining stages
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      order_index: i + 1,
    }));
    setStages(reorderedStages);
  };

  const handleEditStage = (index: number) => {
    const stage = stages[index];
    setStageForm({
      name: stage.name,
      decisionPolicy: stage.decision_policy,
      allowReject: stage.allow_reject,
      slaHours: stage.sla_hours,
      requiredRole: stage.required_role || undefined,
      isActive: true,
    });
    setEditingStageIndex(index);
    setIsStageEditMode(true);
    setIsCreateModalOpen(true);
  };

  const handleCreateWorkflow = async () => {
    try {
      const workflowData = getAllWorkflowValues();

      if (isEditMode && id) {
        // Update existing workflow with all values
        await updateWorkflowTemplate({
          id: Number(id),
          body: workflowData,
        }).unwrap();
      } else {
        // Create new workflow
        await createWorkflowTemplate(workflowData).unwrap();
      }

      // Navigate back to workflow list on success
      navigate("/app/WorkFlow");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} workflow:`,
        error
      );
    }
  };

  function DotSeparated({ items }: { items: string[] }) {
    return (
      <div className="flex items-center text-xs text-[#757575] [&>*+*]:before:content-['•'] [&>*+*]:before:mx-2">
        {items.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    );
  }

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const handleCreateWorkFlow = () => {
    // Reset form for new stage
    setStageForm({
      name: "",
      decisionPolicy: "ALL",
      allowReject: true,
      slaHours: undefined,
      requiredRole: undefined,
      isActive: true,
    });
    setIsStageEditMode(false);
    setEditingStageIndex(null);
    // Open modal after clearing values
    setIsCreateModalOpen(true);

    console.log("Creating new stage - form cleared"); // Debug log
  };
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsStageEditMode(false);
    setEditingStageIndex(null);
    // Reset stage form
    setStageForm({
      name: "",
      decisionPolicy: "ALL",
      allowReject: true,
      slaHours: undefined,
      requiredRole: undefined,
      isActive: true,
    });
  };

  // Show loading state when fetching workflow data for editing
  if (isEditMode && isLoadingWorkflow) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E8476]"></div>
        <span className="ml-2 text-gray-600">
          {t("workflow.loadingWorkflow")}
        </span>
      </div>
    );
  }

  return (
    <div>
      <SharedModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={
          isStageEditMode ? t("workflow.editStage") : t("workflow.createStage")
        }
        size="md"
      >
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Input
              label={t("workflow.stageName")}
              type="text"
              placeholder={t("workflow.enterStageName")}
              value={stageForm.name}
              onChange={(e) =>
                setStageForm((prev) => ({ ...prev, name: e.target.value }))
              }
              autoComplete="off"
            />

            <SharedSelect
              title={t("workflow.decisionPolicy")}
              size="text-sm"
              options={decisionPolicyOptions}
              value={stageForm.decisionPolicy}
              onChange={(value) =>
                setStageForm((prev) => ({
                  ...prev,
                  decisionPolicy: value as "ALL" | "ANY" | "QUORUM",
                }))
              }
              placeholder={t("workflow.selectDecisionPolicy")}
            />

            <SharedSelect
              title={t("workflow.requiredRole")}
              size="text-sm"
              options={roleOptions}
              value={stageForm.requiredRole?.toString() || ""}
              onChange={(value) =>
                setStageForm((prev) => ({
                  ...prev,
                  requiredRole: value ? Number(value) : undefined,
                }))
              }
              placeholder={t("workflow.selectRole")}
            />

            <Input
              label={t("workflow.slaHours")}
              type="number"
              placeholder={t("workflow.enterSlaHours")}
              value={stageForm.slaHours?.toString() || ""}
              onChange={(e) =>
                setStageForm((prev) => ({
                  ...prev,
                  slaHours: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              autoComplete="off"
            />

            <div className="space-y-4">
              <Toggle
                id="allowReject"
                label={t("workflow.allowReject")}
                checked={stageForm.allowReject}
                onChange={(checked) =>
                  setStageForm((prev) => ({
                    ...prev,
                    allowReject: checked,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("workflow.cancel")}
            </button>
            <button
              onClick={handleCreateStage}
              disabled={!stageForm.name || !stageForm.slaHours}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-[#4E8476] rounded-md hover:bg-[#4E8476] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isStageEditMode
                ? t("workflow.updateStage")
                : t("workflow.createStage")}
            </button>
          </div>
        </div>
      </SharedModal>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2  cursor-pointer py-2 text-md text-[#4E8476] hover:text-[#4E8476] "
          >
            {t("workflow.workflows")}
          </button>
          <span className="text-[#737373] text-lg">/</span>
          <h1 className="text-md  text-[#282828] font-meduim tracking-wide">
            {isEditMode
              ? t("workflow.editWorkflow")
              : t("workflow.createNewWorkflow")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2  cursor-pointer p-1   text-md  text-[#282828] px-4 py-2 rounded-md border border-[#BBBBBB] transition"
          >
            {t("workflow.cancel")}
          </button>
          <button
            onClick={handleCreateWorkflow}
            disabled={
              !workflowForm.code ||
              !workflowForm.name ||
              !workflowForm.transferType ||
              !workflowForm.version ||
              stages.length === 0 ||
              isCreating ||
              isUpdating
            }
            className="flex items-center gap-2 cursor-pointer p-1 text-md bg-[#4E8476] text-white px-4 py-2 rounded-md hover:bg-[#4E8476] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isCreating || isUpdating) && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isEditMode
              ? t("workflow.updateWorkflow")
              : t("workflow.addWorkflow")}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3 ">
          <h2 className="text-md ">{t("workflow.workflowInformation")}</h2>

          <div className="flex items-center gap-4">
            <Toggle
              id="affectActiveInstances"
              label={t("workflow.affectActiveInstances")}
              checked={workflowForm.affectActiveInstances}
              onChange={(checked) =>
                setWorkflowForm((prev) => ({
                  ...prev,
                  affectActiveInstances: checked,
                }))
              }
            />

            <Toggle
              id="workflowStatus"
              label={t("workflow.active")}
              checked={workflowForm.isActive}
              onChange={(checked) =>
                setWorkflowForm((prev) => ({
                  ...prev,
                  isActive: checked,
                }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Input
            label={t("workflow.workflowCode")}
            type="text"
            placeholder={t("workflow.enterCode")}
            value={workflowForm.code}
            onChange={(e) =>
              setWorkflowForm((prev) => ({ ...prev, code: e.target.value }))
            }
            autoComplete="off"
          />

          <Input
            label={t("workflow.workflowName")}
            type="text"
            placeholder={t("workflow.enterWorkflowName")}
            value={workflowForm.name}
            onChange={(e) =>
              setWorkflowForm((prev) => ({ ...prev, name: e.target.value }))
            }
            autoComplete="off"
          />
          <SharedSelect
            title={t("workflow.transferType")}
            size="text-sm"
            options={TranstypeOptions}
            value={Transtype}
            onChange={handleSelectChange}
            placeholder={t("workflow.selectTransactionDate")}
          />
          <Input
            label={t("workflow.workflowVersion")}
            type="number"
            placeholder={t("workflow.enterVersion")}
            value={workflowForm.version?.toString() || ""}
            onChange={(e) =>
              setWorkflowForm((prev) => ({
                ...prev,
                version: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            autoComplete="off"
          />

          <div className="col-span-2">
            <label className="text-sm font-semibold " htmlFor="des">
              {t("workflow.workflowDescription")}
            </label>
            <textarea
              placeholder={t("workflow.describeIssue")}
              rows={6}
              value={workflowForm.description}
              onChange={(e) =>
                setWorkflowForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={`w-full px-3 py-3 mt-3 border border-[#E2E2E2] resize-none placeholder:text-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4E8476] focus:border-transparent`}
              name="description"
              id="description"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 mt-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-md ">{t("workflow.workflowStages")}</h2>

          <button
            onClick={handleCreateWorkFlow}
            className="flex items-center gap-2 text-sm  cursor-pointer p-1   text-md bg-[#4E8476] text-white px-4 py-2 rounded-md hover:bg-[#4E8476] transition"
          >
            {t("workflow.addStage")}
          </button>
        </div>

        {stages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("workflow.noStagesYet")}
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 h-full items-center"
              >
                <div className="col-span-1 flex items-center h-full justify-center font-semibold text-xl text-[#4E8476] bg-[#F6F6F6] rounded-md p-4">
                  #{stage.order_index}
                </div>
                <div className="col-span-11 bg-[#F6F6F6] rounded-md p-4 flex flex-col gap-4">
                  <h2 className="text-md font-semibold text-[#4E8476]">
                    {stage.name}
                  </h2>
                  <div className="flex  gap-2 justify-between ">
                    <div className="flex flex-col gap-2">
                      <DotSeparated
                        items={[
                          `${t("workflow.decisionPolicy")}: ${
                            stage.decision_policy
                          }`,
                          `${t("workflow.allowReject")}: ${
                            stage.allow_reject
                              ? t("workflow.yes")
                              : t("workflow.no")
                          }`,
                          ...(stage.required_role_name
                            ? [
                                `${t("workflow.requiredRole")}: ${
                                  stage.required_role_name
                                }`,
                              ]
                            : []),
                        ]}
                      />
                      <p className="text-xs text-[#757575]">
                        {t("workflow.sla")}: {stage.sla_hours}
                        {t("workflow.hours")}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      {/* Edit Icon */}
                      <button
                        onClick={() => handleEditStage(index)}
                        className="p-1.5 text-[#4E8476] hover:bg-[#4E8476] rounded-md transition-colors"
                        title={t("workflow.editStageTitle")}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDeleteStage(index)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title={t("workflow.deleteStageTitle")}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3,6 5,6 21,6" />
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
