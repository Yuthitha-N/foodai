import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { adaptiveRecipeSearch } from "@/lib/recipe-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const category = searchParams.get("category") || ""

    // Perform adaptive search across Free APIs + Curated catalog
    const { results, source } = await adaptiveRecipeSearch({
      query,
      category: category || (["breakfast", "lunch", "dinner", "dessert", "vegetarian", "healthy"].includes(query.toLowerCase()) ? query : "all"),
    })

    // Enhance recipes with review ratings if database is accessible
    let enhancedRecipes = results
    try {
      const { db } = await connectToDatabase()
      enhancedRecipes = await Promise.all(
        results.map(async (recipe: any) => {
          try {
            const normalizedId = isNaN(Number(recipe.id)) ? recipe.id : Number(recipe.id)
            const reviews = await db
              .collection("reviews")
              .find({
                $or: [{ recipeId: normalizedId }, { recipeId: recipe.id.toString() }],
              })
              .toArray()

            if (reviews.length > 0) {
              const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0)
              const averageRating = Math.round((totalRating / reviews.length) * 10) / 10
              return {
                ...recipe,
                averageRating,
                totalReviews: reviews.length,
              }
            }
            return recipe
          } catch {
            return recipe
          }
        })
      )
    } catch (dbError) {
      console.warn("MongoDB review enhancement skipped:", (dbError as any)?.message)
    }

    return NextResponse.json({
      results: enhancedRecipes,
      totalResults: enhancedRecipes.length,
      query,
      category,
      dataSource: source,
    })
  } catch (error: any) {
    console.error("Recipe search error:", error)
    const fallback = await adaptiveRecipeSearch({ query: "all" })
    return NextResponse.json({ message: "Search completed with adaptive fallback", results: fallback.results }, { status: 200 })
  }
}
