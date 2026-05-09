import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">Gérez votre profil</p>
      </div>

      <div className="max-w-md">
        <SettingsForm defaultName={dbUser?.name || ""} defaultEmail={dbUser?.email || ""} />
      </div>
    </div>
  );
}
