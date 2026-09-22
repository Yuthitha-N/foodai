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

    const { recipeId, rating, review, recipeName } = await request.json()

    if (!recipeId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Recipe ID and valid rating (1-5) are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Normalize recipe ID comparison (support both number and string)
    const normalizedRecipeId = isNaN(Number(recipeId)) ? recipeId : Number(recipeId)

    // Check if user already reviewed this recipe
    const existingReview = await db.collection("reviews").findOne({
      $or: [
        { recipeId: normalizedRecipeId, userId: new ObjectId(authUser.userId) },
        { recipeId: recipeId.toString(), userId: new ObjectId(authUser.userId) },
      ]
    })

    if (existingReview) {
      // Update existing review
      await db.collection("reviews").updateOne(
        { _id: existingReview._id },
        {
          $set: {
            rating: Number(rating),
            review: review || "",
            updatedAt: new Date(),
          },
        },
      )
    } else {
      // Create new review
      await db.collection("reviews").insertOne({
        recipeId: normalizedRecipeId,
        recipeName: recipeName || "",
        userId: new ObjectId(authUser.userId),
        userName: authUser.name || "Chefora Chef",
        rating: Number(rating),
        review: review || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({ message: "Review saved successfully" })
  } catch (error: any) {
    console.error("Save review error:", error)
    return NextResponse.json({ message: error?.message || "Failed to save review" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    if (!recipeId) {
      return NextResponse.json({ message: "Recipe ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const normalizedRecipeId = isNaN(Number(recipeId)) ? recipeId : Number(recipeId)

    const reviews = await db
      .collection("reviews")
      .find({
        $or: [
          { recipeId: normalizedRecipeId },
          { recipeId: recipeId.toString() }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    }

    return NextResponse.json({
      reviews: reviews.map((review) => ({
        id: review._id.toString(),
        userName: review.userName,
        rating: review.rating,
        review: review.review,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    })
  } catch (error: any) {
    console.error("Get reviews error:", error)
    return NextResponse.json({ message: error?.message || "Failed to get reviews" }, { status: 500 })
  }
}
