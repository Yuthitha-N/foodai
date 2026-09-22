import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/mongodb"
import { signAuthToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    let db
    try {
      const conn = await connectToDatabase()
      db = conn.db
    } catch (dbError: any) {
      console.error("Database connection failed in login:", dbError)
      return NextResponse.json(
        { message: "Database connection failed. Please check MongoDB Atlas network access and connection string." },
        { status: 503 }
      )
    }

    // Find user
    const user = await db.collection("users").findOne({ email: normalizedEmail })
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Create JWT token using centralized helper
    const token = signAuthToken({
      userId: user._id,
      email: user.email,
      name: user.name,
    })

    return NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ message: error?.message || "Internal server error" }, { status: 500 })
  }
}
