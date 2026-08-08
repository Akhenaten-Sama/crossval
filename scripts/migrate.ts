import { MongoClient } from "mongodb";
import { collectionNames } from "../lib/models";
import { migrations } from "../migrations";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is required to run migrations");
  }

  const dbName = process.env.MONGODB_DB ?? "multi_rate_pricing";
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const migrationCollection = db.collection(collectionNames.migrations);
    await migrationCollection.createIndex({ id: 1 }, { unique: true, name: "migrations_id_unique" });

    for (const migration of migrations) {
      const applied = await migrationCollection.findOne({ id: migration.id });
      if (applied) {
        console.log(`Skipping ${migration.id}`);
        continue;
      }

      console.log(`Applying ${migration.id}`);
      await migration.up(db);
      await migrationCollection.insertOne({
        id: migration.id,
        appliedAt: new Date().toISOString()
      });
    }

    console.log("Migrations complete");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
