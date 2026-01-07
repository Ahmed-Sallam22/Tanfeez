import { useState } from "react";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import SearchBar from "@/shared/SearchBar";
import SharedModal from "@/shared/SharedModal";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui";

// Sample data for accounts
const accountsData: TableRow[] = [
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC001",
    name: "Ahmed Ali",
    email: "ahmed.ali@company.com",
    department: "Finance",
    role: "Manager",
    status: "Active",
    createdDate: "2024-01-15",
  },
  {
    id: "ACC002",
    name: "Sara Mohamed",
    email: "sara.mohamed@company.com",
    department: "Operations",
    role: "Analyst",
    status: "Active",
    createdDate: "2024-01-20",
  },
  {
    id: "ACC003",
    name: "Omar Hassan",
    email: "omar.hassan@company.com",
    department: "IT",
    role: "Developer",
    status: "Inactive",
    createdDate: "2024-02-05",
  },
  {
    id: "ACC004",
    name: "Fatima Al-Zahra",
    email: "fatima.alzahra@company.com",
    department: "HR",
    role: "Coordinator",
    status: "Active",
    createdDate: "2024-02-10",
  },
  {
    id: "ACC005",
    name: "Hassan Mahmoud",
    email: "hassan.mahmoud@company.com",
    department: "Marketing",
    role: "Specialist",
    status: "Active",
    createdDate: "2024-02-15",
  },
];

// Sample data for projects
const projectsData: TableRow[] = [
  {
    id: "PRJ001",
    name: "Digital Transformation Initiative",
    manager: "Ahmed Ali",
    budget: 500000,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    status: "In Progress",
  },
  {
    id: "PRJ002",
    name: "Customer Portal Enhancement",
    manager: "Sara Mohamed",
    budget: 250000,
    startDate: "2024-02-01",
    endDate: "2024-08-31",
    status: "Completed",
  },
  {
    id: "PRJ003",
    name: "Infrastructure Upgrade",
    manager: "Omar Hassan",
    budget: 750000,
    startDate: "2024-03-01",
    endDate: "2025-03-01",
    status: "In Progress",
  },
  {
    id: "PRJ004",
    name: "Mobile App Development",
    manager: "Fatima Al-Zahra",
    budget: 300000,
    startDate: "2024-04-01",
    endDate: "2024-10-31",
    status: "Planning",
  },
  {
    id: "PRJ005",
    name: "Data Analytics Platform",
    manager: "Hassan Mahmoud",
    budget: 400000,
    startDate: "2024-05-01",
    endDate: "2024-11-30",
    status: "In Progress",
  },
];

type FormValues = {
  code: string;
  parent: string;
  alias: string;
};

// ... accountsData / projectsData كما هي

