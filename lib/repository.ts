import { ApiError, ensureDraft } from "./api";
import { collectionNames, mongoIndexes } from "./models";
import { getMongoDb, isMongoConfigured } from "./mongodb";
import { readDb, writeDb } from "./store";
import type { DocumentRecord, LineItem, LineItemInput, UserRecord } from "./types";

let indexesReady: Promise<void> | null = null;

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (isMongoConfigured()) {
    const { users } = await collections();
    return users.findOne({ id }, { projection: { _id: 0 } });
  }

  const db = await readDb();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (isMongoConfigured()) {
    const { users } = await collections();
    return users.findOne({ email }, { projection: { _id: 0 } });
  }

  const db = await readDb();
  return db.users.find((user) => user.email === email) ?? null;
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  if (isMongoConfigured()) {
    const { users } = await collections();
    try {
      await users.insertOne(user);
      return user;
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw new ApiError("email is already registered", 409);
      }
      throw error;
    }
  }

  const db = await readDb();
  if (db.users.some((candidate) => candidate.email === user.email)) {
    throw new ApiError("email is already registered", 409);
  }
  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  if (isMongoConfigured()) {
    const { users } = await collections();
    const result = await users.updateOne({ id: userId }, { $set: { passwordHash } });
    if (result.matchedCount === 0) {
      throw new ApiError("user not found", 404);
    }
    return;
  }

  const db = await readDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) {
    throw new ApiError("user not found", 404);
  }
  user.passwordHash = passwordHash;
  await writeDb(db);
}

export async function listDocumentsByUser(userId: string): Promise<DocumentRecord[]> {
  if (isMongoConfigured()) {
    const { documents } = await collections();
    return documents.find({ userId }, { projection: { _id: 0 } }).sort({ issueDate: -1, createdAt: -1 }).toArray();
  }

  const db = await readDb();
  return db.documents.filter((document) => document.userId === userId);
}

export async function listDocumentsForReport(userId: string, from: string, to: string): Promise<DocumentRecord[]> {
  if (isMongoConfigured()) {
    const { documents } = await collections();
    return documents.find({ userId, issueDate: { $gte: from, $lte: to } }, { projection: { _id: 0 } }).toArray();
  }

  const db = await readDb();
  return db.documents.filter((document) => document.userId === userId && document.issueDate >= from && document.issueDate <= to);
}

export async function createDocument(document: DocumentRecord): Promise<DocumentRecord> {
  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.insertOne(document);
    return document;
  }

  const db = await readDb();
  db.documents.push(document);
  await writeDb(db);
  return document;
}

export async function findDocumentForUser(id: string, userId: string): Promise<DocumentRecord | null> {
  if (isMongoConfigured()) {
    const { documents } = await collections();
    return documents.findOne({ id, userId }, { projection: { _id: 0 } });
  }

  const db = await readDb();
  return db.documents.find((document) => document.id === id && document.userId === userId) ?? null;
}

export async function updateDocumentMetadata(id: string, userId: string, payload: { title: string; customer: string; issueDate: string }): Promise<DocumentRecord> {
  const document = await findMutableDocument(id, userId);
  const updatedAt = new Date().toISOString();

  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.updateOne(
      { id, userId, status: "draft" },
      {
        $set: {
          title: payload.title,
          customer: payload.customer,
          issueDate: payload.issueDate,
          updatedAt
        }
      }
    );
    return mustFindDocument(id, userId);
  }

  document.title = payload.title;
  document.customer = payload.customer;
  document.issueDate = payload.issueDate;
  document.updatedAt = updatedAt;
  await saveLocalDocument(document);
  return document;
}

export async function deleteDraftDocument(id: string, userId: string): Promise<void> {
  const document = await findMutableDocument(id, userId);

  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.deleteOne({ id: document.id, userId, status: "draft" });
    return;
  }

  const db = await readDb();
  db.documents = db.documents.filter((candidate) => !(candidate.id === id && candidate.userId === userId));
  await writeDb(db);
}

export async function addLineItem(id: string, userId: string, payload: LineItemInput): Promise<DocumentRecord> {
  const document = await findMutableDocument(id, userId);
  const line: LineItem = { ...payload, id: crypto.randomUUID(), documentId: document.id };
  const updatedAt = new Date().toISOString();

  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.updateOne({ id, userId, status: "draft" }, { $push: { lineItems: line }, $set: { updatedAt } });
    return mustFindDocument(id, userId);
  }

  document.lineItems.push(line);
  document.updatedAt = updatedAt;
  await saveLocalDocument(document);
  return document;
}

