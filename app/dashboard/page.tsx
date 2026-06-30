"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChefHat,
  Clock,
  Plus,
  Refrigerator,
  Snowflake,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFoodStatus, getStatusLabel } from "@/lib/food";

type FoodItem = {
  id: string;
  name: string;
  quantity: string | null;
  location: "fridge" | "freezer" | "pantry";
  purchase_date: string;
  expiration_date: string;
  notes: string | null;
  used: boolean;
};

const locationIcons = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Package,
};

export default function DashboardPage() {
  const router = useRouter();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFoods() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("used", false)
        .order("expiration_date", { ascending: true });

      if (error) {
        console.error(error.message);
      } else {
        setFoods(data || []);
      }

      setLoading(false);
    }

    loadFoods();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">Loading your fridge...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-5 py-6 pb-28">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[#8A8578]">Welcome 🌿 </p>
            <h1 className="font-serif text-4xl font-bold">Your fridge</h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full bg-[#E7EFE6] p-3 text-[#3F6B4F]">
              <Bell size={22} />
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="rounded-full bg-[#3F6B4F] px-4 py-2 text-sm font-bold text-white"
            >
              Log out
            </button>
          </div>
        </header>

        <div className="mb-6 rounded-3xl bg-[#3F6B4F] p-5 text-white">
          <p className="text-sm opacity-90">A gentle reminder</p>
          <h2 className="mt-2 font-serif text-2xl font-bold">
            Use what expires first.
          </h2>
          <p className="mt-2 text-sm opacity-90">
            Conserva prioritizes ingredients that may be best used soon.
          </p>
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Virtual fridge</h2>
          <Link
            href="/add"
            className="flex items-center gap-1 rounded-full bg-[#E7EFE6] px-4 py-2 font-bold text-[#3F6B4F]"
          >
            <Plus size={18} /> Add
          </Link>
        </div>

        {foods.length === 0 ? (
          <div className="rounded-3xl border border-[#E7E2D6] bg-white p-8 text-center">
            <p className="font-serif text-2xl font-bold">Your fridge is empty</p>
            <p className="mt-2 text-[#8A8578]">
              Add your first food item to start tracking expiration dates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {foods.map((food) => {
              const Icon = locationIcons[food.location];
              const status = getFoodStatus(food.expiration_date);
              const expiring = status === "expiring-soon";
              const expired = status === "expired";

              return (
                <div
                  key={food.id}
                  className="rounded-3xl border border-[#E7E2D6] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7EFE6] text-[#3F6B4F]">
                      <Icon size={24} />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-serif text-xl font-bold">
                        {food.name}
                      </h3>
                      <p className="text-sm capitalize text-[#8A8578]">
                        {food.quantity || "No quantity"} • {food.location}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        expired
                          ? "bg-[#F7E3DF] text-[#A23B30]"
                          : expiring
                          ? "bg-[#FBEBDC] text-[#B5651D]"
                          : "bg-[#E7EFE6] text-[#3F6B4F]"
                      }`}
                    >
                      {expired
                        ? "Expired"
                        : expiring
                        ? "Expiring soon"
                        : "Fresh"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
  <p className="flex items-center gap-2 text-sm text-[#8A8578]">
    <Clock size={15} /> {getStatusLabel(food.expiration_date)}
  </p>

  <div className="flex gap-2">
    <button
      onClick={async () => {
        await supabase
          .from("food_items")
          .update({ used: true })
          .eq("id", food.id);

        setFoods((currentFoods) =>
          currentFoods.filter((item) => item.id !== food.id)
        );
      }}
      className="rounded-full bg-[#E7EFE6] px-3 py-2 text-xs font-bold text-[#3F6B4F]"
    >
      Used
    </button>

    <button
      onClick={async () => {
        const confirmDelete = confirm(`Delete ${food.name}?`);

        if (!confirmDelete) return;

        await supabase.from("food_items").delete().eq("id", food.id);

        setFoods((currentFoods) =>
          currentFoods.filter((item) => item.id !== food.id)
        );
      }}
      className="rounded-full bg-[#F7E3DF] px-3 py-2 text-xs font-bold text-[#A23B30]"
    >
      Delete
    </button>
  </div>
</div>
                </div>
              );
            })}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="mb-3 flex items-center gap-2">
            <ChefHat className="text-[#E08D5C]" />
            <h2 className="font-serif text-2xl font-bold">
              What can I cook?
            </h2>
          </div>

          <p className="text-[#8A8578]">
            Soon, AI recipes will use your actual inventory and prioritize food
            expiring first.
          </p>

          <Link
            href="/recipes"
            className="mt-4 block rounded-2xl bg-[#3F6B4F] py-3 text-center font-bold text-white"
          >
            See recipes
          </Link>
        </section>
      </section>
    </main>
  );
}