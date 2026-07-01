import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type Recipe = {
  title: string;
  description: string;
  ingredientsUsed: string[];
  missingIngredients: string[];
  instructions: string[];
};

function cleanJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalize(item: string) {
  return item.toLowerCase().trim();
}

function validateRecipes(recipes: Recipe[], inventory: string[]) {
  const inventorySet = new Set(inventory.map(normalize));

  return recipes.map((recipe) => {
    const validUsed: string[] = [];
    const correctedMissing: string[] = [...(recipe.missingIngredients || [])];

    for (const ingredient of recipe.ingredientsUsed || []) {
      if (inventorySet.has(normalize(ingredient))) {
        validUsed.push(ingredient);
      } else {
        correctedMissing.push(ingredient);
      }
    }

    return {
      title: recipe.title,
      description: recipe.description,
      ingredientsUsed: validUsed,
      missingIngredients: [...new Set(correctedMissing)],
      instructions: recipe.instructions || [],
    };
  });
}

export async function POST(request: Request) {
  try {
    const { foods } = await request.json();

    if (!foods || foods.length === 0) {
      return NextResponse.json(
        { error: "No foods provided." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are an expert home cook helping reduce food waste.

The user ONLY has these ingredients in their kitchen:
${foods.join(", ")}

Rules:
- Suggest exactly 3 recipes.
- Prioritize using the listed ingredients.
- Do NOT put any ingredient in ingredientsUsed unless it appears in the user's list.
- Any ingredient not in the user's list must go in missingIngredients.
- You may assume only salt, pepper, water, and oil are available as pantry staples.
- Keep recipes simple and realistic.
- Return ONLY valid JSON. No markdown. No code fences.

Format:
[
  {
    "title": "",
    "description": "",
    "ingredientsUsed": [],
    "missingIngredients": [],
    "instructions": []
  }
]
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = cleanJson(rawText);

    const parsed = JSON.parse(cleaned) as Recipe[];
    const validated = validateRecipes(parsed, foods);

    return NextResponse.json({
      recipes: validated,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate recipes." },
      { status: 500 }
    );
  }
}