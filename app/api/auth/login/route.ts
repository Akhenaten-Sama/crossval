import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/repository";
import { getZodMessage } from "@/lib/validation";

const schema = z.object({
  email: z.string().trim().email("email must be valid").toLowerCase(),
  password: z.string().min(1, "password is required")
});

export async function POST(request: NextRequest) {
  try {
    const payload = schema.parse(await request.json());
    const user = await findUserByEmail(payload.email);

    if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
      return NextResponse.json({ error: "invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({ user: { id: user.id, email: user.email } });
    setSessionCookie(response, user.id);
    return response;
  } catch (error) {
    return NextResponse.json({ error: getZodMessage(error) }, { status: 400 });
  }
}
