import { type NextRequest, NextResponse } from "next/server"

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY

const SAMPLE_RECIPES_MAP: Record<string, any> = {
  "101": {
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
  },
  "102": {
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
  },
  "103": {
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
  },
  "104": {
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
  },
  "105": {
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
  },
  "106": {
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
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (SAMPLE_RECIPES_MAP[id]) {
      return NextResponse.json(SAMPLE_RECIPES_MAP[id])
    }

    if (!SPOONACULAR_API_KEY) {
      return NextResponse.json(
        SAMPLE_RECIPES_MAP["101"] || { message: "Recipe details not available" },
        { status: 200 }
      )
    }

    const response = await fetch(
      `https://api.spoonacular.com/recipes/${id}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        SAMPLE_RECIPES_MAP[id] || SAMPLE_RECIPES_MAP["101"],
        { status: 200 }
      )
    }

    const data = await response.json()

    const formattedRecipe = {
      id: data.id,
      title: data.title,
      image: data.image,
      readyInMinutes: data.readyInMinutes,
      servings: data.servings,
      summary: data.summary,
      instructions: data.instructions,
      ingredients: data.extendedIngredients?.map((ing: any) => ing.original) || [],
      nutrition: data.nutrition,
      diets: data.diets || [],
      cuisines: data.cuisines || [],
      dishTypes: data.dishTypes || [],
      spoonacularScore: data.spoonacularScore,
    }

    return NextResponse.json(formattedRecipe)
  } catch (error: any) {
    console.error("Recipe details error:", error)
    return NextResponse.json(SAMPLE_RECIPES_MAP["101"], { status: 200 })
  }
}
