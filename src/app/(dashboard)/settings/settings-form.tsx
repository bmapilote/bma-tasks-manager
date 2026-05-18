"use client";

import { useSupabaseUser } from "@/components/auth/supabase-provider";

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export function SettingsForm({ defaultName, defaultEmail }: Props) {
  const { user } = useSupabaseUser();

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-5">
      <div>
        <label className="block text-sm font-medium text-foreground">Nom</label>
        <p className="mt-1 text-sm text-foreground">{defaultName || "Non renseigné"}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Email</label>
        <p className="mt-1 text-sm text-foreground">{defaultEmail}</p>
      </div>

      <div className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
        La modification du profil sera disponible dans une prochaine version.
      </div>
    </div>
  );
}
