import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function fileToGenerativePart(buffer: Buffer, mimeType: string) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
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
    });

    const prompt = `
You are reading a grocery receipt.

Extract only grocery food items from the receipt.

Rules:
- Return ONLY valid JSON.
- No markdown.
- No explanations.
- Ignore prices, totals, taxes, discounts, store names, and payment details.
- Ignore non-food items.
- Use simple food names.
- If quantity is visible, include it.

Format:
{
  "items": [
    {
      "name": "",
      "quantity": ""
    }
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      fileToGenerativePart(buffer, file.type),
    ]);

    const text = result.response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to scan receipt." },
      { status: 500 }
    );
  }
}