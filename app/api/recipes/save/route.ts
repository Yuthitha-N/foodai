import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 })
    }

    const recipe = await request.json()
    if (!recipe || !recipe.id) {
      return NextResponse.json({ message: "Valid recipe data is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Add recipe to user's favorites
    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser.userId) },
      {
        $addToSet: {
          favorites: {
            id: recipe.id,
            title: recipe.title || "Untitled Recipe",
            image: recipe.image || null,
            readyInMinutes: recipe.readyInMinutes || null,
            servings: recipe.servings || null,
            summary: recipe.summary || null,
            savedAt: new Date(),
          },
        },
      } as any
    )

    return NextResponse.json({ message: "Recipe saved successfully" })
  } catch (error: any) {
    console.error("Save recipe error:", error)
    return NextResponse.json({ message: error?.message || "Failed to save recipe" }, { status: 500 })
  }
}
