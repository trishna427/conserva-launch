"use client";

import { Package, Refrigerator, Snowflake } from "lucide-react";

type ScannedItem = {
  name: string;
  quantity: string;
  location: "fridge" | "freezer" | "pantry";
  purchase_date: string;
  expiration_date: string;
};

type Props = {
  item: ScannedItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (index: number, field: keyof ScannedItem, value: string) => void;
  onRemove: (index: number) => void;
};

const locationIcons = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Package,
};

export default function ReceiptItemCard({
  item,
  index,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
}: Props) {
  const Icon = locationIcons[item.location];

  function daysUntil(date: string) {
    if (!date) return "No date";
  
    const today = new Date();
    const target = new Date(date);
  
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
  
    const diff = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  
    if (diff < 0) return "Expired";
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `${diff} days`;
  }

  return (
    <div className="rounded-2xl border border-[#E7E2D6] bg-white px-4 py-3 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7EFE6] text-[#3F6B4F]">
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-serif text-lg font-bold">
              {item.name || "Unnamed item"}
            </h3>

            <span className="shrink-0 text-sm font-bold text-[#3F6B4F]">
                {daysUntil(item.expiration_date)}
            </span>
          </div>

          <p className="mt-1 text-sm capitalize text-[#8A8578]">
            {item.quantity || "No quantity"} • {item.location}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-[#E7E2D6] pt-4">
          <input
            className="mb-3 w-full rounded-2xl border border-[#E7E2D6] px-4 py-3 outline-none"
            value={item.name}
            onChange={(e) => onUpdate(index, "name", e.target.value)}
          />

          <input
            className="mb-3 w-full rounded-2xl border border-[#E7E2D6] px-4 py-3 outline-none"
            placeholder="Quantity"
            value={item.quantity}
            onChange={(e) => onUpdate(index, "quantity", e.target.value)}
          />

          <select
            className="mb-3 w-full rounded-2xl border border-[#E7E2D6] bg-white px-4 py-3 outline-none"
            value={item.location}
            onChange={(e) => onUpdate(index, "location", e.target.value)}
          >
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="pantry">Pantry</option>
          </select>

          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-bold">
              Purchase date
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-[#E7E2D6] px-4 py-3 outline-none"
              value={item.purchase_date}
              onChange={(e) =>
                onUpdate(index, "purchase_date", e.target.value)
              }
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-bold">
              Best-by date
            </span>
            <input
              type="date"
              className="w-full rounded-2xl border border-[#E7E2D6] px-4 py-3 outline-none"
              value={item.expiration_date}
              onChange={(e) =>
                onUpdate(index, "expiration_date", e.target.value)
              }
            />
          </label>

          <button
            type="button"
            onClick={() => onRemove(index)}
            className="mt-4 rounded-full bg-[#F7E3DF] px-4 py-2 text-sm font-bold text-[#A23B30]"
          >
            Remove item
          </button>
        </div>
      )}
    </div>
  );
}