import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }
  return user;
}
