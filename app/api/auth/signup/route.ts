import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { updateDb } from "@/lib/store";
import { getZodMessage } from "@/lib/validation";

const schema = z.object({
  email: z.string().trim().email("email must be valid").toLowerCase(),
  password: z.string().min(8, "password must be at least 8 characters")
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const user = await updateDb(async (db) => {
      if (db.users.some((candidate) => candidate.email === payload.email)) {
        throw new ApiError("email is already registered", 409);
      }

      const now = new Date().toISOString();
      const created = {
        id: crypto.randomUUID(),
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        createdAt: now
      };
      db.users.push(created);
      return created;
    });

    const response = NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
    setSessionCookie(response, user.id);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: getZodMessage(error) }, { status: 400 });
  }
}
