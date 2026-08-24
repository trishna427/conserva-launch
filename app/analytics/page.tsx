"use client";

import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  Cloud,
  DollarSign,
  Leaf,
  Scale,
  Trash2,
  TreePine,
} from "lucide-react";
import { useEffect, useState } from "react";

type FoodItem = {
  id: string;
  name: string;
  used: boolean;
  status: "active" | "used" | "disposed" | null;
  created_at: string;
};

export default function AnalyticsPage() {
  const [usedFoods, setUsedFoods] = useState<FoodItem[]>([]);
  const [disposedFoods, setDisposedFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("food_items")
      .select("id, name, used, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const foods = data || [];

    // Supports both the old used=true system
    // and the newer status="used" system.
    const saved = foods.filter(
      (food) => food.used === true || food.status === "used"
    );

    const disposed = foods.filter(
      (food) => food.status === "disposed"
    );

    setUsedFoods(saved);
    setDisposedFoods(disposed);
    setLoading(false);
  }

  const foodsSaved = usedFoods.length;
  const foodsWasted = disposedFoods.length;

  // Temporary estimates.
  // We can make these food-specific later.
  const poundsSaved = foodsSaved * 0.5;
  const poundsWasted = foodsWasted * 0.5;
  const moneySaved = foodsSaved * 2.5;
  const co2Avoided = poundsSaved * 1.9;

  const completedFoods = foodsSaved + foodsWasted;

  const wasteRate =
    completedFoods === 0
      ? 0
      : Math.round((foodsWasted / completedFoods) * 100);

  const treeMonths =
    co2Avoided > 0
      ? Math.max(1, Math.round(co2Avoided / 1.8))
      : 0;

  const recentActivity = [
    ...usedFoods.map((food) => ({
      ...food,
      activityType: "used" as const,
    })),
    ...disposedFoods.map((food) => ({
      ...food,
      activityType: "disposed" as const,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">Loading your impact...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8 pb-28">
        <h1 className="font-serif text-4xl font-bold">Analytics</h1>

        <p className="mt-2 text-[#8A8578]">
          Your impact, growing every day.
        </p>

        {/* Tree */}
        <div className="mt-8 rounded-3xl bg-[#E7EFE6] p-6">
          <div className="flex items-center gap-3">
            <TreePine className="text-[#3F6B4F]" size={30} />

            <div>
              <h2 className="font-serif text-2xl font-bold">
                Your Tree
              </h2>

              <p className="text-sm text-[#8A8578]">
                Keep saving food to help it grow.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white text-[#3F6B4F]">
              <TreePine size={72} />
            </div>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[#3F6B4F] transition-all duration-500"
              style={{
                width: `${Math.min(100, foodsSaved * 10)}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-[#8A8578]">
            {foodsSaved < 10
              ? `${foodsSaved}/10 foods saved until your tree levels up.`
              : "Your tree is growing strong."}
          </p>
        </div>

        {/* Impact */}
        <h2 className="mt-8 font-serif text-2xl font-bold">
          Your Impact
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <ImpactCard
            icon={<Leaf />}
            label="Foods saved"
            value={foodsSaved.toString()}
          />

          <ImpactCard
            icon={<DollarSign />}
            label="Money saved"
            value={`$${moneySaved.toFixed(2)}`}
          />

          <ImpactCard
            icon={<Scale />}
            label="Food waste prevented"
            value={`${poundsSaved.toFixed(1)} lbs`}
          />

          <ImpactCard
            icon={<Cloud />}
            label="CO₂ avoided"
            value={`${co2Avoided.toFixed(1)} kg`}
          />
        </div>

        {/* Waste */}
        <div className="mt-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7E3DF] text-[#A23B30]">
              <Trash2 size={20} />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold">
                Food Waste
              </h2>

              <p className="text-sm text-[#8A8578]">
                Foods you marked as disposed.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="font-serif text-3xl font-bold">
                {foodsWasted}
              </p>
              <p className="mt-1 text-sm text-[#8A8578]">
                Foods disposed
              </p>
            </div>

            <div>
              <p className="font-serif text-3xl font-bold">
                {poundsWasted.toFixed(1)} lbs
              </p>
              <p className="mt-1 text-sm text-[#8A8578]">
                Estimated waste
              </p>
            </div>
          </div>

          {completedFoods > 0 && (
            <div className="mt-5 border-t border-[#E7E2D6] pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">
                  Waste rate
                </p>

                <p className="text-sm font-bold text-[#3F6B4F]">
                  {wasteRate}%
                </p>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F1EDE2]">
                <div
                  className="h-full rounded-full bg-[#3F6B4F]"
                  style={{
                    width: `${Math.max(0, 100 - wasteRate)}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-[#8A8578]">
                Lower waste means more of your tracked food was used instead
                of disposed.
              </p>
            </div>
          )}
        </div>

        {/* Tree Impact */}
        <div className="mt-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <h2 className="font-serif text-2xl font-bold">
            Tree Impact
          </h2>

          {treeMonths > 0 ? (
            <>
              <p className="mt-3 text-[#8A8578]">
                The CO₂ you helped avoid is roughly equivalent to what a
                young tree absorbs in about:
              </p>

              <p className="mt-4 font-serif text-4xl font-bold text-[#3F6B4F]">
                {treeMonths} month{treeMonths === 1 ? "" : "s"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-[#8A8578]">
              Start saving food to build your environmental impact.
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 rounded-3xl border border-[#E7E2D6] bg-white p-5">
          <h2 className="font-serif text-2xl font-bold">
            Recent Activity
          </h2>

          {recentActivity.length === 0 ? (
            <p className="mt-3 text-[#8A8578]">
              Mark foods as used or disposed to start tracking your impact.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentActivity.map((food) => (
                <div
                  key={`${food.id}-${food.activityType}`}
                  className="flex items-center gap-3"
                >
                  {food.activityType === "used" ? (
                    <CheckCircle
                      size={18}
                      className="shrink-0 text-[#3F6B4F]"
                    />
                  ) : (
                    <Trash2
                      size={18}
                      className="shrink-0 text-[#A23B30]"
                    />
                  )}

                  <p className="text-sm text-[#8A8578]">
                    {food.activityType === "used"
                      ? `Used ${food.name}`
                      : `Disposed ${food.name}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function ImpactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-[#E7E2D6] bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#E7EFE6] text-[#3F6B4F]">
        {icon}
      </div>

      <p className="font-serif text-3xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#8A8578]">
        {label}
      </p>
    </div>
  );
}