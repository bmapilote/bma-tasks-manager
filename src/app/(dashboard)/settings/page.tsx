import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, role: true, department: true, jobTitle: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez votre profil</p>
      </div>

      <div className="max-w-md space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              dbUser?.role === "ADMIN"
                ? "bg-purple-100 text-purple-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {dbUser?.role === "ADMIN" ? "Administrateur" : "Utilisateur"}
            </span>
          </div>
          {dbUser?.department && (
            <p className="mt-2 text-xs text-gray-500">Service : {dbUser.department}</p>
          )}
          {dbUser?.jobTitle && (
            <p className="text-xs text-gray-500">Fonction : {dbUser.jobTitle}</p>
          )}
        </div>

        <SettingsForm
          defaultName={dbUser?.name || ""}
          defaultEmail={dbUser?.email || ""}
        />
      </div>
    </div>
  );
}
