// Example usage of SharedTable component

import { SharedTable } from '@/shared/SharedTable';
import type { TableColumn, TableRow } from '@/shared/SharedTable';

// Example data
const sampleData: TableRow[] = [
  {
    id: 1,
    name: 'Ahmed Ali',
    email: 'ahmed@example.com',
    role: 'Admin',
    status: 'Active',
    joinDate: '2024-01-15'
  },
  {
    id: 2,
    name: 'Sara Mohamed',
    email: 'sara@example.com',
    role: 'User',
    status: 'Inactive',
    joinDate: '2024-02-20'
  },
  {
    id: 3,
    name: 'Omar Hassan',
    email: 'omar@example.com',
    role: 'Moderator',
    status: 'Active',
    joinDate: '2024-03-10'
  }
];

// Example columns configuration
const columns: TableColumn[] = [
  {
    id: 'id',
    header: 'ID',
    accessor: 'id',
    width: 80,
    minWidth: 60
  },
  {
    id: 'name',
    header: 'Full Name',
    accessor: 'name',
    width: 200,
    minWidth: 150
  },
  {
    id: 'email',
    header: 'Email Address',
    accessor: 'email',
    width: 250,
    minWidth: 200
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
    width: 120,
    minWidth: 100,
    render: (value) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        value === 'Admin' 
          ? 'bg-red-100 text-red-800' 
          : value === 'Moderator'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-green-100 text-green-800'
      }`}>
        {String(value)}
      </span>
    )
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    width: 100,
    minWidth: 80,
    render: (value) => (
      <span className={`inline-flex items-center w-2 h-2 rounded-full ${
        value === 'Active' ? 'bg-green-500' : 'bg-red-500'
      }`}>
        <span className="sr-only">{String(value)}</span>
      </span>
    )
  },
  {
    id: 'joinDate',
    header: 'Join Date',
    accessor: 'joinDate',
    width: 130,
    minWidth: 120
  }
];

export function TableExample() {
  const handleFilter = () => {
    console.log('Filter button clicked');
    // Add your filter logic here
  };

  return (
    <div className="p-6">
      <SharedTable
        title="Users Management"
        columns={columns}
        data={sampleData}
        onFilter={handleFilter}
        filterLabel="Filter Users"
        maxHeight="400px"
        className="shadow-lg"
      />
    </div>
  );
}

export default TableExample;
