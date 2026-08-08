import ReportPage from "@/components/reports/report-page";
import { requirePageUser } from "@/lib/page-auth";

export default async function ReportsRoute() {
  await requirePageUser();

  return <ReportPage />;
}
