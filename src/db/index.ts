import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import * as schema from "./schema.ts";

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: pg.Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({

  connectionString: process.env.DATABASE_URL,

  ssl: {

    rejectUnauthorized: false,

  },

  max: 10,

  connectionTimeoutMillis: 15000,

});

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

pool
  .query("SELECT NOW()")
  .then((res) => {
    console.log("✅ PostgreSQL Connected");
    console.log(res.rows);
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Error");
    console.error(err);

    if (err.errors) {
      console.error("Nested Errors:");
      console.error(err.errors);
    }
  });

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export * as schema from "./schema.ts";
