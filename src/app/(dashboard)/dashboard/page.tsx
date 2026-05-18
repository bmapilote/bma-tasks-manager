import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getDashboardData } from "@/lib/dashboard-data";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ProjectProgress } from "@/components/dashboard/project-progress";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Charts } from "@/components/dashboard/charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { logger } from "@/lib/logger";
import { isAdmin } from "@/lib/rbac";

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
      getDashboardData(user.id, user.role, filters),
      prisma.project.findMany({
        where: isAdmin(user.role) ? {} : { ownerId: user.id },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);
  } catch (err) {
    const message = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack}` : String(err);
    logger.error({ err, userId: user.id }, "Dashboard data fetch failed");
    throw new Error("Erreur lors du chargement des données du tableau de bord");
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
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
          <h2 className="text-sm font-semibold text-foreground">
            Progression des projets
          </h2>
        </div>
        <ProjectProgress projects={data.projects} />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
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
          <h2 className="text-sm font-semibold text-foreground">
            Activité récente
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <ActivityFeed activities={data.recentActivity} />
        </div>
      </section>
    </div>
  );
}
