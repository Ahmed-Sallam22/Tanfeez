import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { SharedSelect, type SelectOption } from "@/shared/SharedSelect";
import { useGetSecurityGroupsQuery } from "@/api/securityGroups.api";
import { useGetWorkflowTemplatesQuery } from "@/api/workflow.api";
import { useGetWorkflowAssignmentsQuery, useBulkAssignWorkflowsMutation } from "@/api/workflowAssignment.api";
import toast from "react-hot-toast";

export default function WorkflowAssignments() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedSecurityGroup, setSelectedSecurityGroup] = useState<number | null>(null);
  const [workflowSelections, setWorkflowSelections] = useState<
    {
      workflow_template_id: number;
      execution_order: number;
      transaction_code_filter?: string | null;
    }[]
  >([]);

  const { data: securityGroupsData } = useGetSecurityGroupsQuery();
  const { data: workflowTemplatesData } = useGetWorkflowTemplatesQuery();
  const { data: assignmentsData, refetch } = useGetWorkflowAssignmentsQuery(selectedSecurityGroup || undefined);
  const [bulkAssign, { isLoading: isSaving }] = useBulkAssignWorkflowsMutation();

  const securityGroupOptions: SelectOption[] =
    securityGroupsData?.groups
      ?.filter((g) => g.is_active)
      .map((group) => ({
        value: group.id.toString(),
        label: group.group_name,
      })) || [];

  const workflowOptions: SelectOption[] =
    workflowTemplatesData?.results
      ?.filter((w) => w.is_active)
      .map((workflow) => ({
        value: workflow.id.toString(),
        label: `${workflow.code} - ${workflow.name}`,
      })) || [];

  // Load existing assignments when security group changes
  useEffect(() => {
    if (selectedSecurityGroup && assignmentsData?.assignments) {
      const existingAssignments = assignmentsData.assignments.map((a) => ({
        workflow_template_id: a.workflow_template,
        execution_order: a.execution_order,
        transaction_code_filter: a.transaction_code_filter,
      }));
      setWorkflowSelections(existingAssignments);
    } else {
      setWorkflowSelections([]);
    }
  }, [selectedSecurityGroup, assignmentsData]);

  // Group workflows by transaction code
  const groupedWorkflows = workflowSelections.reduce((groups, workflow, index) => {
    const key = workflow.transaction_code_filter || "ALL";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push({ ...workflow, originalIndex: index });
    return groups;
  }, {} as Record<string, Array<(typeof workflowSelections)[0] & { originalIndex: number }>>);

  const handleAddWorkflow = (transactionCode: string | null = null) => {
    const nextOrder = workflowSelections.length + 1;
    setWorkflowSelections([
      ...workflowSelections,
      { workflow_template_id: 0, execution_order: nextOrder, transaction_code_filter: transactionCode },
    ]);
  };

  const handleTransactionCodeChange = (index: number, code: string) => {
    const updated = [...workflowSelections];
    updated[index].transaction_code_filter = code === "" ? null : code;
    setWorkflowSelections(updated);
  };

  const handleRemoveWorkflow = (index: number) => {
    const updated = workflowSelections.filter((_, i) => i !== index);
    // Reorder
    const reordered = updated.map((w, i) => ({
      ...w,
      execution_order: i + 1,
    }));
    setWorkflowSelections(reordered);
  };

  const handleWorkflowChange = (index: number, workflowId: number) => {
    const updated = [...workflowSelections];
    updated[index].workflow_template_id = workflowId;
    setWorkflowSelections(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...workflowSelections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Reorder
    const reordered = updated.map((w, i) => ({
      ...w,
      execution_order: i + 1,
    }));
    setWorkflowSelections(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index === workflowSelections.length - 1) return;
    const updated = [...workflowSelections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Reorder
    const reordered = updated.map((w, i) => ({
      ...w,
      execution_order: i + 1,
    }));
    setWorkflowSelections(reordered);
  };

  const handleSave = async () => {
    if (!selectedSecurityGroup) {
      toast.error(t("workflow.selectSecurityGroupFirst"));
      return;
    }

    // Validate all workflows selected
    const hasEmpty = workflowSelections.some((w) => w.workflow_template_id === 0);
    if (hasEmpty) {
      toast.error(t("workflow.selectAllWorkflows"));
      return;
    }

    try {
      // Format workflow assignments for backend
      const formattedAssignments = workflowSelections.map((w) => ({
        workflow_template_id: w.workflow_template_id,
        execution_order: w.execution_order,
        transaction_code_filter: w.transaction_code_filter === "" ? null : w.transaction_code_filter || null,
      }));

      await bulkAssign({
        security_group_id: selectedSecurityGroup,
        workflow_assignments: formattedAssignments,
      }).unwrap();

      toast.success(t("workflow.assignmentsSaved"));
      refetch();
    } catch (error) {
      console.error("Failed to save assignments:", error);
      const apiError = error as { data?: { message?: string } };
      toast.error(apiError?.data?.message || t("workflow.assignmentsFailed"));
    }
  };

  const handleBack = () => {
    navigate("/app/WorkFlow");
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 cursor-pointer py-2 text-md text-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            {t("workflow.workflows")}
          </button>
          <span className="text-[#737373] text-lg">/</span>
          <h1 className="text-md text-[#282828] font-medium tracking-wide">
            {t("workflow.workflowAssignments")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 cursor-pointer p-1 text-md text-[#282828] px-4 py-2 rounded-md border border-[#BBBBBB] transition"
          >
            {t("workflow.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedSecurityGroup || isSaving}
            className="flex items-center gap-2 cursor-pointer p-1 text-md bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:bg-[var(--color-primary)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {t("workflow.saveAssignments")}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <div>
          <h2 className="text-md font-semibold mb-4">
            {t("workflow.selectSecurityGroup")}
          </h2>
          <SharedSelect
            title={t("workflow.securityGroup")}
            size="text-sm"
            options={securityGroupOptions}
            value={selectedSecurityGroup?.toString() || ""}
            onChange={(value) => setSelectedSecurityGroup(Number(value))}
            placeholder={t("workflow.selectSecurityGroup")}
          />
        </div>

        {selectedSecurityGroup && (
          <>
            {/* Display current assignments info */}
            {assignmentsData && assignmentsData.count > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  ✓ {t("workflow.currentlyAssigned")}:{" "}
                  <strong>{assignmentsData.count}</strong>{" "}
                  {t("workflow.workflows")}
                  {assignmentsData.assignments &&
                    assignmentsData.assignments.length > 0 && (
                      <span className="ml-2 text-xs">
                        (
                        {assignmentsData.assignments
                          .map((a) => a.workflow_template_code)
                          .join(", ")}
                        )
                      </span>
                    )}
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold">
                  {t("workflow.assignedWorkflows")}
                  {workflowSelections.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({workflowSelections.length} {t("workflow.total")})
                    </span>
                  )}
                </h2>
              </div>

              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
                <p className="mb-4">{t("workflow.noWorkflowsAssigned")}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleAddWorkflow("FAR")}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    + {t("workflow.addFarWorkflow")}
                  </button>
                  <button
                    onClick={() => handleAddWorkflow("DFR")}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                  >
                    + {t("workflow.addDfrWorkflow")}
                  </button>
                  <button
                    onClick={() => handleAddWorkflow("HFR")}
                    className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
                  >
                    + {t("workflow.addHfrWorkflow")}
                  </button>
                  <button
                    onClick={() => handleAddWorkflow("AFR")}
                    className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm"
                  >
                    + {t("workflow.addAfrWorkflow")}
                  </button>
                  <button
                    onClick={() => handleAddWorkflow(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                  >
                    + {t("workflow.addGeneralWorkflow")}
                  </button>
                </div>
              </div>

              {workflowSelections.length === 0 ? (
                <></>
              ) : (
                <div className="space-y-6">
                  {/* Group workflows by transaction code */}
                  {Object.entries(groupedWorkflows)
                    .sort(([keyA], [keyB]) => {
                      // Sort: FAR, DFR, HFR, others, ALL
                      const order = ["FAR", "DFR", "HFR", "AFR", "ALL"];
                      return order.indexOf(keyA) - order.indexOf(keyB);
                    })
                    .map(([transactionCode, workflows]) => (
                      <div
                        key={transactionCode}
                        className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {transactionCode === "ALL" ? (
                              <span className="text-gray-700">
                                🌐 {t("workflow.allTransactions")}
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`px-3 py-1 rounded-md text-white ${
                                    transactionCode === "FAR"
                                      ? "bg-blue-500"
                                      : transactionCode === "DFR"
                                      ? "bg-green-500"
                                      : transactionCode === "HFR"
                                      ? "bg-purple-500"
                                      : "bg-orange-500"
                                  }`}
                                >
                                  {transactionCode}
                                </span>
                                <span className="text-gray-600">
                                  {t("workflow.workflowsLabel")}
                                </span>
                              </>
                            )}
                            <span className="text-sm text-gray-500 font-normal">
                              ({workflows.length}{" "}
                              {workflows.length !== 1
                                ? t("workflow.workflows_plural")
                                : t("workflow.workflow")}
                              )
                            </span>
                          </h3>
                          <button
                            onClick={() =>
                              handleAddWorkflow(
                                transactionCode === "ALL"
                                  ? null
                                  : transactionCode
                              )
                            }
                            className="flex items-center gap-1 text-xs cursor-pointer bg-[var(--color-primary)] text-white px-3 py-1 rounded-md hover:bg-[#3d6d5f] transition"
                          >
                            + {t("workflow.addTo")} {transactionCode}
                          </button>
                        </div>

                        <div className="space-y-3">
                          {workflows.map((workflow, groupIndex) => {
                            const index = workflow.originalIndex;
                            const selection = workflowSelections[index];
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-3 bg-[#F6F6F6] p-4 rounded-md"
                              >
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={t("workflow.moveUp")}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polyline points="18 15 12 9 6 15"></polyline>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleMoveDown(index)}
                                    disabled={
                                      index === workflowSelections.length - 1
                                    }
                                    className="p-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={t("workflow.moveDown")}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                  </button>
                                </div>

                                <div className="flex items-center justify-center bg-[var(--color-primary)] text-white font-semibold rounded-md px-3 py-2 min-w-[40px]">
                                  {groupIndex + 1}
                                </div>

                                <div className="flex-1 space-y-2">
                                  <SharedSelect
                                    title=""
                                    size="text-sm"
                                    options={workflowOptions}
                                    value={selection.workflow_template_id.toString()}
                                    onChange={(value) =>
                                      handleWorkflowChange(index, Number(value))
                                    }
                                    placeholder={t("workflow.selectWorkflow")}
                                  />

                                  {/* Transaction Code Filter */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600 min-w-fit">
                                      {t("workflow.applyToTransaction")}:
                                    </label>
                                    <select
                                      value={
                                        selection.transaction_code_filter || ""
                                      }
                                      onChange={(e) =>
                                        handleTransactionCodeChange(
                                          index,
                                          e.target.value
                                        )
                                      }
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] bg-white"
                                    >
                                      <option value="">
                                        {t("workflow.allTransactionsNoFilter")}
                                      </option>
                                      <option value="FAR">
                                        {t("workflow.farOnly")}
                                      </option>
                                      <option value="DFR">
                                        {t("workflow.dfrOnly")}
                                      </option>
                                      <option value="HFR">
                                        {t("workflow.hfrOnly")}
                                      </option>
                                      <option value="AFR">
                                        {t("workflow.afrOnly")}
                                      </option>
                                    </select>
                                    {selection.transaction_code_filter && (
                                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                                        {selection.transaction_code_filter}{" "}
                                        {t("workflow.only")}
                                      </span>
                                    )}
                                  </div>

                                  {/* Show additional info if this is an existing assignment */}
                                  {assignmentsData?.assignments &&
                                    assignmentsData.assignments[index] && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1">
                                          <span className="font-semibold">
                                            {
                                              assignmentsData.assignments[index]
                                                .workflow_template_code
                                            }
                                          </span>
                                          <span>•</span>
                                          <span>
                                            {
                                              assignmentsData.assignments[index]
                                                .transfer_type
                                            }
                                          </span>
                                          {assignmentsData.assignments[index]
                                            .transaction_code_filter && (
                                            <>
                                              <span>•</span>
                                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                {t("workflow.filter")}:{" "}
                                                {
                                                  assignmentsData.assignments[
                                                    index
                                                  ].transaction_code_filter
                                                }
                                              </span>
                                            </>
                                          )}
                                          {assignmentsData.assignments[index]
                                            .created_at && (
                                            <>
                                              <span>•</span>
                                              <span>
                                                {t("workflow.created")}:{" "}
                                                {new Date(
                                                  assignmentsData.assignments[
                                                    index
                                                  ].created_at
                                                ).toLocaleDateString()}
                                              </span>
                                            </>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                </div>

                                <button
                                  onClick={() => handleRemoveWorkflow(index)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                  title={t("workflow.remove")}
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <polyline points="3,6 5,6 21,6" />
                                    <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                ℹ️ {t("workflow.transactionCodeFilterInfo")}
              </h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>
                  • <strong>{t("workflow.filterInfo1")}</strong>
                </li>
                <li>
                  • <strong>{t("workflow.filterInfo2")}</strong>
                </li>
                <li>
                  • <strong>{t("workflow.filterInfo3")}</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>- {t("workflow.filterInfo3a")}</li>
                    <li>- {t("workflow.filterInfo3b")}</li>
                    <li>- {t("workflow.filterInfo3c")}</li>
                    <li>- {t("workflow.filterInfo3d")}</li>
                  </ul>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
