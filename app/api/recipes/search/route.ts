import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY
const API_NINJAS_KEY = process.env.API_NINJAS_KEY

const SAMPLE_RECIPES = [
  {
    id: 101,
    title: "Classic Creamy Garlic Parmesan Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3d5d6281728?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 25,
    servings: 4,
    summary: "A rich and comforting pasta tossed with fresh garlic, cream, and freshly grated parmesan cheese.",
    instructions: "1. Cook pasta al dente in salted boiling water.\n2. In a skillet, sauté minced garlic in butter.\n3. Pour in heavy cream and simmer until thickened.\n4. Stir in grated parmesan and toss with pasta. Garnish with parsley.",
    ingredients: ["8 oz Fettuccine", "3 cloves Garlic, minced", "1 cup Heavy Cream", "1 cup Parmesan Cheese", "2 tbsp Butter", "Fresh Parsley"],
    cuisines: ["Italian"],
    diets: ["Vegetarian"],
    dishTypes: ["dinner", "lunch"],
    spoonacularScore: 92,
    source: "curated"
  },
  {
    id: 102,
    title: "Mediterranean Lemon Herb Grilled Chicken",
    image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 35,
    servings: 4,
    summary: "Juicy chicken breasts marinated in olive oil, lemon juice, garlic, oregano, and fresh thyme.",
    instructions: "1. Marinate chicken with olive oil, lemon juice, garlic, and oregano for 20 mins.\n2. Heat grill pan to medium-high.\n3. Grill each side for 6-8 minutes until golden and cooked through.",
    ingredients: ["4 Chicken Breasts", "3 tbsp Olive Oil", "1 Lemon, juiced", "3 cloves Garlic", "1 tsp Dried Oregano", "Salt & Pepper"],
    cuisines: ["Mediterranean"],
    diets: ["Gluten Free", "High Protein"],
    dishTypes: ["dinner", "main course"],
    spoonacularScore: 96,
    source: "curated"
  },
  {
    id: 103,
    title: "Fluffy Golden Buttermilk Pancakes",
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 20,
    servings: 4,
    summary: "Extra soft, thick, and fluffy buttermilk pancakes served with warm maple syrup and fresh berries.",
    instructions: "1. Whisk flour, sugar, baking powder, and salt.\n2. In another bowl, mix buttermilk, melted butter, and egg.\n3. Combine wet and dry ingredients gently.\n4. Cook on hot buttered griddle until bubbly, then flip.",
    ingredients: ["2 cups Flour", "2 tbsp Sugar", "2 tsp Baking Powder", "1.5 cups Buttermilk", "1 Egg", "3 tbsp Melted Butter"],
    cuisines: ["American"],
    diets: ["Vegetarian"],
    dishTypes: ["breakfast"],
    spoonacularScore: 89,
    source: "curated"
  },
  {
    id: 104,
    title: "Fresh Avocado & Quinoa Garden Bowl",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 20,
    servings: 2,
    summary: "Nutrient-packed salad bowl with ripe avocados, fluffy quinoa, cherry tomatoes, cucumbers, and lemon tahini dressing.",
    instructions: "1. Cook quinoa and let cool.\n2. Chop avocado, cherry tomatoes, and cucumber.\n3. Assemble in bowls and drizzle with olive oil and lemon tahini dressing.",
    ingredients: ["1 cup Cooked Quinoa", "1 Ripe Avocado", "1 cup Cherry Tomatoes", "1 Cucumber", "2 tbsp Olive Oil", "1 tbsp Tahini"],
    cuisines: ["Healthy"],
    diets: ["Vegan", "Gluten Free", "Healthy"],
    dishTypes: ["salad", "lunch"],
    spoonacularScore: 94,
    source: "curated"
  },
  {
    id: 105,
    title: "Rich Decadent Chocolate Lava Cake",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 25,
    servings: 2,
    summary: "Warm chocolate cakes with an irresistible molten chocolate center, dusted with powdered sugar.",
    instructions: "1. Melt dark chocolate and butter together.\n2. Whisk eggs and sugar, then fold in chocolate and flour.\n3. Pour into ramekins and bake at 425°F (220°C) for 12 minutes.\n4. Serve immediately.",
    ingredients: ["4 oz Dark Chocolate", "1/2 cup Butter", "2 Eggs", "1/4 cup Sugar", "2 tbsp Flour"],
    cuisines: ["French"],
    diets: ["Vegetarian"],
    dishTypes: ["dessert"],
    spoonacularScore: 98,
    source: "curated"
  },
  {
    id: 106,
    title: "Hearty Indian Butter Chicken & Basmati",
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80",
    readyInMinutes: 40,
    servings: 4,
    summary: "Tender spiced chicken simmered in a silky, aromatic tomato and butter curry sauce with fresh cilantro.",
    instructions: "1. Marinate chicken in yogurt and spices, then sear.\n2. Sauté onions, garlic, ginger, and tomato puree.\n3. Add cream, butter, and chicken. Simmer for 15 minutes.\n4. Serve hot with basmati rice and naan.",
    ingredients: ["1.5 lbs Chicken", "1 can Tomato Puree", "1/2 cup Heavy Cream", "3 tbsp Butter", "1 tbsp Garam Masala", "1 cup Yogurt"],
    cuisines: ["Indian"],
    diets: ["High Protein", "Gluten Free"],
    dishTypes: ["dinner", "main course"],
    spoonacularScore: 95,
    source: "curated"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""

    let results: any[] = []
    let dataSource = "curated"

    // 1. Try Spoonacular if key provided
    if (SPOONACULAR_API_KEY) {
      try {
        const response = await fetch(
          `https://api.spoonacular.com/recipes/complexSearch?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(query)}&number=12&addRecipeInformation=true&fillIngredients=true`,
          { headers: { "Content-Type": "application/json" } }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.results && data.results.length > 0) {
            results = data.results
            dataSource = "spoonacular"
          }
        }
      } catch (err) {
        console.error("Spoonacular search error:", err)
      }
    }

    // 2. Try API Ninjas if Spoonacular returned no results or key not configured
    if (results.length === 0 && API_NINJAS_KEY) {
      try {
        const ninjasResponse = await fetch(
          `https://api.api-ninjas.com/v1/recipe?query=${encodeURIComponent(query)}`,
          {
            headers: {
              "X-Api-Key": API_NINJAS_KEY,
              "Content-Type": "application/json",
            },
          }
        )

        if (ninjasResponse.ok) {
          const ninjasData = await ninjasResponse.json()
          if (Array.isArray(ninjasData) && ninjasData.length > 0) {
            results = ninjasData.slice(0, 12).map((recipe: any, index: number) => ({
              id: `ninjas_${Date.now()}_${index}`,
              title: recipe.title,
              image: null,
              readyInMinutes: null,
              servings: recipe.servings || null,
              summary: null,
              instructions: recipe.instructions,
              extendedIngredients: recipe.ingredients
                ? recipe.ingredients.split("|").map((ing: string, idx: number) => ({
                    id: idx,
                    original: ing.trim(),
                    name: ing.trim(),
                  }))
                : [],
              nutrition: null,
              diets: [],
              cuisines: [],
              dishTypes: [],
              spoonacularScore: null,
              source: "api-ninjas",
            }))
            dataSource = "api-ninjas"
          }
        }
      } catch (err) {
        console.error("API Ninjas error:", err)
      }
    }

    // 3. If no external results, filter curated recipes
    if (results.length === 0) {
      const q = query.toLowerCase().trim()
      if (!q || q === "all") {
        results = SAMPLE_RECIPES
      } else {
        results = SAMPLE_RECIPES.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.cuisines.some((c) => c.toLowerCase().includes(q)) ||
            r.diets.some((d) => d.toLowerCase().includes(q)) ||
            r.dishTypes.some((dt) => dt.toLowerCase().includes(q)) ||
            r.summary.toLowerCase().includes(q)
        )
        if (results.length === 0) {
          results = SAMPLE_RECIPES
        }
      }
      dataSource = "curated"
    }

    // 4. Enhance recipes with review ratings if database is accessible
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
      // Database not available; continue gracefully with unenhanced recipe list
      console.warn("MongoDB review enhancement skipped:", (dbError as any)?.message)
    }

    return NextResponse.json({
      results: enhancedRecipes,
      totalResults: enhancedRecipes.length,
      query,
      dataSource,
    })
  } catch (error: any) {
    console.error("Recipe search error:", error)
    return NextResponse.json({ message: "Failed to search recipes", results: SAMPLE_RECIPES }, { status: 200 })
  }
}
