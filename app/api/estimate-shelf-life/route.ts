import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type StorageLocation = "fridge" | "freezer" | "pantry";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeFoodName(food: string) {
  return food.toLowerCase().trim();
}

function isStorageLocation(value: unknown): value is StorageLocation {
  return (
    value === "fridge" ||
    value === "freezer" ||
    value === "pantry"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const food =
      typeof body.food === "string" ? body.food.trim() : "";

    if (!food) {
      return NextResponse.json(
        { error: "Food name is required." },
        { status: 400 }
      );
    }

    const normalizedFood = normalizeFoodName(food);

    const { data: cached, error: cacheReadError } =
      await supabaseAdmin
        .from("shelf_life_cache")
        .select("days, location")
        .eq("food_name", normalizedFood)
        .maybeSingle();

    if (cacheReadError) {
      console.error("Cache read error:", cacheReadError);
    }

    if (
      cached &&
      Number.isFinite(Number(cached.days)) &&
      isStorageLocation(cached.location)
    ) {
      return NextResponse.json({
        days: Number(cached.days),
        location: cached.location,
        source: "cache",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
Estimate the typical shelf life and normal household storage location
for this grocery food:

"${food}"

Return one JSON object containing:
- "days": a positive whole number
- "location": exactly "fridge", "freezer", or "pantry"

Choose the location where a newly purchased version would normally be stored.

Examples:
- Dry rice: pantry
- Cookies: pantry
- Milk: fridge
- Frozen peas: freezer

Return only JSON:
{
  "days": 7,
  "location": "fridge"
}
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim());

    const days = Math.round(Number(parsed.days));
    const location = parsed.location;

    if (
      !Number.isFinite(days) ||
      days <= 0 ||
      !isStorageLocation(location)
    ) {
      console.error("Invalid AI response:", parsed);

      return NextResponse.json(
        { error: "Invalid shelf-life estimate." },
        { status: 502 }
      );
    }

    const { error: cacheWriteError } = await supabaseAdmin
      .from("shelf_life_cache")
      .upsert(
        {
          food_name: normalizedFood,
          days,
          location,
        },
        {
          onConflict: "food_name",
        }
      );

    if (cacheWriteError) {
      console.error("Cache write error:", cacheWriteError);
    }

    return NextResponse.json({
      days,
      location,
      source: "ai",
    });
  } catch (error) {
    console.error("Shelf-life route failed:", error);

    return NextResponse.json(
      { error: "Failed to estimate shelf life." },
      { status: 500 }
    );
  }
}