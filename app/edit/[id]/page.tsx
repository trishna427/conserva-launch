"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("fridge");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadItem() {
      const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        router.push("/dashboard");
        return;
      }

      setName(data.name);
      setQuantity(data.quantity || "");
      setLocation(data.location);
      setPurchaseDate(data.purchase_date);
      setExpirationDate(data.expiration_date);
      setNotes(data.notes || "");
      setLoading(false);
    }

    loadItem();
  }, [id, router]);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("food_items")
      .update({
        name,
        quantity,
        location,
        purchase_date: purchaseDate,
        expiration_date: expirationDate,
        notes,
      })
      .eq("id", id);

    setSaving(false);

    if (!error) {
      router.push("/dashboard");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF7F0]">
        <p className="text-[#8A8578]">Loading item...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 font-bold text-[#3F6B4F]"
        >
          <ChevronLeft size={20} /> Back
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Pencil size={26} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Edit food</h1>
          <p className="mt-3 text-[#8A8578]">
            Update the details for this item.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="mt-10 space-y-5">
          <input
            className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
            placeholder="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
            placeholder="Quantity"
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
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold">Expiration date</span>
            <input
              className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
          </label>

          <textarea
            className="w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-4 outline-none"
            placeholder="Notes optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            disabled={saving}
            className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>
    </main>
  );
}