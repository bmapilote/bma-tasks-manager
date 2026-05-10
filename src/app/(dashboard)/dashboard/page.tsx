import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard-data";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ProjectProgress } from "@/components/dashboard/project-progress";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Charts } from "@/components/dashboard/charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ projectId?: string; status?: string; priority?: string; search?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    logger.error({ err }, "Dashboard requireUser failed");
    console.error("Dashboard auth error:", message);
    throw err;
  }

  const params = await searchParams;
  const filters = {
    projectId: params?.projectId,
    status: params?.status,
    priority: params?.priority,
    search: params?.search,
  };

  let data;
  let projectNames;
  try {
    [data, projectNames] = await Promise.all([
      getDashboardData(user.id, filters),
      prisma.project.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    logger.error({ err, userId: user.id }, "Dashboard data fetch failed");
    console.error("Dashboard data fetch error:", message);
    throw new Error("Erreur lors du chargement des données du tableau de bord");
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bon retour, {user.name || user.email?.split("@")[0]}
          </p>
        </div>
      </div>

      <DashboardFilters projects={projectNames} />

      <section>
        <StatsGrid stats={data.stats} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Progression des projets
          </h2>
        </div>
        <ProjectProgress projects={data.projects} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Analyses
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
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Activité récente
          </h2>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <ActivityFeed activities={data.recentActivity} />
        </div>
      </section>
    </div>
  );
}
