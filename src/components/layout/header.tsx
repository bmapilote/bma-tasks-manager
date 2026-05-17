"use client";

import { Menu, Shield } from "lucide-react";
import { useSupabaseUser } from "@/components/auth/supabase-provider";
import { useEffect, useState } from "react";

type HeaderProps = {
  onMenuToggle: () => void;
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useSupabaseUser();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        }
      } catch {
        setRole(null);
      }
    }
    fetchRole();
  }, []);

  const displayName = user?.user_metadata?.name as string | undefined;
  const initial = displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {role === "ADMIN" && (
          <span className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
            <Shield className="h-3 w-3" />
            ADMIN
          </span>
        )}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {displayName || user?.email || "Utilisateur"}
        </span>
      </div>
    </header>
  );
}
