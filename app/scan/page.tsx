"use client";

import ReceiptItemCard from "@/components/ReceiptItemCard";
import BottomNav from "@/components/BottomNav";
import { getSuggestedShelfLife } from "@/lib/shelfLife";
import { supabase } from "@/lib/supabase";
import { Camera, Upload } from "lucide-react";
import { useState } from "react";

type ScannedItem = {
  name: string;
  quantity: string;
  location: "fridge" | "freezer" | "pantry";
  purchase_date: string;
  expiration_date: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

function suggestExpiration(name: string) {
  const days = getSuggestedShelfLife(name);
  return days ? addDays(todayISO(), days) : "";
}

export default function ScanPage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setItems([]);
    setExpandedItem(null);
  }

  function removeImage() {
    setImage(null);
    setPreview("");
    setItems([]);
    setExpandedItem(null);
  }

  async function estimateShelfLife(food: string) {
    const response = await fetch("/api/estimate-shelf-life", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ food }),
    });
  
    const data = await response.json().catch(() => null);
  
    if (!response.ok || !data) {
      console.error(
        `Shelf-life estimate failed for "${food}":`,
        response.status,
        data
      );
  
      return null;
    }
  
    const days = Number(data.days);
  
    if (
      !Number.isFinite(days) ||
      !["fridge", "freezer", "pantry"].includes(data.location)
    ) {
      console.error("Invalid shelf-life response:", data);
      return null;
    }
  
    return {
      days,
      location: data.location as
        | "fridge"
        | "freezer"
        | "pantry",
    };
  }

  async function scanReceipt() {
    if (!image) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("receipt", image);

    const response = await fetch("/api/scan-receipt", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    const scannedItems: ScannedItem[] = [];

    for (const item of data.items || []) {
      const name = item.name || item;
    
      const localExpiration = suggestExpiration(name);
      const aiEstimate = await estimateShelfLife(name);
    
      let expiration = localExpiration;
      let location: "fridge" | "freezer" | "pantry" = "fridge";
    
      if (!expiration && aiEstimate) {
        expiration = addDays(todayISO(), aiEstimate.days);
      }
    
      if (aiEstimate) {
        location = aiEstimate.location;
      }
    
      scannedItems.push({
        name,
        quantity: item.quantity || "",
        location,
        purchase_date: todayISO(),
        expiration_date: expiration,
      });
    }

    setItems(scannedItems);
    setLoading(false);
  }

  function updateItem(index: number, field: keyof ScannedItem, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index));

    if (expandedItem === index) {
      setExpandedItem(null);
    }
  }

  async function saveAllToKitchen() {
    setSaving(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setSaving(false);
      return;
    }

    const rows = items
      .filter((item) => item.name.trim() && item.expiration_date)
      .map((item) => ({
        user_id: session.user.id,
        name: item.name,
        quantity: item.quantity,
        location: item.location,
        purchase_date: item.purchase_date,
        expiration_date: item.expiration_date,
        notes: "Added from receipt scan",
        used: false,
      }));

    const { error } = await supabase.from("food_items").insert(rows);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Items added to your kitchen!");
    setItems([]);
    setImage(null);
    setPreview("");
    setExpandedItem(null);
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section className="min-h-screen w-full max-w-[430px] px-6 py-8 pb-28">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Camera size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">Scan receipt</h1>
          <p className="mt-3 text-[#8A8578]">
            Upload a receipt and review the foods before adding them.
          </p>
        </div>

        <label className="mt-10 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[#CFC8BA] bg-white p-8 text-center">
          <Upload className="mb-3 text-[#3F6B4F]" />
          <p className="font-bold text-[#3F6B4F]">Choose receipt image</p>
          <p className="mt-2 text-sm text-[#8A8578]">
            Take a photo or upload one from your device.
          </p>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>

        {preview && (
          <div className="relative mt-6 overflow-hidden rounded-3xl border border-[#E7E2D6] bg-white">
            <button
              type="button"
              onClick={removeImage}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-[#2B2B26] shadow-sm"
              aria-label="Remove receipt image"
            >
              ×
            </button>

            <img src={preview} alt="Receipt preview" className="w-full" />
          </div>
        )}

        <button
          onClick={scanReceipt}
          disabled={!image || loading}
          className="mt-6 w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
        >
          {loading ? "Scanning..." : "Scan Receipt"}
        </button>

        {items.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold">Review items</h2>

            {items.map((item, index) => (
              <ReceiptItemCard
                key={index}
                item={item}
                index={index}
                expanded={expandedItem === index}
                onToggle={() =>
                  setExpandedItem(expandedItem === index ? null : index)
                }
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}

            <button
              onClick={saveAllToKitchen}
              disabled={saving}
              className="w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save all to kitchen"}
            </button>
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}