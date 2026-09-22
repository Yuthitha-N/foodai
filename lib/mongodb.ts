// lib/mongodb.ts
import { MongoClient, type Db } from "mongodb";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://yuthithan23cse_db_user:fwCsLD7ptYO3ncEJ@cluster0.xv6rqbz.mongodb.net/chefora?retryWrites=true&w=majority&appName=Cluster0";

const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

// Global is used here to maintain a cached connection across hot reloads in development
// and across serverless function invocations.
interface GlobalMongo {
  conn: { client: MongoClient; db: Db } | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoCache: GlobalMongo | undefined;
}

let cached: GlobalMongo = global._mongoCache || { conn: null, promise: null };

if (!global._mongoCache) {
  global._mongoCache = cached;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = (async () => {
      try {
        const client = new MongoClient(MONGODB_URI, opts);
        await client.connect();
        
        // Extract database name from URI if specified, otherwise default to "chefora"
        let dbName = "chefora";
        try {
          const parsed = new URL(MONGODB_URI.startsWith("mongodb") ? MONGODB_URI.replace("mongodb+srv://", "http://").replace("mongodb://", "http://") : MONGODB_URI);
          const pathname = parsed.pathname.replace(/^\//, "");
          if (pathname && !pathname.includes("?")) {
            dbName = pathname;
          }
        } catch {
          // Keep default "chefora"
        }

        const db = client.db(dbName);
        console.log(`[MongoDB] Connected successfully to database: "${dbName}"`);
        return { client, db };
      } catch (err: any) {
        console.error("[MongoDB] Connection error:", err?.message || err);
        cached.promise = null; // Reset promise on failure so next call can retry
        throw err;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
