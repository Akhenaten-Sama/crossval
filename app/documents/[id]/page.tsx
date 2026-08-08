import DocumentDetailPage from "@/components/documents/document-detail-page";

type Params = { params: Promise<{ id: string }> };

export default async function DocumentRoute({ params }: Params) {
  const { id } = await params;
  return <DocumentDetailPage id={id} />;
}
