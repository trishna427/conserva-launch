"use client";

import { getSuggestedShelfLife } from "@/lib/shelfLife";
import { searchFoods } from "@/lib/searchFood";
import { supabase } from "@/lib/supabase";
import {
  Camera,
  ChevronLeft,
  Leaf,
  Package,
  Refrigerator,
  Snowflake,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type StorageLocation = "fridge" | "freezer" | "pantry";

type ShelfLifeEstimate = {
  days: number;
  location: StorageLocation;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00`);
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
  const [location, setLocation] =
    useState<StorageLocation>("fridge");
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");

  const [suggestionMessage, setSuggestionMessage] = useState("");
  const [foodSuggestions, setFoodSuggestions] = useState<string[]>([]);
  const [estimating, setEstimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function estimateShelfLife(
    food: string
  ): Promise<ShelfLifeEstimate | null> {
    try {
      const response = await fetch("/api/estimate-shelf-life", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ food }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        console.error("Shelf-life request failed:", response.status, data);
        return null;
      }

      const days = Number(data.days);
      const returnedLocation = data.location;

      const validLocation =
        returnedLocation === "fridge" ||
        returnedLocation === "freezer" ||
        returnedLocation === "pantry";

      if (!Number.isFinite(days) || days <= 0 || !validLocation) {
        console.error("Invalid shelf-life response:", data);
        return null;
      }

      return {
        days,
        location: returnedLocation,
      };
    } catch (error) {
      console.error("Shelf-life request failed:", error);
      return null;
    }
  }

  async function autofillFoodDetails(
    foodName: string,
    date = purchaseDate
  ) {
    const cleanedName = foodName.trim();

    if (!cleanedName || !date) {
      setSuggestionMessage("");
      return;
    }

    setEstimating(true);
    setSuggestionMessage("Estimating shelf life and storage...");

    const localDays = getSuggestedShelfLife(cleanedName);
    const aiEstimate = await estimateShelfLife(cleanedName);

    // Prefer the local database for shelf life when available.
    // Otherwise use the AI estimate.
    const days = localDays ?? aiEstimate?.days ?? null;

    if (days !== null) {
      setExpirationDate(addDays(date, days));
    }

    // AI determines storage for both known and unknown foods.
    if (aiEstimate) {
      setLocation(aiEstimate.location);
    }

    if (days !== null && aiEstimate) {
      setSuggestionMessage(
        `Suggested ${days} days in the ${aiEstimate.location}. You can change these details.`
      );
    } else if (days !== null) {
      setSuggestionMessage(
        `Suggested ${days} days based on typical storage. Please confirm the storage location.`
      );
    } else {
      setSuggestionMessage(
        "We could not estimate this food automatically. Please enter the date and storage location."
      );
    }

    setEstimating(false);
  }

  async function handleAddItem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("food_items").insert({
      user_id: session.user.id,
      name: name.trim(),
      quantity: quantity.trim(),
      location,
      purchase_date: purchaseDate,
      expiration_date: expirationDate,
      notes: notes.trim(),
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
      <section className="min-h-screen w-full max-w-[430px] px-6 pb-28 pt-5">
        <Link
          href="/dashboard"
          className="mb-5 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} />
          Back
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Leaf size={25} />
          </div>

          <h1 className="font-serif text-4xl font-bold">
            Add to your kitchen
          </h1>

          <p className="mt-2 text-[#8A8578]">
            Track it today to waste less tomorrow.
          </p>
        </div>

        <Link
          href="/scan"
          className="mt-5 flex items-center gap-4 rounded-3xl border border-[#E7E2D6] bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E7EFE6]">
            <Camera className="h-7 w-7 text-[#3F6B4F]" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-[#3F6B4F]">
              Scan a receipt
            </h3>
            <p className="mt-1 text-sm text-[#8A8578]">
              Add multiple groceries automatically.
            </p>
          </div>

          <span className="text-2xl text-[#3F6B4F]">→</span>
        </Link>

        <form onSubmit={handleAddItem} className="mt-8 space-y-7">
          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">
              Food Information
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none focus:border-[#3F6B4F]"
                  placeholder="Food name"
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    setFoodSuggestions(searchFoods(value));
                    setSuggestionMessage("");
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setFoodSuggestions([]);
                      void autofillFoodDetails(name);
                    }, 150);
                  }}
                  required
                />

                {foodSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-[#E7E2D6] bg-white shadow-lg">
                    {foodSuggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setName(suggestion);
                          setFoodSuggestions([]);
                          void autofillFoodDetails(suggestion);
                        }}
                        className="block w-full px-4 py-3 text-left text-sm font-semibold hover:bg-[#E7EFE6]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none focus:border-[#3F6B4F]"
                placeholder="Quantity, e.g. 2 cups"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>

            {estimating && (
              <p className="mt-3 text-sm font-semibold text-[#3F6B4F]">
                Estimating food details...
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-serif text-2xl font-bold">
              Storage
            </h2>

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
            <h2 className="mb-3 font-serif text-2xl font-bold">
              Dates
            </h2>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block font-semibold">
                  Purchase date
                </span>
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none focus:border-[#3F6B4F]"
                  type="date"
                  value={purchaseDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPurchaseDate(value);

                    if (name.trim()) {
                      void autofillFoodDetails(name, value);
                    }
                  }}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-semibold">
                  Estimated best-by date
                </span>
                <input
                  className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none focus:border-[#3F6B4F]"
                  type="date"
                  value={expirationDate}
                  onChange={(event) =>
                    setExpirationDate(event.target.value)
                  }
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
            <h2 className="mb-3 font-serif text-2xl font-bold">
              Notes
            </h2>

            <textarea
              className="min-h-28 w-full resize-none rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none focus:border-[#3F6B4F]"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </section>

          {message && (
            <p className="text-center text-sm text-red-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || estimating}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Add to Kitchen"}
          </button>
        </form>
      </section>
    </main>
  );
}