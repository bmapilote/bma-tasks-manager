"use client";

import { useState } from "react";
import { updateUserRole, toggleUserActive } from "@/actions/admin";
import { useRouter } from "next/navigation";
import { Shield, User as UserIcon, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-border bg-card py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as Role | "ALL")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="ALL">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">Utilisateur</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Rôle
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Département
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tâches
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Projets
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Dernière connexion
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="group hover:bg-accent/30">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {u.name || "Sans nom"}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      disabled={loading === u.id}
                      className="rounded border border-border bg-card px-2 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="USER">Utilisateur</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {u.department || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {u.taskCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {u.projectCount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        u.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                      )}
                    >
                      {u.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
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
                        className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
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
