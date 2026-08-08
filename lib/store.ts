import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppDb } from "./types";

const dbPath = path.join(process.cwd(), "data", "db.json");

export async function readDb(): Promise<AppDb> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return JSON.parse(raw) as AppDb;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return { users: [], documents: [] };
  }
}

export async function writeDb(db: AppDb): Promise<void> {
  await mkdir(path.dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}

export async function updateDb<T>(updater: (db: AppDb) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  const result = await updater(db);
  await writeDb(db);
  return result;
}
