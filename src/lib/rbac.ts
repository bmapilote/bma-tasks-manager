import type { Role } from "@/types";

export type Permission =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "projects:read_all"
  | "projects:write_all"
  | "projects:delete_all"
  | "tasks:read_all"
  | "tasks:write_all"
  | "tasks:delete_all"
  | "tasks:assign"
  | "tasks:change_status"
  | "tasks:change_priority"
  | "dashboard:global"
  | "analytics:read"
  | "permissions:manage";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "users:read",
    "users:write",
    "users:delete",
    "projects:read_all",
    "projects:write_all",
    "projects:delete_all",
    "tasks:read_all",
    "tasks:write_all",
    "tasks:delete_all",
    "tasks:assign",
    "tasks:change_status",
    "tasks:change_priority",
    "dashboard:global",
    "analytics:read",
    "permissions:manage",
  ],
  USER: [
    "tasks:change_status",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function can(role: Role, permission: Permission): boolean {
  return hasPermission(role, permission);
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function isUser(role: Role): boolean {
  return role === "USER";
}
