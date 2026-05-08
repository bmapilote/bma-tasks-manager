import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white">
            B
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">BMA Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connectez-vous à votre espace
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
