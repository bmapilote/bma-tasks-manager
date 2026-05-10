import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { isAdmin } from "./rbac";
import type { Role } from "@/types";

export type AuthenticatedUser = {
  id: string;
  supabaseId: string | null;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    throw new Error("Non authentifié — cookies non disponibles");
  }

  const supabase = createClient(cookieStore);
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Auth error: ${error.message}`);
  }
  if (!authUser?.email) {
    throw new Error("Non authentifié");
  }

  try {
    let dbUser = await prisma.user.findFirst({
      where: { supabaseId: authUser.id },
    });
    if (dbUser) {
      if (!dbUser.isActive) {
        throw new Error("Compte désactivé — contactez un administrateur");
      }
      return dbUser;
    }

    dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (dbUser) {
      if (!dbUser.isActive) {
        throw new Error("Compte désactivé — contactez un administrateur");
      }
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { supabaseId: authUser.id },
      });
      return dbUser;
    }

    dbUser = await prisma.user.create({
      data: {
        supabaseId: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name as string | undefined,
        role: "USER",
      },
    });

    return dbUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Erreur base de données — ${message}`);
  }
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (!isAdmin(user.role)) {
    throw new Error("Accès refusé — droits administrateur requis");
  }
  return user;
}