export async function updateLineItem(id: string, userId: string, lineItemId: string, payload: LineItemInput): Promise<DocumentRecord> {
  const document = await findMutableDocument(id, userId);
  const index = document.lineItems.findIndex((line) => line.id === lineItemId);
  if (index === -1) {
    throw new ApiError("line item not found", 404);
  }

  const line: LineItem = { ...payload, id: lineItemId, documentId: document.id };
  const updatedAt = new Date().toISOString();

  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.updateOne(
      { id, userId, status: "draft", "lineItems.id": lineItemId },
      {
        $set: {
          "lineItems.$": line,
          updatedAt
        }
      }
    );
    return mustFindDocument(id, userId);
  }

  document.lineItems[index] = line;
  document.updatedAt = updatedAt;
  await saveLocalDocument(document);
  return document;
}

export async function deleteLineItem(id: string, userId: string, lineItemId: string): Promise<DocumentRecord> {
  const document = await findMutableDocument(id, userId);
  const before = document.lineItems.length;
  document.lineItems = document.lineItems.filter((line) => line.id !== lineItemId);
  if (document.lineItems.length === before) {
    throw new ApiError("line item not found", 404);
  }
  const updatedAt = new Date().toISOString();

  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.updateOne({ id, userId, status: "draft" }, { $pull: { lineItems: { id: lineItemId } }, $set: { updatedAt } });
    return mustFindDocument(id, userId);
  }

  document.updatedAt = updatedAt;
  await saveLocalDocument(document);
  return document;
}

export async function finalizeDocument(id: string, userId: string): Promise<DocumentRecord> {
  const document = await findMutableDocument(id, userId);
  for (const line of document.lineItems) {
    if (line.quantity < 1) {
      throw new ApiError("cannot finalize: every line quantity must be greater than or equal to 1");
    }
    if (line.unitPriceCents < 0) {
      throw new ApiError("cannot finalize: line unit prices must be greater than or equal to 0");
    }
  }

  const now = new Date().toISOString();
  if (isMongoConfigured()) {
    const { documents } = await collections();
    await documents.updateOne({ id, userId, status: "draft" }, { $set: { status: "finalized", finalizedAt: now, updatedAt: now } });
    return mustFindDocument(id, userId);
  }

  document.status = "finalized";
  document.finalizedAt = now;
  document.updatedAt = now;
  await saveLocalDocument(document);
  return document;
}

export async function duplicateDocument(id: string, userId: string): Promise<DocumentRecord> {
  const source = await findDocumentForUser(id, userId);
  if (!source) {
    throw new ApiError("document not found", 404);
  }

  const now = new Date().toISOString();
  const created: DocumentRecord = {
    ...source,
    id: crypto.randomUUID(),
    title: `${source.title} (copy)`,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    finalizedAt: null,
    lineItems: source.lineItems.map((line) => ({
      ...line,
      id: crypto.randomUUID(),
      documentId: ""
    }))
  };
  created.lineItems = created.lineItems.map((line) => ({ ...line, documentId: created.id }));

  return createDocument(created);
}

async function findMutableDocument(id: string, userId: string): Promise<DocumentRecord> {
  const document = await findDocumentForUser(id, userId);
  if (!document) {
    throw new ApiError("document not found", 404);
  }
  ensureDraft(document);
  return document;
}

async function mustFindDocument(id: string, userId: string): Promise<DocumentRecord> {
  const document = await findDocumentForUser(id, userId);
  if (!document) {
    throw new ApiError("document not found", 404);
  }
  return document;
}

async function saveLocalDocument(document: DocumentRecord): Promise<void> {
  const db = await readDb();
  const index = db.documents.findIndex((candidate) => candidate.id === document.id && candidate.userId === document.userId);
  if (index === -1) {
    throw new ApiError("document not found", 404);
  }
  db.documents[index] = document;
  await writeDb(db);
}

async function collections() {
  const db = await getMongoDb();
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection<UserRecord>(collectionNames.users).createIndex(mongoIndexes.users[0].key, mongoIndexes.users[0].options),
      db.collection<DocumentRecord>(collectionNames.documents).createIndex(mongoIndexes.documents[0].key, mongoIndexes.documents[0].options),
      db.collection<DocumentRecord>(collectionNames.documents).createIndex(mongoIndexes.documents[1].key, mongoIndexes.documents[1].options)
    ]).then(() => undefined);
  }
  await indexesReady;

  return {
    users: db.collection<UserRecord>(collectionNames.users),
    documents: db.collection<DocumentRecord>(collectionNames.documents)
  };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}
