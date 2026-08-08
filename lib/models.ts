import type { DocumentRecord, UserRecord } from "./types";

export const collectionNames = {
  users: "users",
  documents: "documents",
  migrations: "migrations"
} as const;

export type UserModel = UserRecord;
export type DocumentModel = DocumentRecord;

export const mongoIndexes = {
  users: [{ key: { email: 1 }, options: { unique: true, name: "users_email_unique" } }],
  documents: [
    { key: { userId: 1, issueDate: 1 }, options: { name: "documents_user_issue_date" } },
    { key: { userId: 1, status: 1 }, options: { name: "documents_user_status" } }
  ],
  migrations: [{ key: { id: 1 }, options: { unique: true, name: "migrations_id_unique" } }]
} as const;
