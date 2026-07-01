"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Leaf, Sparkles } from "lucide-react";
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

export default function AddItemPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("fridge");
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

          <h1 className="font-serif text-4xl font-bold">Add food</h1>
          <p className="mt-3 text-[#8A8578]">
            Add something to your virtual fridge.
          </p>
        </div>

        <form onSubmit={handleAddItem} className="mt-10 space-y-5">
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
    <div className="absolute left-0 right-0 z-10 mt-2 rounded-2xl border border-[#E7E2D6] bg-white shadow-sm">
      {foodSuggestions.map((suggestion) => (
        <button
          type="button"
          key={suggestion}
          onClick={() => {
            setName(suggestion);
            setFoodSuggestions([]);
            updateExpirationSuggestion(suggestion, purchaseDate);
          }}
          className="block w-full px-4 py-3 text-left first:rounded-t-2xl last:rounded-b-2xl hover:bg-[#E7EFE6]"
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

          <select
            className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="pantry">Pantry</option>
          </select>

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
            <span className="mb-2 block font-semibold">Estimated best-by date</span>
            <input
              className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
          </label>

          {suggestionMessage && (
            <div className="flex items-start gap-2 rounded-2xl bg-[#E7EFE6] px-4 py-3 text-sm text-[#3F6B4F]">
              <Sparkles size={16} className="mt-0.5" />
              <p>{suggestionMessage}</p>
            </div>
          )}

          <textarea
            className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
            placeholder="Notes optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {message && <p className="text-center text-sm text-red-700">{message}</p>}

          <button
            disabled={loading}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save item"}
          </button>
        </form>
      </section>
    </main>
  );
}