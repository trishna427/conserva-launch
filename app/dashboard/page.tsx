"use client";

import BottomNav from "@/components/BottomNav";
import { getFoodStatus, getStatusLabel } from "@/lib/food";
import { getKitchenSummary } from "@/lib/reminders";
import { supabase } from "@/lib/supabase";
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "fridge" | "freezer" | "pantry" | "expiring"
  >("all");

  const [kitchenSummary, setKitchenSummary] = useState({
    count: 0,
    reminders: [] as string[],
  });

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      const { data: foodData, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("used", false)
        .order("expiration_date", { ascending: true });

      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      const activeFoods = foodData || [];
      setFoods(activeFoods);

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      const reminderPreferences = preferences || {
        in_app_reminders: true,
        days_before: 2,
      };

      const summary = getKitchenSummary(activeFoods, reminderPreferences);
      setKitchenSummary(summary);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function markAsUsed(id: string) {
    await supabase.from("food_items").update({ used: true }).eq("id", id);
    setFoods((current) => current.filter((food) => food.id !== id));
  }
  async function sendTestEmail() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user?.email) return;
  
    if (kitchenSummary.reminders.length === 0) {
      alert("No reminders to send right now.");
      return;
    }
  
    const response = await fetch("/api/send-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        reminders: kitchenSummary.reminders,
      }),
    });
  
    if (response.ok) {
      alert("Reminder email sent!");
    } else {
      alert("Something went wrong sending the email.");
    }
  }

  async function deleteFood(id: string, name: string) {
    const confirmDelete = confirm(`Delete ${name}?`);
    if (!confirmDelete) return;

    await supabase.from("food_items").delete().eq("id", id);
    setFoods((current) => current.filter((food) => food.id !== id));
  }

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name
      .toLowerCase()
      .includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "all") return true;

    if (filter === "expiring") {
      return getFoodStatus(food.expiration_date) === "expiring-soon";
    }

    return food.location === filter;
  });

  const activeItems = foods.length;

  const expiringItems = foods.filter(
    (food) => getFoodStatus(food.expiration_date) === "expiring-soon"
  ).length;

  const expiredItems = foods.filter(
    (food) => getFoodStatus(food.expiration_date) === "expired"
  ).length;

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
            <p className="text-[#8A8578]">Welcome 🌿</p>
            <h1 className="font-serif text-4xl font-bold">Your fridge</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/reminders"
              className="rounded-full bg-[#E7EFE6] p-3 text-[#3F6B4F]"
            >
              <Bell size={22} />
            </Link>

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
          <p className="text-sm opacity-90">Kitchen Update</p>

          <h2 className="mt-2 font-serif text-2xl font-bold">
            {kitchenSummary.count > 0
              ? `You have ${kitchenSummary.count} food${
                  kitchenSummary.count === 1 ? "" : "s"
                } to use soon`
              : "Everything looks good today"}
          </h2>

          {kitchenSummary.count > 0 ? (
            <ul className="mt-3 space-y-1 text-sm opacity-90">
              {kitchenSummary.reminders.slice(0, 3).map((reminder) => (
                <li key={reminder}>• {reminder}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm opacity-90">
              Nothing needs attention right now. 🌿
            </p>
          )}
        </div>
        <button
          onClick={sendTestEmail}
          className="mb-6 w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-3 font-bold text-[#3F6B4F]"
        >
          📧 Send Test Reminder Email
        </button>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#E7E2D6] bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#3F6B4F]">{activeItems}</p>
            <p className="text-xs text-[#8A8578]">Active</p>
          </div>

          <div className="rounded-2xl border border-[#E7E2D6] bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#E08D5C]">
              {expiringItems}
            </p>
            <p className="text-xs text-[#8A8578]">Expiring</p>
          </div>

          <div className="rounded-2xl border border-[#E7E2D6] bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-[#A23B30]">
              {expiredItems}
            </p>
            <p className="text-xs text-[#8A8578]">Expired</p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search your fridge..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-5 w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-3 outline-none"
        />

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {["all", "fridge", "freezer", "pantry", "expiring"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item as typeof filter)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${
                filter === item
                  ? "bg-[#3F6B4F] text-white"
                  : "bg-[#E7EFE6] text-[#3F6B4F]"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Virtual fridge</h2>

          <div className="flex gap-2">
            <Link
              href="/history"
              className="rounded-full bg-[#F1EDE2] px-4 py-2 font-bold text-[#2B2B26]"
            >
              History
            </Link>

            <Link
              href="/add"
              className="flex items-center gap-1 rounded-full bg-[#E7EFE6] px-4 py-2 font-bold text-[#3F6B4F]"
            >
              <Plus size={18} /> Add
            </Link>
          </div>
        </div>

        {filteredFoods.length === 0 ? (
          <div className="rounded-3xl border border-[#E7E2D6] bg-white p-8 text-center">
            <p className="font-serif text-2xl font-bold">
              {filter === "fridge"
                ? "Your fridge is empty"
                : filter === "freezer"
                ? "Your freezer is empty"
                : filter === "pantry"
                ? "Your pantry is empty"
                : filter === "expiring"
                ? "Nothing is expiring soon"
                : "Your kitchen is empty"}
            </p>

            <p className="mt-2 text-[#8A8578]">
              {filter === "expiring"
                ? "Nice! Nothing needs urgent attention right now."
                : "Add an item to start tracking expiration dates."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFoods.map((food) => {
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
                      <Clock size={15} />{" "}
                      {getStatusLabel(food.expiration_date)}
                    </p>

                    <div className="flex gap-2">
                      <Link
                        href={`/edit/${food.id}`}
                        className="rounded-full bg-[#F1EDE2] px-3 py-2 text-xs font-bold text-[#2B2B26]"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => markAsUsed(food.id)}
                        className="rounded-full bg-[#E7EFE6] px-3 py-2 text-xs font-bold text-[#3F6B4F]"
                      >
                        Used
                      </button>

                      <button
                        onClick={() => deleteFood(food.id, food.name)}
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

      <BottomNav />
    </main>
  );
}