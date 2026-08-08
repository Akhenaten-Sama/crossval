import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ApiError, jsonError, serializeDocument } from "@/lib/api";
import { duplicateDocument } from "@/lib/repository";
import { getZodMessage } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: Params) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const document = await duplicateDocument(id, user.id);

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
