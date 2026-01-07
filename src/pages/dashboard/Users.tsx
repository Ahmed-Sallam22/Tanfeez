/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { SharedTable } from "@/shared/SharedTable";
import type { TableColumn, TableRow } from "@/shared/SharedTable";
import SearchBar from "@/shared/SearchBar";
import SharedModal from "@/shared/SharedModal";
import { SharedSelect } from "@/shared/SharedSelect";
import type { SelectOption } from "@/shared/SharedSelect";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Sample data for users
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useAssignUserLevelMutation,
  type UserListItem,
} from "@/api/user.api";
import {
  useGetLevelsQuery,
  useCreateLevelMutation,
  useUpdateLevelMutation,
  useDeleteLevelMutation,
  type LevelItem,
} from "@/api/level.api";

const toApiRole = (uiRole: string) =>
  (uiRole || "").toLowerCase() === "admin" ? "admin" : "user";

const fromApiRole = (apiRole: string) =>
  (apiRole || "").toLowerCase() === "admin" ? "Admin" : "User";
// Role options
const roleOptions: SelectOption[] = [
  { value: "Admin", label: "Admin" },
  { value: "User", label: "User" },
];

function UserChip({ name }: { name: string }) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#EEEEEE]  px-2 py-1 shadow-sm ring-1 ring-black/5">
      <span className="grid place-items-center h-6 w-6 rounded-full bg-[white] text-[#4E8476] text-xs font-bold">
        {initial}
      </span>
      <span className="text-sm text-gray-700">{name}</span>
    </div>
  );
}
export default function Users() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "users" | "userLevels" | "assignment"
  >("users");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: serverLevels } = useGetLevelsQuery();
  const [createLevel] = useCreateLevelMutation();
  const [updateLevel] = useUpdateLevelMutation();
  const [deleteLevel] = useDeleteLevelMutation();

  const userLevelsData: TableRow[] = useMemo(() => {
    const list = serverLevels ?? [];
    return list.map((lvl: LevelItem) => ({
      id: lvl.id,
      name: lvl.name,
      description: lvl.description,
      order: lvl.level_order,
    }));
  }, [serverLevels]);
  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isUserLevelModalOpen, setIsUserLevelModalOpen] =
    useState<boolean>(false);
  const [isAssignLevelModalOpen, setIsAssignLevelModalOpen] =
    useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<TableRow | null>(null);
  const [editingUserLevel, setEditingUserLevel] = useState<TableRow | null>(
    null
  );

  const { data: serverUsers, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [assignUserLevel, { isLoading: isAssigning }] =
    useAssignUserLevelMutation();

  const usersData: TableRow[] = useMemo(() => {
    const list = serverUsers ?? [];
    return list.map((u: UserListItem) => ({
      id: u.id,
      username: u.username,
      role: u.role === "admin" ? "Admin" : "User",
      userLevel: u.user_level || "-",
      isActive: u.can_transfer_budget, // or any active flag you want
    }));
  }, [serverUsers]);
  const userOptions: SelectOption[] = useMemo(
    () =>
      (serverUsers ?? []).map((u) => ({
        value: String(u.id),
        label: u.username,
      })),
    [serverUsers]
  );

  const levelOptions: SelectOption[] = useMemo(
    () =>
      (serverLevels ?? []).map((lvl) => ({
        value: String(lvl.level_order),
        label: lvl.name,
      })),
    [serverLevels]
  );

  // Form states for user
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "",
  });

  // Form states for user level
  const [userLevelForm, setUserLevelForm] = useState({
    name: "",
    description: "",
    order: "",
  });

  // Assignment form states
  const [assignmentForm, setAssignmentForm] = useState({
    selectedUserId: "",
    selectedLevelOrder: "",
  });

  // Filter data based on search query
  const filteredUsersData = usersData.filter(
    (user) =>
      user.username
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      user.role?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userLevel
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const filteredUserLevelsData = userLevelsData.filter(
    (level) =>
      level.name
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      level.description
        ?.toString()
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Icons

  // Users table columns
  const usersColumns: TableColumn[] = [
    {
      id: "username",
      header: t("users.username"),
      accessor: "username",
    },
    {
      id: "role",
      header: t("users.role"),
      accessor: "role",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value === "Admin"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {String(value)}
        </span>
      ),
    },
    {
      id: "userLevel",
      header: t("users.userLevel"),
      accessor: "userLevel",
    },
    {
      id: "isActive",
      header: t("users.active"),
      accessor: "isActive",
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? t("users.active") : t("users.inactive")}
        </span>
      ),
    },
  ];

  // User levels table columns
  const userLevelsColumns: TableColumn[] = [
    {
      id: "name",
      header: t("users.name"),
      accessor: "name",
    },
    {
      id: "description",
      header: t("users.description"),
      accessor: "description",
    },
    {
      id: "order",
      header: t("users.order"),
      accessor: "order",
    },
  ];

  // Handlers
  const handleTabChange = (tab: "users" | "userLevels" | "assignment") => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchSubmit = (text: string) => {
    console.log("Search submitted:", text);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ username: "", password: "", role: "user" });
    setIsUserModalOpen(true);
  };
  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser({
          pk: Number(editingUser.id),
          data: {
            username: userForm.username,
            role: toApiRole(userForm.role), // ensure lowercase for API
          },
        }).unwrap();
        toast.success(t("users.userUpdated"));
      } else {
        await createUser({
          username: userForm.username,
          password: userForm.password,
          role: toApiRole(userForm.role), // ensure lowercase for API
        }).unwrap();
        toast.success(t("users.userCreated"));
      }
      setIsUserModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || t("users.operationFailed"));
    }
  };

  const handleEdit = (row: TableRow) => {
    setEditingUser(row);
    setUserForm({
      username: String(row.username ?? ""),
      password: "", // do not prefill; backend usually ignores on update
      role: toApiRole(String(row.role ?? "user")), // store api format in form
    });
    setIsUserModalOpen(true);
  };
  const handleDelete = async (row: TableRow) => {
    try {
      await deleteUser({ pk: Number(row.id) }).unwrap();
      toast.success(t("users.userDeleted"));
    } catch (e: any) {
      toast.error(e?.data?.message || t("users.deleteFailed"));
    }
  };
  // const handleEditUser = (user: TableRow) => {
  //   setEditingUser(user);
  //   setUserForm({
  //     username: String(user.username),
  //     password: '',
  //     role: String(user.role)
  //   });
  //   setIsUserModalOpen(true);
  // };

  // const handleDeleteUser = (user: TableRow) => {
  //   if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
  //     console.log("Deleting user:", user);
  //     // Add delete logic here
  //   }
  // };

  const handleAddUserLevel = () => {
    setEditingUserLevel(null);
    setUserLevelForm({ name: "", description: "", order: "" });
    setIsUserLevelModalOpen(true);
  };

  const handleEditUserLevel = (level: TableRow) => {
    setEditingUserLevel(level);
    setUserLevelForm({
      name: String(level.name),
      description: String(level.description),
      order: String(level.order),
    });
    setIsUserLevelModalOpen(true);
  };

  const handleDeleteUserLevel = async (level: TableRow) => {
    try {
      await deleteLevel({ pk: Number(level.id) }).unwrap();
      toast.success(t("users.userLevelDeleted"));
    } catch (e: any) {
      toast.error(e?.data?.message || t("users.deleteFailed"));
    }
  };

  const handleSaveUserLevel = async () => {
    try {
      if (editingUserLevel) {
        await updateLevel({
          pk: Number(editingUserLevel.id),
          data: {
            name: userLevelForm.name,
            description: userLevelForm.description,
            level_order: Number(userLevelForm.order),
          },
        }).unwrap();
        toast.success(t("users.userLevelUpdated"));
      } else {
        await createLevel({
          name: userLevelForm.name,
          description: userLevelForm.description,
          level_order: Number(userLevelForm.order),
        }).unwrap();
        toast.success(t("users.userLevelCreated"));
      }
      setIsUserLevelModalOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || t("users.operationFailed"));
    }
  };

  const handleAssignLevel = async () => {
    try {
      await assignUserLevel({
        user_id: Number(assignmentForm.selectedUserId),
        level_order: Number(assignmentForm.selectedLevelOrder),
      }).unwrap();
      toast.success(t("users.userLevelUpdated"));
      setIsAssignLevelModalOpen(false);
      setAssignmentForm({ selectedUserId: "", selectedLevelOrder: "" });
    } catch (e: any) {
      toast.error(e?.data?.message || t("users.operationFailed"));
    }
  };

  const getPageTitle = () => {
    return t("users.title");
  };

  const shouldShowAddButton = () => {
    console.log(activeTab);
    return activeTab === "users" || activeTab === "userLevels";
  };
  // map لاسم العرض من الليست الجاهزة
  const usernameToLabel = new Map(userOptions.map((o) => [o.value, o.label]));

  // جهّز توزيع المستخدمين حسب المستوى بترتيب الـ order
  const groupedUsersByLevel = userLevelsData
    .slice()
    .sort((a, b) => Number(a.order) - Number(b.order))
    .map((level) => {
      const members = usersData
        .filter((u) => u.userLevel === level.name)
        .map(
          (u) => usernameToLabel.get(String(u.username)) ?? String(u.username)
        );
      return {
        levelName: String(level.name),
        order: Number(level.order),
        members,
        count: members.length,
      };
    });

  return (
    <div>
      {/* Header with title and add button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold tracking-wide">{getPageTitle()}</h1>
        <div className="flex items-center gap-3">
          {/* Assign User to Level Button */}
          {shouldShowAddButton() && (
            <button
              onClick={() => setIsAssignLevelModalOpen(true)}
              className="flex items-center cursor-pointer gap-1 text-sm bg-blue-600 text-white px-2 py-1.5 rounded-md hover:bg-blue-700 transition"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 11H13V8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7C11.7348 7 11.4804 7.10536 11.2929 7.29289C11.1054 7.48043 11 7.73478 11 8V11H8C7.73478 11 7.48043 11.1054 7.29289 11.2929C7.10536 11.4804 7 11.7348 7 12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13H11V16C11 16.2652 11.1054 16.5196 11.2929 16.7071C11.4804 16.8946 11.7348 17 12 17C12.2652 17 12.5196 16.8946 12.7071 16.7071C12.8946 16.5196 13 16.2652 13 16V13H16C16.2652 13 16.5196 12.8946 16.7071 12.7071C16.8946 12.5196 17 12.2652 17 12C17 11.7348 16.8946 11.4804 16.7071 11.2929C16.5196 11.1054 16.2652 11 16 11Z"
                  fill="white"
                />
                <path
                  d="M9 2C6.243 2 4 4.243 4 7V9C4 9.26522 4.10536 9.51957 4.29289 9.70711C4.48043 9.89464 4.73478 10 5 10C5.26522 10 5.51957 9.89464 5.70711 9.70711C5.89464 9.51957 6 9.26522 6 9V7C6 5.346 7.346 4 9 4H15C16.654 4 18 5.346 18 7V17C18 18.654 16.654 20 15 20H9C7.346 20 6 18.654 6 17V15C6 14.7348 5.89464 14.4804 5.70711 14.2929C5.51957 14.1054 5.26522 14 5 14C4.73478 14 4.48043 14.1054 4.29289 14.2929C4.10536 14.4804 4 14.7348 4 15V17C4 19.757 6.243 22 9 22H15C17.757 22 20 19.757 20 17V7C20 4.243 17.757 2 15 2H9Z"
                  fill="white"
                />
              </svg>
              {t("users.assignUserLevel")}
            </button>
          )}

          {/* Add User/Level Button */}
          {shouldShowAddButton() && (
            <button
              onClick={
                activeTab === "users" ? handleAddUser : handleAddUserLevel
              }
              className="flex items-center cursor-pointer gap-1 text-sm bg-[#4E8476] text-white px-2 py-1.5 rounded-md hover:bg-[#4E8476] transition"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 12.998H13V17.998C13 18.2633 12.8946 18.5176 12.7071 18.7052C12.5196 18.8927 12.2652 18.998 12 18.998C11.7348 18.998 11.4804 18.8927 11.2929 18.7052C11.1054 18.5176 11 18.2633 11 17.998V12.998H6C5.73478 12.998 5.48043 12.8927 5.29289 12.7052C5.10536 12.5176 5 12.2633 5 11.998C5 11.7328 5.10536 11.4785 5.29289 11.2909C5.48043 11.1034 5.73478 10.998 6 10.998H11V5.99805C11 5.73283 11.1054 5.47848 11.2929 5.29094C11.4804 5.1034 11.7348 4.99805 12 4.99805C12.2652 4.99805 12.5196 5.1034 12.7071 5.29094C12.8946 5.47848 13 5.73283 13 5.99805V10.998H18C18.2652 10.998 18.5196 11.1034 18.7071 11.2909C18.8946 11.4785 19 11.7328 19 11.998C19 12.2633 18.8946 12.5176 18.7071 12.7052C18.5196 12.8927 18.2652 12.998 18 12.998Z"
                  fill="white"
                />
              </svg>
              {t(
                activeTab === "users" ? "users.addUser" : "users.addUserLevel"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("users.usersTab")}
            </button>
            <button
              onClick={() => handleTabChange("userLevels")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "userLevels"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {t("users.userLevelsTab")}
            </button>
            {/* <button
              onClick={() => handleTabChange("assignment")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "assignment"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {t("users.assignmentTab")}
            </button> */}
          </nav>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab !== "assignment" && (
        <>
          {/* Search Bar */}
          <div className="p-4 bg-white rounded-2xl mb-6">
            <SearchBar
              placeholder={
                activeTab === "users"
                  ? t("users.searchUsers")
                  : t("users.searchUserLevels")
              }
              value={searchQuery}
              onChange={handleSearchChange}
              onSubmit={handleSearchSubmit}
              debounce={250}
            />
          </div>

          {/* Table */}
          <div>
            {isLoading || isDeleting ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">
                  {t("users.loadingTransfers")}
                </span>
              </div>
            ) : (
              <SharedTable
                title={
                  activeTab === "users"
                    ? t("users.usersTab")
                    : t("users.userLevelsTab")
                }
                columns={
                  activeTab === "users" ? usersColumns : userLevelsColumns
                }
                data={
                  activeTab === "users"
                    ? filteredUsersData
                    : filteredUserLevelsData
                }
                maxHeight="600px"
                className="shadow-lg"
                showPagination={false}
                showActions={
                  activeTab === "users" || activeTab === "userLevels"
                }
                onEdit={
                  activeTab === "users" ? handleEdit : handleEditUserLevel
                }
                onDelete={
                  activeTab === "users" ? handleDelete : handleDeleteUserLevel
                }
                showFooter={false}
                filterLabel={
                  activeTab === "userLevels"
                    ? t("users.addUserLevel")
                    : undefined
                }
              />
            )}
          </div>
        </>
      )}

      {/* Assignment Tab Content */}
      {activeTab === "assignment" && (
        <div className="flex gap-6">
          {/* Assign User Level */}
          <div className="w-1/2 p-6 bg-white rounded-2xl shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t("users.assignUserLevel")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("users.assignNewLevel")}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <SharedSelect
                  title={t("users.selectUser")}
                  options={userOptions}
                  value={assignmentForm.selectedUserId}
                  onChange={(value) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      selectedUserId: String(value),
                    }))
                  }
                  placeholder={t("users.chooseUser")}
                  required
                />
              </div>

              <div>
                <SharedSelect
                  title={t("users.selectLevel")}
                  options={levelOptions}
                  value={assignmentForm.selectedLevelOrder}
                  onChange={(value) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      selectedLevelOrder: String(value),
                    }))
                  }
                  placeholder={t("users.chooseLevel")}
                  required
                />
              </div>

              <button
                onClick={handleAssignLevel}
                disabled={
                  !assignmentForm.selectedUserId ||
                  !assignmentForm.selectedLevelOrder
                }
                className="w-full px-4 py-2 bg-[#4E8476] text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {t("users.assign")}
              </button>
            </div>
          </div>

          {/* Users by Level */}
          {/* Users by Level (New Design) */}
          <div className="w-1/2 p-6 bg-white rounded-2xl shadow-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t("users.usersByLevel")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("users.userDistribution")}
              </p>
            </div>

            <div className="space-y-4 max-h-[520px] overflow-y-auto custom-scrollbar pr-2">
              {groupedUsersByLevel.map((group, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl bg-[#F6F6F6] p-4"
                >
                  {/* count badge on the left */}
                  <div className="flex justify-between items-center mb-3">
                    <div className=" flex flex-col items-start justify-between">
                      <h3 className="text-[14px] font-bold text-[#276EF1]">
                        {t("users.planningAndBudgeting")}{" "}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {t("users.orderLabel")} {group.order}
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-white shadow ring-1 ring-black/5">
                      <span className="text-[15px] font-semibold">
                        {group.count}
                      </span>
                      <span className="text-[8px] tracking-wide text-gray-500">
                        {t("users.users")}
                      </span>
                    </div>
                  </div>

                  {/* header row */}

                  {/* chips */}
                  <div className=" flex flex-wrap gap-2">
                    {group.members.length > 0 ? (
                      group.members.map((name, i) => (
                        <UserChip key={i} name={name} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        {t("users.noUsersInLevel")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      <SharedModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? t("users.editUser") : t("users.addUser")}
        size="md"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#282828] mb-2">
              {t("users.username")}
            </label>
            <input
              type="text"
              value={userForm.username}
              onChange={(e) =>
                setUserForm((prev) => ({ ...prev, username: e.target.value }))
              }
              className="w-full px-3 py-2 border border-[#E2E2E2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("users.enterUsername")}
            />
          </div>

          {!editingUser && (
            <div>
              <label className="block text-xs  font-semibold  text-[#282828] mb-2">
                {t("users.password")}
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 border border-[#E2E2E2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("users.enterPassword")}
              />
            </div>
          )}

          <div>
            <SharedSelect
              title={t("users.role")}
              options={roleOptions} // has Admin/User labels
              value={fromApiRole(userForm.role)} // show nice label
              onChange={(value) =>
                setUserForm((prev) => ({
                  ...prev,
                  role: toApiRole(String(value)),
                }))
              }
              placeholder={t("users.selectRole")}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("users.cancel")}
            </button>
            <button
              onClick={handleSaveUser}
              disabled={
                isCreating ||
                isUpdating ||
                !userForm.username.trim() ||
                !userForm.role.trim() ||
                (!editingUser && !userForm.password.trim())
              }
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {(isCreating || isUpdating) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {!isCreating && !isUpdating && (
                <span>
                  {editingUser ? t("users.updateUser") : t("users.addUser")}
                </span>
              )}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* User Level Modal */}
      <SharedModal
        isOpen={isUserLevelModalOpen}
        onClose={() => setIsUserLevelModalOpen(false)}
        title={
          editingUserLevel ? t("users.editUserLevel") : t("users.addUserLevel")
        }
        size="md"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("users.name")} *
            </label>
            <input
              type="text"
              value={userLevelForm.name}
              onChange={(e) =>
                setUserLevelForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full px-3 py-3 border border-[#E2E2E2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("users.enterLevelName")}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("users.description")} *
            </label>
            <textarea
              value={userLevelForm.description}
              onChange={(e) =>
                setUserLevelForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-3 border border-[#E2E2E2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("users.enterLevelDescription")}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#282828] mb-2">
              {t("users.order")} *
            </label>
            <input
              type="number"
              value={userLevelForm.order}
              onChange={(e) =>
                setUserLevelForm((prev) => ({ ...prev, order: e.target.value }))
              }
              className="w-full px-3 py-3 border border-[#E2E2E2] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("users.enterOrderNumber")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsUserLevelModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("users.cancel")}
            </button>
            <button
              onClick={handleSaveUserLevel}
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingUserLevel ? t("users.updateLevel") : t("users.addLevel")}
            </button>
          </div>
        </div>
      </SharedModal>

      {/* Assign User to Level Modal */}
      <SharedModal
        isOpen={isAssignLevelModalOpen}
        onClose={() => setIsAssignLevelModalOpen(false)}
        title={t("users.assignUserLevel")}
        size="md"
      >
        <div className="p-4 space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">{t("users.assignNewLevel")}</p>
          </div>

          <div>
            <SharedSelect
              title={t("users.selectUser")}
              options={userOptions}
              value={assignmentForm.selectedUserId}
              onChange={(value) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  selectedUserId: String(value),
                }))
              }
              placeholder={t("users.chooseUser")}
              required
            />
          </div>

          <div>
            <SharedSelect
              title={t("users.selectLevel")}
              options={levelOptions}
              value={assignmentForm.selectedLevelOrder}
              onChange={(value) =>
                setAssignmentForm((prev) => ({
                  ...prev,
                  selectedLevelOrder: String(value),
                }))
              }
              placeholder={t("users.chooseLevel")}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsAssignLevelModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              {t("users.cancel")}
            </button>
            <button
              onClick={handleAssignLevel}
              disabled={
                isAssigning ||
                !assignmentForm.selectedUserId ||
                !assignmentForm.selectedLevelOrder
              }
              className="px-4 py-2 text-sm font-medium text-white bg-[#4E8476] border border-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isAssigning && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
              )}
              {!isAssigning && <span>{t("users.assign")}</span>}
            </button>
          </div>
        </div>
      </SharedModal>
    </div>
  );
}
