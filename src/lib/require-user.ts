import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export async function requireUser() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user: authUser }, error } = await supabase.auth.getUser();

  if (error || !authUser?.email) {
    throw new Error("Non authentifié");
  }

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
}
