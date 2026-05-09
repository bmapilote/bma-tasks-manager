"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

export async function register(_prevState: unknown, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || password.length < 6) {
    return { error: "Email requis et mot de passe (min 6 caractères)" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Un compte existe déjà avec cet email" };
    }

    const hashedPassword = await hash(password, 12);

    await prisma.user.create({
      data: { name: name || null, email, hashedPassword },
    });

    logger.info({ email }, "user:registered");
    redirect("/login?registered=true");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, email }, "user:register:error");
    return { error: `Erreur base de données — ${message}` };
  }
}
