// lib/auth.ts
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

export const JWT_SECRET =
  process.env.JWT_SECRET ||
  "chefora-secure-jwt-secret-key-2024-recipe-finder-production-key";

export interface DecodedToken {
  userId: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export function signAuthToken(payload: { userId: any; email: string; name: string }): string {
  return jwt.sign(
    {
      userId: payload.userId.toString(),
      email: payload.email,
      name: payload.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function getAuthUser(request: NextRequest): DecodedToken | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error("JWT Verification error:", error);
    return null;
  }
}
