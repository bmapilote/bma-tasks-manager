"use client";

import { Menu } from "lucide-react";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { useSupabaseUser } from "@/components/auth/supabase-provider";

type HeaderProps = {
  onMenuToggle: () => void;
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { user } = useSupabaseUser();
  const displayName = user?.user_metadata?.name as string | undefined;
  const initial = displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-gray-700"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <DarkModeToggle />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {initial}
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayName || user?.email || "Utilisateur"}
        </span>
      </div>
    </header>
  );
}
