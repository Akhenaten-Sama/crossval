import { redirect } from "next/navigation";
import AuthPage from "@/components/app/auth-page";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthRoute() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/documents");
  }

  return <AuthPage />;
}
