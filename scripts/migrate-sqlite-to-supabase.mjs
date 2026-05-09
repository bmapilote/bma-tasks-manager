import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function toDate(v) {
  if (v === null || v === undefined) return v;
  return new Date(v);
}

function toBool(v) {
  if (v === null || v === undefined) return v;
  return Boolean(v);
}

function fixRow(row) {
  if (!row) return row;
  const fixed = { ...row };
  for (const key of ["createdAt", "updatedAt", "emailVerified", "dueDate"]) {
    if (key in fixed) fixed[key] = toDate(fixed[key]);
  }
  if ("completed" in fixed) fixed.completed = toBool(fixed.completed);
  return fixed;
}

async function migrate() {
  const sqlite = new Database("prisma/dev.db");

  const users = sqlite.prepare("SELECT * FROM User").all().map(fixRow);
  const projects = sqlite.prepare("SELECT * FROM Project").all().map(fixRow);
  const tasks = sqlite.prepare("SELECT * FROM Task").all().map(fixRow);
  const subtasks = sqlite.prepare("SELECT * FROM SubTask").all().map(fixRow);
  const activityLogs = sqlite.prepare("SELECT * FROM ActivityLog").all().map(fixRow);

  sqlite.close();

  console.log(`Found: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks, ${subtasks.length} subtasks, ${activityLogs.length} activity logs`);

  if (users.length > 0) {
    await prisma.user.createMany({ data: users, skipDuplicates: true });
    console.log(`Migrated ${users.length} users`);
  }

  if (projects.length > 0) {
    await prisma.project.createMany({ data: projects, skipDuplicates: true });
    console.log(`Migrated ${projects.length} projects`);
  }

  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks, skipDuplicates: true });
    console.log(`Migrated ${tasks.length} tasks`);
  }

  if (subtasks.length > 0) {
    await prisma.subTask.createMany({ data: subtasks, skipDuplicates: true });
    console.log(`Migrated ${subtasks.length} subtasks`);
  }

  if (activityLogs.length > 0) {
    await prisma.activityLog.createMany({ data: activityLogs, skipDuplicates: true });
    console.log(`Migrated ${activityLogs.length} activity logs`);
  }

  console.log("Migration complete!");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
