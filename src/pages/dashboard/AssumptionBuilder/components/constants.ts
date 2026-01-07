import type { SelectOption } from "@/shared/SharedSelect";

// Operator options for conditions
export const operatorOptions: SelectOption[] = [
  { value: "==", label: "Equal (==)" },
  { value: "!=", label: "Not Equal (!=)" },
  { value: ">", label: "Greater Than (>)" },
  { value: "<", label: "Less Than (<)" },
  { value: ">=", label: "Greater or Equal (>=)" },
  { value: "<=", label: "Less or Equal (<=)" },
  { value: "contains", label: "Contains" },
  { value: "startsWith", label: "Starts With" },
  { value: "endsWith", label: "Ends With" },
  { value: "in", label: "In (value in list)" },
  { value: "not_in", label: "Not In (value not in list)" },
  { value: "in_contain", label: "In List (Contains)" },
  { value: "not_in_contain", label: "Not In List (Contains)" },
  { value: "in_starts_with", label: "In List (Starts With)" },
  { value: "not_in_starts_with", label: "Not In List (Starts With)" },
];

// Data type options
export const dataTypeOptions: SelectOption[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "field", label: "Field Reference" },
];

// Execution point options
export const executionPointOptions: SelectOption[] = [
  { value: "before_create", label: "Before Create" },
  { value: "after_create", label: "After Create" },
  { value: "before_update", label: "Before Update" },
  { value: "after_update", label: "After Update" },
  { value: "before_delete", label: "Before Delete" },
  { value: "after_delete", label: "After Delete" },
];

// Action options for if_true_action and if_false_action
export const actionOptions: SelectOption[] = [
  { value: "complete_success", label: "Complete Success" },
  { value: "complete_failure", label: "Complete Failure" },
];
