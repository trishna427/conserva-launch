"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, Bell, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFoodStatus, getStatusLabel } from "@/lib/food";
import BottomNav from "@/components/BottomNav";

type FoodItem = {
  id: string;
  name: string;
  quantity: string | null;
  location: string;
  expiration_date: string;
};

export default function RemindersPage() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReminders() {
      const { data } = await supabase
        .from("food_items")
        .select("*")
        .eq("used", false)
        .order("expiration_date", { ascending: true });

      const reminderFoods = (data || []).filter((food) => {
        const status = getFoodStatus(food.expiration_date);
        return status === "expiring-soon" || status === "expired";
      });

      setFoods(reminderFoods);
      setLoading(false);
    }

    loadReminders();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">Checking your kitchen...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8 pb-28">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} /> Back
        </Link>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Bell size={26} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Reminders</h1>
          <p className="mt-3 text-[#8A8578]">
            Gentle updates for food that may be best used soon.
          </p>
        </div>

        {foods.length === 0 ? (
          <div className="rounded-3xl border border-[#E7E2D6] bg-white p-8 text-center">
            <h2 className="font-serif text-2xl font-bold">All clear</h2>
            <p className="mt-3 text-[#8A8578]">
              Nothing needs attention right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {foods.map((food) => (
              <div
                key={food.id}
                className="rounded-3xl border border-[#E7E2D6] bg-white p-5 shadow-sm"
              >
                <h2 className="font-serif text-2xl font-bold">{food.name}</h2>

                <p className="mt-2 text-[#8A8578]">
                  Your {food.name.toLowerCase()} may be best used soon.
                </p>

                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[#3F6B4F]">
                  <Clock size={16} />
                  {getStatusLabel(food.expiration_date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}