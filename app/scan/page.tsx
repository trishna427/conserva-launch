"use client";

import ReceiptItemCard from "@/components/ReceiptItemCard";
import BottomNav from "@/components/BottomNav";
import { getSuggestedShelfLife } from "@/lib/shelfLife";
import { supabase } from "@/lib/supabase";
import { Camera, Image as ImageIcon, Upload } from "lucide-react";
import { useRef, useState } from "react";

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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const libraryInputRef = useRef<HTMLInputElement | null>(null);

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
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
    setItems([]);
    setExpandedItem(null);

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (libraryInputRef.current) {
      libraryInputRef.current.value = "";
    }
  }

  async function estimateShelfLife(food: string) {
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
        location: data.location as "fridge" | "freezer" | "pantry",
      };
    } catch (error) {
      console.error("Shelf-life estimate failed:", error);
      return null;
    }
  }

  async function scanReceipt() {
    if (!image) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("receipt", image);

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Could not scan receipt.");
        setLoading(false);
        return;
      }

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
    } catch (error) {
      console.error("Receipt scan failed:", error);
      alert("Something went wrong while scanning the receipt.");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    index: number,
    field: keyof ScannedItem,
    value: string
  ) {
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
        status: "active",
      }));

    if (rows.length === 0) {
      alert("No valid items to save.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("food_items").insert(rows);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Items added to your kitchen!");

    removeImage();
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#FAF7F0] text-[#2B2B26]">
      <section
        className="min-h-screen w-full max-w-[430px] px-6 pb-28"
        style={{
          paddingTop: "max(72px, calc(env(safe-area-inset-top) + 24px))",
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3F6B4F] text-white">
            <Camera size={28} />
          </div>

          <h1 className="font-serif text-4xl font-bold">
            Scan receipt
          </h1>

          <p className="mt-3 text-[#8A8578]">
            Take a photo or choose a receipt from your library.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-3xl border border-[#E7E2D6] bg-white p-5 text-center shadow-sm"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7EFE6] text-[#3F6B4F]">
              <Camera size={24} />
            </div>

            <p className="font-bold text-[#3F6B4F]">
              Take photo
            </p>

            <p className="mt-1 text-xs text-[#8A8578]">
              Use your camera
            </p>
          </button>

          <button
            type="button"
            onClick={() => libraryInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-3xl border border-[#E7E2D6] bg-white p-5 text-center shadow-sm"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7EFE6] text-[#3F6B4F]">
              <ImageIcon size={24} />
            </div>

            <p className="font-bold text-[#3F6B4F]">
              Choose photo
            </p>

            <p className="mt-1 text-xs text-[#8A8578]">
              Pick from library
            </p>
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageUpload}
        />

        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

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

            <img
              src={preview}
              alt="Receipt preview"
              className="w-full"
            />
          </div>
        )}

        {image && (
          <button
            type="button"
            onClick={scanReceipt}
            disabled={loading}
            className="mt-6 w-full rounded-3xl bg-[#3F6B4F] py-5 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Scanning..." : "Scan Receipt"}
          </button>
        )}

        {!image && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#E7EFE6] px-4 py-3 text-sm text-[#3F6B4F]">
            <Upload size={16} />
            <span>Select a receipt image to begin.</span>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-serif text-2xl font-bold">
              Review items
            </h2>

            {items.map((item, index) => (
              <ReceiptItemCard
                key={index}
                item={item}
                index={index}
                expanded={expandedItem === index}
                onToggle={() =>
                  setExpandedItem(
                    expandedItem === index ? null : index
                  )
                }
                onUpdate={updateItem}
                onRemove={removeItem}
              />
            ))}

            <button
              type="button"
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