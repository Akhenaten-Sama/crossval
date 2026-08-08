import * as initIndexes from "./001_init_indexes";

export type Migration = {
  id: string;
  up: typeof initIndexes.up;
};

export const migrations: Migration[] = [initIndexes];
