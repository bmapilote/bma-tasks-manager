import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function requireUser() {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    throw new Error("Non authentifié — cookies non disponibles");
  }

  const supabase = createClient(cookieStore);
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("requireUser: Supabase auth error:", error.message);
    throw new Error(`Auth error: ${error.message}`);
  }
  if (!authUser?.email) {
    console.error("requireUser: No email in auth user");
    throw new Error("Non authentifié");
  }

  try {
    let dbUser = await prisma.user.findFirst({
      where: { supabaseId: authUser.id },
    });
    if (dbUser) return dbUser;

    dbUser = await prisma.user.findUnique({
      where: { email: authUser.email },
    });

    if (dbUser) {
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
      },
    });

    return dbUser;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("requireUser: Prisma error:", message, err instanceof Error ? err.stack : "");
    throw new Error(`Erreur base de données — ${message}`);
  }
}
