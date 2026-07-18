import "dotenv/config";
import { createClient } from "@libsql/client";
import { execSync } from "child_process";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("Error: DATABASE_URL is not defined in your .env file.");
  process.exit(1);
}

const isRemote =
  url.startsWith("libsql://") ||
  url.startsWith("https://") ||
  url.startsWith("http://") ||
  url.startsWith("wss://") ||
  url.startsWith("ws://");

if (!isRemote) {
  console.error("Error: DATABASE_URL must point to a remote Turso database (starting with libsql:// or https://) to use this push script.");
  process.exit(1);
}

console.log("Generating database schema SQL script...");
let sql = "";
try {
  sql = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf8" }
  );
} catch (error) {
  console.error("Error generating schema via Prisma Migrate Diff:", error);
  process.exit(1);
}

console.log("Connecting to remote Turso database at:", url);
const client = createClient({ url, authToken });

async function run() {
  try {
    // Strip SQL comments
    const cleanSql = sql.replace(/--.*/g, "");

    // Split the SQL script by statements and execute them individually
    const statements = cleanSql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Executing ${statements.length} SQL schema statements on Turso...`);
    
    // We run in a single transaction/batch if possible, or statement by statement
    // For safer execution and schema creation, we can run them statement by statement
    let count = 0;
    for (const stmt of statements) {
      count++;
      await client.execute(stmt);
    }
    
    console.log("Database schema pushed successfully to Turso!");
  } catch (err) {
    console.error("Error during database schema push:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

run();