export default function AccountsProjects() {
  const [activeTab, setActiveTab] = useState<"accounts" | "projects">(
    "accounts"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // const { t } = useTranslation(); // لو بتستخدم i18n
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { code: "", parent: "", alias: "" },
  });

  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // ====== Filters كما هي ======
  const filteredAccountsData = accountsData.filter(
    (account) =>
      account.name
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      account.email
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      account.department
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredProjectsData = projectsData.filter(
    (project) =>
      project.name
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      project.manager
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // ====== Columns كما هي ======
  const accountsColumns: TableColumn[] = [
    { id: "id", header: "Account ID", accessor: "id" },
    { id: "name", header: "Name", accessor: "name" },
    { id: "email", header: "Email", accessor: "email" },
    { id: "department", header: "Department", accessor: "department" },
    { id: "role", header: "Role", accessor: "role" },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    { id: "createdDate", header: "Created Date", accessor: "createdDate" },
  ];

  const projectsColumns: TableColumn[] = [
    { id: "id", header: "Project ID", accessor: "id" },
    { id: "name", header: "Project Name", accessor: "name" },
    { id: "manager", header: "Project Manager", accessor: "manager" },
    {
      id: "budget",
      header: "Budget",
      accessor: "budget",
      render: (value) => (
        <span className="font-medium text-[#282828]">
          ${Number(value).toLocaleString()}
        </span>
      ),
    },
    { id: "startDate", header: "Start Date", accessor: "startDate" },
    { id: "endDate", header: "End Date", accessor: "endDate" },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Completed"
              ? "bg-green-100 text-green-800"
              : value === "In Progress"
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
  ];

  // ====== Helpers ======
  const handleTabChange = (tab: "accounts" | "projects") => {
    setActiveTab(tab);
    setSearchQuery("");
    setCurrentPage(1);
  };
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
  };
  const handleSearchSubmit = (text: string) => {
    console.log("Search submitted:", text);
  };
  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setIsEditMode(false);
    setEditRowIndex(null);
    reset(); // امسح قيم الفورم
  };

  const handleEdit = (row: TableRow, index: number) => {
    console.log("Edit item:", row);

    setIsEditMode(true);
    setEditRowIndex(index);
    setIsCreateModalOpen(true);
    // لو عندك قيم للمشروع/الأكاونت ممكن تملأ الفورم هنا:
    // reset({ code: row.code ?? '', parent: row.parent ?? '', alias: row.alias ?? '' });
  };

  const handleDelete = (row: TableRow) => {
    console.log("Delete item:", row);
  };

  const handleCreateRequest = () => {
    setIsEditMode(false);
    setEditRowIndex(null);
    reset();
    setIsCreateModalOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (activeTab === "projects") {
      if (isEditMode) {
        console.log("Save Project (edit):", values, { index: editRowIndex });
      } else {
        console.log("Create Project:", values);
      }
    } else {
      if (isEditMode) {
        console.log("Save Account (edit):", values, { index: editRowIndex });
      } else {
        console.log("Create Account:", values);
      }
    }
    handleCloseModal();
  };

  const getPageTitle = () =>
    activeTab === "accounts" ? "Accounts Management" : "Projects Management";
  const getButtonText = () =>
    activeTab === "accounts" ? "Add New Account" : "Add New Project";
  const getSearchPlaceholder = () =>
    activeTab === "accounts" ? "Search accounts..." : "Search projects...";

  const modalTitle =
    activeTab === "projects" ? "Add New Project" : "Add New Account";
  const primaryBtnText = isEditMode
    ? activeTab === "projects"
      ? "Save Project"
      : "Save Account"
    : activeTab === "projects"
    ? "Create Project"
    : "Create Account";

  const firstLabel = activeTab === "projects" ? "Project Code" : "Account Code";
  const firstPlaceholder =
    activeTab === "projects" ? "Enter Projects code" : "Enter Account code";

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium tracking-wide">{getPageTitle()}</h1>
        <button
          onClick={handleCreateRequest}
          className="px-4 flex items-center gap-2 py-2 bg-[#4E8476] text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 12.998H13V17.998C13 18.2633 12.8946 18.5176 12.7071 18.7052C12.5196 18.8927 12.2652 18.998 12 18.998C11.7348 18.998 11.4804 18.8927 11.2929 18.7052C11.1054 18.5176 11 18.2633 11 17.998V12.998H6C5.73478 12.998 5.48043 12.8927 5.29289 12.7052C5.10536 12.5176 5 12.2633 5 11.998C5 11.7328 5.10536 11.4785 5.29289 11.2909C5.48043 11.1034 5.73478 10.998 6 10.998H11V5.99805C11 5.73283 11.1054 5.47848 11.2929 5.29094C11.4804 5.1034 11.7348 4.99805 12 4.99805C12.2652 4.99805 12.5196 5.1034 12.7071 5.29094C12.8946 5.47848 13 5.73283 13 5.99805V10.998H18C18.2652 10.998 18.5196 11.1034 18.7071 11.2909C18.8946 11.4785 19 11.7328 19 11.998C19 12.2633 18.8946 12.5176 18.7071 12.7052C18.5196 12.8927 18.2652 12.998 18 12.998Z"
              fill="white"
            />
          </svg>
          {getButtonText()}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("accounts")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "accounts"
                  ? "border-blue-500 font-semibold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Accounts
            </button>
            <button
              onClick={() => handleTabChange("projects")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "projects"
                  ? "border-blue-500 font-semibold text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Projects
            </button>
          </nav>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-2xl mb-6">
        <SearchBar
          placeholder={getSearchPlaceholder()}
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleSearchSubmit}
          debounce={250}
        />
      </div>

      {/* Table */}
      <div>
        <SharedTable
          title={activeTab === "accounts" ? "Accounts List" : "Projects List"}
          columns={activeTab === "accounts" ? accountsColumns : projectsColumns}
          data={
            activeTab === "accounts"
              ? filteredAccountsData
              : filteredProjectsData
          }
          maxHeight="600px"
          className="shadow-lg"
          showPagination
          currentPage={currentPage}
          onPageChange={handlePageChange}
          itemsPerPage={10}
          showActions
          onEdit={handleEdit}
          onDelete={handleDelete}
          showFooter={false}
        />
      </div>

      {/* Modal */}
      <SharedModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        title={modalTitle}
        size="lg"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 p-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-4">
            {/* 1) First (dynamic) */}
            <Input
              label={firstLabel}
              type="text"
              placeholder={firstPlaceholder}
              autoComplete="off"
              error={errors.code?.message}
              {...register("code", { required: `${firstLabel} is required` })}
            />

            {/* 2) Parent */}
            <Input
              label="Parent"
              type="text"
              placeholder="Enter Parent"
              autoComplete="off"
              error={errors.parent?.message}
              {...register("parent", { required: "Parent is required" })}
            />

            {/* 3) Alias */}
            <Input
              label="Alias"
              type="text"
              placeholder="Enter Alias"
              autoComplete="off"
              error={errors.alias?.message}
              {...register("alias", { required: "Alias is required" })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-[#4E8476] rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#4E8476]"
            >
              {primaryBtnText}
            </button>
          </div>
        </form>
      </SharedModal>
    </div>
  );
}
