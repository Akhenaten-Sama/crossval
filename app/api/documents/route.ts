import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, jsonError, serializeDocument } from "@/lib/api";
import { createDocument, listDocumentsByUser } from "@/lib/repository";
import type { DocumentRecord, LineItem, LineItemInput } from "@/lib/types";
import { documentPayloadSchema, getZodMessage, parseLineItemPayload } from "@/lib/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const documents = (await listDocumentsByUser(user.id)).map(serializeDocument);
    return NextResponse.json({ documents });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const raw = await request.json();
    const payload = documentPayloadSchema.parse(raw);
    const lineItems: LineItemInput[] = Array.isArray(raw.lineItems) ? raw.lineItems.map(parseLineItemPayload) : [];

    const now = new Date().toISOString();
    const created: DocumentRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      title: payload.title,
      description: payload.description,
      customer: payload.customer,
      issueDate: payload.issueDate,
      status: "draft" as const,
      createdAt: now,
      updatedAt: now,
      finalizedAt: null,
      lineItems: lineItems.map<LineItem>((line) => ({
        ...line,
        id: crypto.randomUUID(),
        documentId: ""
      }))
    };
    created.lineItems = created.lineItems.map((line) => ({ ...line, documentId: created.id }));
    const document = await createDocument(created);

    return NextResponse.json({ document: serializeDocument(document) }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}

function routeError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof Response) {
    return jsonError(error.status === 401 ? "Authentication required" : "request failed", error.status);
  }
  return jsonError(getZodMessage(error));
}
