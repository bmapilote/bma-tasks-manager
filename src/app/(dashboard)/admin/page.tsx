import { requireAdmin } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getAdminDashboardData } from "@/lib/dashboard-data";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ProjectProgress } from "@/components/dashboard/project-progress";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Charts } from "@/components/dashboard/charts";
import { Card } from "@/components/ui/card";
import { Users, Shield, UserCheck, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  const data = await getAdminDashboardData(user.id, user.role);

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Administration
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord global — vue d&apos;ensemble du système
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          label="Utilisateurs"
          value={data.users.total}
          icon={<Users className="h-5 w-5" />}
          colorClass="bg-indigo-50 text-indigo-600"
          subtitle={`${data.users.active} actifs`}
        />
        <Card
          label="Administrateurs"
          value={data.users.admins}
          icon={<Shield className="h-5 w-5" />}
          colorClass="bg-purple-50 text-purple-600"
        />
        <Card
          label="Utilisateurs avec tâches"
          value={data.users.withTasks}
          icon={<UserCheck className="h-5 w-5" />}
          colorClass="bg-teal-50 text-teal-600"
        />
        <Card
          label="Taux de complétion"
          value={`${data.globalStats.completionRate}%`}
          icon={<BarChart3 className="h-5 w-5" />}
          colorClass="bg-cyan-50 text-cyan-600"
        />
      </div>

      <section>
        <StatsGrid stats={data.stats} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Progression des projets
          </h2>
        </div>
        <ProjectProgress projects={data.projects} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Analyses globales
          </h2>
        </div>
        <Charts
          taskDistribution={data.taskDistribution}
          tasksPerProject={data.tasksPerProject}
          productivityData={data.productivityData}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Activité récente (tous les utilisateurs)
          </h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <ActivityFeed activities={data.recentActivity} />
        </div>
      </section>
    </div>
  );
}
