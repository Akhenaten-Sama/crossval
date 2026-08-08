import type { Db } from "mongodb";
import { collectionNames } from "../lib/models";
import type { DocumentModel } from "../lib/models";

export const id = "002_add_document_description";

export async function up(db: Db): Promise<void> {
  await db.collection<DocumentModel>(collectionNames.documents).updateMany({ description: { $exists: false } }, { $set: { description: "" } });
}
