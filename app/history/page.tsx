"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FoodItem = {
  id: string;
  name: string;
  quantity: string | null;
  location: string;
};

export default function HistoryPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from("food_items")
        .select("*")
        .eq("used", true)
        .order("created_at", { ascending: false });

      setFoods(data || []);
      setLoading(false);
    }

    loadHistory();
  }, []);

  async function restoreFood(id: string) {
    await supabase
      .from("food_items")
      .update({ used: false })
      .eq("id", id);

    setFoods((current) => current.filter((food) => food.id !== id));
  }

  async function deleteFood(id: string) {
    await supabase
      .from("food_items")
      .delete()
      .eq("id", id);

    setFoods((current) => current.filter((food) => food.id !== id));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F0] flex justify-center">
      <section className="w-full max-w-[430px] px-6 py-8">

        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <h1 className="font-serif text-4xl font-bold mb-6">
          History
        </h1>

        {foods.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center">
            <h2 className="font-serif text-2xl">
              Nothing here yet
            </h2>

            <p className="mt-3 text-[#8A8578]">
              Food you mark as used will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {foods.map((food) => (
              <div
                key={food.id}
                className="rounded-3xl bg-white p-5 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold">
                  {food.name}
                </h2>

                <p className="text-[#8A8578]">
                  {food.quantity || "No quantity"} • {food.location}
                </p>

                <div className="mt-5 flex gap-3">

                  <button
                    onClick={() => restoreFood(food.id)}
                    className="flex items-center gap-2 rounded-full bg-[#E7EFE6] px-4 py-2 font-bold text-[#3F6B4F]"
                  >
                    <RotateCcw size={16} />
                    Restore
                  </button>

                  <button
                    onClick={() => deleteFood(food.id)}
                    className="flex items-center gap-2 rounded-full bg-[#F7E3DF] px-4 py-2 font-bold text-[#A23B30]"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}