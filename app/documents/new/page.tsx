import NewDocumentPage from "@/components/documents/new-document-page";
import { requirePageUser } from "@/lib/page-auth";

export default async function NewDocumentRoute() {
  await requirePageUser();

  return <NewDocumentPage />;
}
