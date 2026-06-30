"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Leaf } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddItemPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("fridge");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 text-[#3F6B4F] font-bold">
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
          <input className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} required />

          <input className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" placeholder="Quantity, e.g. 2 cups" value={quantity} onChange={(e) => setQuantity(e.target.value)} />

          <select className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="pantry">Pantry</option>
          </select>

          <label className="block">
            <span className="mb-2 block font-semibold">Purchase date</span>
            <input className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} required />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Expiration date</span>
            <input className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} required />
          </label>

          <textarea className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none" placeholder="Notes optional" value={notes} onChange={(e) => setNotes(e.target.value)} />

          {message && <p className="text-center text-sm text-red-700">{message}</p>}

          <button disabled={loading} className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60">
            {loading ? "Saving..." : "Save item"}
          </button>
        </form>
      </section>
    </main>
  );
}