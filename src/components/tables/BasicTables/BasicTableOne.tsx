import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Pencil, Trash2 } from "lucide-react";
import Badge from "../../ui/badge/Badge";
import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";

interface User {
  id: number;
  email: string;
  fname: string;
  lname: string;
  role: {
    name: string;
  } | null;
  provider: {
    name: string;
  } | null;
  status: {
    name: string;
  } | null;
}

export default function BasicTableOne() {
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in.");
        return;
      }

      try { //https://sms-blast-backend.onrender.com/api
        // const res = await fetch("http://localhost:4000/api/users", 
        const res = await fetch("https://sms-blast-backend.onrender.com/api/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        alert("Could not load users");
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-6 bg-gray-50 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">User Roles</h2>
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="bg-white px-6 py-4 text-sm text-gray-600 font-medium border-b">
          Role Assignment
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full text-sm text-left text-gray-700">
            <TableHeader className="bg-white text-xs text-gray-500 uppercase border-b">
              <TableRow>
                <TableCell className="px-4 py-3">ID</TableCell>
                <TableCell className="px-4 py-3">Email</TableCell>
                <TableCell className="px-4 py-3">Role</TableCell>
                <TableCell className="px-4 py-3">Provider</TableCell>
                <TableCell className="px-4 py-3">Status</TableCell>
                <TableCell className="px-4 py-3">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="bg-white divide-y">
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="px-4 py-3">{user.id}</TableCell>
                  <TableCell className="px-4 py-3">{user.email}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      size="sm"
                      color="destructive"
                      className="bg-red-100 text-red-500 lowercase"
                    >
                      {user.role?.name || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.provider?.name || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {user.status?.name || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex gap-3 items-center">
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDialog} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4">
            <Dialog.Title className="text-lg font-semibold">Edit User</Dialog.Title>
            {selectedUser && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600">Email</label>
                  <input
                    value={selectedUser.email}
                    readOnly
                    className="w-full mt-1 border rounded px-3 py-2 text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Role</label>
                  <input
                    value={selectedUser.role?.name || ""}
                    readOnly
                    className="w-full mt-1 border rounded px-3 py-2 text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Provider</label>
                  <input
                    value={selectedUser.provider?.name || ""}
                    readOnly
                    className="w-full mt-1 border rounded px-3 py-2 text-sm bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Status</label>
                  <input
                    value={selectedUser.status?.name || ""}
                    readOnly
                    className="w-full mt-1 border rounded px-3 py-2 text-sm bg-gray-100"
                  />
                </div>
                <div className="text-right">
                  <button
                    onClick={closeDialog}
                    className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
