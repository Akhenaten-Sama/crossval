import * as initIndexes from "./001_init_indexes";
import * as addDocumentDescription from "./002_add_document_description";
import * as addLineItemDetails from "./003_add_line_item_details";

export type Migration = {
  id: string;
  up: typeof initIndexes.up;
};

export const migrations: Migration[] = [initIndexes, addDocumentDescription, addLineItemDetails];
