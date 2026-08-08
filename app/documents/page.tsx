import DocumentListPage from "@/components/documents/document-list-page";
import { requirePageUser } from "@/lib/page-auth";

export default async function DocumentsRoute() {
  await requirePageUser();

  return <DocumentListPage />;
}
