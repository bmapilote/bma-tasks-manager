"use client";

import { useState } from "react";
import { updateUserRole, toggleUserActive } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Shield, User as UserIcon, Search, ToggleLeft, ToggleRight } from "lucide-react";
import type { Role } from "@/types";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  department: string | null;
  jobTitle: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  taskCount: number;
  projectCount: number;
};

type Props = {
  users: UserRow[];
};

const roleLabels: Record<Role, string> = {
  ADMIN: "Admin",
  USER: "Utilisateur",
};

export function UsersTable({ users }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "ALL">("ALL");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (filterRole !== "ALL" && u.role !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.jobTitle?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleRoleChange(userId: string, role: Role) {
    setLoading(userId);
    await updateUserRole(userId, role);
    setLoading(null);
    router.refresh();
  }

  async function handleToggleActive(userId: string) {
    setLoading(userId);
    await toggleUserActive(userId);
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | "ALL")}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">Utilisateur</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rôle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Département
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tâches
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Projets
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Dernière connexion
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="group hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.name || "Sans nom"}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      disabled={loading === u.id}
                      className="rounded border border-gray-300 px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none"
                    >
                      <option value="USER">Utilisateur</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {u.department || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {u.taskCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {u.projectCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Jamais"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        disabled={loading === u.id}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                        title={u.isActive ? "Désactiver" : "Activer"}
                      >
                        {u.isActive ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
