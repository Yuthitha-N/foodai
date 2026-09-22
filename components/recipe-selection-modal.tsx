"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Clock, Users, X, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface Recipe {
  id: number
  title: string
  image: string
  readyInMinutes: number
  servings: number
  ingredients?: string[]
}

interface RecipeSelectionModalProps {
  recipes: Recipe[]
  isOpen: boolean
  onClose: () => void
  onGenerateList: (selectedRecipes: Recipe[]) => void
}

export function RecipeSelectionModal({ recipes, isOpen, onClose, onGenerateList }: RecipeSelectionModalProps) {
  const [selectedRecipes, setSelectedRecipes] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRecipes = recipes.filter((recipe) => recipe.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleRecipeSelection = (recipeId: number) => {
    const newSelection = new Set(selectedRecipes)
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId)
    } else {
      newSelection.add(recipeId)
    }
    setSelectedRecipes(newSelection)
  }

  const handleGenerateList = () => {
    const selected = recipes.filter((recipe) => selectedRecipes.has(recipe.id))
    onGenerateList(selected)
    setSelectedRecipes(new Set())
    setSearchQuery("")
  }

  const selectAll = () => {
    setSelectedRecipes(new Set(filteredRecipes.map((recipe) => recipe.id)))
  }

  const clearAll = () => {
    setSelectedRecipes(new Set())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2 text-xl font-bold">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
              <span>Select Recipes for Grocery List</span>
            </DialogTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-bold px-3 py-1">
              {selectedRecipes.size} selected
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Search and Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your favorite recipes..."
                className="pl-10 h-11 border-2 focus:border-orange-500 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={filteredRecipes.length === 0}
                  className="rounded-lg font-medium hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                >
                  Select All ({filteredRecipes.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={selectedRecipes.size === 0}
                  className="rounded-lg font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  Clear All
                </Button>
              </div>

              <p className="text-sm text-gray-500 font-medium">
                {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>

          {/* Recipe Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => {
                const isSelected = selectedRecipes.has(recipe.id)
                return (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Card
                      className={cn(
                        "group cursor-pointer transition-all duration-200 border rounded-xl overflow-hidden select-none",
                        isSelected
                          ? "ring-2 ring-orange-500 bg-orange-50/80 border-orange-300 shadow-md"
                          : "hover:shadow-md hover:border-orange-200 bg-white"
                      )}
                      onClick={() => toggleRecipeSelection(recipe.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <div className="flex items-center justify-center shrink-0">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleRecipeSelection(recipe.id)}
                              className="h-5 w-5 rounded data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                            />
                          </div>

                          {/* Image Thumbnail with Fixed Dimensions */}
                          <div className="w-16 h-16 min-w-[4rem] min-h-[4rem] max-w-[4rem] max-h-[4rem] rounded-lg overflow-hidden shrink-0 bg-gray-100 border border-gray-200 shadow-sm">
                            <img
                              src={recipe.image || "/placeholder.svg?height=80&width=80"}
                              alt={recipe.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Recipe Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                              {recipe.title}
                            </h4>

                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                              <span className="flex items-center font-medium">
                                <Clock className="h-3 w-3 mr-1 text-orange-500 shrink-0" />
                                {recipe.readyInMinutes} min
                              </span>
                              <span className="flex items-center font-medium">
                                <Users className="h-3 w-3 mr-1 text-blue-500 shrink-0" />
                                {recipe.servings}
                              </span>
                            </div>

                            {recipe.ingredients && (
                              <p className="text-[11px] text-gray-400 mt-1 truncate">
                                {recipe.ingredients.length} ingredients
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filteredRecipes.length === 0 && (
            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No recipes found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search query" : "No recipes saved in favorites yet"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t pt-4 mt-2">
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11 font-medium rounded-xl">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleGenerateList}
              disabled={selectedRecipes.size === 0}
              className="flex-1 h-11 font-medium bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/20 rounded-xl transition-all"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Generate List ({selectedRecipes.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
