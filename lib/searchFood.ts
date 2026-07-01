import { shelfLife } from "./shelfLife";

export function searchFoods(query: string) {
  const search = query.toLowerCase().trim();

  if (!search) return [];

  const results: string[] = [];

  for (const [name, info] of Object.entries(shelfLife)) {
    // Match the main food name
    if (name.includes(search)) {
      results.push(name);
      continue;
    }

    // Match aliases
    if (info.aliases.some((alias) => alias.includes(search))) {
      results.push(name);
    }
  }

  // Remove duplicates and limit to 5 suggestions
  return [...new Set(results)].slice(0, 5);
}