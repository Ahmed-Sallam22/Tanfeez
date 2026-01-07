import type { ValidationWorkflow } from "./types";

// Status options
export const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Dummy data for fallback (will be replaced by API data)
export const dummyValidationWorkflows: ValidationWorkflow[] = [
  {
    id: 1,
    name: "Transfer Balance",
    description: "Check Total From is equals to total To",
    execution_point: "general",
    status: "inactive",
    is_default: true,
    created_by: 24,
    created_by_username: "ahmed",
    created_at: "2025-12-13T16:24:24.728254Z",
    updated_at: "2025-12-13T16:53:45.300324Z",
  },
];

// Keep old exports for backward compatibility
export const dummyAssumptions = dummyValidationWorkflows;
