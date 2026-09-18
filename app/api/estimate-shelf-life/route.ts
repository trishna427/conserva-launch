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

    /*
      First check whether this exact item is already in our
      trusted shelf-life cache.

      Anything in this cache was previously accepted as food.
    */
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
      Number(cached.days) > 0 &&
      isStorageLocation(cached.location)
    ) {
      return NextResponse.json({
        isFood: true,
        days: Number(cached.days),
        location: cached.location,
        source: "cache",
      });
    }

    /*
      If it isn't cached, Gemini determines whether it is
      actually something people eat or drink before estimating
      shelf life.
    */
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are validating an item being added to a household food inventory app.

Item entered by the user:

"${food}"

First determine whether the item is a real food, beverage, edible ingredient,
condiment, seasoning, or grocery item intended for human consumption.

Examples that ARE food:
- apple
- milk
- rice
- cookies
- coffee
- olive oil
- salt
- protein powder
- frozen peas
- chicken breast

Examples that are NOT food:
- pencil
- laptop
- shoe
- shampoo
- plate
- phone charger
- paper towel
- detergent

If the item is NOT food, return exactly this JSON structure:

{
  "isFood": false
}

If the item IS food, estimate its typical shelf life after purchase and
the normal household storage location for a newly purchased version.

Return:

{
  "isFood": true,
  "days": 7,
  "location": "fridge"
}

Rules:
- "days" must be a positive whole number.
- "location" must be exactly "fridge", "freezer", or "pantry".
- Choose the location where a newly purchased version is normally stored.
- Dry rice should normally be pantry.
- Cookies should normally be pantry.
- Milk should normally be fridge.
- Frozen peas should normally be freezer.
- Do not pretend a non-food object is food just because it could technically be placed in a refrigerator.

Return JSON only.
`;

    const result = await model.generateContent(prompt);

    const parsed = JSON.parse(
      result.response.text().trim()
    );

    /*
      Non-food item
    */
    if (parsed.isFood !== true) {
      return NextResponse.json({
        isFood: false,
        error: "That doesn't look like a food or drink.",
      });
    }

    /*
      Valid food item
    */
    const days = Math.round(Number(parsed.days));
    const location = parsed.location;

    if (
      !Number.isFinite(days) ||
      days <= 0 ||
      !isStorageLocation(location)
    ) {
      console.error("Invalid AI response:", parsed);

      return NextResponse.json(
        {
          error: "Invalid shelf-life estimate.",
        },
        { status: 502 }
      );
    }

    /*
      Only real foods make it into the cache.
    */
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
      isFood: true,
      days,
      location,
      source: "ai",
    });
  } catch (error) {
    console.error("Shelf-life route failed:", error);

    return NextResponse.json(
      {
        error: "Failed to estimate shelf life.",
      },
      { status: 500 }
    );
  }
}