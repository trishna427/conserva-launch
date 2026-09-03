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
      mimeType,
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
    const buffer = Buffer.from(bytes);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are analyzing a grocery receipt for a food-waste tracking app.

Read the receipt and identify ONLY grocery food items.

For every food item, determine:

1. name
   - Use a simple, human-readable food name.
   - Convert receipt abbreviations into normal names when reasonably clear.

2. quantity
   - Use the quantity shown on the receipt when available.
   - If no quantity is visible, return an empty string.

3. location
   - Determine the normal household storage location for a newly purchased item.
   - Must be exactly one of:
     "fridge"
     "freezer"
     "pantry"

4. shelfLifeDays
   - Estimate how many days the item typically lasts when stored in that location.
   - Return a positive whole number.

Important rules:

- Return ONLY valid JSON.
- Do not return markdown.
- Do not return explanations.
- Ignore prices.
- Ignore totals.
- Ignore taxes.
- Ignore discounts.
- Ignore store names.
- Ignore payment information.
- Ignore non-food products.
- Do not invent food items that are not visible on the receipt.

Examples of storage:
- milk -> fridge
- fresh chicken -> fridge
- apples -> fridge
- dry rice -> pantry
- cookies -> pantry
- canned beans -> pantry
- frozen peas -> freezer
- ice cream -> freezer

Return exactly this structure:

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
      fileToGenerativePart(buffer, file.type),
    ]);

    const text = result.response.text().trim();
    const parsed = JSON.parse(text);

    if (!parsed || !Array.isArray(parsed.items)) {
      return NextResponse.json(
        { error: "Invalid receipt scan response." },
        { status: 502 }
      );
    }

    const items: ReceiptItem[] = parsed.items
      .map((item: any) => {
        const name =
          typeof item.name === "string" ? item.name.trim() : "";

        const quantity =
          typeof item.quantity === "string"
            ? item.quantity.trim()
            : "";

        const location = item.location;

        const shelfLifeDays = Math.round(
          Number(item.shelfLifeDays)
        );

        if (
          !name ||
          !isStorageLocation(location) ||
          !Number.isFinite(shelfLifeDays) ||
          shelfLifeDays <= 0
        ) {
          return null;
        }

        return {
          name,
          quantity,
          location,
          shelfLifeDays,
        };
      })
      .filter((item: ReceiptItem | null): item is ReceiptItem => item !== null);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Receipt scan failed:", error);

    return NextResponse.json(
      { error: "Failed to scan receipt." },
      { status: 500 }
    );
  }
}