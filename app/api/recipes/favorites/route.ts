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

    const { db } = await connectToDatabase()

    let userObjId: ObjectId
    try {
      userObjId = new ObjectId(authUser.userId)
    } catch {
      return NextResponse.json({ message: "Invalid user ID format" }, { status: 400 })
    }

    const user = await db.collection("users").findOne(
      { _id: userObjId },
      { projection: { favorites: 1 } }
    )

    return NextResponse.json({
      favorites: user?.favorites || [],
    })
  } catch (error: any) {
    console.error("Get favorites error:", error)
    return NextResponse.json({ message: error?.message || "Failed to get favorites" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 })
    }

    const { recipeId } = await request.json()
    if (!recipeId && recipeId !== 0) {
      return NextResponse.json({ message: "Recipe ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser.userId) },
      {
        $pull: {
          favorites: { id: recipeId },
        },
      } as any
    )

    return NextResponse.json({ message: "Recipe removed from favorites" })
  } catch (error: any) {
    console.error("Remove favorite error:", error)
    return NextResponse.json({ message: error?.message || "Failed to remove favorite" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 })
    }

    const updatedRecipe = await request.json()
    if (!updatedRecipe || !updatedRecipe.id) {
      return NextResponse.json({ message: "Recipe data with ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    await db.collection("users").updateOne(
      {
        _id: new ObjectId(authUser.userId),
        "favorites.id": updatedRecipe.id,
      },
      {
        $set: {
          "favorites.$.personalNotes": updatedRecipe.personalNotes,
          "favorites.$.personalRating": updatedRecipe.personalRating,
          "favorites.$.cookingHistory": updatedRecipe.cookingHistory,
          "favorites.$.updatedAt": new Date(),
        },
      }
    )

    return NextResponse.json({ message: "Recipe updated successfully" })
  } catch (error: any) {
    console.error("Update favorite error:", error)
    return NextResponse.json({ message: error?.message || "Failed to update favorite" }, { status: 500 })
  }
}
