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
  delete fixed.emailVerified;
  delete fixed.hashedPassword;
  delete fixed.image;
  if ("avatarUrl" in fixed && !fixed.avatarUrl && row.image) {
    fixed.avatarUrl = row.image;
  }
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

  // Clear existing data in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.subTask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared existing data from Postgres");

  for (const user of users) {
    await prisma.user.create({ data: user });
    console.log(`  Created user: ${user.email}`);
  }

  for (const project of projects) {
    await prisma.project.create({ data: project });
    console.log(`  Created project: ${project.name}`);
  }

  for (const task of tasks) {
    await prisma.task.create({ data: task });
    console.log(`  Created task: ${task.title}`);
  }

  for (const subtask of subtasks) {
    await prisma.subTask.create({ data: subtask });
    console.log(`  Created subtask: ${subtask.title}`);
  }

  for (const log of activityLogs) {
    await prisma.activityLog.create({ data: log });
  }

  console.log("Migration complete!");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
