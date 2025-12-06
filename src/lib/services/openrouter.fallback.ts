import type { ActivityStats, MotivationalMessage } from "./openrouter.types";

/**
 * Get fallback motivational message based on activity stats
 * Uses generic English motivational messages when AI generation fails
 */
export function getFallbackMotivation(stats: ActivityStats): MotivationalMessage {
  let message: string;
  let tone: "encouraging" | "celebratory" | "challenging";

  if (stats.totalActivities === 0) {
    message = "Ready to start? Add your first activity and begin your journey!";
    tone = "encouraging";
  } else if (stats.totalActivities >= 20) {
    message = "Incredible consistency! You're crushing your fitness goals this month.";
    tone = "celebratory";
  } else if (stats.totalActivities >= 10) {
    message = `Great progress with ${stats.totalActivities} activities! Keep the momentum going.`;
    tone = "encouraging";
  } else if (stats.daysRemaining > 7) {
    message = `${stats.totalActivities} activities so far. Plenty of time to add more!`;
    tone = "challenging";
  } else {
    message = "Every step counts! Keep moving and finish the month strong.";
    tone = "encouraging";
  }

  return {
    message,
    tone,
    generatedAt: new Date().toISOString(),
    model: "fallback",
    cached: false,
  };
}
