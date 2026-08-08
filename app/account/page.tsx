import AccountPage from "@/components/app/account-page";
import { requirePageUser } from "@/lib/page-auth";

export default async function AccountRoute() {
  const user = await requirePageUser();
  return <AccountPage email={user.email} />;
}
