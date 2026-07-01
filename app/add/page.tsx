"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  Leaf,
  Sparkles,
  Refrigerator,
  Snowflake,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSuggestedShelfLife } from "@/lib/shelfLife";
import { searchFoods } from "@/lib/searchFood";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

const storageOptions = [
  { value: "fridge", label: "Fridge", icon: Refrigerator },
  { value: "freezer", label: "Freezer", icon: Snowflake },
  { value: "pantry", label: "Pantry", icon: Package },
] as const;

export default function AddItemPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState<"fridge" | "freezer" | "pantry">(
    "fridge"
  );
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updateExpirationSuggestion(foodName: string, date: string) {
    const shelfLifeDays = getSuggestedShelfLife(foodName);

    if (!shelfLifeDays) {
      setSuggestionMessage("");
      return;
    }

    const suggestedDate = addDays(date, shelfLifeDays);
    setExpirationDate(suggestedDate);
    setSuggestionMessage(
      `Suggested ${shelfLifeDays} days based on typical storage. You can change it.`
    );
  }

  async function handleAddItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("food_items").insert({
      user_id: session.user.id,
      name,
      quantity,
      location,
      purchase_date: purchaseDate,
      expiration_date: expirationDate,
      notes,
      used: false,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
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

        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Leaf size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">
            Add to your kitchen
          </h1>
          <p className="mt-3 text-[#8A8578]">
            Track it today to waste less tomorrow.
          </p>
        </div>

        <form onSubmit={handleAddItem} className="mt-10 space-y-7">
          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">
              Food Information
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
                  placeholder="Food name"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setName(value);
                    setFoodSuggestions(searchFoods(value));
                    updateExpirationSuggestion(value, purchaseDate);
                  }}
                  required
                />

                {foodSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-2 overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white shadow-lg">
                    {foodSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => {
                          setName(suggestion);
                          setFoodSuggestions([]);
                          updateExpirationSuggestion(
                            suggestion,
                            purchaseDate
                          );
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-semibold text-[#2B2B26] hover:bg-[#E7EFE6]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
                placeholder="Quantity, e.g. 2 cups"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">Storage</h2>

            <div className="grid grid-cols-3 gap-3">
              {storageOptions.map((option) => {
                const Icon = option.icon;
                const selected = location === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocation(option.value)}
                    className={`rounded-3xl border p-4 text-center transition ${
                      selected
                        ? "border-[#3F6B4F] bg-[#3F6B4F] text-white"
                        : "border-[#E7E2D6] bg-white text-[#8A8578]"
                    }`}
                  >
                    <div className="mb-2 flex justify-center">
                      <Icon size={24} />
                    </div>
                    <p className="text-sm font-bold">{option.label}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">Dates</h2>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block font-semibold">Purchase date</span>
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPurchaseDate(value);
                    updateExpirationSuggestion(name, value);
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-semibold">
                  Estimated best-by date
                </span>
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  required
                />
              </label>
            </div>

            {suggestionMessage && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E7EFE6] px-4 py-3 text-sm text-[#3F6B4F]">
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <p>{suggestionMessage}</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">Notes</h2>

            <textarea
              className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>

          {message && (
            <p className="text-center text-sm text-red-700">{message}</p>
          )}

          <button
            disabled={loading}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add to Kitchen"}
          </button>
        </form>
      </section>
    </main>
  );
}