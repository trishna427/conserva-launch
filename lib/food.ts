export type FoodLocation = "fridge" | "freezer" | "pantry";

export type FoodItem = {
  id: string;
  name: string;
  quantity: string;
  location: FoodLocation;
  purchaseDate: string;
  expirationDate: string;
  notes?: string;
  used: boolean;
};

export function daysUntilExpiration(expirationDate: string) {
  const [year, month, day] = expirationDate.split("-").map(Number);

  const today = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    })
  );

  const todayUTC = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const expirationUTC = Date.UTC(year, month - 1, day);

  return Math.round(
    (expirationUTC - todayUTC) / (1000 * 60 * 60 * 24)
  );
}

export function getFoodStatus(expirationDate: string) {
  const days = daysUntilExpiration(expirationDate);

  if (days < 0) return "expired";
  if (days <= 3) return "expiring-soon";
  return "fresh";
}

export function getStatusLabel(expirationDate: string) {
  const days = daysUntilExpiration(expirationDate);

  if (days < 0) return "Expired";
  if (days === 0) return "Use today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export const sampleFoods: FoodItem[] = [
  {
    id: "1",
    name: "Spinach",
    quantity: "1 bunch",
    location: "fridge",
    purchaseDate: "2026-06-27",
    expirationDate: "2026-06-30",
    notes: "Use soon",
    used: false,
  },
  {
    id: "2",
    name: "Paneer",
    quantity: "200g",
    location: "fridge",
    purchaseDate: "2026-06-26",
    expirationDate: "2026-07-01",
    used: false,
  },
  {
    id: "3",
    name: "Rice",
    quantity: "2 lb",
    location: "pantry",
    purchaseDate: "2026-06-10",
    expirationDate: "2027-06-10",
    used: false,
  },
];