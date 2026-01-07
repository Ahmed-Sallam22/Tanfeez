// Types for Validation Workflow
export interface ValidationWorkflow {
  id: number;
  name: string;
  description: string;
  execution_point: string;
  status: 'draft' | 'active' | 'inactive';
  is_default: boolean;
  created_by: number;
  created_by_username: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationWorkflowFormData {
  name: string;
  description: string;
  executionPoint: string;
  status: 'draft' | 'active' | 'inactive';
}

// Keep old types for backward compatibility (can be removed later)
export type AssumptionTemplate = ValidationWorkflow;
export type AssumptionFormData = ValidationWorkflowFormData;
