import { daysUntilExpiration } from "./food";

export type ReminderPreferences = {
  in_app_reminders: boolean;
  days_before: number;
};

export type ReminderFood = {
  id: string;
  name: string;
  expiration_date: string;
  used?: boolean;
};

export function shouldShowReminder(
  food: ReminderFood,
  preferences: ReminderPreferences
) {
  if (!preferences.in_app_reminders) return false;
  if (food.used) return false;

  const daysLeft = daysUntilExpiration(food.expiration_date);

  return daysLeft <= preferences.days_before;
}

export function getReminderMessage(food: ReminderFood) {
    const daysLeft = daysUntilExpiration(food.expiration_date);
  
    if (daysLeft < 0) {
      return `${food.name} • Past estimated best-by`;
    }
  
    if (daysLeft === 0) {
      return `${food.name} • Best used today`;
    }
  
    if (daysLeft === 1) {
      return `${food.name} • 1 day left`;
    }
  
    return `${food.name} • ${daysLeft} days left`;
  }
  
  export function getFoodsNeedingReminders(
    foods: ReminderFood[],
    preferences: ReminderPreferences
  ) {
    return foods.filter((food) => shouldShowReminder(food, preferences));
  }
  
  export function getKitchenSummary(
    foods: ReminderFood[],
    preferences: ReminderPreferences
  ) {
    const reminderFoods = getFoodsNeedingReminders(foods, preferences);
  
    return {
      count: reminderFoods.length,
      reminders: reminderFoods.map(getReminderMessage),
    };
  }