import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { updateUserPassword } from "@/lib/repository";
import { getZodMessage } from "@/lib/validation";

const schema = z.object({
  currentPassword: z.string().min(1, "currentPassword is required"),
  newPassword: z.string().min(8, "newPassword must be at least 8 characters")
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const payload = schema.parse(await request.json());

    if (!(await verifyPassword(payload.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "current password is incorrect" }, { status: 401 });
    }

    await updateUserPassword(user.id, await hashPassword(payload.newPassword));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Response) {
      return NextResponse.json({ error: "Authentication required" }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: getZodMessage(error) }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }
}
