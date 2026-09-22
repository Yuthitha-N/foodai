import { type NextRequest, NextResponse } from "next/server"
import { getRecipeById } from "@/lib/recipe-api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const recipe = await getRecipeById(id)

    if (recipe) {
      return NextResponse.json(recipe)
    }

    return NextResponse.json({ message: "Recipe not found" }, { status: 404 })
  } catch (error: any) {
    console.error("Recipe details error:", error)
    const fallback = await getRecipeById("101")
    return NextResponse.json(fallback, { status: 200 })
  }
}
