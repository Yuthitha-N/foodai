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
    if (recipeId === undefined || recipeId === null) {
      return NextResponse.json({ message: "Recipe ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const rawId = recipeId
    const idNumber = Number(rawId)
    const idOptions = isNaN(idNumber) ? [rawId, String(rawId)] : [rawId, idNumber, String(rawId)]

    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser.userId) },
      {
        $pull: {
          favorites: { id: { $in: idOptions } },
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
    if (!updatedRecipe || (updatedRecipe.id === undefined && updatedRecipe.id === null)) {
      return NextResponse.json({ message: "Recipe data with ID is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const rawId = updatedRecipe.id
    const idNumber = Number(rawId)
    const idOptions = isNaN(idNumber) ? [rawId, String(rawId)] : [rawId, idNumber, String(rawId)]

    const user = await db.collection("users").findOne({ _id: new ObjectId(authUser.userId) })
    if (user && Array.isArray(user.favorites)) {
      const updatedFavorites = user.favorites.map((fav: any) => {
        if (idOptions.some((opt) => String(opt) === String(fav.id))) {
          return {
            ...fav,
            personalNotes: updatedRecipe.personalNotes !== undefined ? updatedRecipe.personalNotes : fav.personalNotes,
            personalRating: updatedRecipe.personalRating !== undefined ? updatedRecipe.personalRating : fav.personalRating,
            cookingHistory: updatedRecipe.cookingHistory !== undefined ? updatedRecipe.cookingHistory : fav.cookingHistory,
            updatedAt: new Date(),
          }
        }
        return fav
      })

      await db.collection("users").updateOne(
        { _id: new ObjectId(authUser.userId) },
        { $set: { favorites: updatedFavorites } }
      )
    }

    return NextResponse.json({ message: "Recipe updated successfully" })
  } catch (error: any) {
    console.error("Update favorite error:", error)
    return NextResponse.json({ message: error?.message || "Failed to update favorite" }, { status: 500 })
  }
}
