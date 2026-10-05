/** Greeting for the current time of day in India (the shop's time zone). */
export function greetingKey(now = new Date()): "greet.morning" | "greet.afternoon" | "greet.evening" | "greet.night" {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  if (hour >= 5 && hour < 12) return "greet.morning";
  if (hour >= 12 && hour < 17) return "greet.afternoon";
  if (hour >= 17 && hour < 21) return "greet.evening";
  return "greet.night";
}
