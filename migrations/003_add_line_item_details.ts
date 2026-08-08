import type { Db } from "mongodb";
import { collectionNames } from "../lib/models";
import type { DocumentModel } from "../lib/models";

export const id = "003_add_line_item_details";

export async function up(db: Db): Promise<void> {
  await db.collection<DocumentModel>(collectionNames.documents).updateMany({ "lineItems.details": { $exists: false } }, { $set: { "lineItems.$[].details": "" } });
}
