"use client";

import { useSession } from "next-auth/react";

type Props = {
  defaultName: string;
  defaultEmail: string;
};

export function SettingsForm({ defaultName, defaultEmail }: Props) {
  const { data: session } = useSession();

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nom</label>
        <p className="mt-1 text-sm text-gray-900">{defaultName || "Non renseigné"}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <p className="mt-1 text-sm text-gray-900">{defaultEmail}</p>
      </div>

      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        La modification du profil sera disponible dans une prochaine version.
      </div>
    </div>
  );
}
