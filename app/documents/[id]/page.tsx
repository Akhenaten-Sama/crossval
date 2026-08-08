import DocumentDetailPage from "@/components/documents/document-detail-page";
import { requirePageUser } from "@/lib/page-auth";

type Params = { params: Promise<{ id: string }> };

export default async function DocumentRoute({ params }: Params) {
  await requirePageUser();

  const { id } = await params;
  return <DocumentDetailPage id={id} />;
}
