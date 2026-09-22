// lib/mongodb.ts
import { MongoClient, type Db } from "mongodb";

// Standard direct replica set URI (bypasses Linux SRV DNS lookup issues on cloud hosts like Render)
const DIRECT_MONGODB_URI =
  "mongodb://yuthithan23cse_db_user:fwCsLD7ptYO3ncEJ@ac-6day0nw-shard-00-00.xv6rqbz.mongodb.net:27017,ac-6day0nw-shard-00-01.xv6rqbz.mongodb.net:27017,ac-6day0nw-shard-00-02.xv6rqbz.mongodb.net:27017/chefora?ssl=true&replicaSet=atlas-10cd9p-shard-0&authSource=admin&retryWrites=true&w=majority";

const PRIMARY_MONGODB_URI = (process.env.MONGODB_URI || DIRECT_MONGODB_URI).trim();

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

async function tryConnect(uri: string): Promise<{ client: MongoClient; db: Db }> {
  const opts = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };

  const client = new MongoClient(uri, opts);
  await client.connect();

  let dbName = "chefora";
  try {
    const parsed = new URL(
      uri.startsWith("mongodb")
        ? uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://")
        : uri
    );
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
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = (async () => {
      // First attempt: Try primary URI (from process.env.MONGODB_URI or direct URI)
      try {
        return await tryConnect(PRIMARY_MONGODB_URI);
      } catch (firstErr: any) {
        console.warn("[MongoDB] Primary connection attempt failed:", firstErr?.message);
        
        // Second attempt: If primary was different from direct URI, fallback to direct replica set URI
        if (PRIMARY_MONGODB_URI !== DIRECT_MONGODB_URI) {
          try {
            console.log("[MongoDB] Attempting direct replica set connection fallback...");
            return await tryConnect(DIRECT_MONGODB_URI);
          } catch (secondErr: any) {
            console.error("[MongoDB] Fallback connection also failed:", secondErr?.message);
            cached.promise = null;
            throw secondErr;
          }
        }

        cached.promise = null;
        throw firstErr;
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
