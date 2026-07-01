"use client";

import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import { ChefHat, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type Recipe = {
  title: string;
  description: string;
  ingredientsUsed: string[];
  missingIngredients: string[];
  instructions: string[];
};

export default function RecipesPage() {
  const [foods, setFoods] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFoods();
  }, []);

  async function loadFoods() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("food_items")
      .select("name")
      .eq("user_id", user.id)
      .eq("used", false);

    if (error) {
      console.error(error);
      return;
    }

    setFoods(data.map((food) => food.name));
  }

  async function generateRecipes() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/generate-recipes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ foods }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    setRecipes(data.recipes || []);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8 pb-28">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <ChefHat size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Recipes</h1>

          <p className="mt-3 text-[#8A8578]">
            Generate meal ideas using what you already have.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <p className="mb-2 font-bold">Your kitchen</p>

          {foods.length === 0 ? (
            <p className="text-sm text-[#8A8578]">
              Add food to your inventory before generating recipes.
            </p>
          ) : (
            <p className="text-sm capitalize text-[#8A8578]">
              {foods.join(" • ")}
            </p>
          )}
        </div>

        <button
          onClick={generateRecipes}
          disabled={loading || foods.length === 0}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
        >
          <Sparkles size={20} />
          {loading ? "Generating recipes..." : "Generate Recipes"}
        </button>

        {message && (
          <p className="mb-5 rounded-2xl bg-white p-4 text-center text-sm text-red-700">
            {message}
          </p>
        )}

        {recipes.length === 0 && !loading ? (
          <div className="rounded-3xl border border-[#E7E2D6] bg-white p-8 text-center">
            <h2 className="font-serif text-2xl font-bold">
              No recipes yet
            </h2>
            <p className="mt-3 text-[#8A8578]">
              Generate recipes from your current inventory.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {recipes.map((recipe) => (
              <div
                key={recipe.title}
                className="rounded-3xl border border-[#E7E2D6] bg-white p-5 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold">
                  {recipe.title}
                </h2>

                <p className="mt-2 text-sm text-[#8A8578]">
                  {recipe.description}
                </p>

                <div className="mt-5">
                  <p className="mb-2 font-bold text-[#3F6B4F]">
                    Uses from your kitchen
                  </p>

                  <ul className="space-y-1 text-sm text-[#8A8578]">
                    {recipe.ingredientsUsed.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>

                {recipe.missingIngredients.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 font-bold text-[#B5651D]">
                      You may also need
                    </p>

                    <ul className="space-y-1 text-sm text-[#8A8578]">
                      {recipe.missingIngredients.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5">
                  <p className="mb-2 font-bold">Instructions</p>

                  <ol className="list-decimal space-y-2 pl-5 text-sm text-[#8A8578]">
                    {recipe.instructions.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}