import { defineConfig } from "drizzle-kit";

// Production: real PostgreSQL via DATABASE_URL (Railway/any host).
// Development: embedded PGlite database stored in ./.pglite (no install needed).
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig(
  databaseUrl
    ? {
        dialect: "postgresql",
        schema: "./src/db/schema/index.ts",
        out: "./drizzle",
        dbCredentials: { url: databaseUrl },
      }
    : {
        dialect: "postgresql",
        driver: "pglite",
        schema: "./src/db/schema/index.ts",
        out: "./drizzle",
        dbCredentials: { url: "./.pglite" },
      }
);
