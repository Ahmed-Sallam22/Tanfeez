import { useState } from "react";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import SharedModal from "@/shared/SharedModal";
import { SharedSelect } from "@/shared/SharedSelect";
import type { SelectOption } from "@/shared/SharedSelect";
import SearchBar from "@/shared/SearchBar";

// Sample data for accounts
const accountsData: TableRow[] = [
  {
    id: "ACC001",
    username: "Ahmed Ali",
    sourceAllowed: "Yes",
    targetAllowed: "No",
    transferAllowed: "Yes",
  },
  {
    id: "ACC002",
    username: "Sara Mohamed",
    sourceAllowed: "Yes",
    targetAllowed: "Yes",
    transferAllowed: "Yes",
  },
  {
    id: "ACC003",
    username: "Omar Hassan",
    sourceAllowed: "No",
    targetAllowed: "Yes",
    transferAllowed: "No",
  },
  {
    id: "ACC004",
    username: "Fatima Al-Zahra",
    sourceAllowed: "Yes",
    targetAllowed: "Yes",
    transferAllowed: "Yes",
  },
  {
    id: "ACC005",
    username: "Hassan Mahmoud",
    sourceAllowed: "No",
    targetAllowed: "No",
    transferAllowed: "No",
  },
  {
    id: "ACC006",
    username: "Yasmin Fawzy",
    sourceAllowed: "Yes",
    targetAllowed: "Yes",
    transferAllowed: "Yes",
  },
];

// Cost Center options
const costCenterOptions: SelectOption[] = [
  { value: "CC001", label: "Cost Center 001 - Operations" },
  { value: "CC002", label: "Cost Center 002 - Finance" },
  { value: "CC003", label: "Cost Center 003 - IT Department" },
  { value: "CC004", label: "Cost Center 004 - Human Resources" },
  { value: "CC005", label: "Cost Center 005 - Marketing" },
  { value: "CC006", label: "Cost Center 006 - Sales" },
];

export default function ProjectsOverview() {
  const [selectedCostCenter, setSelectedCostCenter] = useState<string | number>(
    ""
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<TableRow | null>(null);

  // Edit icon component
  const EditIcon = () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9.03516 12.9834H13.333"
        stroke="#757575"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M8.46158 3.11747C8.92122 2.56814 9.74749 2.48758 10.3082 2.93788C10.3392 2.96231 11.3353 3.73614 11.3353 3.73614C11.9513 4.10852 12.1427 4.90018 11.762 5.50431C11.7417 5.53667 6.11013 12.581 6.11013 12.581C5.92277 12.8147 5.63836 12.9527 5.33441 12.956L3.17774 12.9831L2.69181 10.9264C2.62374 10.6372 2.69181 10.3335 2.87917 10.0997L8.46158 3.11747Z"
        stroke="#757575"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.41992 4.4248L10.6509 6.90606"
        stroke="#757575"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  // Table columns configuration
  const accountsColumns: TableColumn[] = [
    {
      id: "id",
      header: "ID",
      accessor: "id",
    },
    {
      id: "username",
      header: "Username",
      accessor: "username",
    },
    {
      id: "sourceAllowed",
      header: "Source Allowed",
      accessor: "sourceAllowed",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Yes"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: "targetAllowed",
      header: "Target Allowed",
      accessor: "targetAllowed",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Yes"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: "transferAllowed",
      header: "Transfer Allowed",
      accessor: "transferAllowed",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Yes"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      render: (_, row) => (
        <button
          onClick={() => handleEdit(row)}
          className="p-2 border rounded-full border-[#EEEEEE] transition-colors"
          title="Edit Account"
        >
          <EditIcon />
        </button>
      ),
    },
  ];

  const handleCostCenterChange = (value: string | number) => {
    setSelectedCostCenter(value);
  };

  const handleEdit = (account: TableRow) => {
    setSelectedAccount(account);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setSelectedAccount(null);
  };

  const handleSaveChanges = () => {
    // Handle save logic here
    console.log("Saving changes for account:", selectedAccount);
    handleCloseModal();
  };
  const [q, setQ] = useState<string>("");

  const handleSearchChange = (text: string) => {
    console.log("Search changed:", text);
    setQ(text);
  };

  const doSearch = (text: string) => {
    console.log("Search submitted:", text);
    // run your filter / API call here
  };

  return (
    <div>
      {/* Page Title */}
      <h1 className="text-2xl font-bold tracking-wide mb-6">
        Projects Overview
      </h1>

      {/* Cost Center Selection */}
      <div className="p-3 shadow-sm rounded-2xl bg-white mb-6">
        <div className="flex items-center gap-4 w-[95%] mx-auto">
          <div>
            <p className="text-sm font-semibold text-[#282828]">Cost Center</p>
          </div>
          <div className="flex-1">
            <SharedSelect
              options={costCenterOptions}
              value={selectedCostCenter}
              onChange={handleCostCenterChange}
              placeholder="Select Cost Center"
              searchable={true}
              searchPlaceholder="Search cost centers..."
            />
          </div>
        </div>
      </div>
      {selectedCostCenter && (
        <div className="p-4 bg-white rounded-2xl mt-4">
          <SearchBar
            placeholder="Search Transfer"
            value={q}
            onChange={handleSearchChange}
            onSubmit={doSearch}
            debounce={250}
          />
        </div>
      )}
      {/* Accounts Table - Only show when cost center is selected */}
      {selectedCostCenter && (
        <div className="mt-6">
          <SharedTable
            title="Accounts"
            columns={accountsColumns}
            data={accountsData}
            maxHeight="600px"
            className="shadow-lg"
            showPagination={false}
            currentPage={1}
            onPageChange={() => {}}
            itemsPerPage={10}
            showActions={false}
            showFooter={false}
          />
        </div>
      )}

      {/* Edit Modal */}
      <SharedModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        title="Edit Account Permissions"
        size="md"
      >
        <div className="p-4">
          {selectedAccount && (
            <div className="space-y-4">
              {/* Account Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Account Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <span className="ml-2 text-gray-900">
                      {String(selectedAccount.id)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Username:</span>
                    <span className="ml-2 text-gray-900">
                      {String(selectedAccount.username)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Permissions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Source Allowed
                    </span>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sourceAllowed"
                          value="Yes"
                          defaultChecked={
                            selectedAccount.sourceAllowed === "Yes"
                          }
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sourceAllowed"
                          value="No"
                          defaultChecked={
                            selectedAccount.sourceAllowed === "No"
                          }
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Target Allowed
                    </span>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="targetAllowed"
                          value="Yes"
                          defaultChecked={
                            selectedAccount.targetAllowed === "Yes"
                          }
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="targetAllowed"
                          value="No"
                          defaultChecked={
                            selectedAccount.targetAllowed === "No"
                          }
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Transfer Allowed
                    </span>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="transferAllowed"
                          value="Yes"
                          defaultChecked={
                            selectedAccount.transferAllowed === "Yes"
                          }
                          className="mr-2"
                        />
                        Yes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="transferAllowed"
                          value="No"
                          defaultChecked={
                            selectedAccount.transferAllowed === "No"
                          }
                          className="mr-2"
                        />
                        No
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </SharedModal>
    </div>
  );
}
