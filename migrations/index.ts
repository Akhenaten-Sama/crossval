import * as initIndexes from "./001_init_indexes";
import * as addDocumentDescription from "./002_add_document_description";

export type Migration = {
  id: string;
  up: typeof initIndexes.up;
};

export const migrations: Migration[] = [initIndexes, addDocumentDescription];
