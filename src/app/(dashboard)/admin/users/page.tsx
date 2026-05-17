import { requireAdmin } from "@/lib/require-user";
import { getUsers } from "@/actions/admin";
import { UsersTable } from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getUsers();

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Gestion des utilisateurs
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {users.length} utilisateur{users.length !== 1 ? "s" : ""} inscrit{users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <UsersTable users={users} />
    </div>
  );
}
