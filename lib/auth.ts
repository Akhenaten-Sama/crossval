import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readDb } from "./store";
import type { UserRecord } from "./types";

const cookieName = "pricing_session";
const secret = process.env.AUTH_SECRET ?? "local-development-secret-change-before-production";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await pbkdf2(password, salt);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) {
    return false;
  }

  const candidate = await pbkdf2(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSessionToken(token: string | undefined): { userId: string } | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId: string };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<UserRecord> {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(cookieName)?.value);
  if (!session) {
    throw new Response("Authentication required", { status: 401 });
  }

  const db = await readDb();
  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user) {
    throw new Response("Authentication required", { status: 401 });
  }

  return user;
}

export function setSessionCookie(response: NextResponse, userId: string): void {
  response.cookies.set(cookieName, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

async function pbkdf2(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 120000, 32, "sha256", (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey.toString("hex"));
    });
  });
}
