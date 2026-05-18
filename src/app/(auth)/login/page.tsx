import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            B
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">BMA Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez-vous à votre espace
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary/80">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
