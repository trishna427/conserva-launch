type ShelfLifeItem = {
    days: number;
    aliases: string[];
  };
  
  export const shelfLife: Record<string, ShelfLifeItem> = {    milk: {
      days: 7,
      aliases: ["whole milk", "skim milk", "2% milk"],
    },
  
    egg: {
      days: 21,
      aliases: ["eggs"],
    },
  
    butter: {
      days: 30,
      aliases: [],
    },
  
    yogurt: {
      days: 14,
      aliases: ["greek yogurt"],
    },
  
    cheese: {
      days: 21,
      aliases: ["cheddar", "mozzarella", "swiss cheese"],
    },
  
    bread: {
      days: 7,
      aliases: ["white bread", "wheat bread"],
    },
  
    apple: {
      days: 30,
      aliases: ["apples"],
    },
  
    banana: {
      days: 5,
      aliases: ["bananas"],
    },
  
    strawberry: {
      days: 5,
      aliases: ["strawberries"],
    },
  
    blueberry: {
      days: 10,
      aliases: ["blueberries"],
    },
  
    grape: {
      days: 14,
      aliases: ["grapes"],
    },
  
    lettuce: {
      days: 7,
      aliases: [],
    },
  
    spinach: {
      days: 5,
      aliases: [],
    },
  
    tomato: {
      days: 7,
      aliases: ["tomatoes"],
    },
  
    onion: {
      days: 30,
      aliases: ["onions"],
    },
  
    potato: {
      days: 30,
      aliases: ["potatoes"],
    },
  
    carrot: {
      days: 21,
      aliases: ["carrots"],
    },
  
    broccoli: {
      days: 7,
      aliases: [],
    },
  
    cucumber: {
      days: 7,
      aliases: ["cucumbers"],
    },
  
    "bell pepper": {
      days: 7,
      aliases: ["bell peppers", "pepper"],
    },
  
    chicken: {
      days: 2,
      aliases: ["chicken breast", "chicken thighs"],
    },
  
    beef: {
      days: 3,
      aliases: ["steak"],
    },
  
    "ground beef": {
      days: 2,
      aliases: ["hamburger meat"],
    },
  
    pork: {
      days: 3,
      aliases: ["pork chops"],
    },
  
    salmon: {
      days: 2,
      aliases: [],
    },
  
    shrimp: {
      days: 2,
      aliases: [],
    },
  
    rice: {
      days: 365,
      aliases: ["white rice", "brown rice"],
    },
  
    pasta: {
      days: 365,
      aliases: ["spaghetti", "penne"],
    },
  
    cereal: {
      days: 180,
      aliases: [],
    },
  
    flour: {
      days: 365,
      aliases: [],
    },
  
    sugar: {
      days: 730,
      aliases: [],
    },
  
    "peanut butter": {
      days: 180,
      aliases: ["peanutbutter"],
    },
  
    jam: {
      days: 180,
      aliases: ["jelly"],
    },
  
    ketchup: {
      days: 180,
      aliases: [],
    },
  
    mustard: {
      days: 365,
      aliases: [],
    },
  };
  
  export function getSuggestedShelfLife(foodName: string) {
    const search = foodName.toLowerCase().trim();
  
    for (const [name, info] of Object.entries(shelfLife)) {
      if (name === search) return info.days;
      if (info.aliases.includes(search)) return info.days;
  
      if (search.includes(name)) return info.days;
  
      if (info.aliases.some((alias) => search.includes(alias))) {
        return info.days;
      }
    }
  
    return null;
  }