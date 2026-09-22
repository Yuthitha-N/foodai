import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    if (!recipeId) {
      return NextResponse.json({ message: "Recipe ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const normalizedRecipeId = isNaN(Number(recipeId)) ? recipeId : Number(recipeId)

    const userReview = await db.collection("reviews").findOne({
      $or: [
        { recipeId: normalizedRecipeId, userId: new ObjectId(authUser.userId) },
        { recipeId: recipeId.toString(), userId: new ObjectId(authUser.userId) }
      ]
    })

    return NextResponse.json({
      userReview: userReview
        ? {
            rating: userReview.rating,
            review: userReview.review,
            createdAt: userReview.createdAt,
            updatedAt: userReview.updatedAt,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Get user review error:", error)
    return NextResponse.json({ message: error?.message || "Failed to get user review" }, { status: 500 })
  }
}
