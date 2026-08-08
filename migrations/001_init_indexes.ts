import type { Db } from "mongodb";
import { collectionNames, mongoIndexes } from "../lib/models";
import type { DocumentModel, UserModel } from "../lib/models";

export const id = "001_init_indexes";

export async function up(db: Db): Promise<void> {
  await Promise.all([
    db.collection<UserModel>(collectionNames.users).createIndex(mongoIndexes.users[0].key, mongoIndexes.users[0].options),
    db.collection<DocumentModel>(collectionNames.documents).createIndex(mongoIndexes.documents[0].key, mongoIndexes.documents[0].options),
    db.collection<DocumentModel>(collectionNames.documents).createIndex(mongoIndexes.documents[1].key, mongoIndexes.documents[1].options),
    db.collection(collectionNames.migrations).createIndex(mongoIndexes.migrations[0].key, mongoIndexes.migrations[0].options)
  ]);
}
