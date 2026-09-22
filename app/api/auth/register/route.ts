// app/api/auth/register/route.ts

import { type NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { signAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long" }, { status: 400 });
    }

    let db;
    try {
      const conn = await connectToDatabase();
      db = conn.db;
    } catch (dbError: any) {
      return NextResponse.json(
        { message: `Database connection failed: ${dbError?.message || "Connection timeout"}. Please check MongoDB Atlas network access (allow 0.0.0.0/0) and MONGODB_URI.` },
        { status: 503 }
      );
    }

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json({ message: "An account with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.collection("users").insertOne({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      favorites: [],
      createdAt: new Date(),
    });

    const token = signAuthToken({
      userId: result.insertedId,
      email: normalizedEmail,
      name: trimmedName,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: {
          id: result.insertedId.toString(),
          name: trimmedName,
          email: normalizedEmail,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: error?.message || "Internal server error" }, { status: 500 });
  }
}
