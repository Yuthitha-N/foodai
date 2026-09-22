import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getAuthUser } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { getRecipeById } from "@/lib/recipe-api"

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ message: "Valid authorization token required" }, { status: 401 })
    }

    const recipe = await request.json()
    if (!recipe || (recipe.id === undefined && recipe.id === null)) {
      return NextResponse.json({ message: "Valid recipe data is required" }, { status: 400 })
    }

    // If details are sparse, enrich from recipe dataset/API
    let fullRecipeDetails: any = null
    if (!recipe.ingredients || recipe.ingredients.length === 0 || !recipe.instructions) {
      try {
        fullRecipeDetails = await getRecipeById(recipe.id)
      } catch {
        // use recipe as-is
      }
    }

    const { db } = await connectToDatabase()

    const rawId = recipe.id
    const idNumber = Number(rawId)
    const idOptions = isNaN(idNumber) ? [rawId, String(rawId)] : [rawId, idNumber, String(rawId)]

    const completeRecipe = {
      id: isNaN(idNumber) ? rawId : idNumber,
      title: recipe.title || fullRecipeDetails?.title || "Untitled Recipe",
      image: recipe.image || fullRecipeDetails?.image || "",
      readyInMinutes: recipe.readyInMinutes || fullRecipeDetails?.readyInMinutes || 30,
      servings: recipe.servings || fullRecipeDetails?.servings || 4,
      summary: recipe.summary || fullRecipeDetails?.summary || "",
      instructions: recipe.instructions || fullRecipeDetails?.instructions || "",
      ingredients: (recipe.ingredients && recipe.ingredients.length > 0) ? recipe.ingredients : (fullRecipeDetails?.ingredients || []),
      nutrition: recipe.nutrition || fullRecipeDetails?.nutrition || null,
      diets: recipe.diets || fullRecipeDetails?.diets || [],
      cuisines: recipe.cuisines || fullRecipeDetails?.cuisines || [],
      dishTypes: recipe.dishTypes || fullRecipeDetails?.dishTypes || [],
      spoonacularScore: recipe.spoonacularScore || fullRecipeDetails?.spoonacularScore || null,
      personalNotes: recipe.personalNotes || "",
      personalRating: recipe.personalRating || 0,
      cookingHistory: recipe.cookingHistory || [],
      savedAt: new Date(),
    }

    // 1. Remove any existing favorite with same ID (number or string) to avoid duplicate records
    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser.userId) },
      {
        $pull: {
          favorites: { id: { $in: idOptions } },
        },
      } as any
    )

    // 2. Add complete, enriched recipe to user's favorites
    await db.collection("users").updateOne(
      { _id: new ObjectId(authUser.userId) },
      {
        $push: {
          favorites: completeRecipe,
        },
      } as any
    )

    return NextResponse.json({ message: "Recipe saved successfully", recipe: completeRecipe })
  } catch (error: any) {
    console.error("Save recipe error:", error)
    return NextResponse.json({ message: error?.message || "Failed to save recipe" }, { status: 500 })
  }
}
