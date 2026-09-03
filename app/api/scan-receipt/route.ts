import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type StorageLocation = "fridge" | "freezer" | "pantry";

type ReceiptItem = {
  name: string;
  quantity: string;
  location: StorageLocation;
  shelfLifeDays: number;
};

function fileToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType: mimeType || "image/jpeg",
    },
  };
}

function isStorageLocation(value: unknown): value is StorageLocation {
  return (
    value === "fridge" ||
    value === "freezer" ||
    value === "pantry"
  );
}

function cleanJson(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No receipt image provided." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();

    if (!bytes.byteLength) {
      return NextResponse.json(
        { error: "Receipt image was empty." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(bytes);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are analyzing a grocery receipt for a food-waste tracking app.

Read the receipt image and extract ONLY grocery food items.

For every detected food item return:

- name
  A simple human-readable food name.
  Convert obvious receipt abbreviations into normal food names.

- quantity
  The quantity if visible.
  If no quantity is visible, use an empty string.

- location
  The normal household storage location for a newly purchased item.
  It MUST be exactly:
  "fridge"
  "freezer"
  or
  "pantry"

- shelfLifeDays
  The estimated number of days the food normally lasts in that storage location.
  This MUST be a positive whole number.

Important:
- Ignore prices.
- Ignore totals.
- Ignore tax.
- Ignore discounts.
- Ignore payment information.
- Ignore store names.
- Ignore loyalty information.
- Ignore non-food products.
- Do not invent items not shown on the receipt.
- Return ONLY JSON.

Examples:

Milk:
location = "fridge"
shelfLifeDays = 7

Dry rice:
location = "pantry"
shelfLifeDays = 365

Frozen peas:
location = "freezer"
shelfLifeDays = 180

Cookies:
location = "pantry"
shelfLifeDays = 14

Return exactly this shape:

{
  "items": [
    {
      "name": "Milk",
      "quantity": "1",
      "location": "fridge",
      "shelfLifeDays": 7
    }
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      fileToGenerativePart(
        buffer,
        file.type || "image/jpeg"
      ),
    ]);

    const rawText = result.response.text();

    console.log("Raw receipt AI response:", rawText);

    const cleaned = cleanJson(rawText);

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error(
        "Could not parse receipt JSON:",
        parseError,
        cleaned
      );

      return NextResponse.json(
        { error: "AI returned an unreadable receipt response." },
        { status: 502 }
      );
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      console.error("Invalid receipt structure:", parsed);

      return NextResponse.json(
        { error: "AI could not identify grocery items." },
        { status: 502 }
      );
    }

    const items: ReceiptItem[] = [];

    for (const item of parsed.items) {
      const name =
        typeof item?.name === "string"
          ? item.name.trim()
          : "";

      let quantity = "";

      if (typeof item?.quantity === "string") {
        quantity = item.quantity.trim();
      } else if (
        typeof item?.quantity === "number"
      ) {
        quantity = String(item.quantity);
      }

      const rawLocation =
        typeof item?.location === "string"
          ? item.location.toLowerCase().trim()
          : "";

      const shelfLifeDays = Math.round(
        Number(item?.shelfLifeDays)
      );

      if (!name) {
        continue;
      }

      if (!isStorageLocation(rawLocation)) {
        console.warn(
          `Skipping "${name}" because storage was invalid:`,
          rawLocation
        );
        continue;
      }

      if (
        !Number.isFinite(shelfLifeDays) ||
        shelfLifeDays <= 0
      ) {
        console.warn(
          `Skipping "${name}" because shelf life was invalid:`,
          item?.shelfLifeDays
        );
        continue;
      }

      items.push({
        name,
        quantity,
        location: rawLocation,
        shelfLifeDays,
      });
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            "No usable grocery items were found on the receipt.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Receipt scan failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to scan receipt.",
      },
      { status: 500 }
    );
  }
}